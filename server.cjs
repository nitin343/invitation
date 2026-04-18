const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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
