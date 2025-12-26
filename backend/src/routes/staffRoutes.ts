import express from 'express';
import { getAllStaff, createStaff, updateStaff, deleteStaff, transferStaff } from '../controllers/staffController';

const router = express.Router();

router.get('/', getAllStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);
router.post('/action/transfer', transferStaff);

export default router;
