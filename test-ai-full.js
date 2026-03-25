const { GoogleGenAI } = require("@google/genai");
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No API key found in GEMINI_API_KEY");
    // Also try GOOGLE_API_KEY
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
        console.log("No API key found in GOOGLE_API_KEY either.");
        return;
    }
  }

  const ai = new GoogleGenAI({ apiKey: apiKey || process.env.GOOGLE_API_KEY });
  console.log("Using model gemini-2.0-flash");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hello, how are you?"
    });
    console.log("Response text success:", !!response.text);
    console.log("Text:", response.text);
  } catch (error) {
    console.error("Error with gemini-2.0-flash:", error.message);
    console.error("Full error:", error);
    
    console.log("Trying gemini-1.5-flash...");
    try {
        const response2 = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: "Hello"
        });
        console.log("Success with 1.5-flash");
    } catch (err2) {
        console.error("Error with 1.5-flash:", err2.message);
    }
  }
}

test();
