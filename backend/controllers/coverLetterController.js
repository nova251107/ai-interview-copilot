const prisma = require('../services/prisma');
const { extractTextFromPdfUrl } = require('../services/pdfParser');
const Groq = require('groq-sdk');
const logger = require('../services/logger');
const { generateCoverLetterSchema } = require('../validators/coverLetter');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateCoverLetter = async (req, res) => {
  const userId = req.headers['x-user-id'];
  const userName = req.headers['x-user-name'] || 'Applicant';

  if (!userId) {return res.status(401).json({ success: false, message: 'User ID required' });}

  const parsed = generateCoverLetterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
  }
  const { jobDescription, jobTitle, companyName } = parsed.data;

  try {
    // 1. Try to load the user's latest resume text
    let resumeText = '';
    try {
      const resume = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (resume?.resumeUrl) {
        resumeText = await extractTextFromPdfUrl(resume.resumeUrl);
      }
    } catch (err) {
      logger.warn({ err }, 'No resume found, using JD-only mode');
    }

    const hasResume = resumeText && resumeText.length > 30;

    // 2. Build the AI prompt
    const prompt = `You are an expert career coach and professional writer specializing in cover letters.
Write a compelling, personalized cover letter for a job application.

${hasResume ? `Candidate's Resume:
"""
${resumeText.slice(0, 4000)}
"""` : ''}

Job Description:
"""
${jobDescription.slice(0, 3000)}
"""

${jobTitle ? `Job Title: ${jobTitle}` : ''}
${companyName ? `Company: ${companyName}` : ''}
Candidate Name: ${userName}

Instructions:
- Write exactly 3 paragraphs
- Paragraph 1: Express enthusiasm for the specific role${companyName ? ` at ${companyName}` : ''} and briefly introduce yourself
- Paragraph 2: Highlight 2-3 specific skills or experiences from the resume that match the job description
- Paragraph 3: Express confidence, mention eagerness to discuss further, and close professionally
- Use a formal but warm tone — NOT generic. Reference specific skills from the resume.
- Do NOT use placeholder text like [Your Name] or [Date]
- Start directly with "Dear Hiring Manager,"
- End with "Sincerely,\\n${userName}"
- Do NOT include any explanation or extra text — only the cover letter itself.`;

    // 3. Call Groq AI
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a professional cover letter writer. Write exactly what is asked — no extra commentary.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 700,
    });

    const coverLetter = completion.choices[0].message.content.trim();

    return res.status(200).json({
      success: true,
      coverLetter,
      usedResume: hasResume,
    });
  } catch (error) {
    logger.error({ err: error, userId }, 'generateCoverLetter failed');
    return res.status(500).json({ success: false, message: 'Failed to generate cover letter' });
  }
};

module.exports = { generateCoverLetter };
