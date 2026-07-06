const { submitAnswer } = require('../controllers/interviewController');

// Mock dependencies
jest.mock('../services/prisma', () => ({
  question: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  interview: {
    update: jest.fn(),
  },
}));

jest.mock('../services/interviewAI', () => ({
  evaluateAnswer: jest.fn(),
}));

const prisma = require('../services/prisma');
const { evaluateAnswer } = require('../services/interviewAI');

const mockReq = (body = {}, headers = {}) => ({ body, headers });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('submitAnswer', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 if interviewId, questionId or answer is missing', async () => {
    const req = mockReq({ interviewId: 'int1' }); // missing questionId and answer
    const res = mockRes();
    await submitAnswer(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('returns 404 if question not found', async () => {
    prisma.question.findUnique.mockResolvedValue(null);
    const req = mockReq({ interviewId: 'int1', questionId: 'q1', answer: 'My answer' }, { 'x-user-id': 'user1' });
    const res = mockRes();
    await submitAnswer(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('evaluates answer and returns score', async () => {
    prisma.question.findUnique.mockResolvedValue({ id: 'q1', question: 'What is React?', interview: { userId: 'user1' } });
    prisma.question.update.mockResolvedValue({});
    prisma.question.findMany.mockResolvedValue([{ evaluation: { score: 8 } }]);
    prisma.interview.update.mockResolvedValue({});
    evaluateAnswer.mockResolvedValue({ score: 8, feedback: 'Great answer!' });

    const req = mockReq(
      { interviewId: 'int1', questionId: 'q1', answer: 'React is a JS library' },
      { 'x-user-id': 'user1' }
    );
    const res = mockRes();
    await submitAnswer(req, res);

    expect(evaluateAnswer).toHaveBeenCalledWith('What is React?', 'React is a JS library');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, score: 8 }));
  });
});
