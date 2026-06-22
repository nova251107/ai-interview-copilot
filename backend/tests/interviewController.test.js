// jest test for interviewController.startInterview
const { startInterview } = require('../controllers/interviewController');

jest.mock('../services/interviewAI', () => ({
  generateQuestions: jest.fn(),
  evaluateAnswer: jest.fn(),
}));

jest.mock('../services/prisma', () => ({
  resume: {
    findFirst: jest.fn(),
  },
  user: {
    upsert: jest.fn(),
  },
  interview: {
    create: jest.fn(),
  },
  question: {
    create: jest.fn(),
  },
}));

const { generateQuestions } = require('../services/interviewAI');
const prisma = require('../services/prisma');

describe('startInterview', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates interview with default 5 questions when no count provided', async () => {
    generateQuestions.mockResolvedValue(Array(5).fill({ question: 'Q', type: 'technical' }));
    prisma.resume.findFirst.mockResolvedValue(null);
    prisma.interview.create.mockResolvedValue({ id: 'interview1' });
    prisma.question.create.mockImplementation(({ data }) => Promise.resolve({ id: data.interviewId + '_q', question: data.question }));

    const req = {
      headers: {
        'x-user-id': 'user1',
        'x-user-name': 'Test User',
        'x-user-email': 'test@example.com',
      },
      body: { jobRole: 'Software Engineer' },
    };
    const res = mockRes();

    await startInterview(req, res);
    expect(generateQuestions).toHaveBeenCalledWith('Software Engineer', '', 5);
    expect(res.status).toHaveBeenCalledWith(201);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.questions).toHaveLength(5);
  });

  test('honors valid questionCount (10)', async () => {
    generateQuestions.mockResolvedValue(Array(10).fill({ question: 'Q', type: 'technical' }));
    prisma.resume.findFirst.mockResolvedValue(null);
    prisma.interview.create.mockResolvedValue({ id: 'interview2' });
    prisma.question.create.mockImplementation(({ data }) => Promise.resolve({ id: data.interviewId + '_q', question: data.question }));

    const req = {
      headers: { 'x-user-id': 'user2' },
      body: { jobRole: 'Data Scientist', questionCount: 10 },
    };
    const res = mockRes();

    await startInterview(req, res);
    expect(generateQuestions).toHaveBeenCalledWith('Data Scientist', '', 10);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].questions).toHaveLength(10);
  });

  test('falls back to default when invalid count provided', async () => {
    generateQuestions.mockResolvedValue(Array(5).fill({ question: 'Q', type: 'technical' }));
    prisma.resume.findFirst.mockResolvedValue(null);
    prisma.interview.create.mockResolvedValue({ id: 'interview3' });
    prisma.question.create.mockImplementation(({ data }) => Promise.resolve({ id: data.interviewId + '_q', question: data.question }));

    const req = {
      headers: { 'x-user-id': 'user3' },
      body: { jobRole: 'Product Manager', questionCount: 7 },
    };
    const res = mockRes();

    await startInterview(req, res);
    expect(generateQuestions).toHaveBeenCalledWith('Product Manager', '', 5);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].questions).toHaveLength(5);
  });
});
