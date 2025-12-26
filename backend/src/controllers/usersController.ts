import { Request, Response } from 'express';
import User from '../models/User';
import Teacher from '../models/Teacher';
import bcrypt from 'bcrypt';

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'is_default', 'teacher_id', 'permissions'],
            include: [{
                model: Teacher,
                as: 'teacher',
                attributes: ['id', 'nom', 'prenom'],
                required: false
            }]
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Create new user (admin only)
export const createUser = async (req: Request, res: Response) => {
    try {
        const { username, password, email, role, teacher_id, permissions } = req.body;

        // Validate required fields
        if (!username || !password || !role) {
            return res.status(400).json({ message: 'Username, password, and role are required' });
        }

        // Validate role-specific fields
        if (role === 'teacher' && !teacher_id) {
            return res.status(400).json({ message: 'Teacher ID is required for teacher accounts' });
        }

        if (role === 'secretary' && !permissions) {
            return res.status(400).json({ message: 'Permissions are required for secretary accounts' });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            username,
            password: hashedPassword,
            email: email || null,
            role,
            is_default: false,
            teacher_id: role === 'teacher' ? teacher_id : null,
            permissions: role === 'secretary' ? permissions : null,
        });

        res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            is_default: user.is_default,
            teacher_id: user.teacher_id,
            permissions: user.permissions,
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update user (admin only, cannot update default admin)
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { username, password, email, role, teacher_id, permissions } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent updating default admin
        if (user.is_default) {
            return res.status(403).json({ message: 'Cannot modify the default admin account' });
        }

        // Prepare update data
        const updateData: any = {};
        if (username) updateData.username = username;
        if (email !== undefined) updateData.email = email || null;
        if (role) updateData.role = role;
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update role-specific fields
        if (role === 'teacher') {
            updateData.teacher_id = teacher_id;
            updateData.permissions = null;
        } else if (role === 'secretary') {
            updateData.permissions = permissions;
            updateData.teacher_id = null;
        } else {
            updateData.teacher_id = null;
            updateData.permissions = null;
        }

        await user.update(updateData);

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            is_default: user.is_default,
            teacher_id: user.teacher_id,
            permissions: user.permissions,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Delete user (admin only, cannot delete default admin)
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting default admin
        if (user.is_default) {
            return res.status(403).json({ message: 'Cannot delete the default admin account' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
