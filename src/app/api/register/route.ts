import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return new NextResponse("Missing email or password", { status: 400 })
    }

    // 既存ユーザーのチェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return new NextResponse("Email already exists", { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split("@")[0]
      }
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name
    })

  } catch (error) {
    console.error("[REGISTER_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
