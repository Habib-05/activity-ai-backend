export default async function handler(req, res) {
  // Header CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { recommendation } = req.body;
  const trimmedRecommendation = (recommendation || "").trim();

  if (!trimmedRecommendation) {
    return res.status(400).json({ error: "Rekomendasi film kosong" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY belum diatur di Vercel" });
  }

  try {
    // Prompt Gemini untuk poster film
    const prompt = `
Buatkan sebuah poster film fiktif berdasarkan rekomendasi berikut:
${trimmedRecommendation}

Ketentuan:
- Poster hanya 1 gambar
- Gaya sinematik, dramatis, dan estetik
- Sesuai genre atau tema film
- Fokus pada karakter utama atau tema visual
- Tidak menampilkan logo brand resmi
- Judul film boleh fiktif
- Visual keren dan premium
- Tanpa teks yang mengganggu
`.trim();

    // Request ke Gemini generative content API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: `Buat deskripsi visual poster film berdasarkan rekomendasi: ${prompt}` }] }
          ]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini poster error:", data);
      return res.status(response.status).json({ error: data.error?.message || "Gagal generate poster film dari Gemini" });
    }

    const posterDescription = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!posterDescription) return res.status(500).json({ error: "Gemini tidak menghasilkan deskripsi poster" });

    // Kembalikan sebagai base64 agar frontend bisa menampilkan
    return res.status(200).json({ image: Buffer.from(posterDescription).toString("base64") });

  } catch (error) {
    console.error("Generate poster film Gemini error:", error);
    return res.status(500).json({ error: "Gagal menghubungi Gemini API" });
  }
}
