import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { registerPushToken } from '../lib/push';
import { prisma } from '../lib/prisma';

export const pushRouter = Router();

pushRouter.use(requireAuth);

pushRouter.post('/register', async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const { token } = req.body as { token: string };
    if (!token) return res.status(400).json({ message: 'token required' });
    const record = await registerPushToken(userId, token);
    return res.json(record);
  } catch (err) {
    next(err);
  }
});

pushRouter.post('/unregister', async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const { token } = req.body as { token?: string };
    if (token) {
      await prisma.pushToken.deleteMany({ where: { token, userId } });
      return res.json({ message: 'Token deleted' });
    }
    // If no token provided, delete all tokens for user (logout)
    await prisma.pushToken.deleteMany({ where: { userId } });
    return res.json({ message: 'Tokens deleted' });
  } catch (err) {
    next(err);
  }
});

export default pushRouter;
