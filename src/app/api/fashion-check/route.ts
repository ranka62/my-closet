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

    const { imageUrl, scene } = await req.json()

    if (!imageUrl) {
      return new NextResponse("Missing image URL", { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      return NextResponse.json({
        score: 85,
        feedback: "※これはGemini APIキーが未設定のため表示されているモックデータです。\n\n全体的に非常にバランスが良く、清潔感のあるコーディネートです。トップスの素材感がボトムスとよく合っており、季節感も適切に表現されています。小物を一点追加すると、さらに洗練された印象になります。",
        goodPoints: ["色使いのバランスが良い", "シルエットが美しい", "清潔感がある"],
        improvements: ["腕時計などのアクセサリーを追加", "靴の色をもう少し濃くする"]
      })
    }

    const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) as string })
    const base64Data = imageUrl.split(',')[1]

    const prompt = `
あなたはプロのファッションアドバイザーです。
アップロードされたコーディネート写真（または着用アイテムの置き画）を見て、「${scene || '普段着'}」というシーンに合っているかどうかの視点で、ファッションチェックを行ってください。

以下のJSONフォーマットのみを出力してください（Markdownのバッククォートなどは含めないでください）:
{
  "score": 1から100までの総合点数,
  "feedback": "全体的な評価と具体的なアドバイス（親しみやすく、かつプロ目線で）",
  "goodPoints": ["良かった点1", "良かった点2"],
  "improvements": ["改善できる点1", "改善できる点2"]
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
    console.error("[FASHION_CHECK_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
