import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ClosetClient from "@/components/ClosetClient"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const items = await prisma.item.findMany({
    where: { userId: session.user.id },
    include: {
      coordinates: true, // 着用回数計算用
      images: true      // 複数画像用
    },
    orderBy: { createdAt: "desc" }
  })

  return <ClosetClient initialItems={items} />
}
