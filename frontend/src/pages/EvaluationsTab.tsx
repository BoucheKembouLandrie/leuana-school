import React, { useState, useEffect } from 'react';
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
import { formatDate } from '../utils/formatDate';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Controller } from 'react-hook-form';
import dayjs from 'dayjs';

const schema = z.object({
    nom: z.string().min(1, 'Nom de l\'évaluation requis'),
    date_debut: z.string().min(1, 'Date de début requise'),
    date_fin: z.string().min(1, 'Date de fin requise'),
});

type FormData = z.infer<typeof schema>;

interface Evaluation {
    id: number;
    nom: string;
    date_debut: string;
    date_fin: string;
}

const EvaluationsTab: React.FC = () => {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/evaluations');
            setEvaluations(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching evaluations', err);
            setError('Erreur lors du chargement des évaluations');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        try {
            if (editingId) {
                await api.put(`/evaluations/${editingId}`, data);
            } else {
                await api.post('/evaluations', data);
            }
            fetchData();
            handleClose();
            setError('');
        } catch (err) {
            console.error('Error saving evaluation', err);
            setError('Erreur lors de l\'enregistrement');
        }
    };

    const handleEdit = (evaluation: Evaluation) => {
        setEditingId(evaluation.id);
        setValue('nom', evaluation.nom);
        setValue('date_debut', evaluation.date_debut || '');
        setValue('date_fin', evaluation.date_fin || '');
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette évaluation ?')) {
            try {
                await api.delete(`/evaluations/${id}`);
                fetchData();
                setError('');
            } catch (err) {
                console.error('Error deleting evaluation', err);
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
                    sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
                >
                    Ajouter une évaluation
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ maxHeight: 586 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Évaluation</TableCell>
                            <TableCell>Date de début</TableCell>
                            <TableCell>Date de fin</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {evaluations.map((evaluation) => (
                            <TableRow key={evaluation.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fbeeee' } }}>
                                <TableCell>{evaluation.nom}</TableCell>
                                <TableCell>{formatDate(evaluation.date_debut)}</TableCell>
                                <TableCell>{formatDate(evaluation.date_fin)}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(evaluation)} color="primary">
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(evaluation.id)} color="error">
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {evaluations.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    Aucune évaluation créée
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Modifier l\'évaluation' : 'Ajouter une évaluation'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Nom de l'évaluation"
                            {...register('nom')}
                            error={!!errors.nom}
                            helperText={errors.nom?.message}
                            fullWidth
                        />
                        <Controller
                            control={control}
                            name="date_debut"
                            render={({ field }) => (
                                <DatePicker
                                    label="Date de début"
                                    value={field.value ? dayjs(field.value) : null}
                                    onChange={(newValue) => field.onChange(newValue ? newValue.format('YYYY-MM-DD') : '')}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            InputLabelProps: { shrink: true },
                                            error: !!errors.date_debut,
                                            helperText: errors.date_debut?.message
                                        }
                                    }}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="date_fin"
                            render={({ field }) => (
                                <DatePicker
                                    label="Date de fin"
                                    value={field.value ? dayjs(field.value) : null}
                                    onChange={(newValue) => field.onChange(newValue ? newValue.format('YYYY-MM-DD') : '')}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            InputLabelProps: { shrink: true },
                                            error: !!errors.date_fin,
                                            helperText: errors.date_fin?.message
                                        }
                                    }}
                                />
                            )}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Annuler</Button>
                    <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
                        {editingId ? 'Modifier' : 'Ajouter'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
};

export default EvaluationsTab;
