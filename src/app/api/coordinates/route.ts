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

    const { date, scene, notes, itemIds, isAi, imageUrl, companions } = await req.json()

    const coordinate = await prisma.coordinate.create({
      data: {
        userId: session.user.id,
        date: new Date(date),
        scene,
        notes,
        companions,
        isAi,
        imageUrl,
        items: {
          create: itemIds.map((id: string) => ({
            item: { connect: { id } }
          }))
        }
      }
    })

    return NextResponse.json(coordinate)
  } catch (error) {
    console.error("[COORDINATES_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
