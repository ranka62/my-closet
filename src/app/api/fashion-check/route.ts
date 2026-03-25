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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        score: 85,
        feedback: "※APIキー未設定のモックデータです。\n全体的にまとまりがあって素敵ですが、足元に少し明るい色を入れるとさらに良くなりそうです。",
        goodPoints: ["色のバランス", "季節感"],
        improvements: ["靴の色"]
      })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
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
      model: "gemini-3-flash",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        },
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
    console.error("[FASHION_CHECK_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
