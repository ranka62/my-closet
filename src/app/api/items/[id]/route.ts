import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// アイテムの更新
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { category, brand, name, price, season, source, status } = body

    const item = await prisma.item.update({
      where: {
        id,
        userId: session.user.id // 自分のアイテムのみ更新可能
      },
      data: {
        category,
        brand,
        name,
        price,
        season,
        source,
        status
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("[ITEM_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// アイテムの削除
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params

    await prisma.item.delete({
      where: {
        id,
        userId: session.user.id // 自分のアイテムのみ削除可能
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[ITEM_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
