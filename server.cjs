const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
console.log('API Key Loaded:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.slice(0, 4)}...${process.env.GEMINI_API_KEY.slice(-4)}` : 'MISSING');
const PORT = process.env.PORT || 5000;

// --- AI Context ---
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

// --- AI Chat Endpoint with New SDK ---
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // Format history for the new SDK
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
    console.error("AI SDK Error:", err.message);
    res.status(500).json({ error: "The Concierge is finishing a quick break. Try again in 10 seconds! ✨" });
  }
});

// --- AI Wish Generator ---
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
    console.error('Wish Gen Error:', err.message);
    res.status(500).json({ error: 'AI is taking a creative break.' });
  }
});

// --- Admin AI Analysis ---
app.get('/api/admin/ai-analysis', async (req, res) => {
  try {
    const rsvps = await prisma.guest.findMany({ where: { rsvpStatus: 'attending' } });
    const messages = rsvps.map(r => r.message).filter(Boolean).join('\n');
    
    if (!messages) return res.json({ summary: "No messages to analyze yet!" });
    
    const prompt = `Analyze these wedding guest messages and provide a 2-sentence summary of the overall vibe and any special requests or common themes: \n${messages}`;
    
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    res.json({ summary: result.text });
  } catch (err) {
    console.error('Analysis error:', err.message);
    res.status(500).json({ error: 'Analysis failed.' });
  }
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST') console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// --- RSVP Submission ---
app.post('/api/rsvp', async (req, res) => {
  try {
    const { name, phone, attending, meal, guests, message } = req.body;
    
    const rsvp = await prisma.guest.create({
      data: {
        name,
        phone,
        rsvpStatus: attending === 'yes' ? 'attending' : 'declined',
        meal,
        totalGuests: guests,
        message
      }
    });

    res.status(201).json({ success: true, id: rsvp.id });
  } catch (err) {
    console.error('RSVP Error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// --- Admin Dashboard Stats ---
app.get('/api/admin/stats', async (req, res) => {
  try {
    const allGuests = await prisma.guest.findMany();
    
    const stats = {
      total: allGuests.length,
      attending: allGuests.filter(g => g.rsvpStatus === 'attending').length,
      declined: allGuests.filter(g => g.rsvpStatus === 'declined').length,
      totalHeads: allGuests.reduce((acc, g) => acc + (g.rsvpStatus === 'attending' ? g.totalGuests : 0), 0),
      veg: allGuests.filter(g => g.rsvpStatus === 'attending' && g.meal === 'veg').length,
      guests: allGuests
    };

    res.json(stats);
  } catch (err) {
    console.error('Stats Error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
