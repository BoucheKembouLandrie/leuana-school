import express from 'express';
import { sendSuggestion } from '../controllers/suggestionController';

const router = express.Router();

router.post('/', sendSuggestion);

export default router;
