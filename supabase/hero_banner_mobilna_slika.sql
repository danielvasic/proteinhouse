-- Zasebna mobilna pozadina za hero bannere.
--
-- Pozadina se prikazuje s bg-cover. Siroki kadar (npr. 1920x720, 2.67:1) se u
-- visokom mobilnom okviru rezanjem svede na sredinu i kompozicija se izgubi,
-- pa admin moze dodati uspravnu verziju samo za mobilni. Prazno = koristi se
-- image_url, tj. ponasanje ostaje kakvo je bilo.
alter table hero_banners add column if not exists image_mobile_url text;

comment on column hero_banners.image_mobile_url is
  'Mobilna izvedba pozadine (do 767px). Prazno = koristi se image_url.';
