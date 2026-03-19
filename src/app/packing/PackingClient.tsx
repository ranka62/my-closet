"use client"

import { useState } from "react"
import { Item } from "@prisma/client"
import { Plus, Briefcase, Calendar as CalendarIcon, CheckSquare } from "lucide-react"
import { format } from "date-fns"

export default function PackingClient({ items, initialLists }: { items: Item[], initialLists: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    notes: "",
    itemIds: [] as string[]
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      itemIds: prev.itemIds.includes(id) 
        ? prev.itemIds.filter(i => i !== id)
        : [...prev.itemIds, id]
    }))
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-stone-200">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif tracking-tight text-stone-900 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-stone-700" />
            Packing Lists
          </h1>
          <p className="text-sm text-stone-500 font-light">旅行や出張の持ち物準備</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full hover:bg-stone-800 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          <span className="text-sm font-medium">Create New</span>
        </button>
      </div>

      {isModalOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Title</label>
              <input 
                type="text" required
                placeholder="e.g. 2泊3日 京都旅行"
                className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-lg font-light text-stone-900 focus:border-stone-900 focus:outline-none transition-colors"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Start Date</label>
                <input 
                  type="date" required
                  className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-lg font-light text-stone-900 focus:border-stone-900 focus:outline-none transition-colors"
                  value={formData.startDate}
                  onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">End Date</label>
                <input 
                  type="date" required
                  className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-lg font-light text-stone-900 focus:border-stone-900 focus:outline-none transition-colors"
                  value={formData.endDate}
                  onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Select Items to Pack</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-60 overflow-y-auto p-2 border border-stone-100 rounded-2xl bg-stone-50/50">
              {items.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => toggleItem(item.id)}
                  className={`cursor-pointer rounded-xl overflow-hidden relative group transition-all duration-200 ${formData.itemIds.includes(item.id) ? 'ring-2 ring-stone-900 ring-offset-2 scale-95' : 'hover:scale-105'}`}
                >
                  <div className="aspect-[3/4] bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  {formData.itemIds.includes(item.id) && (
                    <div className="absolute inset-0 bg-stone-900/10 flex items-center justify-center">
                      <CheckSquare className="text-stone-900 h-6 w-6 bg-white rounded-md" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100">Cancel</button>
            <button type="submit" disabled={loading} className="bg-stone-900 text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-stone-800 disabled:opacity-50">
              {loading ? "Saving..." : "Save List"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6">
        {initialLists.map(list => (
          <div key={list.id} className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-serif text-stone-900">{list.title}</h2>
                <p className="text-sm text-stone-500 flex items-center gap-2 mt-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(new Date(list.startDate), "yyyy.MM.dd")} - {format(new Date(list.endDate), "yyyy.MM.dd")}
                </p>
              </div>
              <div className="bg-stone-100 px-4 py-2 rounded-full text-sm font-medium text-stone-600">
                {list.items.length} items
              </div>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 pt-6 border-t border-stone-100">
              {list.items.map((li: any) => (
                <div key={li.id} className="group relative">
                  <div className="aspect-[3/4] bg-stone-50 rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={li.item.imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
