"use client"

import { useState } from "react"
import { Item } from "@prisma/client"
import { Plus, Search, Filter, Shirt } from "lucide-react"
import AddItemModal from "./AddItemModal"

const CATEGORIES = ["すべて", "トップス", "ボトムス", "アウター", "シューズ", "アクセサリー", "ワンピース", "バッグ", "雑貨・ライフスタイル", "ガジェット", "その他"]

export default function ClosetClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("すべて")
  const [isModalOpen, setIsModalOpen] = useState(false)

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
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full hover:bg-stone-800 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          <span className="text-sm font-medium">アイテム追加</span>
        </button>
      </div>

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
        {filteredItems.map(item => (
          <div key={item.id} className="group cursor-pointer">
            <div className="aspect-[3/4] relative bg-stone-100 rounded-2xl overflow-hidden mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.name || "Item"}
                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
            </div>
            <div className="space-y-1 px-1">
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">{item.category}</p>
              <h3 className="font-medium text-sm text-stone-900 truncate">{item.brand || "Unknown"}</h3>
              <p className="text-xs text-stone-500 truncate font-light">{item.name}</p>
            </div>
          </div>
        ))}
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
    </div>
  )
}
