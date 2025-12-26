import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Alert
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import api from '../services/api';

interface ExamRule {
    id?: number;
    category: string;
    min_average: number;
    max_average: number;
    min_absence: number;
    max_absence: number;
    status: string;
}

const CATEGORIES = ['Non redoublant(e)', 'Redoublant(e)'];
const STATUSES = ['Admis(e) en classe supérieure', 'Redouble la classe', 'Exclu(e)'];

const ConfigurationsTab: React.FC = () => {
    const [rules, setRules] = useState<ExamRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newRule, setNewRule] = useState<ExamRule>({
        category: 'Non redoublant(e)',
        min_average: 0,
        max_average: 20,
        min_absence: 0,
        max_absence: 1000,
        status: 'Exclu(e)'
    });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await api.get('/exam-rules');
            setRules(response.data);
        } catch (err) {
            console.error('Error fetching rules', err);
        }
    };

    const handleAddRule = async () => {
        setError('');
        setSuccess('');

        // Validation 1: Interval Logic
        if (newRule.min_average >= newRule.max_average) {
            setError('L\'intervalle de moyenne est invalide (Min < Max).');
            return;
        }
        if (newRule.min_absence >= newRule.max_absence) {
            setError('L\'intervalle d\'absence est invalide (Min < Max).');
            return;
        }

        // Validation 2: Values must be within bounds
        if (newRule.min_average < 0 || newRule.max_average > 20) {
            setError('Les moyennes doivent être entre 0 et 20.');
            return;
        }


        setLoading(true);
        try {
            await api.post('/exam-rules', newRule);
            setSuccess('Logique ajoutée avec succès.');
            fetchRules();
            // Reset form
            setNewRule({
                category: 'Non redoublant(e)',
                min_average: 0,
                max_average: 20,
                min_absence: 0,
                max_absence: 1000,
                status: 'Exclu(e)'
            });
        } catch (err: any) {
            console.error('Error adding rule', err);
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout de la logique.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRule = async (id: number) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cette logique ?')) return;
        try {
            await api.delete(`/exam-rules/${id}`);
            setSuccess('Logique supprimée avec succès.');
            fetchRules();
        } catch (err) {
            console.error('Error deleting rule', err);
            setError('Erreur lors de la suppression.');
        }
    };

    return (
        <Box>
            {/* Alerts */}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            {/* Input Form */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#fafafa' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: 'text.secondary' }}>
                            Catégorie
                        </Typography>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            value={newRule.category}
                            onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                        >
                            {CATEGORIES.map((cat) => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: 'text.secondary', textAlign: 'center' }}>
                            Moyenne de note
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                type="number"
                                size="small"
                                placeholder="0"
                                inputProps={{ min: 0, max: 20, step: 0.01 }}
                                value={newRule.min_average}
                                onChange={(e) => setNewRule({ ...newRule, min_average: parseFloat(e.target.value) || 0 })}
                                fullWidth
                            />
                            <TextField
                                type="number"
                                size="small"
                                placeholder="20"
                                inputProps={{ min: 0, max: 20, step: 0.01 }}
                                value={newRule.max_average}
                                onChange={(e) => setNewRule({ ...newRule, max_average: parseFloat(e.target.value) || 20 })}
                                fullWidth
                            />
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: 'text.secondary', textAlign: 'center' }}>
                            Absence non justifiée
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                type="number"
                                size="small"
                                placeholder="0"
                                inputProps={{ min: 0 }}
                                value={newRule.min_absence}
                                onChange={(e) => setNewRule({ ...newRule, min_absence: parseInt(e.target.value) || 0 })}
                                fullWidth
                            />
                            <TextField
                                type="number"
                                size="small"
                                placeholder="1000"
                                inputProps={{ min: 0 }}
                                value={newRule.max_absence}
                                onChange={(e) => setNewRule({ ...newRule, max_absence: parseInt(e.target.value) || 1000 })}
                                fullWidth
                            />
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: 'text.secondary' }}>
                            Status
                        </Typography>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            value={newRule.status}
                            onChange={(e) => setNewRule({ ...newRule, status: e.target.value })}
                        >
                            {STATUSES.map((status) => (
                                <MenuItem key={status} value={status}>{status}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </Box>

                {/* Valider Button */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        onClick={handleAddRule}
                        disabled={loading}
                        sx={{
                            bgcolor: '#d32f2f',
                            '&:hover': { bgcolor: '#b71c1c' },
                            textTransform: 'none',
                            fontWeight: 'bold',
                            px: 4
                        }}
                    >
                        Valider
                    </Button>
                </Box>
            </Paper>

            {/* Rules Table */}
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Catégorie</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Moyenne</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Absences</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rules.map((rule) => (
                            <TableRow
                                key={rule.id}
                                sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fbeeee' } }}
                            >
                                <TableCell>{rule.category}</TableCell>
                                <TableCell align="center">[{rule.min_average} - {rule.max_average}]</TableCell>
                                <TableCell align="center">[{rule.min_absence} - {rule.max_absence}]</TableCell>
                                <TableCell>{rule.status}</TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteRule(rule.id!)}
                                        sx={{ color: '#d32f2f' }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {rules.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    Aucune règle définie
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ConfigurationsTab;
