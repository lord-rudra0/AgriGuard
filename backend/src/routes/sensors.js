import express from 'express';
import dataRoutes from './sensors/dataRoutes.js';
import analyticsRoutes from './sensors/analyticsRoutes.js';
import historyRoutes from './sensors/historyRoutes.js';

const router = express.Router();

router.use('/', dataRoutes);
router.use('/', analyticsRoutes);
router.use('/', historyRoutes);

export default router;
