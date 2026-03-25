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

    const { temperature, scene, request, items } = await req.json()

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      // Mock response for development if no key
      return NextResponse.json({
        itemIds: items.slice(0, 3).map((i: any) => i.id),
        reason: "※これはGemini APIキーが未設定のため表示されているモックデータです。\n\n今日の気温（" + temperature + "℃）と「" + scene + "」というシーンに合わせて、こちらのアイテムを選びました。"
      })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY })

    const prompt = `
あなたはプロのパーソナルスタイリスト兼ライフスタイルアドバイザーです。
以下のユーザーの手持ちのアイテムリスト（洋服、バッグ、雑貨、ガジェットなど）から、今日の条件に合った最適な組み合わせ（コーディネートや持ち物のセット）を1つ提案してください。

【条件】
気温: ${temperature}℃
シーン: ${scene}
要望: ${request || "特になし"}

【手持ちのアイテムリスト】
${items.map((item: any) => `- ID: ${item.id} | カテゴリ: ${item.category} | ブランド: ${item.brand || 'なし'} | 名前: ${item.name || 'なし'} | シーズン: ${item.season}`).join('\n')}

洋服だけでなく、シーンに合わせてバッグやガジェット、雑貨なども積極的に組み合わせて、ユーザーの1日をより良くする提案を行ってください。
また、手持ちのアイテムを分析し、「このようなアイテム（色や形、小物など）を1つ買い足すと、さらにコーディネートの幅が広がりますよ」という【おすすめの買い足しアイテム】も1つ提案に含めてください。

以下のJSONフォーマットのみを出力してください（Markdownのバッククォートなどは含めないでください）:
{
  "itemIds": ["選んだアイテムのIDの配列"],
  "reason": "アイテムの選定理由やおすすめポイント、今日の過ごし方のアドバイスなど（丁寧な言葉遣いで）",
  "recommendation": "おすすめの買い足しアイテムとその理由（1〜2文程度）"
}
`

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
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
    console.error("[STYLIST_POST]", error)
    return NextResponse.json({ error: "Failed to generate styling" }, { status: 500 })
  }
}
