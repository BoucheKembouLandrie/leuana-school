import express from 'express';
import { exportData, importData, resetData } from '../controllers/dataController';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/export', exportData);
router.post('/import', upload.single('file'), importData);
router.delete('/reset', resetData);

export default router;
