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

    if (!process.env.GEMINI_API_KEY) {
      const matchedItems = items.slice(0, 3)
      return NextResponse.json({
        matchedItemIds: matchedItems.map((i: any) => i.id),
        reason: matchedItems.length > 0 
          ? "※APIキー未設定のデモ表示です。\nあなたのクローゼットにある「" + matchedItems.map((i: any) => i.brand || i.name).join("」や「") + "」などのアイテムが、アップロードされた服にとてもよく似合います。全体のシルエットと色合いを合わせるのがポイントです。"
          : "クローゼットにアイテムがないため、マッチングできませんでした。"
      })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
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
      model: "gemini-2.0-flash",
      contents: [
        { text: prompt },
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    })

    const text = response.text
    if (!text) {
      throw new Error("No response from Gemini")
    }

    // JSONをクリーンアップしてパース
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim()
    return NextResponse.json(JSON.parse(cleanedText))

  } catch (error) {
    console.error("[MATCH_SEARCH_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
