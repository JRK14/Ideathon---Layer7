# StudyBuddy – AI Tutor for Students

A chatbot that helps students with doubts in any subject. It uses the same kind of AI as ChatGPT and Gemini, with a **student-focused tutor personality**: clear explanations, step-by-step help, and encouragement.

## Features

- **Multiple AI providers**: Switch between **ChatGPT (OpenAI)** and **Gemini (Google)** in one place.
- **Tutor behavior**: The AI is prompted to explain clearly, use examples, and guide without doing homework for you.
- **Any subject**: Math, science, languages, history, programming, exam prep, study tips, and more.
- **Clean UI**: Dark theme, suggestion chips, and markdown-style answers (lists, code, bold).

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Set API keys (choose one)

**Option A – Environment (recommended)**  
Copy `.env.example` to `.env` and add your keys:

```env
OPENAI_API_KEY=sk-...    # from https://platform.openai.com/api-keys
GEMINI_API_KEY=AIza...   # free at https://aistudio.google.com/apikey
```

**Option B – In the app**  
Click **API keys** in the header and paste your keys there. They are only sent to your own server, not stored on disk.

### 3. Run the app

```bash
npm run dev
```

- **Frontend**: http://localhost:5173  
- **API**: http://localhost:3001  

The frontend talks to the API via Vite’s proxy, so you only need to open the app in the browser.

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start API + frontend together  |
| `npm run build`| Build frontend for production  |
| `npm start`    | Run API only (after building)  |

## Tech stack

- **Frontend**: React, Vite, react-markdown  
- **Backend**: Node.js, Express  
- **AI**: OpenAI API (gpt-4o-mini), Google Gemini API (gemini-1.5-flash)

You can change the models in `server/index.js` if you have access to other models (e.g. GPT-4, Gemini Pro).
