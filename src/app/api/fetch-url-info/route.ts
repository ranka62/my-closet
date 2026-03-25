import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GoogleGenAI } from "@google/genai"
import * as cheerio from "cheerio"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { url } = await req.json()
    if (!url) {
      return new NextResponse("Missing URL", { status: 400 })
    }

    // URLのコンテンツを取得
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    })
    const html = await res.text()
    const $ = cheerio.load(html)

    // 基本的な情報を抽出
    const title = $("title").text() || $('meta[property="og:title"]').attr("content")
    const description = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content")
    
    // Geminiを使って詳細を解析
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY })
      const prompt = `
以下のウェブサイトの情報を解析して、アイテムの情報をJSON形式で抽出してください。
タイトル: ${title}
説明文: ${description}
ページ内容（一部）: ${html.substring(0, 2000)}

【抽出項目】
- name: アイテム名
- brand: ブランド名
- price: 価格（数値のみ）
- category: トップス, ボトムス, アウター, シューズ, アクセサリー, ワンピース, バッグ, 雑貨・ライフスタイル, ガジェット, その他 のいずれか
- color: 色（例：ホワイト, ブラック など）

JSONフォーマットのみを出力してください:
{
  "name": "...",
  "brand": "...",
  "price": 0,
  "category": "...",
  "color": "..."
}
`
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt
      })

      const text = response.text
      if (!text) {
        throw new Error("No response from Gemini")
      }

      // JSONを抽出
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const cleanedText = jsonMatch ? jsonMatch[0] : text
      const data = JSON.parse(cleanedText)
      
      return NextResponse.json({
        name: data.name || title,
        brand: data.brand || "",
        price: data.price || null,
        category: data.category || "その他",
        color: data.color || ""
      })
    }

    // APIキーがない場合は最低限の情報を返す
    return NextResponse.json({
      name: title,
      brand: "",
      price: null,
      category: "その他",
      color: ""
    })

  } catch (error) {
    console.error("[FETCH_URL_INFO_POST]", error)
    return new NextResponse("Failed to fetch URL info", { status: 500 })
  }
}
