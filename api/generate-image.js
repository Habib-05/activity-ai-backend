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
    const prompt = `
Berdasarkan aktivitas berikut:

${activities}

Bayangkan mahasiswa tersebut direpresentasikan sebagai seekor hewan lucu.

Tentukan:

- jenis hewan yang sesuai dengan kepribadian dan pola aktivitasnya

- ekspresi wajah (rajin, malas, santai, lelah, fokus, dll)

- gaya visual yang lucu, imut, dan menarik

Buat satu gambar saja (single character), bukan banyak adegan.

Ketentuan:

- gaya ilustrasi kartun / chibi / cute

- warna cerah dan menarik

- fokus pada satu karakter utama

- boleh menambahkan properti kecil (buku, HP, bantal, dll) sesuai aktivitas

- jangan menampilkan teks di dalam gambar

Gambar harus mencerminkan kepribadian berdasarkan aktivitas tersebut.
    `;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Gagal membuat gambar"
      });
    }

    return res.status(200).json({
      image: data.data[0].b64_json
    });

  } catch (error) {
    return res.status(500).json({
      error: "Gagal menghubungi image API"
    });
  }
}
