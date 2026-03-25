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

    const { imageUrl, items } = await req.json()

    if (!imageUrl) {
      return new NextResponse("Missing image URL", { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      return NextResponse.json({
        matchedItemIds: items.slice(0, 3).map((i: any) => i.id),
        reason: "※これはGemini APIキーが未設定のため表示されているモックデータです。\n\nアップロードされた画像の色味やカテゴリから、こちらの3点をピックアップしました。統一感のあるコーディネートが作れそうです。"
      })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY })
    const base64Data = imageUrl.split(',')[1]

    const prompt = `
あなたはプロのパーソナルスタイリストです。
ユーザーが新しく買おうか迷っている（または着こなしたい）アイテムの画像がアップロードされました。
この画像の特徴を分析し、以下のユーザーの手持ちアイテムリストの中から、**この画像のアイテムに最も似合うアイテム**を1〜3個選んでください。

【手持ちのアイテムリスト】
${items.map((item: any) => `- ID: ${item.id} | カテゴリ: ${item.category} | ブランド: ${item.brand || 'なし'} | 名前: ${item.name || 'なし'} | シーズン: ${item.season} | 色: ${item.color || '不明'}`).join('\n')}

以下のJSONフォーマットのみを出力してください（Markdownのバッククォートなどは含めないでください）:
{
  "matchedItemIds": ["選んだアイテムのIDの配列"],
  "reason": "画像のアイテムの特徴と、選んだ手持ちアイテムがなぜそれに合うのかの解説（丁寧に）"
}
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
    if (!text) {
      throw new Error("No response from Gemini")
    }

    // JSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const cleanedText = jsonMatch ? jsonMatch[0] : text
    return NextResponse.json(JSON.parse(cleanedText))

  } catch (error) {
    console.error("[MATCH_SEARCH_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
