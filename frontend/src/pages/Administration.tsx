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
    titre: z.string().min(1, 'Titre requis'),
    nom: z.string().min(1, 'Nom requis'),
    prenom: z.string().min(1, 'Prénom requis'),
    tel: z.string().min(1, 'Téléphone requis'),
    email: z.string().email('Email invalide').min(1, 'Email requis'),
    salaire: z.string().min(1, 'Salaire requis'),
});

type FormData = z.infer<typeof schema>;

interface Staff {
    id: number;
    titre: string;
    nom: string;
    prenom: string;
    tel: string;
    email: string;
    salaire: number;
}

const Administration: React.FC = () => {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await api.get('/staff');
            setStaffList(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching staff', err);
            setError('Erreur lors du chargement du personnel');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        try {
            if (editingId) {
                await api.put(`/staff/${editingId}`, data);
            } else {
                await api.post('/staff', data);
            }
            fetchStaff();
            handleClose();
            setError('');
        } catch (err) {
            console.error('Error saving staff', err);
            setError('Erreur lors de l\'enregistrement');
        }
    };

    const handleEdit = (staff: Staff) => {
        setEditingId(staff.id);
        reset({
            titre: staff.titre,
            nom: staff.nom,
            prenom: staff.prenom,
            tel: staff.tel,
            email: staff.email || '',
            salaire: staff.salaire ? staff.salaire.toString() : '',
        });
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce membre du personnel ?')) {
            try {
                await api.delete(`/staff/${id}`);
                fetchStaff();
                setError('');
            } catch (err) {
                console.error('Error deleting staff', err);
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
                    Ajouter un poste
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ maxHeight: 586 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Titre</TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell>Prénom</TableCell>
                            <TableCell>Téléphone</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Salaire</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {staffList.map((staff) => (
                            <TableRow key={staff.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#faecf1' } }}>
                                <TableCell>{staff.titre}</TableCell>
                                <TableCell>{staff.nom}</TableCell>
                                <TableCell>{staff.prenom}</TableCell>
                                <TableCell>{staff.tel}</TableCell>
                                <TableCell>{staff.email || '-'}</TableCell>
                                <TableCell>{staff.salaire ? `${staff.salaire} FCFA` : '-'}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(staff)} color="primary">
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(staff.id)} color="error">
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Modifier le poste' : 'Ajouter un poste'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Titre (ex: Comptable, Secrétaire)"
                            {...register('titre')}
                            error={!!errors.titre}
                            helperText={errors.titre?.message}
                            fullWidth
                        />
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
                            type="email"
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
                    <Button onClick={handleSubmit(onSubmit)} variant="contained" color="primary">
                        Enregistrer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Administration;
