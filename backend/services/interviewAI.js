const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate interview questions tailored to the job role and resume.
 * Returns an array of objects: [{ question: string, type: string }]
 */
const generateQuestions = async (jobRole, resumeText, count = 5) => {
  const prompt = `You are a senior technical interviewer.
Generate **exactly ${count}** interview questions for a ${jobRole} candidate.
- Include 3 technical questions, 1 behavioral, and 1 situational.
- Base the questions on the following resume (use relevant experience, skills, projects):
"""
${resumeText.slice(0, 5000)}
"""
Return the result as **JSON** with this shape:
[{ "question": "...", "type": "technical|behavioral|situational" }]
Do NOT include any extra text, just the JSON array.`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You are an AI that ONLY returns valid JSON as instructed.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 800,
  });

  const raw = response.choices[0].message.content.trim();
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
};

/**
 * Evaluate a candidate's answer to a given question.
 * Returns { score: number (0‑10), feedback: string }
 */
const evaluateAnswer = async (question, answer) => {
  const prompt = `You are a senior technical interviewer evaluating a candidate's answer.
Question: "${question}"
Candidate Answer: "${answer}"
Score the answer on a scale of 0 to 10 (10 = excellent, 0 = completely off‑track).
Provide **exactly** a JSON object with two fields:
{ "score": <number>, "feedback": "<concise constructive feedback>" }
Do NOT add any extra text or explanation.`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You ONLY output the JSON object as instructed.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 400,
  });

  const raw = response.choices[0].message.content.trim();
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
};

module.exports = { generateQuestions, evaluateAnswer };
