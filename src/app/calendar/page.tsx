import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CalendarClient from "@/components/CalendarClient"

export default async function CalendarPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const coordinates = await prisma.coordinate.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          item: true
        }
      }
    }
  })

  const items = await prisma.item.findMany({
    where: { userId: session.user.id }
  })

  return <CalendarClient coordinates={coordinates} items={items} />
}
