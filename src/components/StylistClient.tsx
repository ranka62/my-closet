"use client"

import { useState } from "react"
import { Item } from "@prisma/client"
import { Sparkles, Save, ThumbsUp, ThumbsDown, ThermometerSun, MapPin, MessageSquare, Camera } from "lucide-react"

export default function StylistClient({ items }: { items: Item[] }) {
  const [activeTab, setActiveTab] = useState<"suggest" | "check">("suggest")
  
  // Suggest Tab State
  const [temperature, setTemperature] = useState("20")
  const [scene, setScene] = useState("オフィス")
  const [request, setRequest] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<{
    itemIds: string[],
    reason: string,
    recommendation?: string
  } | null>(null)

  // Check Tab State
  const [checkImage, setCheckImage] = useState("")
  const [checkScene, setCheckScene] = useState("お出かけ")
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<{
    score: number,
    feedback: string,
    goodPoints: string[],
    improvements: string[]
  } | null>(null)

  const fetchWeather = async () => {
    try {
      // 簡易的な天気取得（本来はOpenWeatherMapなどのAPIを使用）
      // 現在はダミーデータとして東京の平均的な気温を設定
      setTemperature("22")
    } catch (error) {
      console.error("Failed to fetch weather", error)
    }
  }
  const handleGenerate = async () => {
    if (items.length === 0) {
      alert("クローゼットにアイテムがありません。まずはアイテムを追加してください。")
      return
    }

    setLoading(true)
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

      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperature, scene, request, items: itemsMetadata })
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        try {
          const compressed = await compressImage(base64)
          setCheckImage(compressed)
        } catch (error) {
          console.error("Compression failed", error)
          setCheckImage(base64)
        }
      }
      reader.readAsDataURL(file)
      e.target.value = ""
    }
  }

  const handleCheck = async () => {
    if (!checkImage) return
    setChecking(true)
    try {
      const res = await fetch("/api/fashion-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: checkImage, scene: checkScene })
      })
      if (res.ok) {
        setCheckResult(await res.json())
      }
    } catch (error) {
      console.error(error)
      alert("診断に失敗しました")
    } finally {
      setChecking(false)
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
        <p className="text-stone-500 font-light max-w-lg mx-auto">AIがあなたの専属スタイリストになります。</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-stone-100 p-1 rounded-full flex gap-1">
          <button 
            onClick={() => setActiveTab("suggest")}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeTab === "suggest" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            コーデ提案
          </button>
          <button 
            onClick={() => setActiveTab("check")}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeTab === "check" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            コーデ診断
          </button>
        </div>
      </div>

      {activeTab === "suggest" ? (
        <>
          <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-medium text-stone-500 uppercase tracking-wider">
              <ThermometerSun className="h-4 w-4" /> Temperature
            </label>
            <div className="relative flex items-center gap-2">
              <input 
                type="number" 
                className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-2xl font-light text-stone-900 focus:border-stone-900 focus:outline-none transition-colors"
                value={temperature}
                onChange={e => setTemperature(e.target.value)}
              />
              <span className="absolute right-12 bottom-3 text-stone-400 font-light">℃</span>
              <button 
                onClick={fetchWeather}
                className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors text-stone-600"
                title="現在地の気温を取得"
              >
                <MapPin className="h-4 w-4" />
              </button>
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
            <div className="p-8 sm:p-12 border-b border-stone-100 bg-stone-50/50 space-y-6">
              <p className="text-stone-700 leading-loose whitespace-pre-wrap font-light text-lg">{suggestion.reason}</p>
              {suggestion.recommendation && (
                <div className="mt-6 p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-stone-900 mb-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Stylist&apos;s Advice for Next Purchase
                  </h4>
                  <p className="text-stone-600 font-light leading-relaxed">{suggestion.recommendation}</p>
                </div>
              )}
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
      </>
    ) : (
      <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 space-y-8 animate-in fade-in duration-300">
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="space-y-3">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Upload your outfit</label>
              <div className="border-2 border-dashed border-stone-200 rounded-2xl p-4 text-center hover:bg-stone-50 transition-colors relative h-64 flex flex-col items-center justify-center">
                {checkImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={checkImage} alt="Outfit" className="h-full object-contain mix-blend-multiply" />
                ) : (
                  <div className="space-y-2">
                    <Camera className="h-8 w-8 text-stone-400 mx-auto" />
                    <p className="text-sm text-stone-600">今日のコーデをアップロード</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Scene</label>
              <input 
                type="text" 
                placeholder="e.g. 友達とカフェ、オフィス"
                className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-xl font-light text-stone-900 focus:border-stone-900 focus:outline-none transition-colors"
                value={checkScene}
                onChange={e => setCheckScene(e.target.value)}
              />
            </div>

            <button 
              onClick={handleCheck}
              disabled={checking || !checkImage}
              className="w-full bg-stone-900 text-white py-4 rounded-full font-medium hover:bg-stone-800 disabled:opacity-50 flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
            >
              {checking ? (
                <><Sparkles className="h-4 w-4 animate-spin" /> Analyzing...</>
              ) : "診断する"}
            </button>

            {checkResult && (
              <div className="mt-8 pt-8 border-t border-stone-100 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                  <div className="text-5xl font-serif text-stone-900">{checkResult.score}<span className="text-2xl text-stone-400">/100</span></div>
                  <p className="text-stone-500 font-medium">Fashion Score</p>
                </div>
                
                <div className="bg-stone-50 p-6 rounded-2xl">
                  <p className="text-stone-700 leading-relaxed font-light">{checkResult.feedback}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="border border-stone-100 p-4 rounded-xl space-y-3 bg-white">
                    <h4 className="flex items-center gap-2 text-sm font-medium text-green-700">
                      <ThumbsUp className="h-4 w-4" /> Good Points
                    </h4>
                    <ul className="space-y-2">
                      {checkResult.goodPoints.map((p, i) => (
                        <li key={i} className="text-sm text-stone-600 font-light flex gap-2">
                          <span className="text-green-500">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border border-stone-100 p-4 rounded-xl space-y-3 bg-white">
                    <h4 className="flex items-center gap-2 text-sm font-medium text-amber-700">
                      <Sparkles className="h-4 w-4" /> Improvements
                    </h4>
                    <ul className="space-y-2">
                      {checkResult.improvements.map((p, i) => (
                        <li key={i} className="text-sm text-stone-600 font-light flex gap-2">
                          <span className="text-amber-500">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
