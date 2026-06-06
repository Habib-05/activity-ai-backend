export default async function handler(req, res) {
  // Header CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  // Ambil body
  const { search_history } = req.body;
  const trimmedHistory = (search_history || "").trim();

  if (!trimmedHistory) {
    return res.status(400).json({ error: "Riwayat film kosong" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY belum diatur di Vercel" });
  }

  try {
    // Prompt Gemini untuk rekomendasi film
    const prompt = `
Berikut adalah riwayat film dan genre yang sering ditonton oleh pengguna:
${trimmedHistory}

Tugas:
1. Analisis selera film pengguna
2. Berikan 5 rekomendasi film terbaru atau populer yang sesuai
3. Sertakan alasan singkat untuk setiap rekomendasi
4. Berikan 1-2 genre tambahan yang mungkin disukai

Gunakan bahasa Indonesia yang sederhana, rapi, dan mudah dipahami.
`.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error response:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Gagal mendapatkan respons dari Gemini"
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini tidak memberikan rekomendasi film.";

    return res.status(200).json({ result: text });

  } catch (error) {
    console.error("Analyze error:", error);
    return res.status(500).json({ error: "Gagal menghubungi Gemini AI" });
  }
}
