const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'dummy' });
console.log('Models methods:', Object.keys(ai.models));
// console.log('Chats methods:', Object.keys(ai.chats));
