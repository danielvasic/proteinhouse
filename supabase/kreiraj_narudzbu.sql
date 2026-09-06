-- kreiraj_narudzbu — jedina tacka upisa narudzbe (SECURITY DEFINER, zove je
-- checkout preko RPC-a s anon kljucem). Do 2026-09-06 je zivjela SAMO u bazi;
-- ovo je versionisana kopija. Svaka izmjena ide ovdje pa u bazu.
--
-- Dodano: p_viber_consent. Kupac na checkoutu moze dati privolu za Viber
-- podsjetnike; tekst privole je KONSTANTA ovdje, ne dolazi s klijenta — dokaz
-- koji Viber/agregator trazi ne smije biti nesto sto je klijent mogao
-- promijeniti. Privola se pamti uz narudzbu (viber_consent_at/_text).
--
-- Cijena stavke: price_sale ?? price po varijanti, pa products.price — isti
-- redoslijed slijedi i prikaz (getVariantPrice), da kupac vidi sto ce platiti.

drop function if exists public.kreiraj_narudzbu(text,text,text,text,text,text,text,text,jsonb,text,jsonb,jsonb);

create or replace function public.kreiraj_narudzbu(
  p_customer_name text, p_customer_email text, p_customer_phone text,
  p_shipping_address text, p_shipping_city text, p_shipping_zip text,
  p_notes text, p_payment_method text, p_items jsonb,
  p_coupon_code text default null, p_gift jsonb default null, p_atribucija jsonb default null,
  p_viber_consent boolean default false)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  c_prag_besplatno constant numeric := 149;
  c_prag_srednji   constant numeric := 100;
  c_postarina_sred constant numeric := 7;
  c_postarina_baza constant numeric := 9;
  c_dozvoljeni constant text[] := array[
    'gclid','fbclid','fbc','fbp','ga_client','landing',
    'utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
  -- Mora biti identican tekstu uz kvacicu na checkoutu (VIBER_PRIVOLA u Checkout.jsx).
  c_viber_privola constant text :=
    'Želim na Viber, na broj koji sam unio/la, dobijati podsjetnike za obnovu zaliha i povremene ponude ProteinHouse-a. Odjava odgovorom STOP.';
  v_stavka jsonb; v_proizvod products%rowtype; v_kolicina integer;
  v_okus text; v_vel text; v_kljuc text; v_var jsonb; v_cijena numeric(10,2);
  v_stavke jsonb := '[]'::jsonb; v_medjuzbir numeric(10,2) := 0;
  v_popust numeric(10,2) := 0; v_besplatna boolean := false;
  v_postarina numeric(10,2); v_ukupno numeric(10,2);
  v_kupon jsonb; v_kupon_kod text := null; v_poklon jsonb := null;
  v_kampanja gift_campaigns%rowtype; v_atrib jsonb := '{}'::jsonb;
  v_k text; v_v text; v_broj text; v_pokusaj integer := 0;
  v_privola boolean := coalesce(p_viber_consent, false);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Korpa je prazna.' using errcode = '22023'; end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Previše različitih stavki u narudžbi.' using errcode = '22023'; end if;
  if coalesce(trim(p_customer_name),'') = '' or coalesce(trim(p_customer_phone),'') = '' then
    raise exception 'Ime i telefon su obavezni.' using errcode = '22023'; end if;

  for v_stavka in select * from jsonb_array_elements(p_items) loop
    v_kolicina := coalesce((v_stavka ->> 'qty')::integer, 0);
    if v_kolicina < 1 or v_kolicina > 99 then
      raise exception 'Neispravna količina.' using errcode = '22023'; end if;
    select * into v_proizvod from products
     where id = (v_stavka ->> 'id')::uuid and is_active limit 1;
    if not found then raise exception 'Proizvod nije dostupan.' using errcode = '22023'; end if;

    v_okus := nullif(v_stavka ->> 'selectedFlavor', '');
    v_vel  := nullif(v_stavka ->> 'selectedSize', '');
    v_kljuc := case
      when v_okus is not null and v_vel is not null then v_okus || '|' || v_vel
      when v_okus is not null then v_okus
      when v_vel  is not null then v_vel end;
    v_var := case when v_kljuc is not null then v_proizvod.stock_variants -> v_kljuc end;
    v_cijena := coalesce(
      nullif(v_var ->> 'price_sale','')::numeric,
      nullif(v_var ->> 'price','')::numeric,
      v_proizvod.price);
    if v_cijena is null or v_cijena < 0 then
      raise exception 'Cijena nije poznata za izabranu varijantu.' using errcode = '22023'; end if;

    v_medjuzbir := v_medjuzbir + (v_cijena * v_kolicina);
    v_stavke := v_stavke || jsonb_build_object(
      'id', v_proizvod.id, 'brand', v_proizvod.brand, 'title', v_proizvod.title,
      'price', v_cijena, 'qty', v_kolicina,
      'selectedSize', v_vel, 'selectedFlavor', v_okus);
  end loop;

  if coalesce(trim(p_coupon_code),'') <> '' then
    v_kupon := validate_coupon(p_coupon_code, v_medjuzbir, p_customer_email);
    if (v_kupon ->> 'valid')::boolean then
      v_popust := coalesce((v_kupon ->> 'discount')::numeric, 0);
      v_besplatna := coalesce((v_kupon ->> 'free_shipping')::boolean, false);
      v_kupon_kod := v_kupon ->> 'code';
    else raise notice 'Kupon odbijen: %', v_kupon ->> 'reason'; end if;
  end if;

  if v_besplatna then v_postarina := 0;
  elsif (v_medjuzbir - v_popust) >= c_prag_besplatno then v_postarina := 0;
  elsif (v_medjuzbir - v_popust) >= c_prag_srednji then v_postarina := c_postarina_sred;
  else v_postarina := c_postarina_baza; end if;
  v_ukupno := v_medjuzbir - v_popust + v_postarina;

  if p_gift is not null and coalesce(p_gift ->> 'campaign_id','') <> '' then
    select * into v_kampanja from gift_campaigns
     where id = (p_gift ->> 'campaign_id')::uuid and is_active
       and (starts_at is null or now() >= starts_at)
       and (ends_at is null or now() <= ends_at) limit 1;
    if found and v_medjuzbir >= v_kampanja.min_order_total then v_poklon := p_gift; end if;
  end if;

  if p_atribucija is not null and jsonb_typeof(p_atribucija) = 'object' then
    foreach v_k in array c_dozvoljeni loop
      v_v := nullif(trim(p_atribucija ->> v_k), '');
      if v_v is not null then v_atrib := v_atrib || jsonb_build_object(v_k, left(v_v, 512)); end if;
    end loop;
  end if;

  loop
    v_pokusaj := v_pokusaj + 1;
    v_broj := 'PH-' || to_char(now(),'YYMM') || '-' || lpad((1000 + floor(random()*9000))::int::text, 4, '0');
    exit when not exists (select 1 from orders where order_number = v_broj);
    if v_pokusaj >= 20 then raise exception 'Ne mogu dodijeliti broj narudžbe.' using errcode='22023'; end if;
  end loop;

  insert into orders (order_number, customer_name, customer_email, customer_phone,
    shipping_address, shipping_city, shipping_zip, notes, payment_method,
    items, subtotal, discount, coupon_code, shipping_cost, total, gift, status, atribucija,
    viber_consent_at, viber_consent_text)
  values (v_broj, trim(p_customer_name), lower(nullif(trim(p_customer_email),'')), trim(p_customer_phone),
    p_shipping_address, p_shipping_city, p_shipping_zip, p_notes,
    coalesce(nullif(trim(p_payment_method),''),'pouzece'),
    v_stavke, v_medjuzbir, v_popust, v_kupon_kod, v_postarina, v_ukupno, v_poklon, 'nova',
    nullif(v_atrib, '{}'::jsonb),
    case when v_privola then now() end,
    case when v_privola then c_viber_privola end);

  return jsonb_build_object('order_number', v_broj, 'subtotal', v_medjuzbir,
    'discount', v_popust, 'shipping', v_postarina, 'total', v_ukupno, 'gift', v_poklon);
end; $function$;

grant execute on function public.kreiraj_narudzbu(text,text,text,text,text,text,text,text,jsonb,text,jsonb,jsonb,boolean)
  to anon, authenticated, service_role;
