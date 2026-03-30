import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import MyPageClient from "@/components/MyPageClient"

export default async function MyPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      id: true,
      name: true,
      email: true,
    }
  })

  if (!user) {
    redirect("/login")
  }

  const items = await prisma.item.findMany({
    where: { userId: user.id },
  })

  // Calculate stats
  const totalCount = items.length
  const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0)
  const avgPrice = totalCount > 0 ? Math.round(totalValue / totalCount) : 0
  
  const categoryBreakdown: Record<string, number> = {}
  items.forEach(item => {
    const cat = item.category || "Uncategorized"
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1
  })

  const topCategory = Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a)[0]?.[0] || ""

  return (
    <MyPageClient 
      user={user} 
      itemStats={{
        totalCount,
        totalValue,
        avgPrice,
        topCategory,
        categoryBreakdown
      }} 
    />
  )
}
