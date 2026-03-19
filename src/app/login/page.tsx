"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    })

    if (res?.error) {
      alert(res.error)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcfbf9] px-4">
      <div className="w-full max-w-md space-y-10 rounded-3xl bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-serif tracking-tight text-stone-900">MyCloset</h2>
          <p className="text-sm text-stone-500 font-light tracking-widest uppercase mt-4">Personal Stylist</p>
        </div>
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
              className="flex w-full justify-center rounded-full bg-stone-900 px-4 py-3.5 text-sm font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 transition-all active:scale-[0.98]"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
