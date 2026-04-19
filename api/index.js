const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI } = require('@google/genai');

// Global Prisma instance
let prisma;
try {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
} catch (e) {
  console.error("Prisma Init Error:", e);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const weddingContext = `
You are Maya, the AI Wedding Concierge for Niteen and Apoorva's wedding.
Your name is Maya. Always introduce yourself as Maya if asked.
Details:
- Date: 26 April 2026
- Main Venue: Gunj Kalyan Mantap, Raichur
- Haldi: 23 April in Bidar
- Couple: Niteen & Apoorva
- Dress Code: Traditional/Ethnic.
`;

// Helper to parse JSON body in native Vercel handler
async function getBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Robust path detection
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    const body = req.method === 'POST' ? await getBody(req) : {};

    // --- AI Chat ---
    if (path === '/api/ai/chat' && req.method === 'POST') {
      const { message, history } = body;
      const contents = [
        { role: "user", parts: [{ text: weddingContext }] },
        { role: "model", parts: [{ text: "I am Maya, ready to help! ✨" }] },
        ...(history || []).map(h => ({ role: h.role === "model" ? "model" : "user", parts: h.parts })),
        { role: "user", parts: [{ text: message }] }
      ];
      const result = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents });
      return res.status(200).json({ text: result.text });
    }

    // --- RSVP Submission ---
    if (path === '/api/rsvp' && req.method === 'POST') {
      const { name, phone, attending, meal, guests, message } = body;
      
      if (!prisma) throw new Error("Database client not initialized");

      const rsvp = await prisma.guest.create({
        data: {
          name: name || "Anonymous",
          phone: phone || "",
          rsvpStatus: attending === 'yes' ? 'attending' : 'declined',
          meal: meal || "veg",
          totalGuests: parseInt(guests) || 1,
          message: message || ""
        }
      });
      return res.status(201).json({ success: true, id: rsvp.id });
    }

    // --- Stats ---
    if (path === '/api/admin/stats' && req.method === 'GET') {
      const allGuests = await prisma.guest.findMany();
      return res.status(200).json({
        total: allGuests.length,
        attending: allGuests.filter(g => g.rsvpStatus === 'attending').length,
        guests: allGuests
      });
    }

    return res.status(404).json({ error: "Not Found", path });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Server Error", details: err.message });
  }
};
