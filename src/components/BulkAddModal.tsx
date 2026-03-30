"use client"

import { useState } from "react"
import { X, Upload, Sparkles, Plus, Trash2, Edit2, Check, AlertCircle } from "lucide-react"
import { Button } from "./ui/button"

interface ScannedItem {
  category: string
  season: string
  brand: string
  name: string
  price: number | null
  purchaseDate: string | null
  color: string
  source: string
  imageUrl?: string
}

export default function BulkAddModal({
  onClose,
  onAdd
}: {
  onClose: () => void
  onAdd: (items: any[]) => void
}) {
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [recognizedItems, setRecognizedItems] = useState<ScannedItem[]>([])
  const [error, setError] = useState<string | null>(null)

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

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newImages: string[] = []
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
      setScreenshots(prev => [...prev, ...newImages])
    }
  }

  const handleScan = async () => {
    if (screenshots.length === 0) return
    setScanning(true)
    setError(null)
    try {
      const res = await fetch("/api/items/bulk-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: screenshots })
      })

      if (res.ok) {
        const data = await res.json()
        setRecognizedItems(data.items || [])
      } else {
        const errorText = await res.text()
        setError(`スキャンに失敗しました: ${errorText}`)
      }
    } catch (error) {
      console.error("Scan failed", error)
      setError("スキャン中にネットワークエラーが発生しました")
    } finally {
      setScanning(false)
    }
  }

  const handleBulkSave = async () => {
    if (recognizedItems.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: recognizedItems })
      })

      if (res.ok) {
        const data = await res.json()
        onAdd(data)
        onClose()
      } else {
        const errorText = await res.text()
        setError(`保存に失敗しました: ${errorText}`)
      }
    } catch (error) {
      console.error("Bulk save failed", error)
      setError("保存中にネットワークエラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  const removeItem = (index: number) => {
    setRecognizedItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItemField = (index: number, field: keyof ScannedItem, value: any) => {
    setRecognizedItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-100 shrink-0">
          <h2 className="text-xl font-serif tracking-tight text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-stone-400" />
            Bulk Add from Screenshots
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {recognizedItems.length === 0 ? (
            <div className="space-y-6">
              <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-3xl p-12 text-center relative group hover:border-stone-300 hover:bg-stone-100/50 transition-all">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={scanning}
                />
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-stone-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-stone-800">購入履歴のスクショをアップロード</p>
                    <p className="text-sm text-stone-500 mt-1">Amazon, ZOZOTOWN, 楽天などの注文履歴画面を複数枚可</p>
                  </div>
                </div>
              </div>

              {screenshots.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider">
                      Uploads ({screenshots.length})
                    </h3>
                    <button
                      onClick={() => setScreenshots([])}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                    {screenshots.map((img, idx) => (
                      <div key={idx} className="relative w-32 h-32 shrink-0 rounded-2xl border border-stone-200 overflow-hidden bg-white shadow-sm">
                        <img src={img} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setScreenshots(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-sm hover:bg-stone-100 transition-colors"
                        >
                          <X className="h-3 w-3 text-stone-600" />
                        </button>
                      </div>
                    ))}
                    <label className="w-32 h-32 shrink-0 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-stone-300 hover:bg-stone-50 transition-all">
                      <Plus className="w-6 h-6 text-stone-400" />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <Button
                    onClick={handleScan}
                    disabled={scanning || screenshots.length === 0}
                    className="w-full bg-stone-900 hover:bg-stone-800 h-14 rounded-2xl text-lg gap-2"
                  >
                    {scanning ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        AIが解析中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        AIで一括認識する
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif text-stone-800">
                  Recognized Items ({recognizedItems.length})
                </h3>
                <button
                  onClick={() => setRecognizedItems([])}
                  className="text-sm text-stone-500 hover:text-stone-800"
                >
                  Start over
                </button>
              </div>

              <div className="space-y-4">
                {recognizedItems.map((item, idx) => (
                  <div key={idx} className="group bg-white border border-stone-200 rounded-2xl p-5 hover:border-stone-300 transition-all shadow-sm">
                    <div className="flex gap-6">
                      <div className="w-24 h-24 shrink-0 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-center relative overflow-hidden">
                        <Edit2 className="w-4 h-4 text-stone-300 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] text-stone-400 text-center px-2">No Image Detected</span>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItemField(idx, 'name', e.target.value)}
                              className="w-full text-lg font-medium text-stone-900 border-none p-0 focus:ring-0 placeholder:text-stone-300"
                              placeholder="Item Name"
                            />
                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                value={item.brand}
                                onChange={(e) => updateItemField(idx, 'brand', e.target.value)}
                                className="text-sm text-stone-500 border-none p-0 focus:ring-0 placeholder:text-stone-300 w-32"
                                placeholder="Brand"
                              />
                              <span className="text-stone-300">|</span>
                              <select
                                value={item.category}
                                onChange={(e) => updateItemField(idx, 'category', e.target.value)}
                                className="text-sm text-stone-500 border-none p-0 focus:ring-0 bg-transparent cursor-pointer"
                              >
                                {["トップス", "ボトムス", "アウター", "シューズ", "アクセサリー", "ワンピース", "バッグ", "雑貨・ライフスタイル", "ガジェット", "その他"].map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(idx)}
                            className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-stone-50">
                          <div className="space-y-1">
                            <label className="text-[10px] text-stone-400 uppercase tracking-wider">Price</label>
                            <div className="flex items-center gap-1">
                              <span className="text-stone-400 text-sm">¥</span>
                              <input
                                type="number"
                                value={item.price || ""}
                                onChange={(e) => updateItemField(idx, 'price', e.target.value)}
                                className="w-full text-sm font-medium text-stone-700 border-none p-0 focus:ring-0 placeholder:text-stone-300"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-stone-400 uppercase tracking-wider">Date</label>
                            <input
                              type="date"
                              value={item.purchaseDate || ""}
                              onChange={(e) => updateItemField(idx, 'purchaseDate', e.target.value)}
                              className="w-full text-sm font-medium text-stone-700 border-none p-0 focus:ring-0 bg-transparent"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-stone-400 uppercase tracking-wider">Color</label>
                            <input
                              type="text"
                              value={item.color}
                              onChange={(e) => updateItemField(idx, 'color', e.target.value)}
                              className="w-full text-sm font-medium text-stone-700 border-none p-0 focus:ring-0 placeholder:text-stone-300"
                              placeholder="Color"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-stone-400 uppercase tracking-wider">Season</label>
                            <select
                              value={item.season}
                              onChange={(e) => updateItemField(idx, 'season', e.target.value)}
                              className="w-full text-sm font-medium text-stone-700 border-none p-0 focus:ring-0 bg-transparent cursor-pointer"
                            >
                              {["夏", "春秋", "春夏秋", "春秋冬", "冬", "オール"].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 bg-white/80 backdrop-blur-md pt-4 pb-2 border-t border-stone-100 flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="rounded-full px-8"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkSave}
                  disabled={saving || recognizedItems.length === 0}
                  className="bg-stone-900 hover:bg-stone-800 rounded-full px-12 gap-2"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {recognizedItems.length}点をクローゼットに追加
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
