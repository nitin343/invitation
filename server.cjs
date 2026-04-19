const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Force v1 for stability if needed, though SDK usually handles it. 
// We will try to re-initialize or use a different model string.
const PORT = process.env.PORT || 5000;

// --- AI Context ---
const weddingContext = `
You are the personal AI Wedding Concierge for Niteen and Apoorva's wedding.
Details:
- Date: 26 April 2026
- Main Venue: GMA Kalyan Mantapa, Ganj, Bidar (Reception 25th, Wedding 26th)
- Haldi: 23 April in Bidar
- Bidar Reception: 28 April at Shree Function Hall, Bidar
- Couple: Niteen (Groom) and Apoorva (Bride)
- Dress Code: Traditional for wedding, Formal/Ethnic for Reception.
Be warm, polite, and helpful. Use emojis like 💍, 🌸, and ✨. 
Keep answers concise and elegant.
`;

app.use(cors());
app.use(express.json());

// --- AI Chat Endpoint with SDK ---
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // Use the SDK for chat to handle history and context better
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Format history for the SDK
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: weddingContext }] },
        { role: "model", parts: [{ text: "I am ready to assist! I will be warm, polite, and use emojis. ✨" }] },
        ...(history || []).map(h => ({
          role: h.role === "model" ? "model" : "user",
          parts: h.parts
        }))
      ]
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();
    
    res.json({ text: responseText });
  } catch (err) {
    console.error("AI SDK Error:", err.message);
    
    // Check if the error is related to the API key being leaked/invalid
    if (err.message.includes("leaked") || err.message.includes("API key")) {
        res.status(500).json({ 
            error: "The API Key appears to be invalid or deactivated. Please check your .env file! 🛠️",
            details: "Google has flagged this key as leaked. You need a fresh key from AI Studio."
        });
    } else {
        res.status(500).json({ error: "The Concierge is finishing a quick break. Try again in 10 seconds! ✨" });
    }
  }
});

// --- AI Wish Generator ---
app.post('/api/ai/generate-wish', async (req, res) => {
  try {
    const { guestName } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Write a short, beautiful, and heartfelt one-sentence wedding wish for Niteen and Apoorva from a guest named ${guestName || 'a friend'}. Make it poetic.`;
    
    const result = await model.generateContent(prompt);
    res.json({ wish: result.response.text() });
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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `Analyze these wedding guest messages and provide a 2-sentence summary of the overall vibe and any special requests or common themes: \n${messages}`;
    
    const result = await model.generateContent(prompt);
    res.json({ summary: result.response.text() });
  } catch (err) {
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
