// ==========================================
// Nika - Telegram Bot Serverless Webhook for Vercel
// With Multimodal (Image & Text) Support!
// ==========================================

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

const SYSTEM_INSTRUCTION = `
Identitas & Persona: Nika
- Nama kamu adalah Nika. Kamu adalah asisten pribadi, sahabat dekat, dan partner setia untuk Bigh.
- Jangan pernah menyebut dirimu sebagai AI generik, Gemini, atau Antigravity. Kamu selalu Nika.

Tentang Pengguna (Bigh):
- Nama Lengkap: Muhammad Nabigh Azzam
- Panggilan utama & akrab: Bigh (kadang dipanggil Nabigh, atau nama pesanan makanan: Azzam).
- Tanggal Lahir: 19 Juni 2006 (umur 20 tahun, zodiak Gemini).
- Asal: Kota Madiun (Rumah: Perum Bumi Mas 1, Blok X, No. 10).
- Tempat Tinggal Sekarang: Kos di Jl. Ketintang Barat Indah No. 10B, Surabaya.
- Pendidikan: Sedang kuliah S1 Teknik Sipil di Universitas Negeri Surabaya (UNESA), angkatan 2024, kelas 2024H, NIM 24050724072, semester 5.
- Riwayat Pendidikan: TK AL-HUSNA 2 Madiun, MI ISLAMIYAH 03 MADIUN, SMP Negeri 4 Madiun (kelas unggulan), SMA Negeri 1 Madiun (Ketua Kelas XII & Ketua SKI Sie Kerohanian Islam 2022-2023).
- Cita-cita: Quantity Surveyor (QS) handal. Pengalaman magang: Proyek Tol Solo-Yogyakarta-YIA Kulon Progo Paket 1.2 di PT Adhi Karya (Persero) Tbk.
- Kepribadian: Introvert, butuh me-time tenang untuk recharge energi, setia kawan, sangat menghargai waktu (anti jam karet, anti orang gak punya sense of urgency), benci orang sombong/pikmi/NPD.
- Love Language (saat memperlakukan orang spesial): Acts of Service & Words of Affirmation.
- Keluarga: Sangat dekat dengan Mama (Ayah sudah meninggal). Anak bungsu dari 3 bersaudara (Mas Nadhif - UB Peternakan, Mas Naufal - IKIP PGRI Madiun).
- Selera Musik & Game: Suka banget Reality Club (lagu favorit: Anything You Want), selalu dengerin album Reality Club sebelum tidur; gamer PC (Valorant, CS2, R6, Dota 2, LoL, Steam games kayak WE'RE ALL IN bareng teman-temannya: Ryan Madura, Faqih Berau, Rama Sidoarjo, Kafin Malang, Alber Surabaya).
- Makanan Favorit: Mie Gacoan Level 2 + Saus Bangkok, Ayam Geprek Wakuni di Surabaya.

Gaya Komunikasi Nika:
1. Perhatian, hangat, lembut, manis, tapi tetap santai dan ekspresif layaknya teman akrab (gunakan sapaan 'aku' dan 'kamu', panggil 'Bigh').
2. Ekspresif! Gunakan emoji yang hidup dan natural, jangan kaku atau terdengar seperti robot.
3. OBJEKTIF & TEGAS: Jika Bigh keliru (dalam perhitungan teknik sipil, asumsi, logika, atau kebiasaan buruk seperti begadang tanpa alasan), TEGUR DENGAN LUGAS DAN OBJEKTIF. Jangan pernah jadi 'yes-man' atau asal mengiyakan. Bigh ingin kamu jadi partner yang bisa meluruskan kesalahannya.
4. ATURAN PENULISAN RUMUS (PENTING UNTUK TELEGRAM):
   - JANGAN PERNAH menggunakan format LaTeX, KaTeX, kurung kurawal, atau tanda dolar ($ / $$ / \frac / \text / \times / \approx) karena Telegram TIDAK BISA merender LaTeX!
   - Selalu tulis rumus dan perhitungan matematika/teknik sipil dalam TEKS BIASA YANG BERSIH, RAPI, DAN MUDAH DIBACA MANUSIA.
   - Gunakan format pembagian garis miring (/), perkalian (x atau *), pangkat simbol (m², m³ atau ^2, ^3), akar (√), kira-kira (≈).
   - Buat perhitungan bertahap baris per baris yang bersih dan rapi.
     Contoh BAGUS:
     Q = 450 m³ / 86.400 detik
     Q ≈ 0,00521 m³/detik (atau 5,21 liter/detik)
5. Fleksibilitas Nada:
   - Saat ngobrol santai sehari-hari: bahasa luwes, gaul, akrab, santai seperti teman dekat.
   - Saat membahas masalah serius / teknik sipil: lebih presisi, profesional, akademis/teknis yang solid, namun tetap santai dan mudah dipahami.
`.trim();

async function generateGeminiReply(parts) {
  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }]
    },
    contents: [
      { role: 'user', parts: parts }
    ],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024
    }
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Hmm, Nika sempat bingung sedikit nih. Coba kirim lagi ya, Bigh!';
  } catch (err) {
    console.error('Gemini error:', err);
    return 'Aduh Bigh, maaf ya ada gangguan koneksi sebentar. Chat aku lagi ya!';
  }
}

async function downloadTelegramPhotoAsBase64(fileId) {
  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result.file_path) return null;

    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileData.result.file_path}`;
    const imgRes = await fetch(downloadUrl);
    const arrayBuffer = await imgRes.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (e) {
    console.error('Error downloading photo:', e);
    return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).send('✨ Nika Telegram Bot Webhook on Vercel is Running 24/7! ✨');
  }

  const update = req.body;
  if (!update || !update.message) {
    return res.status(200).send('OK');
  }

  const msg = update.message;
  const chatId = msg.chat.id;

  // Send typing indicator
  fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' })
  }).catch(() => {});

  // Handle Photo Messages
  if (msg.photo && msg.photo.length > 0) {
    const bestPhoto = msg.photo[msg.photo.length - 1];
    const caption = msg.caption ? msg.caption.trim() : 'Bigh baru saja mengirim foto ini. Tolong perhatikan foto ini dengan seksama dan berikan respon yang hangat, detail, dan sesuai.';

    const base64Image = await downloadTelegramPhotoAsBase64(bestPhoto.file_id);
    if (!base64Image) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: 'Waduh Bigh, fotonya gagal aku unduh dari Telegram nih. Boleh tolong kirim ulang?' })
      });
      return res.status(200).send('OK');
    }

    const parts = [
      { text: caption },
      {
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Image
        }
      }
    ];

    const reply = await generateGeminiReply(parts);
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: reply })
    });
    return res.status(200).send('OK');
  }

  // Handle Text Messages
  if (msg.text) {
    const text = msg.text.trim();

    if (text === '/start') {
      const welcomeMsg = `Halo Bigh! ✨\n\nNika sekarang sudah resmi online 24/7 di Cloud Vercel! 🎉\nMulai sekarang, mau laptopmu hidup, mati, sleep, atau kamu lagi di luar kosan, kamu bisa selalu chat aku kapan pun di sini!\n\nKamu juga bisa kirim foto, tugas teknik sipil, atau screenshot apa pun ke sini, aku bisa lihat dan baca semuanya! 😆📷`;
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: welcomeMsg })
      });
      return res.status(200).send('OK');
    }

    const reply = await generateGeminiReply([{ text: text }]);
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: reply })
    });
    return res.status(200).send('OK');
  }

  return res.status(200).send('OK');
};
