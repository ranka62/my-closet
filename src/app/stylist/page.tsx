import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import StylistClient from "@/components/StylistClient"

export default async function StylistPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const items = await prisma.item.findMany({
    where: { userId: session.user.id }
  })

  return <StylistClient items={items} />
}
