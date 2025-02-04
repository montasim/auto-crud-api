'use strict';

import express from 'express';

import HppViolation from '../models/HppViolation.js';

import asyncHandler from '../utils/asyncHandler.js';
import hppIncidentReport from '../service/hppIncidentReport.js';
import getDocumentsList from '../service/getDocumentsList.js';
import getADocument from '../service/getADocument.js';

const router = express.Router();
const model = HppViolation;
const sentenceCaseModelName = 'HPP violations';

// ✅ Create an HPP violation report
router.post(
    '/',
    express.json(),
    asyncHandler((req, res) => hppIncidentReport(req, res))
);

// ✅ Get a list of HPP violations (Paginated)
router.get(
    '/',
    asyncHandler((req, res) =>
        getDocumentsList(req, res, model, {}, sentenceCaseModelName, {}, {})
    )
);

// ✅ Get a specific HPP violation by ID
router.get(
    '/:id',
    asyncHandler((req, res) =>
        getADocument(req, res, model, {}, sentenceCaseModelName, {}, {})
    )
);

export default router;
