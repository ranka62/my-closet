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

    const body = await req.json()
    const { imageUrl, images, category, brand, name, price, season, source, status, color, purchaseDate } = body

    if (!imageUrl || !category) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const item = await prisma.item.create({
      data: {
        userId: session.user.id,
        imageUrl,
        category,
        brand,
        name,
        price,
        season,
        source,
        color,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        status: status || "available",
        images: {
          create: (images || []).map((url: string) => ({ url }))
        }
      },
      include: {
        images: true
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("[ITEMS_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
