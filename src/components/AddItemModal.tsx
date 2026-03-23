"use client"

import { useState } from "react"
import { Item } from "@prisma/client"
import { X, Upload, Sparkles } from "lucide-react"

export default function AddItemModal({
  onClose,
  onAdd
}: {
  onClose: () => void
  onAdd: (item: Item) => void
}) {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [formData, setFormData] = useState({
    imageUrl: "", // Main image
    images: [] as string[], // All images
    category: "トップス",
    brand: "",
    name: "",
    color: "",
    price: "",
    season: "オール",
    source: "",
    status: "available",
    removeBackground: false
  })

  const SEASONS = ["夏", "春秋", "春夏秋", "春秋冬", "冬", "オール"]

  const fetchUrlInfo = async () => {
    if (!formData.source || !formData.source.startsWith("http")) return
    setLoading(true)
    try {
      const res = await fetch("/api/fetch-url-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.source })
      })
      if (res.ok) {
        const data = await res.json()
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          brand: data.brand || prev.brand,
          price: data.price?.toString() || prev.price,
          category: data.category || prev.category,
          color: data.color || prev.color
        }))
      }
    } catch (error) {
      console.error("Failed to fetch URL info", error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeImage = async (image: string) => {
    setAnalyzing(true)
    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: image })
      })
      
      if (res.ok) {
        const data = await res.json()
        setFormData(prev => ({
          ...prev,
          category: data.category || prev.category,
          season: data.season === "All" ? "オール" : (data.season || prev.season),
          brand: data.brand || prev.brand,
          name: data.name || prev.name,
          color: data.color || prev.color
        }))
      }
    } catch (error) {
      console.error("Failed to analyze image", error)
    } finally {
      setAnalyzing(false)
    }
  }

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setAnalyzing(true)
      const newImages: string[] = []
      
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          const compressed = await compressImage(base64)
          newImages.push(compressed)
        }

        setFormData(prev => ({ 
          ...prev, 
          imageUrl: newImages[0], // Set first as main
          images: [...prev.images, ...newImages],
          brand: "", 
          name: "" 
        }))
        
        // Analyze the first image
        await analyzeImage(newImages[0])
      } catch (error) {
        console.error("Image processing failed", error)
      } finally {
        setAnalyzing(false)
      }
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index)
      return {
        ...prev,
        images: newImages,
        imageUrl: newImages[0] || ""
      }
    })
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
          price: formData.price ? parseInt(formData.price, 10) : null
        })
      })
      
      if (res.ok) {
        const newItem = await res.json()
        onAdd(newItem)
        onClose()
      } else {
        const errorText = await res.text()
        console.error("Save failed:", errorText)
        alert(`保存に失敗しました: ${errorText || res.statusText}`)
      }
    } catch (error) {
      console.error("Network error:", error)
      alert("ネットワークエラーが発生しました。通信環境を確認してください。")
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
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Photos <span className="text-red-400">*</span></label>
              <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  checked={formData.removeBackground}
                  onChange={e => setFormData(prev => ({ ...prev, removeBackground: e.target.checked }))}
                />
                背景を切り抜く（準備中）
              </label>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative w-32 h-32 shrink-0 rounded-2xl border border-stone-200 overflow-hidden bg-stone-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-contain mix-blend-multiply p-2" />
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-white/90 rounded-full p-1 shadow-sm hover:bg-stone-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 bg-stone-900 text-white text-[8px] px-1.5 py-0.5 rounded-sm">MAIN</span>
                  )}
                </div>
              ))}
              
              <div className={`shrink-0 w-32 h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors relative ${formData.images.length === 0 ? 'w-full h-48' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'}`}>
                <div className="space-y-2 text-center">
                  <Upload className="h-5 w-5 text-stone-400 mx-auto" strokeWidth={1.5} />
                  {formData.images.length === 0 && (
                    <div>
                      <p className="text-sm font-medium text-stone-700">Click to upload</p>
                      <p className="text-xs text-stone-400">Multiple images allowed</p>
                    </div>
                  )}
                </div>
                {analyzing && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <div className="h-6 w-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleImageUpload}
                  disabled={analyzing}
                  required={formData.images.length === 0}
                />
              </div>
            </div>
            {formData.images.length > 0 && !analyzing && (
              <button 
                type="button"
                onClick={() => analyzeImage(formData.images[0])}
                className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 mt-2"
              >
                <Sparkles className="h-3 w-3" /> 1枚目の画像で再解析
              </button>
            )}
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
                {SEASONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
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
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Color</label>
              <input 
                type="text" 
                placeholder="e.g. ホワイト, ブラック"
                className="w-full border border-stone-200 bg-stone-50 rounded-xl p-3 text-sm focus:border-stone-400 focus:ring-0 focus:bg-white transition-colors placeholder:text-stone-300"
                value={formData.color}
                onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider flex justify-between">
                Source 
                {formData.source && formData.source.startsWith("http") && (
                  <button type="button" onClick={fetchUrlInfo} className="text-stone-900 font-bold hover:underline normal-case">
                    URLから情報を取得
                  </button>
                )}
              </label>
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
