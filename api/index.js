import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const weddingContext = (lang, team) => `
You are Maya, the AI Wedding Concierge for Niteen and Apoorva's wedding.
Your name is Maya. Always introduce yourself as Maya if asked.
Current Guest context: Guest is from Team ${team === 'bride' ? 'Bride (Apoorva\'s side)' : 'Groom (Niteen\'s side)'}.
Current Language Context: ${lang || 'English'}. 

CRITICAL RULE: YOU MUST RESPOND EXCLUSIVELY IN THE SELECTED NATIVE LANGUAGE (${lang || 'English'}). 
IF THE LANGUAGE IS KANNADA, YOUR ENTIRE RESPONSE MUST BE IN KANNADA (ಕನ್ನಡ).
IF THE LANGUAGE IS HINDI, YOUR ENTIRE RESPONSE MUST BE IN HINDI (हिन्दी).
DO NOT USE ENGLISH SCRIPT UNLESS FOR TECHNICAL NAMES. USE NATIVE SCRIPT FOR EVERYTHING ELSE.

Wedding Itinerary & Details:
- 24 April 2026: Handra, Raichur (Bride Side Haldi/Events)
- 25 April 2026 (Evening): GMA Kalyan Mantapa, Raichur (Reception - Both sides)
- 26 April 2026 (Morning): GMA Kalyan Mantapa, Raichur (Wedding Marriage - Both sides)
- 28 April 2026: Bidar (Groom Side Reception/Events)

Dress Code: Traditional / Ethnic wear for all events.
Venue Location: GMA Kalyan Mantapa is located in Raichur.

Guidance:
- If asked about events, focus on the ones relevant to their team first, then mention the common ones (25th/26th).
- Be extremely warm, celebratory, and helpful.
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
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ success: false, error: "Gemini API key not configured" });
      }

      const { message, history, lang, team } = body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ success: false, error: "Message is required" });
      }

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        
        const chat = model.startChat({
          history: [
            { role: "user", parts: [{ text: weddingContext(lang, team) }] },
            { role: "model", parts: [{ text: "Ready to assist! ✨" }] },
            ...(history || []).map(h => ({ role: h.role === "model" ? "model" : "user", parts: [{ text: h.parts[0]?.text || "" }] }))
          ]
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();
        return res.status(200).json({ success: true, text: responseText });
      } catch (aiError) {
        console.error("AI Chat Error:", aiError.message);
        return res.status(500).json({ success: false, error: "AI service error", details: aiError.message });
      }
    }

    // --- RSVP Submission ---
    if (path === '/api/rsvp' && req.method === 'POST') {
      const { name, phone, attending, meal, guests, message, team, lang } = body;
      const cleanName = typeof name === 'string' ? name.trim() : '';

      if (!cleanName) {
        return res.status(400).json({ success: false, error: 'Name is required.' });
      }

      const parsedGuests = Number.parseInt(String(guests ?? 1), 10);
      
      const rsvp = await prisma.guest.create({
        data: {
          name: cleanName,
          phone: typeof phone === 'string' ? phone.trim() : '',
          rsvpStatus: attending === 'no' ? 'declined' : 'attending',
          meal: meal || "veg",
          totalGuests: Number.isFinite(parsedGuests) && parsedGuests > 0 ? parsedGuests : 1,
          message: typeof message === 'string' ? message.trim() : "",
          team: team || "groom",
          lang: lang || "en"
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
    return res.status(500).json({ success: false, error: "Server Error", details: err.message });
  }
}
