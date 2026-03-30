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

    const { images } = await req.json() // Array of base64 images (screenshots)

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new NextResponse("Missing images", { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey || apiKey === "YOUR_API_KEY" || apiKey.includes("your-api-key")) {
      // Mock data for testing when API key is not available
      return NextResponse.json({
        items: [
          {
            category: "トップス",
            brand: "UNIQLO",
            name: "エアリズムコットンオーバーサイズTシャツ",
            color: "ホワイト",
            season: "Summer",
            price: 1990,
            purchaseDate: "2024-03-15",
            source: "UNIQLO Online Store"
          },
          {
            category: "ボトムス",
            brand: "ZARA",
            name: "リラックスフィットデニム",
            color: "ブルー",
            season: "All",
            price: 5990,
            purchaseDate: "2024-03-10",
            source: "ZARA Online"
          }
        ]
      })
    }

    const ai = new GoogleGenAI({ apiKey })
    const allItems = []

    for (const imageUrl of images) {
      const base64Data = imageUrl.split(',')[1]
      const prompt = `
この購入履歴のスクリーンショット画像を解析し、注文されている各アイテムの情報を抽出してください。
以下のJSON配列フォーマットで情報を抽出してください。
（Markdownのバッククォートなどは含めないでください。純粋なJSON配列のみを返してください）

[
  {
    "category": "トップス, ボトムス, アウター, シューズ, アクセサリー, ワンピース, バッグ, 雑貨・ライフスタイル, ガジェット, その他 のいずれか",
    "season": "Spring, Summer, Autumn, Winter, All のいずれか",
    "brand": "ブランド名（不明な場合は空文字）",
    "name": "アイテムの簡潔な説明・名前（例：白のVネックTシャツ など）",
    "price": 金額(数値、不明な場合はnull),
    "purchaseDate": "購入日（YYYY-MM-DD形式、不明な場合はnull）",
    "color": "推測される色（不明な場合は空文字）",
    "source": "購入先（例：ZOZOTOWN, Amazon, 楽天 など）"
  }
]
`

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg"
            }
          },
          prompt
        ]
      })

      const text = response.text
      if (text) {
        try {
          const jsonMatch = text.match(/\[[\s\S]*\]/)
          const cleanedText = jsonMatch ? jsonMatch[0] : text
          const items = JSON.parse(cleanedText)
          if (Array.isArray(items)) {
            allItems.push(...items)
          }
        } catch (e) {
          console.error("Failed to parse AI response for image:", text)
        }
      }
    }

    return NextResponse.json({ items: allItems })

  } catch (error: any) {
    console.error("[BULK_SCAN_POST] Error:", error.message || error)
    return NextResponse.json({ error: "Internal error", details: error.message }, { status: 500 })
  }
}
