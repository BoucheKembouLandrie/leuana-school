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
    Autocomplete,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';

const schema = z.object({
    date: z.string().min(1, 'Date requise'),
    classe_id: z.string().min(1, 'Classe requise'),
    eleve_id: z.string().min(1, 'Élève requis'),
    motif: z.string().min(1, 'Motif requis'),
    time: z.string().min(1, 'Heure requise'),
});

type FormData = z.infer<typeof schema>;

interface Attendance {
    id: number;
    eleve_id: number;
    date: string;
    statut: string;
    motif: string;
    time: string;
    student?: { nom: string; prenom: string };
}

interface Student {
    id: number;
    nom: string;
    prenom: string;
    classe_id: number;
}

interface Class {
    id: number;
    libelle: string;
}

const Attendance: React.FC = () => {
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [filterDate, setFilterDate] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterStudent, setFilterStudent] = useState('');
    const [filterStudentsList, setFilterStudentsList] = useState<Student[]>([]);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const selectedClassId = watch('classe_id');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            const filtered = students.filter(s => s.classe_id === parseInt(selectedClassId));
            setFilteredStudents(filtered);
        } else {
            setFilteredStudents([]);
        }
    }, [selectedClassId, students]);

    useEffect(() => {
        if (filterClass) {
            const filtered = students.filter(s => s.classe_id === parseInt(filterClass));
            setFilterStudentsList(filtered);
        } else {
            setFilterStudentsList([]);
        }
    }, [filterClass, students]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [attendancesRes, studentsRes, classesRes] = await Promise.all([
                api.get('/attendance'),
                api.get('/students'),
                api.get('/classes'),
            ]);
            setAttendances(attendancesRes.data);
            setStudents(studentsRes.data);
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
            const payload = {
                ...data,
                statut: 'retard',
            };

            if (editingId) {
                await api.put(`/attendance/${editingId}`, payload);
            } else {
                await api.post('/attendance', payload);
            }
            fetchData();
            handleClose();
            setError('');
        } catch (err) {
            console.error('Error saving attendance', err);
            setError('Erreur lors de l\'enregistrement');
        }
    };

    const handleEdit = (attendance: Attendance) => {
        setEditingId(attendance.id);
        const student = students.find(s => s.id === attendance.eleve_id);
        if (student) {
            setValue('classe_id', student.classe_id.toString());
        }
        reset({
            eleve_id: attendance.eleve_id.toString(),
            classe_id: student?.classe_id.toString() || '',
            date: attendance.date.split('T')[0],
            motif: attendance.motif || 'absence justifiée',
            time: attendance.time || '',
        });
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement ?')) {
            try {
                await api.delete(`/attendance/${id}`);
                fetchData();
                setError('');
            } catch (err) {
                console.error('Error deleting attendance', err);
                setError('Erreur lors de la suppression');
            }
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditingId(null);
        reset();
    };

    // Filter attendances based on selected filters
    const filteredAttendances = attendances.filter(attendance => {
        if (filterDate && attendance.date.split('T')[0] !== filterDate) return false;
        if (filterClass) {
            const student = students.find(s => s.id === attendance.eleve_id);
            if (!student || student.classe_id !== parseInt(filterClass)) return false;
        }
        if (filterStudent && attendance.eleve_id !== parseInt(filterStudent)) return false;
        return true;
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
                    sx={{ backgroundColor: '#1e88e5', '&:hover': { backgroundColor: '#1565c0' } }}
                >
                    Ajouter une présence
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Filter Bar */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            label="Date"
                            type="date"
                            fullWidth
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            label="Classe"
                            fullWidth
                            value={filterClass}
                            onChange={(e) => {
                                setFilterClass(e.target.value);
                                setFilterStudent('');
                            }}
                            SelectProps={{ displayEmpty: true }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <MenuItem value="">Toutes les classes</MenuItem>
                            {classes.map((cls) => (
                                <MenuItem key={cls.id} value={cls.id.toString()}>{cls.libelle}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Autocomplete
                            options={filterStudentsList}
                            getOptionLabel={(option) => `${option.nom} ${option.prenom}`}
                            value={filterStudentsList.find(s => s.id.toString() === filterStudent) || null}
                            onChange={(_, newValue) => setFilterStudent(newValue ? newValue.id.toString() : '')}
                            disabled={!filterClass}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Élève"
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                            noOptionsText="Aucun élève trouvé"
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => {
                                setFilterDate('');
                                setFilterClass('');
                                setFilterStudent('');
                            }}
                            sx={{ height: '56px' }}
                        >
                            Réinitialiser
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Motif</TableCell>
                            <TableCell>Periode</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAttendances.map((attendance) => (
                            <TableRow key={attendance.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#ecf5fd' } }}>
                                <TableCell>
                                    {attendance.student ? `${attendance.student.nom} ${attendance.student.prenom}` : 'N/A'}
                                </TableCell>
                                <TableCell>{new Date(attendance.date).toLocaleDateString('fr-FR')}</TableCell>
                                <TableCell>{attendance.motif}</TableCell>
                                <TableCell>{attendance.time}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(attendance)} color="primary">
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(attendance.id)} color="error">
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Modifier la présence' : 'Ajouter une présence'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Date"
                            type="date"
                            {...register('date')}
                            error={!!errors.date}
                            helperText={errors.date?.message}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            defaultValue={new Date().toISOString().split('T')[0]}
                        />
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
                            {classes.map((cls) => (
                                <MenuItem key={cls.id} value={cls.id.toString()}>
                                    {cls.libelle}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Autocomplete
                            options={filteredStudents}
                            getOptionLabel={(option) => `${option.nom} ${option.prenom}`}
                            value={filteredStudents.find(s => s.id.toString() === watch('eleve_id')) || null}
                            onChange={(_, newValue) => setValue('eleve_id', newValue ? newValue.id.toString() : '')}
                            disabled={!selectedClassId}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Élève"
                                    error={!!errors.eleve_id}
                                    helperText={errors.eleve_id?.message}
                                />
                            )}
                            noOptionsText="Aucun élève trouvé"
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                        />
                        <TextField
                            select
                            label="Motif"
                            {...register('motif')}
                            error={!!errors.motif}
                            helperText={errors.motif?.message}
                            fullWidth
                            defaultValue="absence justifiée"
                        >
                            <MenuItem value="absence justifiée">absence justifiée</MenuItem>
                            <MenuItem value="absence non justifiée">absence non justifiée</MenuItem>
                        </TextField>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                select
                                label="Heure"
                                {...register('time')}
                                error={!!errors.time}
                                helperText={errors.time?.message}
                                sx={{ flex: 1 }}
                                value={watch('time')?.split(':')[0] || ''}
                                onChange={(e) => {
                                    const hour = e.target.value;
                                    const minute = watch('time')?.split(':')[1] || '00';
                                    setValue('time', `${hour}:${minute}`);
                                }}
                            >
                                {Array.from({ length: 24 }, (_, i) => (
                                    <MenuItem key={i} value={i.toString().padStart(2, '0')}>
                                        {i.toString().padStart(2, '0')}h
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                label="Minutes"
                                sx={{ flex: 1 }}
                                value={watch('time')?.split(':')[1] || ''}
                                onChange={(e) => {
                                    const hour = watch('time')?.split(':')[0] || '00';
                                    const minute = e.target.value;
                                    setValue('time', `${hour}:${minute}`);
                                }}
                            >
                                {Array.from({ length: 60 }, (_, i) => (
                                    <MenuItem key={i} value={i.toString().padStart(2, '0')}>
                                        {i.toString().padStart(2, '0')}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Annuler</Button>
                    <Button onClick={handleSubmit(onSubmit)} variant="contained">
                        {editingId ? 'Modifier' : 'Enregistrer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
};

export default Attendance;
