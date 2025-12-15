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
    date_naissance: z.string().min(1, 'Date de naissance requise'),
    sexe: z.enum(['M', 'F']),
    category: z.string().min(1, 'Catégorie requise'),
    adresse: z.string().min(1, 'Adresse requise'),
    parent_tel: z.string().min(1, 'Téléphone parent requis'),
    classe_id: z.string().min(1, 'Classe requise'),
});

type FormData = z.infer<typeof schema>;

interface Student {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    date_naissance: string;
    sexe: string;
    category: string;
    adresse: string;
    parent_tel: string;
    classe_id: number;
    class?: { libelle: string };
}

interface Class {
    id: number;
    libelle: string;
}

const Students: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        fetchStudents();
        fetchClasses();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/students');
            setStudents(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching students', err);
            setError('Erreur lors du chargement des élèves');
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes');
            setClasses(response.data);
        } catch (err) {
            console.error('Error fetching classes', err);
        }
    };

    const onSubmit = async (data: FormData) => {
        try {
            if (editingId) {
                await api.put(`/students/${editingId}`, data);
            } else {
                await api.post('/students', data);
            }
            fetchStudents();
            handleClose();
            setError('');
        } catch (err) {
            console.error('Error saving student', err);
            setError('Erreur lors de l\'enregistrement');
        }
    };

    const handleEdit = (student: Student) => {
        setEditingId(student.id);
        reset({
            nom: student.nom,
            prenom: student.prenom,
            date_naissance: student.date_naissance,
            sexe: student.sexe as 'M' | 'F',
            category: student.category || 'Non redoublant',
            adresse: student.adresse,
            parent_tel: student.parent_tel,
            classe_id: student.classe_id.toString(),
        });
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
            try {
                await api.delete(`/students/${id}`);
                fetchStudents();
                setError('');
            } catch (err) {
                console.error('Error deleting student', err);
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
                    sx={{ backgroundColor: '#5e35b1', '&:hover': { backgroundColor: '#4527a0' } }}
                >
                    Nouvel élève
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 220px)' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Matricule</TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell>Prénom</TableCell>
                            <TableCell>Date de naissance</TableCell>
                            <TableCell>Sexe</TableCell>
                            <TableCell>Classe</TableCell>
                            <TableCell>Catégorie</TableCell>
                            <TableCell>Téléphone Parent</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f2eef9' } }}>
                                <TableCell>{student.matricule}</TableCell>
                                <TableCell>{student.nom}</TableCell>
                                <TableCell>{student.prenom}</TableCell>
                                <TableCell>{new Date(student.date_naissance).toLocaleDateString()}</TableCell>
                                <TableCell>{student.sexe}</TableCell>
                                <TableCell>{student.class?.libelle || 'N/A'}</TableCell>
                                <TableCell>{student.category}</TableCell>
                                <TableCell>{student.parent_tel}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(student)} color="primary">
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(student.id)} color="error">
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Modifier l\'élève' : 'Ajouter un élève'}</DialogTitle>
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
                            label="Date de naissance"
                            type="date"
                            {...register('date_naissance')}
                            error={!!errors.date_naissance}
                            helperText={errors.date_naissance?.message}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            select
                            label="Sexe"
                            {...register('sexe')}
                            error={!!errors.sexe}
                            helperText={errors.sexe?.message}
                            fullWidth
                            SelectProps={{ native: true }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <option value="">Sélectionner</option>
                            <option value="M">Masculin</option>
                            <option value="F">Féminin</option>
                        </TextField>
                        <TextField
                            select
                            label="Catégorie"
                            {...register('category')}
                            error={!!errors.category}
                            helperText={errors.category?.message}
                            fullWidth
                            SelectProps={{ native: true }}
                            defaultValue="Non redoublant"
                        >
                            <option value="Non redoublant">Non redoublant</option>
                            <option value="Redoublant">Redoublant</option>
                        </TextField>
                        <TextField
                            label="Adresse"
                            {...register('adresse')}
                            fullWidth
                        />
                        <TextField
                            label="Téléphone parent"
                            {...register('parent_tel')}
                            fullWidth
                        />
                        <TextField
                            select
                            label="Classe"
                            {...register('classe_id')}
                            error={!!errors.classe_id}
                            helperText={errors.classe_id?.message}
                            fullWidth
                            SelectProps={{ native: true }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <option value="">Sélectionner une classe</option>
                            {classes.map((classe) => (
                                <option key={classe.id} value={classe.id}>
                                    {classe.libelle}
                                </option>
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

export default Students;
