import { Router, Request, Response } from 'express';
import { isMongoConnected } from '../services/mongo.service';
import state from '../services/whatsapp.state';

const router = Router();

/**
 * GET /health
 * Public endpoint — returns server + dependency health
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      mongodb: isMongoConnected() ? 'connected' : 'disconnected',
      whatsapp: state.isReady ? 'ready' : 'not_ready',
    },
  });
});

export default router;
