import Link from "next/link"
import { Shirt, Calendar, Sparkles, Briefcase } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { LogoutButton } from "./LogoutButton"
import { Logo } from "./Logo"

export default async function Header() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
            <span className="hidden sm:inline">Closet</span>
            <Shirt className="h-4 w-4 sm:hidden" />
          </Link>
          <Link href="/stylist" className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
            <span className="hidden sm:inline">Stylist</span>
            <Sparkles className="h-4 w-4 sm:hidden" />
          </Link>
          <Link href="/calendar" className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
            <span className="hidden sm:inline">Calendar</span>
            <Calendar className="h-4 w-4 sm:hidden" />
          </Link>
          <Link href="/packing" className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
            <span className="hidden sm:inline">Packing</span>
            <Briefcase className="h-4 w-4 sm:hidden" />
          </Link>
          <div className="h-4 w-px bg-stone-200 mx-2 hidden sm:block" />
          <LogoutButton />
        </nav>
      </div>
    </header>
  )
}
