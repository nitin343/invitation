const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI } = require('@google/genai');

// Initialize outside for connection pooling
let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

const app = express();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const weddingContext = `
You are Maya, the personal AI Wedding Concierge for Niteen and Apoorva's wedding.
Your name is Maya. Always introduce yourself as Maya if asked.
Details:
- Date: 26 April 2026
- Main Venue: Gunj Kalyan Mantap, Raichur (6975+J23, Jalal Nagar, Raichur, Karnataka 584102)
- Events at Main Venue: Reception on 25th April, Wedding on 26th April.
- Haldi: 23 April in Bidar
- Bidar Reception: 28 April at Shree Function Hall, Bidar
- Couple: Niteen (Groom) and Apoorva (Bride)
- Dress Code: Traditional for wedding, Formal/Ethnic for Reception.

IMPORTANT FORMATTING RULES:
1. Use bullet points for lists (venues, dates, dress codes).
2. Use double line breaks between different topics.
3. Keep responses concise but well-structured.
4. Use emojis like 💍, 🌸, and ✨.
5. Use Markdown links for locations, e.g., [Open in Google Maps](URL).
6. Be warm, polite, and elegant.
`;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'active', time: new Date() }));

// --- AI Chat Endpoint ---
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");

    const contents = [
      { role: "user", parts: [{ text: weddingContext }] },
      { role: "model", parts: [{ text: "I am ready to assist! I will be warm, polite, and use emojis. ✨" }] },
      ...(history || []).map(h => ({
        role: h.role === "model" ? "model" : "user",
        parts: h.parts
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents
    });

    res.json({ text: result.text });
  } catch (err) {
    console.error("AI Error:", err.message);
    res.status(500).json({ error: "Maya is finishing a quick break. Try again in 10 seconds! ✨", details: err.message });
  }
});

// --- RSVP Submission ---
app.post('/api/rsvp', async (req, res) => {
  try {
    const { name, phone, attending, meal, guests, message } = req.body;
    
    // Ensure guests is a number
    const guestCount = parseInt(guests) || 1;

    const rsvp = await prisma.guest.create({
      data: {
        name, 
        phone: phone || "",
        rsvpStatus: attending === 'yes' ? 'attending' : 'declined',
        meal: meal || "veg", 
        totalGuests: guestCount, 
        message: message || ""
      }
    });

    res.status(201).json({ success: true, id: rsvp.id });
  } catch (err) {
    console.error("RSVP Error:", err.message);
    res.status(500).json({ success: false, error: 'Internal Server Error', details: err.message });
  }
});

// --- Wish Generator ---
app.post('/api/ai/generate-wish', async (req, res) => {
  try {
    const { guestName } = req.body;
    const prompt = `Write a short, beautiful, and heartfelt one-sentence wedding wish for Niteen and Apoorva from a guest named ${guestName || 'a friend'}. Make it poetic.`;
    
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    res.json({ wish: result.text });
  } catch (err) {
    res.status(500).json({ error: 'AI is taking a creative break.' });
  }
});

module.exports = app;
