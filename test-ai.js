const { GoogleGenAI } = require("@google/genai");

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No API key found in GEMINI_API_KEY");
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ text: "Hello, how are you?" }]
    });
    console.log("Response text:", response.text);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
