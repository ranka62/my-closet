"use client"

import { useState, useRef } from "react"
import { Item } from "@prisma/client"
import { Plus, Search, Filter, Shirt, X, Calculator, ImagePlus, Sparkles, Trash2, Edit3, ChevronLeft, ChevronRight } from "lucide-react"
import AddItemModal from "./AddItemModal"

const CATEGORIES = ["すべて", "トップス", "ボトムス", "アウター", "シューズ", "アクセサリー", "ワンピース", "バッグ", "雑貨・ライフスタイル", "ガジェット", "その他"]

export default function ClosetClient({ initialItems }: { initialItems: any[] }) {
  const [items, setItems] = useState<any[]>(initialItems)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("すべて")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showNameTooltip, setShowNameTooltip] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState({
    category: "",
    brand: "",
    name: "",
    color: "",
    price: "",
    season: "",
    source: "",
    status: ""
  })
  const [isMatching, setIsMatching] = useState(false) 
  const [updating, setUpdating] = useState(false)

  // Image Match Search State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [matchingImage, setMatchingImage] = useState<string | null>(null)
  const [matchResult, setMatchResult] = useState<{
    matchedItemIds: string[],
    reason: string
  } | null>(null)

  // ... (existing states)

  const handleEditClick = (item: any) => {
    setEditFormData({
      category: item.category,
      brand: item.brand || "",
      name: item.name || "",
      color: item.color || "",
      price: item.price?.toString() || "",
      season: item.season || "オール",
      source: item.source || "",
      status: item.status || "available"
    })
    setIsEditMode(true)
  }

  const handleUpdateItem = async () => {
    if (!selectedItem) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/items/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFormData,
          price: editFormData.price ? parseInt(editFormData.price) : null
        })
      })
      if (res.ok) {
        const updatedItem = await res.json()
        setItems(items.map(i => i.id === updatedItem.id ? { ...updatedItem, coordinates: i.coordinates } : i))
        setSelectedItem({ ...updatedItem, coordinates: selectedItem.coordinates })
        setIsEditMode(false)
      }
    } catch (error) {
      console.error(error)
      alert("更新に失敗しました")
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!selectedItem) return
    if (!window.confirm("このアイテムを削除してもよろしいですか？この操作は取り消せません。")) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/items/${selectedItem.id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        setItems(items.filter(i => i.id !== selectedItem.id))
        setSelectedItem(null)
      }
    } catch (error) {
      console.error(error)
      alert("削除に失敗しました")
    } finally {
      setUpdating(false)
    }
  }

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => { setSelectedItem(null); setIsEditMode(false); setCurrentImageIndex(0); setShowNameTooltip(false); }}>
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
            
            <div className="w-full md:w-3/5 aspect-square md:aspect-auto bg-stone-100 relative group/carousel">
              {/* Multiple Images Display with Arrows */}
              <div className="w-full h-full relative overflow-hidden">
                {selectedItem.images && selectedItem.images.length > 0 ? (
                  <div 
                    className="w-full h-full flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                  >
                    {selectedItem.images.map((img: any, idx: number) => (
                      <img 
                        key={idx} 
                        src={img.url} 
                        alt="" 
                        className="w-full h-full object-contain mix-blend-multiply flex-shrink-0" 
                      />
                    ))}
                  </div>
                ) : (
                  <img src={selectedItem.imageUrl} alt={selectedItem.name || ""} className="w-full h-full object-contain mix-blend-multiply" />
                )}

                {/* Navigation Arrows */}
                {selectedItem.images?.length > 1 && (
                  <>
                    <button 
                      onClick={() => setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : selectedItem.images.length - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full text-stone-900 shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => setCurrentImageIndex(prev => (prev < selectedItem.images.length - 1 ? prev + 1 : 0))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full text-stone-900 shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    
                    {/* Pagination Dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                      {selectedItem.images.map((_: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${currentImageIndex === idx ? 'bg-stone-900 w-4' : 'bg-stone-300'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="w-full md:w-2/5 p-6 md:p-10 flex flex-col overflow-y-auto bg-white border-l border-stone-50">
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1 min-w-0 pr-4">
                  {isEditMode ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Category</label>
                        <select 
                          className="w-full border border-stone-200 bg-stone-50 rounded-xl p-2 text-sm focus:border-stone-400 focus:outline-none"
                          value={editFormData.category}
                          onChange={e => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                        >
                          {CATEGORIES.filter(c => c !== "すべて").map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Brand</label>
                        <input 
                          type="text"
                          className="w-full border border-stone-200 bg-stone-50 rounded-xl p-2 text-sm focus:border-stone-400 focus:outline-none"
                          value={editFormData.brand}
                          onChange={e => setEditFormData(prev => ({ ...prev, brand: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Name</label>
                        <input 
                          type="text"
                          className="w-full border border-stone-200 bg-stone-50 rounded-xl p-2 text-sm focus:border-stone-400 focus:outline-none"
                          value={editFormData.name}
                          onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs uppercase tracking-wider text-stone-400 font-medium mb-1.5">{selectedItem.category}</p>
                      <h2 className="text-3xl font-serif text-stone-900 truncate" title={selectedItem.brand || "Unknown Brand"}>{selectedItem.brand || "Unknown Brand"}</h2>
                      <div className="relative">
                        <p 
                          className="text-stone-500 font-light mt-1.5 truncate text-lg cursor-help" 
                          onClick={() => setShowNameTooltip(!showNameTooltip)}
                        >
                          {selectedItem.name || "No Name"}
                        </p>
                        {showNameTooltip && (
                          <div className="absolute top-full left-0 z-50 mt-2 p-3 bg-stone-900 text-white text-sm rounded-xl shadow-xl max-w-xs animate-in fade-in zoom-in-95 duration-200">
                            {selectedItem.name || "No Name"}
                            <div className="absolute -top-1 left-4 w-2 h-2 bg-stone-900 rotate-45" />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Unified Button Group to prevent overlap */}
                <div className="flex items-center gap-1 shrink-0">
                  {!isEditMode && (
                    <button 
                      onClick={() => handleEditClick(selectedItem)}
                      className="p-2.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors"
                      title="編集"
                    >
                      <Edit3 className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                  )}
                  <button 
                    onClick={() => { setSelectedItem(null); setIsEditMode(false); setCurrentImageIndex(0); setShowNameTooltip(false); }} 
                    className="p-2.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors"
                    title="閉じる"
                  >
                    <X className="h-6 w-6" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="space-y-6 flex-1 pr-4">
                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Price (¥)</label>
                        <input 
                          type="number"
                          className="w-full border border-stone-200 bg-stone-50 rounded-xl p-2 text-sm focus:border-stone-400 focus:outline-none"
                          value={editFormData.price}
                          onChange={e => setEditFormData(prev => ({ ...prev, price: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Color</label>
                        <input 
                          type="text"
                          className="w-full border border-stone-200 bg-stone-50 rounded-xl p-2 text-sm focus:border-stone-400 focus:outline-none"
                          value={editFormData.color}
                          onChange={e => setEditFormData(prev => ({ ...prev, color: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Season</label>
                        <select 
                          className="w-full border border-stone-200 bg-stone-50 rounded-xl p-2 text-sm focus:border-stone-400 focus:outline-none"
                          value={editFormData.season}
                          onChange={e => setEditFormData(prev => ({ ...prev, season: e.target.value }))}
                        >
                          {["夏", "春秋", "春夏秋", "春秋冬", "冬", "オール"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Status</label>
                        <select 
                          className="w-full border border-stone-200 bg-stone-50 rounded-xl p-2 text-sm focus:border-stone-400 focus:outline-none"
                          value={editFormData.status}
                          onChange={e => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                        >
                          {["available", "washing", "cleaning", "archived"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Source URL / Store</label>
                      <input 
                        type="text"
                        className="w-full border border-stone-200 bg-stone-50 rounded-xl p-2 text-sm focus:border-stone-400 focus:outline-none"
                        value={editFormData.source}
                        onChange={e => setEditFormData(prev => ({ ...prev, source: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <button 
                        onClick={handleUpdateItem}
                        disabled={updating}
                        className="flex-1 bg-stone-900 text-white py-2 rounded-full text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
                      >
                        {updating ? "Saving..." : "Save Changes"}
                      </button>
                      <button 
                        onClick={() => setIsEditMode(false)}
                        className="flex-1 border border-stone-200 text-stone-600 py-2 rounded-full text-sm font-medium hover:bg-stone-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="min-w-0">
                        <p className="text-stone-400 mb-1">Price</p>
                        <p className="font-medium text-stone-900">¥{selectedItem.price?.toLocaleString() || "---"}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-stone-400 mb-1">Color</p>
                        <p className="font-medium text-stone-900">{selectedItem.color || "---"}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-stone-400 mb-1">Season</p>
                        <p className="font-medium text-stone-900">{selectedItem.season || "---"}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-stone-400 mb-1">Status</p>
                        <p className="font-medium text-stone-900 capitalize">{selectedItem.status}</p>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <p className="text-stone-400 mb-1">Source</p>
                        {selectedItem.source?.startsWith('http') ? (
                          <a 
                            href={selectedItem.source} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-medium text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors block truncate"
                          >
                            {selectedItem.source}
                          </a>
                        ) : (
                          <p className="font-medium text-stone-900 truncate">{selectedItem.source || "---"}</p>
                        )}
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

                    <div className="pt-4">
                      <button 
                        onClick={handleDeleteItem}
                        disabled={updating}
                        className="flex items-center justify-center gap-2 w-full text-red-500 text-xs font-medium hover:text-red-700 transition-colors py-2 border border-red-100 rounded-xl hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete this item
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
