"use client"

import { useState } from "react"
import { DayPicker } from "react-day-picker"
import { format, isSameDay } from "date-fns"
import { ja } from "date-fns/locale"
import "react-day-picker/dist/style.css"
import { Plus, Sparkles, MapPin, AlignLeft, Calendar as CalendarIcon, Users } from "lucide-react"

export default function CalendarClient({ coordinates, items }: { coordinates: any[], items: any[] }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Normalize dates for comparison
  const selectedDateCoords = coordinates.filter(c => {
    if (!selectedDate) return false
    return isSameDay(new Date(c.date), selectedDate)
  })

  // Basic Add Coordinate form inline for brevity
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    scene: "",
    notes: "",
    companions: "",
    imageUrl: "",
    itemIds: [] as string[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) return
    setLoading(true)
    try {
      const res = await fetch("/api/coordinates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          ...formData,
          isAi: false
        })
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
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 animate-in fade-in duration-500">
      <div className="w-full lg:w-auto shrink-0">
        <div className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 sticky top-24">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ja}
            modifiers={{
              hasCoordinate: (date) => coordinates.some(c => isSameDay(new Date(c.date), date))
            }}
            modifiersStyles={{
              hasCoordinate: { fontWeight: "bold", color: "#1c1917" }
            }}
            className="!font-sans"
            classNames={{
              day_selected: "bg-stone-900 text-white hover:bg-stone-800",
              day_today: "font-bold text-stone-900",
            }}
          />
        </div>
      </div>

      <div className="flex-1 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-6 border-b border-stone-200">
          <div className="space-y-1">
            <h2 className="text-3xl font-serif tracking-tight text-stone-900 flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-stone-400" />
              {selectedDate ? format(selectedDate, "yyyy.MM.dd", { locale: ja }) : "Select a date"}
            </h2>
            <p className="text-sm text-stone-500 font-light">
              {selectedDateCoords.length > 0 ? `${selectedDateCoords.length}件の記録があります` : "この日の記録はありません"}
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(!isModalOpen)}
            className="group flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-5 py-2.5 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all active:scale-95 shadow-sm"
          >
            <Plus className={`h-4 w-4 transition-transform duration-300 ${isModalOpen ? 'rotate-45' : ''}`} />
            <span className="text-sm font-medium">Add Look</span>
          </button>
        </div>

        {isModalOpen && (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 space-y-6 animate-in slide-in-from-top-4 duration-300">
            <h3 className="font-serif text-xl text-stone-900">New Look Record</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-500 uppercase tracking-wider">
                  <MapPin className="h-4 w-4" /> Scene
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. オフィス、デート"
                  className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-lg font-light text-stone-900 focus:border-stone-900 focus:outline-none transition-colors placeholder:text-stone-300"
                  value={formData.scene}
                  onChange={e => setFormData(prev => ({ ...prev, scene: e.target.value }))}
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-500 uppercase tracking-wider">
                  <Users className="h-4 w-4" /> Companions
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 友人、同僚、家族"
                  className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-lg font-light text-stone-900 focus:border-stone-900 focus:outline-none transition-colors placeholder:text-stone-300"
                  value={formData.companions}
                  onChange={e => setFormData(prev => ({ ...prev, companions: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-medium text-stone-500 uppercase tracking-wider">
                <AlignLeft className="h-4 w-4" /> Notes
              </label>
              <input 
                type="text" 
                placeholder="e.g. 少し肌寒かった"
                className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-lg font-light text-stone-900 focus:border-stone-900 focus:outline-none transition-colors placeholder:text-stone-300"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="space-y-4 pt-4">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Select Items</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-60 overflow-y-auto p-2">
                {items.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => toggleItem(item.id)}
                    className={`cursor-pointer rounded-xl overflow-hidden relative group transition-all duration-200 ${formData.itemIds.includes(item.id) ? 'ring-2 ring-stone-900 ring-offset-2 scale-95' : 'hover:scale-105'}`}
                  >
                    <div className="aspect-[3/4] bg-stone-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                    </div>
                    {formData.itemIds.includes(item.id) && (
                      <div className="absolute inset-0 bg-stone-900/10" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={loading} className="bg-stone-900 text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-all active:scale-95 shadow-md">
                {loading ? "Saving..." : "Save Record"}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-8">
          {selectedDateCoords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400 space-y-4">
              <CalendarIcon className="h-12 w-12 opacity-20" strokeWidth={1} />
              <p className="text-sm font-light">まだ記録がありません</p>
            </div>
          ) : (
            selectedDateCoords.map(coord => (
              <div key={coord.id} className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    {coord.isAi && (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full mb-2">
                        <Sparkles className="h-3 w-3" /> AI Suggestion
                      </span>
                    )}
                    <h3 className="text-2xl font-serif text-stone-900">{coord.scene || "Scene not set"}</h3>
                    {coord.companions && (
                      <p className="flex items-center gap-1.5 text-sm text-stone-500 font-light">
                        <Users className="h-3.5 w-3.5" />
                        {coord.companions}
                      </p>
                    )}
                  </div>
                </div>
                
                {coord.notes && (
                  <p className="text-stone-600 font-light leading-relaxed border-l-2 border-stone-200 pl-4">{coord.notes}</p>
                )}
                
                <div className="pt-6 border-t border-stone-100">
                  <h4 className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-6">Worn Items</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
                    {coord.items.map((ci: any) => (
                      <div key={ci.id} className="group cursor-pointer">
                        <div className="aspect-[3/4] bg-stone-100 rounded-xl overflow-hidden mb-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ci.item.imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        <p className="text-[10px] text-stone-500 truncate text-center px-1">{ci.item.brand || ci.item.name || "Unknown"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
