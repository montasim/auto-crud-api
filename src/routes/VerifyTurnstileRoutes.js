'use strict';

import express from 'express';

import asyncHandler from '../utils/asyncHandler.js';
import verifyTurnstile from '../service/verifyTurnstile.js';

const router = express.Router();

// ✅ Create an HPP violation report
router.post(
    '/',
    express.json(),
    asyncHandler((req, res) => verifyTurnstile(req, res))
);

export default router;
