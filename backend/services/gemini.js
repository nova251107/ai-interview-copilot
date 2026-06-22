const Groq = require('groq-sdk');
const axios = require('axios');
const pdfParse = require('pdf-parse');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Download PDF from URL, extract text, analyze with Groq (Llama 3.1)
 * Returns: atsScore, summary, skills, strengths, suggestions, missingKeywords, overallFeedback
 */
const analyzeResume = async (pdfUrl) => {
  // 1. Download PDF as buffer
  const response = await axios.get(pdfUrl, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  // 2. Extract text from PDF
  const buffer = Buffer.from(response.data);
  const pdfData = await pdfParse(buffer);
  const resumeText = pdfData.text?.trim();

  if (!resumeText || resumeText.length < 30) {
    throw new Error('Could not extract text from PDF. Make sure the PDF has selectable text.');
  }

  console.log(`📄 Extracted ${resumeText.length} characters from PDF`);

  // 3. Analyze with Groq (Llama 3.1 8B)
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: 'You are an expert ATS resume analyzer and career coach. You ONLY respond with valid JSON — no markdown, no explanation, no code fences.',
      },
      {
        role: 'user',
        content: `Analyze this resume and return ONLY a valid JSON object with this exact structure:
{
  "atsScore": <number 0-100>,
  "summary": "<2-3 sentence professional summary of the candidate>",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "strengths": ["strength1", "strength2", "strength3"],
  "suggestions": [
    { "category": "Format", "tip": "<specific actionable tip>" },
    { "category": "Keywords", "tip": "<specific actionable tip>" },
    { "category": "Experience", "tip": "<specific actionable tip>" },
    { "category": "Skills", "tip": "<specific actionable tip>" }
  ],
  "missingKeywords": ["keyword1", "keyword2", "keyword3"],
  "overallFeedback": "<one paragraph of honest constructive feedback>"
}

Resume text:
"""
${resumeText.slice(0, 6000)}
"""

Return ONLY the JSON object. No other text.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  const raw = completion.choices[0].message.content.trim();

  // Strip any accidental markdown fences
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  return JSON.parse(cleaned);
};

module.exports = { analyzeResume };
