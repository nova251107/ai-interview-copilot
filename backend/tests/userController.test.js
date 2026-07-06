const { createUser, getUserById } = require('../controllers/userController');

jest.mock('../services/prisma', () => ({
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
}));

const prisma = require('../services/prisma');

const mockReq = (body = {}, params = {}) => ({ body, params });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('createUser', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 if id or email is missing', async () => {
    const req = mockReq({ name: 'John' });
    const res = mockRes();
    await createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('creates user successfully', async () => {
    const userData = { id: 'user_123', name: 'John', email: 'john@test.com', image: null };
    prisma.user.upsert.mockResolvedValue(userData);
    const req = mockReq(userData);
    const res = mockRes();
    await createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('getUserById', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 if user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const req = mockReq({}, { id: 'nonexistent' });
    const res = mockRes();
    await getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns user with all related data', async () => {
    const user = { id: 'user_123', name: 'John', resumes: [], interviews: [], roadmaps: [], dsa: null };
    prisma.user.findUnique.mockResolvedValue(user);
    const req = mockReq({}, { id: 'user_123' });
    const res = mockRes();
    await getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, user }));
  });
});
