
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, Typography, Button, Box, MenuItem, TextField,
    Checkbox, List, ListItem, ListItemText, ListItemIcon, ListItemButton,
    Paper, LinearProgress, Alert
} from '@mui/material';
import api from '../services/api';
import { useSchoolYear } from '../contexts/SchoolYearContext';

interface StudentTransferModalProps {
    open: boolean;
    onClose: () => void;
}

const StudentTransferModal: React.FC<StudentTransferModalProps> = ({ open, onClose }) => {
    const { currentYear } = useSchoolYear();

    // Source State
    const [sourceClasses, setSourceClasses] = useState<any[]>([]);
    const [sourceClassId, setSourceClassId] = useState<string>('');
    const [sourceStudents, setSourceStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

    // Destination State
    const [years, setYears] = useState<any[]>([]);
    const [destYearId, setDestYearId] = useState<string>('');
    const [destClasses, setDestClasses] = useState<any[]>([]);
    const [destClassId, setDestClassId] = useState<string>('');
    const [destStudents, setDestStudents] = useState<any[]>([]);

    // UI/Loading State
    const [loading, setLoading] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initial Data Load
    useEffect(() => {
        if (open) {
            fetchInitialData();
            fetchYears();
        }
    }, [open, currentYear]);

    const fetchInitialData = async () => {
        try {
            const response = await api.get('/classes');
            setSourceClasses(response.data);
        } catch (error) {
            console.error('Error fetching source classes', error);
        }
    };

    const fetchYears = async () => {
        try {
            const res = await api.get('/school-years');
            setYears(res.data);
        } catch (e) { console.error(e); }
    };

    // Fetch Source Students when Class Changes
    useEffect(() => {
        if (!sourceClassId) return;
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const res = await api.get('/students/data/with-average', {
                    params: { classe_id: sourceClassId }
                });
                setSourceStudents(res.data);
                setSelectedStudentIds([]);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [sourceClassId]);

    // Fetch Destination Classes when Year Changes
    useEffect(() => {
        if (!destYearId) {
            setDestClasses([]);
            return;
        }
        const fetchDestClasses = async () => {
            try {
                const res = await api.get('/classes', {
                    headers: { 'x-school-year-id': destYearId }
                });
                setDestClasses(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchDestClasses();
    }, [destYearId]);

    // Fetch Destination Students when Class Changes
    useEffect(() => {
        if (!destClassId || !destYearId) {
            setDestStudents([]);
            return;
        }
        const fetchDestList = async () => {
            try {
                const res = await api.get('/students', {
                    headers: { 'x-school-year-id': destYearId },
                    params: { classe_id: destClassId }
                });
                setDestStudents(res.data.map((s: any) => ({ ...s, isNew: false })));
            } catch (error) {
                console.error(error);
            }
        };
        fetchDestList();
    }, [destClassId, destYearId]);


    // Selection Logic
    const handleToggleStudent = (id: number) => {
        setSelectedStudentIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectPassed = () => {
        const passedIds = sourceStudents
            .filter(s => s.moyenne !== 'N/A' && parseFloat(s.moyenne) >= 10)
            .map(s => s.id);
        setSelectedStudentIds(passedIds);
    };

    const handleSelectFailed = () => {
        const failedIds = sourceStudents
            .filter(s => s.moyenne !== 'N/A' && parseFloat(s.moyenne) < 10)
            .map(s => s.id);
        setSelectedStudentIds(failedIds);
    };


    // Transfer Action
    const handleTransfer = async () => {
        if (!destClassId || !destYearId || selectedStudentIds.length === 0) return;

        setTransferring(true);
        setMessage(null);

        try {
            const payload = {
                studentIds: selectedStudentIds,
                destClassId: destClassId,
                destYearId: destYearId
            };

            const res = await api.post('/students/action/transfer', payload);

            setMessage({ type: 'success', text: `Transfert réussi ! ${res.data.count} élèves transférés.` });

            const destRes = await api.get('/students', {
                headers: { 'x-school-year-id': destYearId },
                params: { classe_id: destClassId }
            });

            const sourceNames = sourceStudents.filter(s => selectedStudentIds.includes(s.id)).map(s => `${s.nom} ${s.prenom}`);

            const updatedDestList = destRes.data.map((s: any) => ({
                ...s,
                isNew: sourceNames.includes(`${s.nom} ${s.prenom}`)
            }));

            setDestStudents(updatedDestList);
            setSelectedStudentIds([]);

        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur lors du transfert.' });
            console.error(error);
        } finally {
            setTransferring(false);
        }
    };


    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
            <DialogTitle>Transfert d'Élèves</DialogTitle>
            <DialogContent dividers>
                {transferring && <LinearProgress sx={{ mb: 2 }} />}
                {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

                <Grid container spacing={3} sx={{ height: '600px' }}>

                    {/* LEFT: SOURCE */}
                    <Grid size={{ xs: 6 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Source (Année Courante)</Typography>

                        <Box sx={{ mb: 2 }}>
                            <TextField
                                select
                                label="Sélectionner la classe"
                                fullWidth
                                value={sourceClassId}
                                onChange={(e) => setSourceClassId(e.target.value)}
                            >
                                {sourceClasses.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>{c.libelle}</MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        {/* Bulk Selection Helpers */}
                        <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
                            <Button variant="outlined" size="small"
                                sx={{ color: 'green', borderColor: 'green' }}
                                onClick={handleSelectPassed}
                            >
                                Sélectionner Admis (≥10)
                            </Button>
                            <Button variant="outlined" size="small"
                                sx={{ color: 'red', borderColor: 'red' }}
                                onClick={handleSelectFailed}
                            >
                                Sélectionner Échoués (&lt;10)
                            </Button>
                        </Box>

                        {/* Student List */}
                        <Paper sx={{ flexGrow: 1, overflow: 'auto', border: '1px solid #ddd' }}>
                            <List dense>
                                {sourceStudents.map((student) => {
                                    const avg = parseFloat(student.moyenne);
                                    const isPassed = !isNaN(avg) && avg >= 10;
                                    const isFailed = !isNaN(avg) && avg < 10;
                                    const bgColor = isPassed ? '#e8f5e9' : (isFailed ? '#ffebee' : 'transparent');

                                    return (
                                        <ListItem
                                            key={student.id}
                                            disablePadding
                                            sx={{ backgroundColor: bgColor, borderBottom: '1px solid #eee' }}
                                        >
                                            <ListItemButton onClick={() => handleToggleStudent(student.id)}>
                                                <ListItemIcon>
                                                    <Checkbox
                                                        edge="start"
                                                        checked={selectedStudentIds.includes(student.id)}
                                                        tabIndex={-1}
                                                        disableRipple
                                                    />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={`${student.nom} ${student.prenom}`}
                                                    secondary={
                                                        student.moyenne !== 'N/A' ? (
                                                            <span style={{ fontStyle: 'italic', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                                Moyenne: {student.moyenne}/20
                                                            </span>
                                                        ) : 'Pas de moyenne'
                                                    }
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                                {sourceStudents.length === 0 && !loading && (
                                    <Typography sx={{ p: 2, color: 'text.secondary' }}>Aucun élève</Typography>
                                )}
                            </List>
                        </Paper>
                    </Grid>

                    {/* RIGHT: DESTINATION */}
                    <Grid size={{ xs: 6 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid #eee', pl: 3 }}>
                        <Typography variant="h6" gutterBottom>Destination</Typography>

                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                select
                                label="Année Scolaire"
                                fullWidth
                                value={destYearId}
                                onChange={(e) => setDestYearId(e.target.value)}
                            >
                                {years.map((y) => (
                                    <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                label="Classe"
                                fullWidth
                                value={destClassId}
                                onChange={(e) => setDestClassId(e.target.value)}
                                disabled={!destYearId}
                            >
                                {destClasses.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>{c.libelle}</MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Élèves dans la classe de destination :</Typography>

                        <Paper sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#f5f5f5' }}>
                            <List dense>
                                {destStudents.map((student, idx) => (
                                    <ListItem key={student.id || idx} sx={{
                                        bgcolor: student.isNew ? '#fff9c4' : 'transparent',
                                        borderBottom: '1px solid #eee'
                                    }}>
                                        <ListItemText
                                            primary={`${student.nom} ${student.prenom}`}
                                            secondary={student.matricule}
                                        />
                                    </ListItem>
                                ))}
                                {destStudents.length === 0 && (
                                    <Typography sx={{ p: 2, color: 'text.secondary' }}>Classe vide</Typography>
                                )}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button
                    variant="contained"
                    onClick={handleTransfer}
                    disabled={transferring || selectedStudentIds.length === 0 || !destClassId}
                >
                    Valider le transfert {selectedStudentIds.length > 0 && `(${selectedStudentIds.length})`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StudentTransferModal;
