'use strict';

import express from 'express';

import CspViolation from '../models/CspViolation.js';

import asyncHandler from '../utils/asyncHandler.js';
import cspViolationReport from '../service/cspViolationReport.js';
import getADocument from '../service/getADocument.js';
import getDocumentsList from '../service/getDocumentsList.js';

const router = express.Router();
const model = CspViolation;
const sentenceCaseModelName = 'CSP violations';

// ✅ Create a CSP violation report
router.post(
    '/',
    express.json(),
    asyncHandler((req, res) => cspViolationReport(req, res))
);

// ✅ Get a list of CSP violations (Paginated)
router.get(
    '/',
    asyncHandler((req, res) =>
        getDocumentsList(req, res, model, {}, sentenceCaseModelName, {}, {})
    )
);

// ✅ Get a specific CSP violation by ID
router.get(
    '/:id',
    asyncHandler((req, res) =>
        getADocument(req, res, model, {}, sentenceCaseModelName, {}, {})
    )
);

export default router;
