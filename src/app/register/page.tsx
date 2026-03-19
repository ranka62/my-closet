"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      })

      if (res.ok) {
        // 登録成功したらログイン画面へ
        router.push("/login?registered=true")
      } else {
        const text = await res.text()
        setError(text || "アカウントの作成に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcfbf9] px-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-10 rounded-3xl bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-serif tracking-tight text-stone-900">Create Account</h2>
          <p className="text-sm text-stone-500 font-light tracking-widest uppercase mt-4">Join MyCloset</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-stone-600 mb-1 ml-1">Name (Optional)</label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-xl border-stone-200 bg-stone-50/50 py-3 px-4 text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:ring-stone-400 focus:bg-white transition-colors sm:text-sm"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-stone-600 mb-1 ml-1">Email <span className="text-red-400">*</span></label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border-stone-200 bg-stone-50/50 py-3 px-4 text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:ring-stone-400 focus:bg-white transition-colors sm:text-sm"
                placeholder="hello@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-stone-600 mb-1 ml-1">Password <span className="text-red-400">*</span></label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border-stone-200 bg-stone-50/50 py-3 px-4 text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:ring-stone-400 focus:bg-white transition-colors sm:text-sm"
                placeholder="•••••••• (6文字以上)"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-full bg-stone-900 px-4 py-3.5 text-sm font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-stone-900 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
