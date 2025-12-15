import { Router } from 'express';
import { getAllPayments, getPaymentById, getPaymentsByStudent, createPayment, updatePayment, deletePayment } from '../controllers/paymentController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllPayments);
router.get('/:id', getPaymentById);
router.get('/student/:studentId', getPaymentsByStudent);
router.post('/', createPayment);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

export default router;
