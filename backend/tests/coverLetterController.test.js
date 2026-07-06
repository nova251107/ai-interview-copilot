const { generateCoverLetter } = require('../controllers/coverLetterController');

jest.mock('../services/prisma', () => ({
  resume: { findFirst: jest.fn() },
}));

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Dear Hiring Manager, I am writing to express my interest...' } }],
        }),
      },
    },
  }));
});

const mockReq = (body = {}, headers = {}) => ({ body, headers });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('generateCoverLetter', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 if jobDescription is missing', async () => {
    const req = mockReq({}, { 'x-user-id': 'user1' });
    const res = mockRes();
    await generateCoverLetter(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 if jobDescription is too short', async () => {
    const req = mockReq({ jobDescription: 'short' }, { 'x-user-id': 'user1' });
    const res = mockRes();
    await generateCoverLetter(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
