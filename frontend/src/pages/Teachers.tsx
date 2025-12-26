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
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';

const schema = z.object({
    nom: z.string().min(1, 'Nom requis'),
    prenom: z.string().min(1, 'Prénom requis'),
    tel: z.string().min(1, 'Téléphone requis'),
    email: z.string().email('Email invalide').min(1, 'Email requis'),
    salaire: z.string().min(1, 'Salaire requis'),
});

type FormData = z.infer<typeof schema>;

interface Teacher {
    id: number;
    nom: string;
    prenom: string;
    tel: string;
    email: string;
    salaire: number;
}

const Teachers: React.FC = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/teachers');
            setTeachers(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching teachers', err);
            setError('Erreur lors du chargement des enseignants');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        try {
            if (editingId) {
                await api.put(`/teachers/${editingId}`, data);
            } else {
                await api.post('/teachers', data);
            }
            fetchTeachers();
            handleClose();
            setError('');
        } catch (err) {
            console.error('Error saving teacher', err);
            setError('Erreur lors de l\'enregistrement');
        }
    };

    const handleEdit = (teacher: Teacher) => {
        setEditingId(teacher.id);
        reset({
            nom: teacher.nom,
            prenom: teacher.prenom,
            tel: teacher.tel,
            email: teacher.email || '',
            salaire: teacher.salaire ? teacher.salaire.toString() : '',
        });
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
            try {
                await api.delete(`/teachers/${id}`);
                fetchTeachers();
                setError('');
            } catch (err) {
                console.error('Error deleting teacher', err);
                setError('Erreur lors de la suppression');
            }
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditingId(null);
        reset();
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
                    sx={{ backgroundColor: '#c2185b', '&:hover': { backgroundColor: '#ad1457' } }}
                >
                    Nouvel enseignant
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ maxHeight: 586 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom</TableCell>
                            <TableCell>Prénom</TableCell>
                            <TableCell>Téléphone</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Salaire</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {teachers.map((teacher) => (
                            <TableRow key={teacher.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#faecf1' } }}>
                                <TableCell>{teacher.nom}</TableCell>
                                <TableCell>{teacher.prenom}</TableCell>
                                <TableCell>{teacher.tel}</TableCell>
                                <TableCell>{teacher.email || '-'}</TableCell>
                                <TableCell>{teacher.salaire ? `${teacher.salaire} FCFA` : '-'}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(teacher)} color="primary">
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(teacher.id)} color="error">
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Modifier l\'enseignant' : 'Ajouter un enseignant'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Nom"
                            {...register('nom')}
                            error={!!errors.nom}
                            helperText={errors.nom?.message}
                            fullWidth
                        />
                        <TextField
                            label="Prénom"
                            {...register('prenom')}
                            error={!!errors.prenom}
                            helperText={errors.prenom?.message}
                            fullWidth
                        />
                        <TextField
                            label="Téléphone"
                            {...register('tel')}
                            error={!!errors.tel}
                            helperText={errors.tel?.message}
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            {...register('email')}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            fullWidth
                        />
                        <TextField
                            label="Salaire"
                            {...register('salaire')}
                            error={!!errors.salaire}
                            helperText={errors.salaire?.message}
                            fullWidth
                            type="number"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Annuler</Button>
                    <Button onClick={handleSubmit(onSubmit)} variant="contained">
                        {editingId ? 'Modifier' : 'Ajouter'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
};

export default Teachers;
