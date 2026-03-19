"use client"

import { useState } from "react"
import { Item } from "@prisma/client"
import { Sparkles, Save, ThumbsUp, ThumbsDown, ThermometerSun, MapPin, MessageSquare } from "lucide-react"

export default function StylistClient({ items }: { items: Item[] }) {
  const [temperature, setTemperature] = useState("20")
  const [scene, setScene] = useState("オフィス")
  const [request, setRequest] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<{
    itemIds: string[],
    reason: string
  } | null>(null)

  const handleGenerate = async () => {
    if (items.length === 0) {
      alert("クローゼットにアイテムがありません。まずはアイテムを追加してください。")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperature, scene, request, items })
      })
      const data = await res.json()
      if (res.ok) {
        setSuggestion(data)
      } else {
        alert(data.error || "エラーが発生しました")
      }
    } catch (error) {
      console.error(error)
      alert("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToCalendar = async () => {
    if (!suggestion) return
    try {
      const res = await fetch("/api/coordinates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          scene,
          notes: suggestion.reason,
          itemIds: suggestion.itemIds,
          isAi: true
        })
      })
      if (res.ok) {
        alert("カレンダーに保存しました！")
      }
    } catch (error) {
      console.error(error)
      alert("保存に失敗しました")
    }
  }

  const suggestedItems = suggestion?.itemIds
    .map(id => items.find(i => i.id === id))
    .filter(Boolean) as Item[]

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center p-3 bg-stone-100 rounded-full mb-2">
          <Sparkles className="h-6 w-6 text-stone-700" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-serif tracking-tight text-stone-900">AI Stylist</h1>
        <p className="text-stone-500 font-light max-w-lg mx-auto">今日の気温と予定に合わせて、あなたのクローゼットから最適なコーディネートを提案します。</p>
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-medium text-stone-500 uppercase tracking-wider">
              <ThermometerSun className="h-4 w-4" /> Temperature
            </label>
            <div className="relative">
              <input 
                type="number" 
                className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-2xl font-light text-stone-900 focus:border-stone-900 focus:outline-none transition-colors"
                value={temperature}
                onChange={e => setTemperature(e.target.value)}
              />
              <span className="absolute right-0 bottom-3 text-stone-400 font-light">℃</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-medium text-stone-500 uppercase tracking-wider">
              <MapPin className="h-4 w-4" /> Scene
            </label>
            <select 
              className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-xl font-light text-stone-900 focus:border-stone-900 focus:outline-none transition-colors cursor-pointer appearance-none"
              value={scene}
              onChange={e => setScene(e.target.value)}
            >
              {["オフィス", "デート", "カフェ", "アウトドア", "パーティー", "リラックス"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-medium text-stone-500 uppercase tracking-wider">
              <MessageSquare className="h-4 w-4" /> Request
            </label>
            <input 
              type="text" 
              placeholder="e.g. 歩きやすい靴で"
              className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-xl font-light text-stone-900 focus:border-stone-900 focus:outline-none transition-colors placeholder:text-stone-300"
              value={request}
              onChange={e => setRequest(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-center">
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-medium tracking-wide text-white transition-all duration-200 bg-stone-900 rounded-full hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 animate-spin" />
                Thinking...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Generate Style
                <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
              </span>
            )}
          </button>
        </div>
      </div>

      {suggestion && (
        <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-10">
          <div className="text-center">
            <h2 className="text-2xl font-serif text-stone-900">Today&apos;s Look</h2>
            <div className="h-px w-24 bg-stone-300 mx-auto mt-6 mb-8"></div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 overflow-hidden">
            <div className="p-8 sm:p-12 border-b border-stone-100 bg-stone-50/50">
              <p className="text-stone-700 leading-loose whitespace-pre-wrap font-light text-lg">{suggestion.reason}</p>
            </div>

            <div className="p-8 sm:p-12">
              <h3 className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-8 text-center">Selected Items</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
                {suggestedItems.map(item => (
                  <div key={item.id} className="group">
                    <div className="aspect-[3/4] relative bg-stone-100 rounded-2xl overflow-hidden mb-4 border border-stone-100/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.name || ""} className="object-cover w-full h-full mix-blend-multiply transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">{item.category}</p>
                      <p className="text-sm font-medium text-stone-900 truncate px-2">{item.brand || item.name || "Unknown"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-stone-200 rounded-full hover:bg-stone-50 hover:border-stone-300 text-sm font-medium text-stone-600 transition-all active:scale-95 shadow-sm">
                  <ThumbsUp className="h-4 w-4" /> Good
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-stone-200 rounded-full hover:bg-stone-50 hover:border-stone-300 text-sm font-medium text-stone-600 transition-all active:scale-95 shadow-sm">
                  <ThumbsDown className="h-4 w-4" /> Pass
                </button>
              </div>
              <button 
                onClick={handleSaveToCalendar}
                className="flex items-center gap-2 px-8 py-2.5 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-sm font-medium transition-all active:scale-95 shadow-md"
              >
                <Save className="h-4 w-4" /> Save to Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
