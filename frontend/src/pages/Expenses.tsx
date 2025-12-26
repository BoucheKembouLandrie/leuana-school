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
    Tabs,
    Tab,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
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
    titre: z.string().optional(),
    montant: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Le montant doit être positif',
    }),
    date_depense: z.string().min(1, 'Date requise'),
    description: z.string().optional(),
    category: z.enum(['generale', 'salaire']).optional(),
    teacher_id: z.string().optional(),
    staff_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Expense {
    id: number;
    titre: string;
    montant: number;
    date_depense: string;
    description?: string;
    category: 'generale' | 'salaire';
    status: 'payé' | 'en_attente';
    teacher_id?: number;
    staff_id?: number;
    teacher?: { nom: string; prenom: string };
    staffMember?: { nom: string; prenom: string; titre: string };
}

interface Teacher {
    id: number;
    nom: string;
    prenom: string;
    salaire?: number;
}

interface Staff {
    id: number;
    nom: string;
    prenom: string;
    titre: string;
    salaire?: number;
}

const Expenses: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    // Salary related state
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [mode, setMode] = useState<'expense' | 'salary'>('expense');
    const [salaryType, setSalaryType] = useState<'teacher' | 'staff'>('teacher');
    const [selectedPersonId, setSelectedPersonId] = useState<string>('');

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        setError(''); // Clear any error messages when switching tabs
    };

    const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            date_depense: new Date().toISOString().split('T')[0],
            category: 'generale',
        }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expensesRes, teachersRes, staffRes] = await Promise.all([
                api.get('/expenses'),
                api.get('/teachers'),
                api.get('/staff')
            ]);
            setExpenses(expensesRes.data);
            setTeachers(teachersRes.data);
            setStaffList(staffRes.data);
            setError('');
        } catch (err) {
            console.error('Error fetching data', err);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handlePersonChange = (id: string, type: 'teacher' | 'staff') => {
        setSelectedPersonId(id);
        let person: Teacher | Staff | undefined;
        if (type === 'teacher') {
            person = teachers.find(t => t.id.toString() === id);
        } else {
            person = staffList.find(s => s.id.toString() === id);
        }

        if (person && person.salaire) {
            setValue('montant', person.salaire.toString());
        } else {
            setValue('montant', '');
        }
    };

    const onSubmit = async (data: FormData) => {
        try {
            let payload: any = { ...data };

            if (mode === 'salary') {
                // Validate that a person is selected
                if (!selectedPersonId) {
                    setError('Veuillez sélectionner une personne');
                    return;
                }

                // Check if this person already has a salary for this month
                const selectedDate = new Date(data.date_depense);
                const selectedMonth = selectedDate.getMonth();
                const selectedYear = selectedDate.getFullYear();

                const existingSalary = expenses.find(exp => {
                    if (exp.category !== 'salaire') return false;
                    if (editingId && exp.id === editingId) return false; // Skip current record when editing

                    const expDate = new Date(exp.date_depense);
                    const expMonth = expDate.getMonth();
                    const expYear = expDate.getFullYear();

                    // Check if same month/year and same person
                    if (expMonth === selectedMonth && expYear === selectedYear) {
                        if (salaryType === 'teacher' && exp.teacher_id?.toString() === selectedPersonId) {
                            return true;
                        }
                        if (salaryType === 'staff' && exp.staff_id?.toString() === selectedPersonId) {
                            return true;
                        }
                    }
                    return false;
                });

                if (existingSalary) {
                    const monthName = selectedDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
                    setError(`Cette personne a déjà un salaire enregistré pour ${monthName}`);
                    return;
                }

                payload.category = 'salaire';
                payload.status = 'payé'; // Default status as per request
                let personName = '';

                if (salaryType === 'teacher') {
                    payload.teacher_id = selectedPersonId;
                    const t = teachers.find(tea => tea.id.toString() === selectedPersonId);
                    if (t) personName = `${t.nom} ${t.prenom}`;
                } else {
                    payload.staff_id = selectedPersonId;
                    const s = staffList.find(st => st.id.toString() === selectedPersonId);
                    if (s) personName = `${s.nom} ${s.prenom}`;
                }

                // Auto-generate title for salary
                const date = new Date(data.date_depense);
                const month = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
                payload.titre = `Salaire ${month} - ${personName}`;
            } else {
                // Validate titre for expense mode
                if (!data.titre || data.titre.trim() === '') {
                    setError('Le titre est requis');
                    return;
                }
                payload.category = 'generale';
            }

            if (editingId) {
                await api.put(`/expenses/${editingId}`, payload);
            } else {
                await api.post('/expenses', payload);
            }
            fetchData();
            handleClose();
            setError('');
        } catch (err) {
            console.error('Error saving expense', err);
            setError('Erreur lors de l\'enregistrement');
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingId(expense.id);
        if (expense.category === 'salaire') {
            setMode('salary');
            if (expense.teacher_id) {
                setSalaryType('teacher');
                setSelectedPersonId(expense.teacher_id.toString());
            } else if (expense.staff_id) {
                setSalaryType('staff');
                setSelectedPersonId(expense.staff_id.toString());
            }
        } else {
            setMode('expense');
        }

        reset({
            titre: expense.titre,
            montant: expense.montant.toString(),
            date_depense: expense.date_depense,
            description: expense.description || '',
            category: expense.category,
        });
        setOpen(true);
    };

    const handleOpenExpense = () => {
        setMode('expense');
        setOpen(true);
    };

    const handleOpenSalary = () => {
        setMode('salary');
        setSalaryType('teacher'); // Default
        setSelectedPersonId('');
        setValue('montant', '');
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette charge ?')) {
            try {
                await api.delete(`/expenses/${id}`);
                fetchData();
                setError('');
            } catch (err) {
                console.error('Error deleting expense', err);
                setError('Erreur lors de la suppression');
            }
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditingId(null);
        setMode('expense');
        setSelectedPersonId('');
        reset({
            date_depense: new Date().toISOString().split('T')[0],
            category: 'generale',
            titre: '',
            montant: '',
            description: '',
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    const generalExpenses = expenses.filter(expense =>
        expense.category !== 'salaire' &&
        (!startDate || expense.date_depense >= startDate) &&
        (!endDate || expense.date_depense <= endDate) &&
        (expense.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const salaryExpenses = expenses.filter(expense =>
        expense.category === 'salaire' &&
        (!startDate || expense.date_depense >= startDate) &&
        (!endDate || expense.date_depense <= endDate) &&
        (expense.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#795548',
                        },
                    }}
                >
                    <Tab
                        label="Charges Diverses"
                        sx={{
                            '&.Mui-selected': { color: '#795548' },
                            color: 'text.secondary'
                        }}
                    />
                    <Tab
                        label="Salaires"
                        sx={{
                            '&.Mui-selected': { color: '#795548' },
                            color: 'text.secondary'
                        }}
                    />
                </Tabs>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <DatePicker
                        label="Date début"
                        value={startDate ? dayjs(startDate) : null}
                        onChange={(newValue) => setStartDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
                        slotProps={{ textField: { sx: { flex: 1 }, InputLabelProps: { shrink: true } } }}
                    />
                    <DatePicker
                        label="Date fin"
                        value={endDate ? dayjs(endDate) : null}
                        onChange={(newValue) => setEndDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
                        slotProps={{ textField: { sx: { flex: 1 }, InputLabelProps: { shrink: true } } }}
                    />
                    <TextField
                        label="Recherche"
                        placeholder="Mot-clé..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flex: 1 }}
                    />
                </Paper>
            </Box>

            <div role="tabpanel" hidden={activeTab !== 0}>
                {activeTab === 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={handleOpenExpense}
                                sx={{ backgroundColor: '#795548', '&:hover': { backgroundColor: '#5d4037' }, minWidth: '180px', height: '40px' }}
                            >
                                Nouvelle charge
                            </Button>
                        </Box>

                        {error && activeTab === 0 && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <TableContainer component={Paper} sx={{ maxHeight: 586 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Titre</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Montant (FCFA)</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {generalExpenses.map((expense) => (
                                        <TableRow key={expense.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f4f1f0' } }}>
                                            <TableCell>{formatDate(expense.date_depense)}</TableCell>
                                            <TableCell>{expense.titre}</TableCell>
                                            <TableCell>{expense.description || '-'}</TableCell>
                                            <TableCell>{expense.montant.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <IconButton onClick={() => handleEdit(expense)} color="primary">
                                                    <Edit />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(expense.id)} color="error">
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {generalExpenses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">Aucune charge trouvée</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </div>

            <div role="tabpanel" hidden={activeTab !== 1}>
                {activeTab === 1 && (
                    <Box>


                        {error && activeTab === 1 && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <TableContainer component={Paper} sx={{ maxHeight: 586 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Nom</TableCell>
                                        <TableCell>Montant (FCFA)</TableCell>
                                        <TableCell>Statut</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {salaryExpenses.map((expense) => {
                                        const teacherName = expense.teacher ? `${expense.teacher.nom} ${expense.teacher.prenom}` : '';
                                        const staffName = expense.staffMember ? `${expense.staffMember.nom} ${expense.staffMember.prenom}` : '';
                                        const name = teacherName || staffName || expense.titre;

                                        return (
                                            <TableRow key={expense.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f4f1f0' } }}>
                                                <TableCell>{formatDate(expense.date_depense)}</TableCell>
                                                <TableCell>{name}</TableCell>
                                                <TableCell>{expense.montant.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label="Paiement reçu"
                                                        color="success"
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => handleDelete(expense.id)} color="error">
                                                        <Delete />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {salaryExpenses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">Aucun salaire enregistré</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </div>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {mode === 'expense'
                        ? (editingId ? 'Modifier la charge' : 'Ajouter une charge')
                        : (editingId ? 'Modifier le salaire' : 'Nouveau salaire')
                    }
                </DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

                        {mode === 'expense' ? (
                            <>
                                <TextField
                                    label="Titre (ex: Achat craie)"
                                    {...register('titre')}
                                    error={!!errors.titre}
                                    helperText={errors.titre?.message}
                                    fullWidth
                                />
                                <TextField
                                    label="Montant (FCFA)"
                                    {...register('montant')}
                                    error={!!errors.montant}
                                    helperText={errors.montant?.message}
                                    fullWidth
                                    type="number"
                                />
                                <TextField
                                    label="Description"
                                    {...register('description')}
                                    error={!!errors.description}
                                    helperText={errors.description?.message}
                                    fullWidth
                                    multiline
                                    rows={3}
                                />
                            </>
                        ) : (
                            <>
                                <FormControl fullWidth>
                                    <InputLabel>Type de personnel</InputLabel>
                                    <Select
                                        value={salaryType}
                                        label="Type de personnel"
                                        onChange={(e) => {
                                            setSalaryType(e.target.value as 'teacher' | 'staff');
                                            setSelectedPersonId('');
                                            setValue('montant', '');
                                        }}
                                        disabled={!!editingId} // Cannot change type during edit to simplify logic
                                    >
                                        <MenuItem value="teacher">Enseignant</MenuItem>
                                        <MenuItem value="staff">Administration</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Nom</InputLabel>
                                    <Select
                                        value={selectedPersonId}
                                        label="Nom"
                                        onChange={(e) => handlePersonChange(e.target.value, salaryType)}
                                        disabled={!!editingId}
                                    >
                                        {salaryType === 'teacher' ? (
                                            teachers.map((t) => (
                                                <MenuItem key={t.id} value={t.id.toString()}>
                                                    {t.nom} {t.prenom}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            staffList.map((s) => (
                                                <MenuItem key={s.id} value={s.id.toString()}>
                                                    {s.nom} {s.prenom} ({s.titre})
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Montant (FCFA)"
                                    {...register('montant')}
                                    error={!!errors.montant}
                                    helperText={errors.montant?.message}
                                    fullWidth
                                    type="number"
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{ readOnly: true }}
                                />
                            </>
                        )}

                        <Controller
                            control={control}
                            name="date_depense"
                            render={({ field }) => (
                                <DatePicker
                                    label="Date"
                                    value={field.value ? dayjs(field.value) : null}
                                    onChange={(newValue) => field.onChange(newValue ? newValue.format('YYYY-MM-DD') : '')}
                                    disabled={mode === 'salary'}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            InputLabelProps: { shrink: true },
                                            error: !!errors.date_depense,
                                            helperText: errors.date_depense?.message
                                        }
                                    }}
                                />
                            )}
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

export default Expenses;
