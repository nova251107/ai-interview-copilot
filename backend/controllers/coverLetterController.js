const prisma = require('../services/prisma');
const { extractTextFromPdfUrl } = require('../services/pdfParser');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate a personalized cover letter using the user's resume + job description.
 * Body: { jobDescription, jobTitle?, companyName? }
 * Headers: x-user-id, x-user-name
 */
const generateCoverLetter = async (req, res) => {
  const userId = req.headers['x-user-id'];
  const userName = req.headers['x-user-name'] || 'Applicant';
  const {
    jobDescription: rawJobDescription = '',
    jobTitle: rawJobTitle = '',
    companyName: rawCompanyName = '',
  } = req.body;

  // ─── Input sanitization & validation ────────────────────────────
  const jobDescription = typeof rawJobDescription === 'string' ? rawJobDescription.trim() : '';
  const jobTitle       = typeof rawJobTitle       === 'string' ? rawJobTitle.trim()       : '';
  const companyName    = typeof rawCompanyName    === 'string' ? rawCompanyName.trim()    : '';

  if (!userId) return res.status(401).json({ success: false, message: 'User ID required' });
  if (!jobDescription || jobDescription.length < 30) return res.status(400).json({ success: false, message: 'Job description must be at least 30 characters' });
  if (jobDescription.length > 5000) return res.status(400).json({ success: false, message: 'Job description must be 5000 characters or fewer' });
  if (jobTitle.length > 150)    return res.status(400).json({ success: false, message: 'Job title must be 150 characters or fewer' });
  if (companyName.length > 150) return res.status(400).json({ success: false, message: 'Company name must be 150 characters or fewer' });

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
      console.warn('No resume found, using JD-only mode:', err.message);
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
    console.error('[generateCoverLetter] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to generate cover letter' });
  }
};

module.exports = { generateCoverLetter };
