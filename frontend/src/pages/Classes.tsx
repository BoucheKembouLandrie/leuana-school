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
import { useSchoolYear } from '../contexts/SchoolYearContext';

const schema = z.object({
    libelle: z.string().min(1, 'Libellé requis'),
    niveau: z.string().min(1, 'Niveau requis'),
    annee: z.string().min(1, 'Année scolaire requise'),
    pension: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: 'La pension doit être un nombre positif',
    }),
});

type FormData = z.infer<typeof schema>;

interface Class {
    id: number;
    libelle: string;
    niveau: string;
    annee: string;
    pension: number;
    students?: any[];
}

const Classes: React.FC = () => {
    const { currentYear } = useSchoolYear();
    const [classes, setClasses] = useState<Class[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/classes');
            setClasses(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching classes', err);
            setError('Erreur lors du chargement des classes');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        try {
            if (editingId) {
                await api.put(`/classes/${editingId}`, data);
            } else {
                await api.post('/classes', data);
            }
            fetchClasses();
            handleClose();
            setError('');
        } catch (err) {
            console.error('Error saving class', err);
            setError('Erreur lors de l\'enregistrement');
        }
    };

    const handleEdit = (classe: Class) => {
        setEditingId(classe.id);
        reset({
            libelle: classe.libelle,
            niveau: classe.niveau,
            annee: classe.annee,
            pension: classe.pension?.toString() || '0',
        });
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
            try {
                await api.delete(`/classes/${id}`);
                fetchClasses();
                setError('');
            } catch (err) {
                console.error('Error deleting class', err);
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
                    onClick={() => {
                        reset({
                            libelle: '',
                            niveau: '',
                            annee: currentYear?.name || '',
                            pension: '0',
                        });
                        setOpen(true);
                    }}
                    sx={{ backgroundColor: '#e65100', '&:hover': { backgroundColor: '#d84315' } }}
                >
                    Nouvelle classe
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ maxHeight: 586 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Libellé</TableCell>
                            <TableCell>Niveau</TableCell>
                            <TableCell>Année</TableCell>
                            <TableCell>Pension (FCFA)</TableCell>
                            <TableCell>Nombre d'élèves</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {classes.map((classe) => (
                            <TableRow key={classe.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fdf1ea' } }}>
                                <TableCell>{classe.libelle}</TableCell>
                                <TableCell>{classe.niveau}</TableCell>
                                <TableCell>{classe.annee}</TableCell>
                                <TableCell>{Number(classe.pension || 0).toLocaleString()}</TableCell>
                                <TableCell>{classe.students?.length || 0}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(classe)} color="primary">
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(classe.id)} color="error">
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table >
            </TableContainer >

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Modifier la classe' : 'Ajouter une classe'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Libellé"
                            {...register('libelle')}
                            error={!!errors.libelle}
                            helperText={errors.libelle?.message}
                            fullWidth
                        />
                        <TextField
                            label="Niveau"
                            {...register('niveau')}
                            error={!!errors.niveau}
                            helperText={errors.niveau?.message}
                            fullWidth
                        />
                        <TextField
                            label="Année scolaire"
                            {...register('annee')}
                            error={!!errors.annee}
                            helperText={errors.annee?.message}
                            fullWidth
                            placeholder="2024-2025"
                        />
                        <TextField
                            label="Pension (FCFA)"
                            type="number"
                            {...register('pension')}
                            error={!!errors.pension}
                            helperText={errors.pension?.message}
                            fullWidth
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

export default Classes;
