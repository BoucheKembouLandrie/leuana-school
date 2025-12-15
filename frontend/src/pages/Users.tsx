import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert,
    MenuItem,
    Chip,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';

const schema = z.object({
    username: z.string().min(3, 'Nom d\'utilisateur requis (min 3 caractères)'),
    password: z.string().min(6, 'Motif requis'),
    role: z.enum(['admin', 'secretary', 'teacher']),
    teacher_id: z.string().optional(),
    permissions: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

interface User {
    id: number;
    username: string;
    role: 'admin' | 'secretary' | 'teacher';
    is_default?: boolean;
    teacher_id?: number | null;
    permissions?: string[] | null;
}

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('teacher');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        // Note: You might need to implement a specific endpoint for listing users if not already done
        // For now, we'll assume there's one or simulate it
        // Since we didn't explicitly create a GET /users endpoint in the backend walkthrough, 
        // this might fail if not implemented. Let's assume it exists or handle gracefully.
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const [usersRes, teachersRes] = await Promise.all([
                api.get('/users'),
                api.get('/teachers')
            ]);
            setUsers(usersRes.data);
            setTeachers(teachersRes.data);
            setError('');
        } catch (err) {
            console.error('Error fetching users', err);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        try {
            const payload: any = {
                username: data.username,
                password: data.password,
                role: data.role,
            };

            if (data.role === 'teacher') {
                payload.teacher_id = data.teacher_id;
            } else if (data.role === 'secretary') {
                payload.permissions = selectedPermissions;
            }

            if (editingId) {
                await api.put(`/users/${editingId}`, payload);
            } else {
                await api.post('/users', payload);
            }
            fetchUsers();
            handleClose();
            setError('');
        } catch (err: any) {
            console.error('Error saving user', err);
            setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
        }
    };

    const handleEdit = (user: User) => {
        if (user.is_default) {
            alert('Le compte administrateur par défaut ne peut pas être modifié');
            return;
        }
        setEditingId(user.id);
        setSelectedRole(user.role);
        setSelectedPermissions(user.permissions || []);
        reset({
            username: user.username,
            role: user.role,
            password: '',
            teacher_id: user.teacher_id?.toString() || '',
        });
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        const user = users.find(u => u.id === id);
        if (user?.is_default) {
            alert('Le compte administrateur par défaut ne peut pas être supprimé');
            return;
        }
        if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
                setError('');
            } catch (err: any) {
                console.error('Error deleting user', err);
                setError(err.response?.data?.message || 'Erreur lors de la suppression');
            }
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditingId(null);
        setSelectedRole('teacher');
        setSelectedPermissions([]);
        reset();
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'error';
            case 'secretary': return 'primary';
            case 'teacher': return 'success';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpen(true)}
                    sx={{ backgroundColor: '#8e24aa', '&:hover': { backgroundColor: '#6a1b9a' } }}
                >
                    Nouvel utilisateur
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 220px)' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom d'utilisateur</TableCell>
                            <TableCell>Rôle</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f6edf8' } }}>
                                <TableCell>
                                    {user.username}
                                    {user.is_default && <Chip label="PAR DÉFAUT" size="small" color="warning" sx={{ ml: 1 }} />}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.role.toUpperCase()}
                                        color={getRoleColor(user.role) as any}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => handleEdit(user)}
                                        color="primary"
                                        disabled={user.is_default}
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(user.id)}
                                        color="error"
                                        disabled={user.is_default}
                                    >
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Nom d'utilisateur"
                            {...register('username')}
                            error={!!errors.username}
                            helperText={errors.username?.message}
                            fullWidth
                        />
                        <TextField
                            label="Mot de passe"
                            type="password"
                            {...register('password')}
                            error={!!errors.password}
                            helperText={errors.password?.message}
                            fullWidth
                            placeholder={editingId ? "Laisser vide pour ne pas changer" : ""}
                        />
                        <TextField
                            select
                            label="Rôle"
                            {...register('role')}
                            error={!!errors.role}
                            helperText={errors.role?.message}
                            fullWidth
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            <MenuItem value="admin">Administrateur</MenuItem>
                            <MenuItem value="secretary">Secrétaire</MenuItem>
                            <MenuItem value="teacher">Enseignant</MenuItem>
                        </TextField>

                        {selectedRole === 'teacher' && (
                            <TextField
                                select
                                label="Enseignant"
                                {...register('teacher_id')}
                                fullWidth
                                defaultValue=""
                            >
                                <MenuItem value="">Sélectionner un enseignant</MenuItem>
                                {teachers.map((teacher) => (
                                    <MenuItem key={teacher.id} value={teacher.id.toString()}>
                                        {teacher.nom} {teacher.prenom}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}

                        {selectedRole === 'secretary' && (
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Permissions (onglets accessibles)</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {['eleves', 'classes', 'enseignants', 'matieres', 'notes', 'paiements', 'presences', 'parametres'].map((perm) => (
                                        <Chip
                                            key={perm}
                                            label={perm}
                                            onClick={() => {
                                                setSelectedPermissions(prev =>
                                                    prev.includes(perm)
                                                        ? prev.filter(p => p !== perm)
                                                        : [...prev, perm]
                                                );
                                            }}
                                            color={selectedPermissions.includes(perm) ? 'primary' : 'default'}
                                            variant={selectedPermissions.includes(perm) ? 'filled' : 'outlined'}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Annuler</Button>
                    <Button onClick={handleSubmit(onSubmit)} variant="contained">
                        {editingId ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
};

export default Users;
