import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';

// Initialize Prisma
let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

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

// Helper to parse JSON body
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

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    const body = req.method === 'POST' ? await getBody(req) : {};

    // --- AI Chat ---
    if (path === '/api/ai/chat' && req.method === 'POST') {
      const { message, history } = body;
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: weddingContext }] },
          { role: "model", parts: [{ text: "I am Maya, ready to help! ✨" }] },
          ...(history || []).map(h => ({ role: h.role === "model" ? "model" : "user", parts: h.parts }))
        ]
      });

      const result = await chat.sendMessage(message);
      return res.status(200).json({ text: result.response.text() });
    }

    // --- RSVP Submission ---
    if (path === '/api/rsvp' && req.method === 'POST') {
      const { name, phone, attending, guests, message } = body;
      
      const rsvp = await prisma.guest.create({
        data: {
          name: name || "Anonymous",
          phone: phone || "",
          rsvpStatus: attending === 'yes' ? 'attending' : 'declined',
          meal: "veg", // Default as per latest UI change
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
}
