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

    const { title, startDate, endDate, notes, itemIds } = await req.json()

    const packingList = await prisma.packingList.create({
      data: {
        userId: session.user.id,
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes,
        items: {
          create: itemIds.map((id: string) => ({
            item: { connect: { id } }
          }))
        }
      }
    })

    return NextResponse.json(packingList)
  } catch (error) {
    console.error("[PACKING_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
