export default async function handler(req, res) {
  // Header CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { activities } = req.body;
  const trimmedActivities = (activities || "").trim();

  if (!trimmedActivities) {
    return res.status(400).json({ error: "Data aktivitas kosong" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY belum diatur di Vercel" });
  }

  try {
    const prompt = `
Berdasarkan aktivitas berikut:
${trimmedActivities}

Bayangkan mahasiswa tersebut direpresentasikan sebagai seekor hewan lucu.
Buat deskripsi visual satu karakter yang lucu, imut, dan menarik.
Sertakan ekspresi wajah (rajin, malas, santai, lelah, fokus, dll)
dan properti kecil (buku, HP, bantal, dll) sesuai aktivitas.
Visual harus fokus pada satu karakter, tanpa teks.
`.trim();

    // Request ke Gemini generative API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: `Buat deskripsi visual poster karakter dari prompt berikut agar bisa diubah menjadi gambar: ${prompt}` }] }
          ]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini poster error:", data);
      return res.status(response.status).json({ error: data.error?.message || "Gagal generate poster dari Gemini" });
    }

    // Ambil text dari Gemini dan ubah ke base64 (frontend bisa render gambar dari text ini atau pakai library tambahan)
    const posterDescription = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!posterDescription) return res.status(500).json({ error: "Gemini tidak menghasilkan deskripsi poster" });

    return res.status(200).json({ image: Buffer.from(posterDescription).toString("base64") });

  } catch (error) {
    console.error("Generate poster Gemini error:", error);
    return res.status(500).json({ error: "Gagal menghubungi Gemini API" });
  }
}
