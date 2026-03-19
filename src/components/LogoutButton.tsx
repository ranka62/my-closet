"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
      title="ログアウト"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.5} />
      <span className="hidden sm:inline">Logout</span>
    </button>
  )
}
