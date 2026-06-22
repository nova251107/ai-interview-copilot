const axios = require('axios');

/**
 * Download a PDF from a URL and extract its text content
 * Uses pdf-parse with correct CommonJS import
 */
const extractTextFromPdfUrl = async (pdfUrl) => {
  // pdf-parse requires this specific import pattern
  const pdfParse = require('pdf-parse');
  const fn = pdfParse.default || pdfParse;

  // Download the PDF as a buffer
  const response = await axios.get(pdfUrl, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  const buffer = Buffer.from(response.data);
  const data = await fn(buffer);

  return data.text;
};

module.exports = { extractTextFromPdfUrl };
