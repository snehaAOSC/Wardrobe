import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Groq from 'groq-sdk';

async function testGroqGreeting() {
  const apiKey = process.env.GROQ_API_KEY;
  console.log('GROQ API KEY PRESENT:', Boolean(apiKey), 'KEY PREFIX:', apiKey ? apiKey.slice(0, 8) : 'NONE');
  if (!apiKey) return;

  const groq = new Groq({ apiKey });
  const start = Date.now();
  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are the expert AI Fashion Stylist for WardrobeWise, a 3D virtual wardrobe app. Respond in 2 short, chic, welcoming sentences.'
        },
        {
          role: 'user',
          content: 'hii, i need you help'
        }
      ],
      max_tokens: 150,
      temperature: 0.6
    });

    console.log('TIME TAKEN:', Date.now() - start, 'ms');
    console.log('REPLY:', res.choices[0]?.message?.content);
  } catch (err) {
    console.error('GROQ ERROR:', err.message);
  }
}

testGroqGreeting();
