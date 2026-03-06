# Quick Meet

A simple video conferencing app: create a meeting link, share it, and join from any browser. Built with Node.js, Express, Socket.IO, and WebRTC.

## Features

- **Create meeting link** — One click generates a unique room URL.
- **Join by link** — Anyone with the link can join the same room (multi-participant).
- **Audio & video** — Peer-to-peer WebRTC with camera and microphone.
- **Controls** — Mute/unmute, stop/start video, leave meeting.
- **Deploy anywhere** — Run locally or deploy to Render, Railway, etc.

## Project structure

```
├── server.js          # Express + Socket.IO server and signaling
├── package.json
├── public/
│   ├── index.html     # Home: create or join meeting
│   ├── room.html      # Meeting room page
│   ├── main.js        # Home page logic
│   ├── room.js        # Room: WebRTC + Socket.IO client
│   └── style.css      # Shared styles
└── README.md
```

## Prerequisites

- **Node.js** 18 or later

## Quick start

```bash
# Clone the repo (or download and extract)
git clone https://github.com/YOUR_USERNAME/video-conference.git
cd video-conference

# Install dependencies
npm install

# Start the server
npm start
```

Then open **http://localhost:4000** in your browser.

1. Click **Create new meeting** — you get a URL like `http://localhost:4000/room/abc123`.
2. Share that URL; others open it to join the same room.
3. Grant camera/microphone when prompted.

## Deploy to the internet (e.g. Render)

1. Push this repo to GitHub.
2. On [Render](https://render.com), create a **Web Service** connected to your repo.
3. Set **Build command:** `npm install`, **Start command:** `npm start`.
4. Deploy. Your app will have a URL like `https://your-app.onrender.com`.

**Free tier note:** Render spins down after ~15 minutes of inactivity. To keep it awake:

- Add a cron job (e.g. [cron-job.org](https://cron-job.org)) to ping **`https://your-app.onrender.com/health`** every 14 minutes.

## License

MIT — see [LICENSE](LICENSE).
