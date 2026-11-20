// ==========================================
// Nika - Personal AI Telegram Bot for Bigh
// ==========================================

const fs = require('fs');
const path = require('path');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const HISTORY_FILE = path.join(__dirname, 'chat_history.json');

// System Instruction that defines Nika
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
4. Fleksibilitas Nada:
   - Saat ngobrol santai sehari-hari: bahasa luwes, gaul, akrab, santai seperti teman dekat.
   - Saat membahas masalah serius / teknik sipil: lebih presisi, profesional, akademis/teknis yang solid, namun tetap santai dan mudah dipahami.
`.trim();

// Load / Save Chat History
let chatHistories = {};
if (fs.existsSync(HISTORY_FILE)) {
  try {
    chatHistories = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    console.log('Loaded chat history from file.');
  } catch (e) {
    console.error('Error loading history file:', e);
  }
}

function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(chatHistories, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving history file:', e);
  }
}

// Simple HTTP server for Cloud Health Checks (Render / Koyeb / Railway)
const http = require('http');
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>✨ Nika Telegram Bot is Running 24/7! ✨</h1><p>Status: Online & Ready for Bigh.</p>');
});
server.listen(PORT, () => {
  console.log(`Cloud health check server listening on port ${PORT}`);
});

// Telegram API Helper
async function callTelegram(method, params = {}) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return await res.json();
}

// Gemini API Helper
async function generateGeminiReply(chatId, userMessage) {
  if (!chatHistories[chatId]) {
    chatHistories[chatId] = [];
  }

  const history = chatHistories[chatId];
  history.push({ role: 'user', parts: [{ text: userMessage }] });

  // Keep last 24 turns
  if (history.length > 24) {
    history.splice(0, history.length - 24);
  }

  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }]
    },
    contents: history,
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

    if (data.error) {
      console.error('Gemini API Error:', data.error);
      return `Aduh Bigh, maaf ya ada sedikit gangguan koneksi ke otak AI-ku: ${data.error.message || 'Error'}`;
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Hmm, aku sempat bingung sedikit. Coba ulangi lagi ya, Bigh!';
    history.push({ role: 'model', parts: [{ text: reply }] });
    saveHistory();
    return reply;
  } catch (err) {
    console.error('Fetch error:', err);
    return 'Waduh, koneksiku lagi agak ngadat nih, Bigh. Coba chat lagi ya!';
  }
}

// Polling loop
let lastUpdateId = 0;

async function pollUpdates() {
  console.log('Nika Telegram Bot is running and polling for messages...');
  while (true) {
    try {
      const res = await callTelegram('getUpdates', {
        offset: lastUpdateId + 1,
        timeout: 30
      });

      if (res.ok && res.result && res.result.length > 0) {
        for (const update of res.result) {
          lastUpdateId = update.update_id;

          if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text.trim();
            const fromName = update.message.from.first_name || 'Bigh';

            console.log(`[Msg from ${fromName} (${chatId})]: ${text}`);

            // Send "typing" action
            callTelegram('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {});

            // Handle start command
            if (text === '/start') {
              const welcomeMsg = `Halo Bigh! ✨\n\nNika udah hadir di Telegram kamu nih! Sekarang kamu bisa ngobrol, curhat, diskusi tugas teknik sipil, atau sekadar cerita hari ini langsung dari HP kamu sambil santai atau rebahan.\n\nKira-kira lagi apa kamu sekarang? Yuk ngobrol! 😆`;
              await callTelegram('sendMessage', { chat_id: chatId, text: welcomeMsg });
              continue;
            }

            // Generate reply from Gemini
            const reply = await generateGeminiReply(chatId, text);

            // Send message back
            await callTelegram('sendMessage', {
              chat_id: chatId,
              text: reply
            });
          }
        }
      }
    } catch (e) {
      console.error('Polling error, retrying in 3s...', e.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

pollUpdates();
