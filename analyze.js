export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Gunakan method POST" });
  }

  const { activities } = req.body;

  if (!activities) {
    return res.status(400).json({ error: "Data aktivitas kosong" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
Berikut adalah daftar aktivitas harian mahasiswa:

${activities}

Tolong simpulkan pola aktivitas tersebut.
Beri penilaian apakah mahasiswa cenderung rajin, seimbang, kurang produktif, atau perlu evaluasi.
Berikan alasan singkat dan 2 saran perbaikan.
Gunakan bahasa Indonesia yang sederhana.
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Gagal mendapatkan respons dari OpenAI"
      });
    }

    let text = "";

    try {
      text = data.output[0].content[0].text;
    } catch (e) {
      text = JSON.stringify(data);
    }

    return res.status(200).json({
      result: text
    });

  } catch (error) {
    return res.status(500).json({
      error: "Gagal menghubungi AI"
    });
  }
}
