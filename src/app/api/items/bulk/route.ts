import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { items } = await req.json() // Array of item objects

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new NextResponse("Missing items", { status: 400 })
    }

    const createdItems = await Promise.all(
      items.map(async (itemData) => {
        const { 
          imageUrl, 
          category, 
          brand, 
          name, 
          price, 
          season, 
          source, 
          status, 
          color, 
          purchaseDate 
        } = itemData

        // Fallback placeholder if no imageUrl provided
        const finalImageUrl = imageUrl || "https://images.unsplash.com/photo-1523381235312-3a1647fa9917?w=500&auto=format&fit=crop&q=60"

        return await prisma.item.create({
          data: {
            userId: session.user.id,
            imageUrl: finalImageUrl,
            category: category || "その他",
            brand: brand || "",
            name: name || "New Item",
            price: price ? parseInt(price.toString(), 10) : null,
            season: season || "オール",
            source: source || "",
            color: color || "",
            purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
            status: status || "available",
          }
        })
      })
    )

    return NextResponse.json(createdItems)
  } catch (error) {
    console.error("[ITEMS_BULK_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
