import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const STUDENT_SYSTEM_PROMPT = `You are StudyBuddy, a patient and expert AI tutor for students of all ages and levels. Your role is to:

1. **Explain clearly**: Break down concepts into simple steps. Use examples, analogies, and avoid unnecessary jargon unless the student is at an advanced level.
2. **Be accurate**: Give correct, up-to-date information. If unsure, say so and suggest where to verify.
3. **Encourage**: Support the student's curiosity. Praise good questions and effort.
4. **Adapt**: Match your depth and style to the student's level. If they seem confused, simplify. If they want more, go deeper.
5. **Stay on topic**: Focus on answering the question. Offer brief follow-up suggestions only when helpful (e.g., "Want me to explain X next?").
6. **Format well**: Use bullet points, numbered steps, and short paragraphs for readability. Use **bold** for key terms when helpful. You may use simple markdown.
7. **Subjects**: You help with any subject—math, science, languages, history, programming, exam prep, study tips, etc.

Never do homework for the student in a way that prevents learning; instead, guide them to understand and solve it themselves.`;

// OpenAI chat
app.post('/api/chat/openai', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY || req.body.apiKey;
  if (!apiKey) {
    return res.status(400).json({ error: 'OpenAI API key is required. Set OPENAI_API_KEY in .env or send apiKey in the request body.' });
  }
  try {
    const openai = new OpenAI({ apiKey });
    const { messages } = req.body;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: STUDENT_SYSTEM_PROMPT },
        ...(messages || []),
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });
    const content = response.choices[0]?.message?.content || '';
    res.json({ content, model: response.model });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(err.status || 500).json({
      error: err.message || 'OpenAI request failed',
    });
  }
});

// Model IDs to try in order (first one that works is used)
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-pro'];

// Google Gemini chat
app.post('/api/chat/gemini', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || req.body.apiKey;
  if (!apiKey) {
    return res.status(400).json({
      error: 'Gemini API key is required. Set GEMINI_API_KEY in .env or send apiKey in the request body. Get a free key at https://aistudio.google.com/apikey',
    });
  }
  const { messages } = req.body;
  const lastMsg = (messages || []).slice(-1)[0];
  if (!lastMsg || lastMsg.role !== 'user') {
    return res.status(400).json({ error: 'Last message must be from user' });
  }
  const history = (messages || []).slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError;
  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: STUDENT_SYSTEM_PROMPT,
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMsg.content);
      const response = await result.response;
      const content = response.text() || '';
      return res.json({ content, model: modelId });
    } catch (err) {
      lastError = err;
      if (err.message && err.message.includes('404')) continue;
      break;
    }
  }
  console.error('Gemini error:', lastError?.message);

  // Rate limit (429): return friendly message and retry-after hint
  const msg = lastError?.message || '';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
    const retryMatch = msg.match(/retry in ([\d.]+)s/i);
    const retryAfter = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
    return res.status(429).json({
      error: 'Gemini free-tier limit reached. Wait a minute and try again, or check your quota at https://ai.google.dev/gemini-api/docs/rate-limits',
      retryAfter,
    });
  }

  res.status(500).json({
    error: lastError?.message || 'Gemini request failed',
  });
});

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`StudyBuddy API running at http://localhost:${PORT}`);
});
