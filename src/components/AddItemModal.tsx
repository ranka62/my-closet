"use client"

import { useState } from "react"
import { Item } from "@prisma/client"
import { X, Upload } from "lucide-react"

export default function AddItemModal({
  onClose,
  onAdd
}: {
  onClose: () => void
  onAdd: (item: Item) => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    imageUrl: "",
    category: "トップス",
    brand: "",
    name: "",
    price: "",
    season: "All",
    source: ""
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseInt(formData.price) : null
        })
      })
      
      if (res.ok) {
        const newItem = await res.json()
        onAdd(newItem)
        onClose()
      }
    } catch (error) {
      console.error(error)
      alert("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <h2 className="text-xl font-serif tracking-tight text-stone-900">Add New Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Photo <span className="text-red-400">*</span></label>
            <div className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors relative ${formData.imageUrl ? 'border-transparent bg-stone-50' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'}`}>
              {formData.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formData.imageUrl} alt="Preview" className="mx-auto h-48 object-contain mix-blend-multiply" />
              ) : (
                <div className="py-8 space-y-3">
                  <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-stone-100">
                    <Upload className="h-5 w-5 text-stone-400" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-stone-700">Click to upload</p>
                    <p className="text-xs text-stone-400">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleImageUpload}
                required={!formData.imageUrl}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Category <span className="text-red-400">*</span></label>
              <select 
                className="w-full border border-stone-200 bg-stone-50 rounded-xl p-3 text-sm focus:border-stone-400 focus:ring-0 focus:bg-white transition-colors"
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                {["トップス", "ボトムス", "アウター", "シューズ", "アクセサリー", "ワンピース", "バッグ", "雑貨・ライフスタイル", "ガジェット", "その他"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Season</label>
              <select 
                className="w-full border border-stone-200 bg-stone-50 rounded-xl p-3 text-sm focus:border-stone-400 focus:ring-0 focus:bg-white transition-colors"
                value={formData.season}
                onChange={e => setFormData(prev => ({ ...prev, season: e.target.value }))}
              >
                {["Spring", "Summer", "Autumn", "Winter", "All"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Brand</label>
            <input 
              type="text" 
              placeholder="e.g. ZARA"
              className="w-full border border-stone-200 bg-stone-50 rounded-xl p-3 text-sm focus:border-stone-400 focus:ring-0 focus:bg-white transition-colors placeholder:text-stone-300"
              value={formData.brand}
              onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Item Name</label>
            <input 
              type="text" 
              placeholder="e.g. 白のオーバーサイズシャツ"
              className="w-full border border-stone-200 bg-stone-50 rounded-xl p-3 text-sm focus:border-stone-400 focus:ring-0 focus:bg-white transition-colors placeholder:text-stone-300"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Price (¥)</label>
              <input 
                type="number" 
                placeholder="5000"
                className="w-full border border-stone-200 bg-stone-50 rounded-xl p-3 text-sm focus:border-stone-400 focus:ring-0 focus:bg-white transition-colors placeholder:text-stone-300"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Source</label>
              <input 
                type="text" 
                placeholder="Store or URL"
                className="w-full border border-stone-200 bg-stone-50 rounded-xl p-3 text-sm focus:border-stone-400 focus:ring-0 focus:bg-white transition-colors placeholder:text-stone-300"
                value={formData.source}
                onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="pt-6 flex justify-end gap-3 border-t border-stone-100">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 text-sm font-medium bg-stone-900 text-white rounded-full hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? "Saving..." : "Save Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
