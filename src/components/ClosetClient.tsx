"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import NextImage from "next/image"
import { Item } from "@prisma/client"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Plus, Search, Filter, Shirt, X, Calculator, ImagePlus, Sparkles, Trash2, Edit3, ChevronLeft, ChevronRight, ArrowUpDown, Layers } from "lucide-react"
import AddItemModal from "./AddItemModal"
import BulkAddModal from "./BulkAddModal"

const CATEGORIES = ["すべて", "トップス", "ボトムス", "アウター", "シューズ", "アクセサリー", "ワンピース", "バッグ", "雑貨・ライフスタイル", "ガジェット", "その他"]

const SORT_OPTIONS = [
  { label: "登録順 (新)", value: "created_desc" },
  { label: "登録順 (旧)", value: "created_asc" },
  { label: "購入順 (新)", value: "purchase_desc" },
  { label: "購入順 (旧)", value: "purchase_asc" },
  { label: "価格が高い順", value: "price_desc" },
  { label: "価格が安い順", value: "price_asc" },
  { label: "着用頻度が高い順", value: "freq_desc" },
  { label: "着用頻度が低い順", value: "freq_asc" },
]

export default function ClosetClient({ initialItems }: { initialItems: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  const [items, setItems] = useState<any[]>(initialItems)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("すべて")
  const [sortBy, setSortBy] = useState("created_desc")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showNameTooltip, setShowNameTooltip] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [newImages, setNewImages] = useState<string[]>([])
  const [editFormData, setEditFormData] = useState({
    category: "",
    brand: "",
    name: "",
    color: "",
    purchaseDate: "",
    price: "",
    season: "",
    source: "",
    status: ""
  })
  const [isMatching, setIsMatching] = useState(false) 
  const [updating, setUpdating] = useState(false)
  const [fetchingUrl, setFetchingUrl] = useState(false)

  // Image Match Search State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [matchingImage, setMatchingImage] = useState<string | null>(null)
  const [matchResult, setMatchResult] = useState<{
    matchedItemIds: string[],
    reason: string
  } | null>(null)

  // URLからアイテムIDを取得して詳細を表示
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      const item = items.find(i => i.id === editId)
      if (item) {
        setSelectedItem(item)
        setIsEditMode(true)
        // フォームデータも初期化
        setEditFormData({
          category: item.category,
          brand: item.brand || "",
          name: item.name || "",
          color: item.color || "",
          purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : "",
          price: item.price?.toString() || "",
          season: item.season || "オール",
          source: item.source || "",
          status: item.status || "available"
        })
      }
    } else {
      const itemId = searchParams.get('item')
      if (itemId) {
        const item = items.find(i => i.id === itemId)
        if (item) {
          setSelectedItem(item)
          setIsEditMode(false)
        }
      }
    }
  }, [searchParams, items])

  const openItemDetails = (item: any) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('item', item.id)
    params.delete('edit')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const closeItemDetails = () => {
    setSelectedItem(null)
    setIsEditMode(false)
    setNewImages([])
    setCurrentImageIndex(0)
    setShowNameTooltip(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('item')
    params.delete('edit')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleEditClick = (item: any) => {
    setNewImages([]) // Reset newly uploaded images
    const params = new URLSearchParams(searchParams.toString())
    params.set('edit', item.id)
    params.delete('item')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const fetchUrlInfo = async () => {
    if (!editFormData.source || !editFormData.source.startsWith("http")) return
    setFetchingUrl(true)
    try {
      const res = await fetch("/api/fetch-url-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: editFormData.source })
      })
      if (res.ok) {
        const data = await res.json()
        setEditFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          brand: data.brand || prev.brand,
          price: data.price?.toString() || prev.price,
          category: data.category || prev.category,
          color: data.color || prev.color
        }))
      } else {
        alert("情報の取得に失敗しました")
      }
    } catch (error) {
      console.error("Failed to fetch URL info", error)
      alert("エラーが発生しました")
    } finally {
      setFetchingUrl(false)
    }
  }

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setUpdating(true)
      const uploaded: string[] = []
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          const compressed = await compressImage(base64)
          uploaded.push(compressed)
        }
        setNewImages(prev => [...prev, ...uploaded])
      } catch (error) {
        console.error("Image processing failed", error)
      } finally {
        setUpdating(false)
      }
    }
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
          price: editFormData.price ? parseInt(editFormData.price) : null,
          purchaseDate: editFormData.purchaseDate ? new Date(editFormData.purchaseDate) : null,
          newImages: newImages // Newly added images
        })
      })
      if (res.ok) {
        const updatedItem = await res.json()
        setItems(items.map(i => i.id === updatedItem.id ? { ...updatedItem, coordinates: i.coordinates } : i))
        setSelectedItem({ ...updatedItem, coordinates: selectedItem.coordinates })
        setIsEditMode(false)
        setNewImages([]) // Clear after update
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

  const handleMatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (items.length === 0) {
      alert("クローゼットにアイテムがありません。先にアイテムを追加してください。")
      return
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Image = reader.result as string
      setMatchingImage(base64Image)
      setIsMatching(true)
      setMatchResult(null)

      try {
        const compressed = await compressImage(base64Image)
        setMatchingImage(compressed) // Use compressed for preview too

        // ペイロード削減のため、画像データを除いたメタデータのみを送信
        const itemsMetadata = items.map((item: any) => ({
          id: item.id,
          category: item.category,
          brand: item.brand,
          name: item.name,
          season: item.season,
          color: item.color
        }))

        const res = await fetch("/api/match-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: compressed, items: itemsMetadata })
        })
        if (res.ok) {
          setMatchResult(await res.json())
        } else {
          const errorText = await res.text()
          console.error("Match search failed:", errorText)
          alert("検索に失敗しました: " + errorText)
        }
      } catch (error) {
        console.error("Match search failed", error)
        alert("検索中にエラーが発生しました")
      } finally {
        setIsMatching(false)
      }
    }
    reader.onerror = () => {
      alert("画像の読み込みに失敗しました")
      setIsMatching(false)
    }
    reader.readAsDataURL(file)
    // 次回同じファイルを選んでもonChangeが走るようにリセット
    e.target.value = ""
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
      // ペイロード削減のため、画像データを除いたメタデータのみを送信
      const itemsMetadata = items.map((item: any) => ({
        id: item.id,
        category: item.category,
        brand: item.brand,
        name: item.name,
        season: item.season,
        color: item.color
      }))

      const res = await fetch("/api/declutter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsMetadata })
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

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const matchCategory = category === "すべて" || item.category === category
      const matchSearch = search === "" || 
        (item.name?.toLowerCase().includes(search.toLowerCase()) || 
         item.brand?.toLowerCase().includes(search.toLowerCase()))
      return matchCategory && matchSearch
    })

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "created_desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "created_asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "purchase_desc":
          const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0
          const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0
          return dateB - dateA
        case "purchase_asc":
          const dateA2 = a.purchaseDate ? new Date(a.purchaseDate).getTime() : Infinity
          const dateB2 = b.purchaseDate ? new Date(b.purchaseDate).getTime() : Infinity
          return dateA2 - dateB2
        case "price_desc":
          return (b.price || 0) - (a.price || 0)
        case "price_asc":
          return (a.price || 0) - (b.price || 0)
        case "freq_desc":
          return (b.coordinates?.length || 0) - (a.coordinates?.length || 0)
        case "freq_asc":
          return (a.coordinates?.length || 0) - (b.coordinates?.length || 0)
        default:
          return 0
      }
    })

    return result
  }, [items, category, search, sortBy])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div className="space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-serif tracking-tight">Wardrobe</h1>
          <p className="text-[10px] sm:text-sm text-stone-500 font-light">あなたのコレクション</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={handleDeclutterAnalysis}
            disabled={isDecluttering}
            className="group flex items-center justify-center gap-2 bg-white border border-stone-200 text-stone-700 p-2 sm:px-5 sm:py-2.5 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all active:scale-95 shadow-sm disabled:opacity-50"
            title="整理"
          >
            {isDecluttering ? <Sparkles className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-stone-400" />}
            <span className="text-sm font-medium hidden sm:inline">整理</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group flex items-center justify-center gap-2 bg-white border border-stone-200 text-stone-700 p-2 sm:px-5 sm:py-2.5 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all active:scale-95 shadow-sm"
            title="似合う服"
          >
            <ImagePlus className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">似合う服</span>
          </button>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleMatchImageUpload}
          />
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="group flex items-center justify-center gap-2 bg-white border border-stone-200 text-stone-700 p-2 sm:px-5 sm:py-2.5 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all active:scale-95 shadow-sm"
            title="一括追加"
          >
            <Layers className="h-4 w-4 text-stone-400" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">一括追加</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center justify-center gap-2 bg-stone-900 text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-full hover:bg-stone-800 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            <span className="text-xs sm:text-sm font-medium">追加</span>
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
                {matchingImage && (
                  <NextImage 
                    src={matchingImage} 
                    alt="Target" 
                    fill
                    className="object-contain p-2" 
                  />
                )}
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
                          <div key={item.id} className="group cursor-pointer" onClick={() => openItemDetails(item)}>
                            <div className="aspect-[3/4] bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm relative">
                              <NextImage 
                                src={item.imageUrl} 
                                alt="" 
                                fill
                                sizes="100px"
                                className="object-cover mix-blend-multiply" 
                              />
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
                        <div key={item.id} className="w-24 shrink-0 group cursor-pointer" onClick={() => openItemDetails(item)}>
                          <div className="aspect-[3/4] bg-stone-50 rounded-xl overflow-hidden border border-stone-100 mb-2 relative">
                            <NextImage 
                              src={item.imageUrl} 
                              alt="" 
                              fill
                              sizes="96px"
                              className="object-cover mix-blend-multiply" 
                            />
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

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-1.5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-stone-100">
        <div className="flex flex-col sm:flex-row flex-1 w-full gap-2">
          <div className="flex-1 flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-xl border border-transparent focus-within:border-stone-200 focus-within:bg-white transition-colors">
            <Search className="h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="ブランドや名前で検索..."
              className="bg-transparent border-none outline-none w-full text-sm placeholder:text-stone-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-xl border border-transparent focus-within:border-stone-200 focus-within:bg-white transition-colors">
            <Filter className="h-4 w-4 text-stone-400" />
            <select
              className="bg-transparent border-none outline-none w-full text-sm text-stone-700 cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-xl border border-transparent focus-within:border-stone-200 focus-within:bg-white transition-colors">
            <ArrowUpDown className="h-4 w-4 text-stone-400" />
            <select
              className="bg-transparent border-none outline-none w-full text-sm text-stone-700 cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        <div className="text-xs font-medium text-stone-400 uppercase tracking-widest px-4">
          {items.length} items
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
        {filteredItems.map((item, index) => {
          const wearCount = item.coordinates?.length || 0;
          return (
            <div key={item.id} className="group cursor-pointer" onClick={() => openItemDetails(item)}>
              <div className="aspect-[3/4] relative bg-stone-100 rounded-2xl overflow-hidden mb-2">
                <NextImage
                  src={item.imageUrl}
                  alt={item.name || "Item"}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority={index < 10}
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
                {item.purchaseDate && (
                  <p className="text-[10px] text-stone-400 font-light">
                    購入日: {new Date(item.purchaseDate).toLocaleDateString('ja-JP')}
                  </p>
                )}
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

      {isBulkModalOpen && (
        <BulkAddModal
          onClose={() => setIsBulkModalOpen(false)}
          onAdd={(newItems) => setItems([...newItems, ...items])}
        />
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={closeItemDetails}>
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
            {/* Top Right Close Button for entire modal */}
            <button 
              onClick={closeItemDetails} 
              className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur-md rounded-full text-stone-400 hover:text-stone-900 transition-all shadow-sm md:shadow-none md:bg-transparent"
              title="閉じる"
            >
              <X className="h-6 w-6" strokeWidth={1.5} />
            </button>
            
            <div className="w-full md:w-3/5 aspect-square md:aspect-auto bg-stone-100 relative group/carousel">
              {/* Multiple Images Display with Arrows */}
              <div className="w-full h-full relative overflow-hidden">
                {(() => {
                  const existingImagesUrls = (selectedItem.images || []).map((img: any) => img.url)
                  const displayImages = [...existingImagesUrls]
                  
                  // もともと画像がないか、imageUrlがimagesに含まれていない場合は先頭に追加
                  if (selectedItem.imageUrl && !existingImagesUrls.includes(selectedItem.imageUrl)) {
                    displayImages.unshift(selectedItem.imageUrl)
                  }
                  
                  // 追加画像があれば末尾に追加
                  displayImages.push(...newImages)
                  
                  if (displayImages.length > 0) {
                    return (
                      <div 
                        className="w-full h-full flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                      >
                        {displayImages.map((url: string, idx: number) => (
                          <div key={idx} className="relative w-full h-full flex-shrink-0">
                            <NextImage 
                              src={url} 
                              alt="" 
                              fill
                              className="object-contain mix-blend-multiply" 
                              priority={idx === 0}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  } else {
                    return (
                      <div className="relative w-full h-full">
                        <NextImage 
                          src={selectedItem.imageUrl} 
                          alt={selectedItem.name || ""} 
                          fill
                          className="object-contain mix-blend-multiply" 
                          priority
                        />
                      </div>
                    )
                  }
                })()}

                {/* Navigation Arrows */}
                {(() => {
                  const existingImagesUrls = (selectedItem.images || []).map((img: any) => img.url)
                  const displayImages = [...existingImagesUrls]
                  if (selectedItem.imageUrl && !existingImagesUrls.includes(selectedItem.imageUrl)) {
                    displayImages.unshift(selectedItem.imageUrl)
                  }
                  displayImages.push(...newImages)
                  
                  const totalImages = displayImages.length
                  if (totalImages > 1) {
                    return (
                      <>
                        <button 
                          onClick={() => setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : totalImages - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full text-stone-900 shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => setCurrentImageIndex(prev => (prev < totalImages - 1 ? prev + 1 : 0))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full text-stone-900 shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        
                        {/* Pagination Dots */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                          {Array.from({ length: totalImages }).map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${currentImageIndex === idx ? 'bg-stone-900 w-4' : 'bg-stone-300'}`}
                            />
                          ))}
                        </div>
                      </>
                    )
                  }
                  return null
                })()}
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
                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-medium block">Add Images</label>
                        <div className="flex flex-wrap gap-2">
                          <label className="w-16 h-16 border-2 border-dashed border-stone-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-stone-400 transition-colors">
                            <Plus className="h-4 w-4 text-stone-400" />
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple 
                              className="hidden" 
                              onChange={handleEditImageUpload}
                              disabled={updating}
                            />
                          </label>
                          {newImages.map((url, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-xl border border-stone-200 overflow-hidden bg-stone-50">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <button 
                                onClick={() => setNewImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-0.5 right-0.5 p-0.5 bg-white/80 rounded-full text-stone-500 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
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
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {!isEditMode && (
                    <button 
                      onClick={() => handleEditClick(selectedItem)}
                      className="p-3 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors bg-stone-50"
                      title="編集"
                    >
                      <Edit3 className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                  )}
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
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Purchase Date</label>
                        <input 
                          type="date"
                          className="w-full border border-stone-200 bg-stone-50 rounded-xl p-2 text-sm focus:border-stone-400 focus:outline-none"
                          value={editFormData.purchaseDate}
                          onChange={e => setEditFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
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
                      <label className="text-[10px] uppercase tracking-wider text-stone-400 font-medium flex justify-between items-center">
                        Source URL / Store
                        {editFormData.source && editFormData.source.startsWith("http") && (
                          <button 
                            type="button" 
                            onClick={fetchUrlInfo} 
                            disabled={fetchingUrl}
                            className="text-stone-900 font-bold hover:underline normal-case disabled:opacity-50"
                          >
                            {fetchingUrl ? "取得中..." : "URLから情報を取得"}
                          </button>
                        )}
                      </label>
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
                        <p className="text-stone-400 mb-1">Purchase Date</p>
                        <p className="font-medium text-stone-900">{selectedItem.purchaseDate ? new Date(selectedItem.purchaseDate).toLocaleDateString('ja-JP') : "---"}</p>
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
