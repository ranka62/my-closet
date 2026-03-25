"use client"

import { Shirt } from "lucide-react"

export function Logo() {
  return (
    <a 
      href="/" 
      className="flex items-center gap-2 group cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        window.location.href = '/';
      }}
    >
      <Shirt className="h-5 w-5 text-stone-900 group-hover:text-stone-600 transition-colors" />
      <span className="font-serif text-2xl font-medium tracking-tight text-stone-900">MyCloset</span>
    </a>
  )
}
