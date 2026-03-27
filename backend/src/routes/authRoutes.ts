import { Router } from 'express';
import { login, signup } from '../controllers/authController';

const router = Router();

// User login route
router.post('/login', login);

// User signup route
router.post('/signup', signup);

export default router;