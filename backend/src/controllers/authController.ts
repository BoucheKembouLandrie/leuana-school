import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendPasswordRecoveryEmail } from '../services/emailService';

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                is_default: user.is_default,
                teacher_id: user.teacher_id,
                permissions: user.permissions
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getMe = async (req: any, res: Response) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { username, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword, role });
        res.status(201).json({ message: 'User created successfully', user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email, role } = req.body;

        // Validate email
        if (!email || !email.includes('@')) {
            return res.status(400).json({ message: 'Adresse email invalide' });
        }

        // Only process for admin role
        if (role !== 'admin') {
            return res.status(400).json({ message: 'Cette fonctionnalité est réservée aux administrateurs' });
        }

        // Find admin user with this email
        const user = await User.findOne({
            where: {
                email: email,
                role: 'admin'
            }
        });

        if (!user) {
            return res.status(404).json({
                message: 'Aucun compte administrateur n\'est associé à cette adresse email'
            });
        }

        // Generate temporary password (8 characters: letters and numbers)
        const generateTempPassword = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
            let password = '';
            for (let i = 0; i < 8; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        };

        const temporaryPassword = generateTempPassword();

        // Hash the temporary password
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        // Update user password
        await user.update({ password: hashedPassword });

        // Send email with credentials
        await sendPasswordRecoveryEmail(email, user.username, temporaryPassword);

        res.json({
            message: 'Un email contenant vos identifiants a été envoyé à votre adresse email'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.'
        });
    }
};
