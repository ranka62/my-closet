import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GoogleGenAI } from "@google/genai"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return new NextResponse("Missing image URL", { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      return NextResponse.json({
        category: "トップス",
        brand: "UNIQLO",
        name: "Mock Item",
        color: "ホワイト",
        season: "オール",
        price: 2990
      })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY })
    
    // Base64プレフィックスを削除
    const base64Data = imageUrl.split(',')[1]

    const prompt = `
この洋服・アイテムの画像を解析し、以下のJSONフォーマットで情報を抽出してください。
（Markdownのバッククォートなどは含めないでください）

{
  "category": "トップス, ボトムス, アウター, シューズ, アクセサリー, ワンピース, バッグ, 雑貨・ライフスタイル, ガジェット, その他 のいずれか",
  "season": "Spring, Summer, Autumn, Winter, All のいずれか",
  "brand": "推測されるブランド名（不明な場合は空文字）",
  "name": "アイテムの簡潔な説明・名前（例：白のVネックTシャツ、黒のレザーショルダーバッグ など）"
}
`

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        }
      ]
    })

    const text = response.text
    if (!text) {
      throw new Error("No response from Gemini")
    }

    // JSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const cleanedText = jsonMatch ? jsonMatch[0] : text
    return NextResponse.json(JSON.parse(cleanedText))

  } catch (error) {
    console.error("[ANALYZE_IMAGE_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
