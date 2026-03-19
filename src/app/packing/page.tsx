import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PackingClient from "./PackingClient"

export default async function PackingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const items = await prisma.item.findMany({
    where: { userId: session.user.id }
  })

  const packingLists = await prisma.packingList.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { item: true }
      }
    },
    orderBy: { startDate: 'desc' }
  })

  return <PackingClient items={items} initialLists={packingLists} />
}
