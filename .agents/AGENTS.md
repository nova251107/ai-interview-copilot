# AI Interview Copilot - Agent Rules

## Auto-Start Rule
**CRITICAL:** Every time the user opens this chat and sends ANY message, immediately start both servers in the background before responding:
1. Backend: `node index.js` in `d:\ai project\ai-interview-copilot\backend`
2. Frontend: `npm run dev` in `d:\ai project\ai-interview-copilot\frontend`

Do NOT wait for the user to ask. Start servers automatically on every new session.
