"use client"

import { useState, useRef } from "react"
import { Item } from "@prisma/client"
import { Plus, Search, Filter, Shirt, X, Calculator, ImagePlus, Sparkles, Trash2 } from "lucide-react"
import AddItemModal from "./AddItemModal"

const CATEGORIES = ["すべて", "トップス", "ボトムス", "アウター", "シューズ", "アクセサリー", "ワンピース", "バッグ", "雑貨・ライフスタイル", "ガジェット", "その他"]

export default function ClosetClient({ initialItems }: { initialItems: any[] }) {
  const [items, setItems] = useState<any[]>(initialItems)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("すべて")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  
  // Image Match Search State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [matchingImage, setMatchingImage] = useState<string | null>(null)
  const [isMatching, setIsMatching] = useState(false)
  const [matchResult, setMatchResult] = useState<{
    matchedItemIds: string[],
    reason: string
  } | null>(null)

  const handleMatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Image = reader.result as string
      setMatchingImage(base64Image)
      setIsMatching(true)
      setMatchResult(null)

      try {
        const res = await fetch("/api/match-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: base64Image, items })
        })
        if (res.ok) {
          setMatchResult(await res.json())
        }
      } catch (error) {
        console.error("Match search failed", error)
        alert("検索に失敗しました")
      } finally {
        setIsMatching(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // Declutter State
  const [isDecluttering, setIsDecluttering] = useState(false)
  const [declutterResult, setDeclutterResult] = useState<{
    advices: { itemIds: string[], reason: string }[]
  } | null>(null)

  const handleDeclutterAnalysis = async () => {
    if (items.length === 0) return
    setIsDecluttering(true)
    try {
      const res = await fetch("/api/declutter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      })
      if (res.ok) {
        setDeclutterResult(await res.json())
      }
    } catch (error) {
      console.error("Declutter analysis failed", error)
      alert("分析に失敗しました")
    } finally {
      setIsDecluttering(false)
    }
  }

  const filteredItems = items.filter(item => {
    const matchCategory = category === "すべて" || item.category === category
    const matchSearch = search === "" || 
      (item.name?.toLowerCase().includes(search.toLowerCase()) || 
       item.brand?.toLowerCase().includes(search.toLowerCase()))
    return matchCategory && matchSearch
  })

  const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0)

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-stone-200">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif tracking-tight">Wardrobe</h1>
          <p className="text-sm text-stone-500 font-light">あなたのコレクション</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDeclutterAnalysis}
            disabled={isDecluttering}
            className="group flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-5 py-2.5 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all active:scale-95 shadow-sm disabled:opacity-50"
            title="クローゼットの断捨離を提案"
          >
            {isDecluttering ? <Sparkles className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-stone-400" />}
            <span className="text-sm font-medium hidden sm:inline">整理</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-5 py-2.5 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all active:scale-95 shadow-sm"
          >
            <ImagePlus className="h-4 w-4" />
            <span className="text-sm font-medium">これに合う服は？</span>
          </button>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleMatchImageUpload}
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full hover:bg-stone-800 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            <span className="text-sm font-medium">アイテム追加</span>
          </button>
        </div>
      </div>

      {/* Match Search Result Section */}
      {(matchingImage || isMatching || matchResult) && (
        <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 animate-in slide-in-from-top-4 duration-300 relative">
          <button 
            onClick={() => { setMatchingImage(null); setMatchResult(null); setIsMatching(false); }}
            className="absolute top-4 right-4 p-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-48 shrink-0 space-y-3">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider text-center">Target Item</p>
              <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {matchingImage && <img src={matchingImage} alt="Target" className="w-full h-full object-contain p-2" />}
                {isMatching && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-stone-900 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <h3 className="text-xl font-serif text-stone-900">AI Match Result</h3>
              </div>
              
              {isMatching ? (
                <p className="text-stone-500 font-light animate-pulse">クローゼットの中から似合うアイテムを探しています...</p>
              ) : matchResult ? (
                <div className="space-y-6">
                  <p className="text-stone-700 leading-relaxed font-light">{matchResult.reason}</p>
                  
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-4">Matched Items from your closet</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {matchResult.matchedItemIds.map(id => {
                        const item = items.find(i => i.id === id)
                        if (!item) return null
                        return (
                          <div key={item.id} className="group cursor-pointer" onClick={() => setSelectedItem(item)}>
                            <div className="aspect-[3/4] bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Declutter Result Section */}
      {declutterResult && (
        <div className="bg-stone-50 p-6 sm:p-8 rounded-[2rem] border border-stone-100 animate-in slide-in-from-top-4 duration-300 relative">
          <button 
            onClick={() => setDeclutterResult(null)}
            className="absolute top-4 right-4 p-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-stone-700" />
              <h3 className="text-xl font-serif text-stone-900">AI Declutter Advice</h3>
            </div>

            <div className="space-y-6">
              {declutterResult.advices.map((advice, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <p className="text-stone-700 font-light leading-relaxed">{advice.reason}</p>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {advice.itemIds.map(id => {
                      const item = items.find(i => i.id === id)
                      if (!item) return null
                      return (
                        <div key={item.id} className="w-24 shrink-0 group cursor-pointer" onClick={() => setSelectedItem(item)}>
                          <div className="aspect-[3/4] bg-stone-50 rounded-xl overflow-hidden border border-stone-100 mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                          </div>
                          <p className="text-[10px] text-stone-500 truncate text-center px-1">{item.brand || item.name || "Unknown"}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-stone-100">
        <div className="flex flex-1 w-full gap-2">
          <div className="flex-1 flex items-center gap-2 bg-stone-50 px-4 py-2.5 rounded-xl border border-transparent focus-within:border-stone-200 focus-within:bg-white transition-colors">
            <Search className="h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="ブランドや名前で検索..."
              className="bg-transparent border-none outline-none w-full text-sm placeholder:text-stone-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-stone-50 px-4 py-2.5 rounded-xl border border-transparent focus-within:border-stone-200 focus-within:bg-white transition-colors">
            <Filter className="h-4 w-4 text-stone-400" />
            <select
              className="bg-transparent border-none outline-none w-full text-sm text-stone-700 cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="text-xs font-medium text-stone-400 uppercase tracking-widest px-4">
          {items.length} items / ¥{totalValue.toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
        {filteredItems.map(item => {
          const wearCount = item.coordinates?.length || 0;
          return (
            <div key={item.id} className="group cursor-pointer" onClick={() => setSelectedItem(item)}>
              <div className="aspect-[3/4] relative bg-stone-100 rounded-2xl overflow-hidden mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.name || "Item"}
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                {wearCount > 0 && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-stone-900 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                    {wearCount} wears
                  </div>
                )}
              </div>
              <div className="space-y-1 px-1">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">{item.category}</p>
                <h3 className="font-medium text-sm text-stone-900 truncate">{item.brand || "Unknown"}</h3>
                <p className="text-xs text-stone-500 truncate font-light">{item.name}</p>
              </div>
            </div>
          )
        })}
        {filteredItems.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-stone-400 space-y-4">
            <Shirt className="h-12 w-12 opacity-20" strokeWidth={1} />
            <p className="text-sm font-light">アイテムが見つかりません</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <AddItemModal
          onClose={() => setIsModalOpen(false)}
          onAdd={(newItem) => setItems([newItem, ...items])}
        />
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedItem(null)}>
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-stone-100 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedItem.imageUrl} alt={selectedItem.name || ""} className="w-full h-full object-cover mix-blend-multiply" />
            </div>
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400 font-medium mb-1">{selectedItem.category}</p>
                  <h2 className="text-2xl font-serif text-stone-900">{selectedItem.brand || "Unknown Brand"}</h2>
                  <p className="text-stone-500 font-light mt-1">{selectedItem.name || "No Name"}</p>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-stone-400 mb-1">Price</p>
                    <p className="font-medium text-stone-900">¥{selectedItem.price?.toLocaleString() || "---"}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 mb-1">Season</p>
                    <p className="font-medium text-stone-900">{selectedItem.season || "---"}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 mb-1">Source</p>
                    <p className="font-medium text-stone-900">{selectedItem.source || "---"}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 mb-1">Status</p>
                    <p className="font-medium text-stone-900 capitalize">{selectedItem.status}</p>
                  </div>
                </div>

                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-stone-900 mb-4">
                    <Calculator className="h-4 w-4" /> Cost Per Wear Analysis
                  </h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-stone-500 mb-1">Worn Count</p>
                      <p className="text-2xl font-serif">{selectedItem.coordinates?.length || 0} <span className="text-sm font-sans text-stone-400">times</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-500 mb-1">Cost Per Wear</p>
                      <p className="text-2xl font-serif text-stone-900">
                        {selectedItem.price && selectedItem.coordinates?.length > 0
                          ? `¥${Math.round(selectedItem.price / selectedItem.coordinates.length).toLocaleString()}`
                          : "---"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
