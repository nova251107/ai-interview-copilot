const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate a 3-month personalized learning roadmap for a given job role.
 * Returns structured JSON with month, title, and weekly topics.
 */
const generateRoadmapContent = async (jobRole, durationMonths = 3) => {
  const monthKeysPrompt = Array.from({ length: durationMonths }, (_, i) => {
    return `"month${i + 1}": {\n    "title": "...",\n    "weeks": [\n      {\n        "week": 1,\n        "topics": ["...", "..."],\n        "resources": ["...", "..."],\n        "milestone": "..."\n      }\n    ]\n  }`;
  }).join(",\n  ");

  const prompt = `You are an expert career counselor and senior tech lead.
Generate a structured ${durationMonths}-month learning roadmap to become a "${jobRole}".
Break it down into exactly ${durationMonths} months. For each month, provide a title and 4 weeks of content.
Each week should have:
- week: number (1 to 4)
- topics: array of 2-3 specific topics to learn
- resources: array of 1-2 recommended resources (e.g., "MDN Docs", "FreeCodeCamp")
- milestone: a short string describing a weekly goal or micro-project

Return the result as **ONLY** valid JSON with this exact shape:
{
  ${monthKeysPrompt}
}
Do NOT include any markdown formatting, code fences (like \`\`\`json), or extra text. ONLY return the raw JSON object.`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You are an AI that ONLY returns valid JSON as instructed.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 4500,
  });

  const raw = response.choices[0].message.content.trim();
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  
  return JSON.parse(cleaned);
};

module.exports = { generateRoadmapContent };
