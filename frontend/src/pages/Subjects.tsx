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
    Grid,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';

const schema = z.object({
    nom: z.string().min(1, 'Nom de la matière requis'),
    teacher_id: z.string().min(1, 'Enseignant requis'),
    classe_id: z.string().min(1, 'Classe requise'),
    coefficient: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Le coefficient doit être un nombre positif',
    }),
});

type FormData = z.infer<typeof schema>;

interface Subject {
    id: number;
    nom: string;
    teacher_id: number | null;
    classe_id: number | null;
    coefficient: number;
    teacher?: { nom: string; prenom: string };
    class?: { libelle: string };
}

interface Teacher {
    id: number;
    nom: string;
    prenom: string;
}

interface Class {
    id: number;
    libelle: string;
}

const Subjects: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter State
    const [filterClassId, setFilterClassId] = useState<string>('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [subjectsRes, teachersRes, classesRes] = await Promise.all([
                api.get('/subjects'),
                api.get('/teachers'),
                api.get('/classes'),
            ]);
            setSubjects(subjectsRes.data);
            setTeachers(teachersRes.data);
            setClasses(classesRes.data);
            setError('');
        } catch (err) {
            console.error('Error fetching data', err);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        try {
            if (editingId) {
                await api.put(`/subjects/${editingId}`, data);
            } else {
                await api.post('/subjects', data);
            }
            fetchData();
            handleClose();
            setError('');
        } catch (err) {
            console.error('Error saving subject', err);
            setError('Erreur lors de l\'enregistrement');
        }
    };

    const handleEdit = (subject: Subject) => {
        setEditingId(subject.id);
        reset({
            nom: subject.nom,
            teacher_id: subject.teacher_id ? subject.teacher_id.toString() : '',
            classe_id: subject.classe_id ? subject.classe_id.toString() : '',
            coefficient: subject.coefficient?.toString() || '1',
        });
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
            try {
                await api.delete(`/subjects/${id}`);
                fetchData();
                setError('');
            } catch (err) {
                console.error('Error deleting subject', err);
                setError('Erreur lors de la suppression');
            }
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditingId(null);
        reset();
    };

    // Filter Logic
    const filteredSubjects = subjects.filter(subject => {
        if (!filterClassId) return true;
        return subject.classe_id.toString() === filterClassId;
    });

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
                    sx={{ backgroundColor: '#009688', '&:hover': { backgroundColor: '#00796b' } }}
                >
                    Nouvelle matière
                </Button>
            </Box>

            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 1 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            label="Classe"
                            value={filterClassId}
                            onChange={(e) => setFilterClassId(e.target.value)}
                            fullWidth
                            SelectProps={{ displayEmpty: true }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <MenuItem value="">Toutes les classes</MenuItem>
                            {classes.map((c) => (
                                <MenuItem key={c.id} value={c.id.toString()}>{c.libelle}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ maxHeight: 586 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom</TableCell>
                            <TableCell>Coefficient</TableCell>
                            <TableCell>Enseignant</TableCell>
                            <TableCell>Classe</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSubjects.map((subject) => (
                            <TableRow key={subject.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#eaf5f4' } }}>
                                <TableCell>{subject.nom}</TableCell>
                                <TableCell>{subject.coefficient}</TableCell>
                                <TableCell>
                                    {subject.teacher ? `${subject.teacher.nom} ${subject.teacher.prenom}` : 'N/A'}
                                </TableCell>
                                <TableCell>{subject.class?.libelle || 'N/A'}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(subject)} color="primary">
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(subject.id)} color="error">
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredSubjects.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    Aucune matière trouvée
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table >
            </TableContainer >

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Modifier la matière' : 'Ajouter une matière'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Nom de la matière"
                            {...register('nom')}
                            error={!!errors.nom}
                            helperText={errors.nom?.message}
                            fullWidth
                        />
                        <TextField
                            label="Coefficient"
                            type="number"
                            inputProps={{ min: 1 }}
                            {...register('coefficient')}
                            error={!!errors.coefficient}
                            helperText={errors.coefficient?.message}
                            fullWidth
                        />
                        <TextField
                            select
                            label="Enseignant"
                            {...register('teacher_id')}
                            error={!!errors.teacher_id}
                            helperText={errors.teacher_id?.message}
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
                        <TextField
                            select
                            label="Classe"
                            {...register('classe_id')}
                            error={!!errors.classe_id}
                            helperText={errors.classe_id?.message}
                            fullWidth
                            defaultValue=""
                        >
                            <MenuItem value="">Sélectionner une classe</MenuItem>
                            {classes.map((classe) => (
                                <MenuItem key={classe.id} value={classe.id.toString()}>
                                    {classe.libelle}
                                </MenuItem>
                            ))}
                        </TextField>
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

export default Subjects;
