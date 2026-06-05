import { useRef, useState } from 'react'
import { Upload, X, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

/**
 * Reusable image upload widget for admin forms.
 *
 * Props:
 *   value      – current public URL (string)
 *   onChange   – (url: string) => void  called after successful upload or manual URL edit
 *   bucket     – Supabase Storage bucket (default: 'product-images')
 *   folder     – path prefix inside the bucket (default: '')
 *   label      – button label (default: 'Upload slike')
 *   showUrl    – show the URL input field below the button (default: true)
 *   previewH   – Tailwind height class for the preview (default: 'h-32')
 */
export default function ImageUpload({
  value = '',
  onChange,
  bucket = 'product-images',
  folder = '',
  label = 'Upload slike',
  showUrl = true,
  previewH = 'h-32',
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop().toLowerCase()
      const name = `${folder ? folder + '/' : ''}${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(name, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data } = supabase.storage.from(bucket).getPublicUrl(name)
      onChange(data.publicUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {/* Preview */}
      {value ? (
        <div className={`relative w-full ${previewH} rounded-lg overflow-hidden border border-gray-200 bg-gray-50`}>
          <img
            src={value}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div
          className={`w-full ${previewH} rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-gray-300 hover:text-gray-500 transition-colors`}
          onClick={() => fileRef.current?.click()}
        >
          <ImageIcon size={28} className="mb-1" />
          <span className="text-xs">Klikni za upload</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5"
        >
          {uploading
            ? <><RefreshCw size={12} className="animate-spin" /> Uploaduje…</>
            : <><Upload size={12} /> {label}</>
          }
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} className="text-muted-foreground">
            <X size={12} className="mr-1" /> Ukloni
          </Button>
        )}
      </div>

      {/* Optional URL input */}
      {showUrl && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ili unesi URL slike…"
          className="text-xs text-muted-foreground"
        />
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
