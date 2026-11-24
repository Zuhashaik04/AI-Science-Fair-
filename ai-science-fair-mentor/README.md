# AI Science Fair Mentor

A starter full-stack application that helps students generate and refine science fair project ideas based on their interests, education level, available resources, and project preferences.

## Stack
- React + TypeScript + Vite
- Node.js + Express
- Groq API through LangChain's `ChatGroq`
- LangGraph for the AI workflow
- Zod for request validation

## Requirements
- Node.js 18 or newer
- A Groq API key

## Run locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and add your Groq API key:
   ```env
   GROQ_API_KEY=your_key
   GROQ_MODEL=llama-3.3-70b-versatile
   PORT=3001
   ```
3. Start the frontend and backend:
   ```bash
   npm run dev
   ```
4. Open the Vite URL shown in the terminal (usually http://localhost:5173).

## API
- `GET /api/health` — health check
- `POST /api/ideas` — generates three project ideas

Example request:
```json
{
  "interests": "plants and climate",
  "gradeLevel": "High school",
  "resources": "pots, soil, ruler, phone camera",
  "projectType": "Experiment",
  "question": "I have three weeks."
}
```

## Notes
- The API key must remain on the server in `.env`; never expose it in frontend code.
- AI-generated project plans should be reviewed by a teacher or guardian. Follow school science fair rules and appropriate safety guidance.
- This is a starter implementation. Add authentication, persistence, rate limiting, tests, and deployment configuration before production use.
