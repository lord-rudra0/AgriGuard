import express from 'express';
import commandRoutes from './iot/commandRoutes.js';
import ingestRoutes from './iot/ingestRoutes.js';

const router = express.Router();

router.use('/', commandRoutes);
router.use('/', ingestRoutes);

export default router;
