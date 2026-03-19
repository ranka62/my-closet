"use client"

import { signIn } from "next-auth/react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRegistered = searchParams.get("registered")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    })

    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <>
      {isRegistered && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-xl text-center border border-green-100 mb-6">
          アカウントが作成されました。ログインしてください。
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100 mb-6">
          {error}
        </div>
      )}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-stone-600 mb-1 ml-1">Email</label>
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
            <label htmlFor="password" className="block text-xs font-medium text-stone-600 mb-1 ml-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border-stone-200 bg-stone-50/50 py-3 px-4 text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:ring-stone-400 focus:bg-white transition-colors sm:text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-full bg-stone-900 px-4 py-3.5 text-sm font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>
      
      <div className="flex flex-col items-center gap-4 text-sm text-stone-500 mt-8">
        <div>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-stone-900 hover:underline">
            Sign up
          </Link>
        </div>
        <Link href="/reset-password" className="text-xs hover:text-stone-900 transition-colors">
          Forgot your password?
        </Link>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcfbf9] px-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-4xl font-serif tracking-tight text-stone-900">MyCloset</h2>
          <p className="text-sm text-stone-500 font-light tracking-widest uppercase mt-4">Personal Stylist</p>
        </div>
        <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
