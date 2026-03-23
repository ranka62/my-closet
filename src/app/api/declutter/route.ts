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

    const { items } = await req.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        advices: [
          {
            itemIds: items.slice(0, 2).map((i: any) => i.id),
            reason: "※APIキー未設定のモックデータです。\nこれらのアイテムは用途が被っているため、どちらか一方を手放すことを検討しても良いかもしれません。"
          }
        ]
      })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const prompt = `
あなたはプロの整理収納アドバイザー兼ミニマリストです。
ユーザーの手持ちアイテムリスト（着用回数データ含む）を分析し、**「手放す（断捨離）を検討すべきアイテム」**を提案してください。

【判断基準の例】
- 用途やデザインが完全に被っているアイテムがある
- 登録から時間が経っているのに着用回数が極端に少ない
- 季節外れで、次のシーズンも着るか怪しいもの

【手持ちのアイテムリスト】
${items.map((item: any) => `- ID: ${item.id} | カテゴリ: ${item.category} | ブランド: ${item.brand || 'なし'} | 名前: ${item.name || 'なし'} | 着用回数: ${item.coordinates?.length || 0}回`).join('\n')}

以下のJSONフォーマットのみを出力してください（複数提案可、最大3つまで）:
{
  "advices": [
    {
      "itemIds": ["比較対象や断捨離候補のアイテムIDの配列"],
      "reason": "なぜこれらを手放す・整理することを提案するのかの理由（優しく論理的に）"
    }
  ]
}
`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: prompt }
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
    console.error("[DECLUTTER_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
