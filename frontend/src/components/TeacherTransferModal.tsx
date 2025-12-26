import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, Typography, Button, Box, MenuItem, TextField,
    Checkbox, List, ListItem, ListItemText, ListItemIcon, ListItemButton,
    Paper, LinearProgress, Alert
} from '@mui/material';
import api from '../services/api';
import { useSchoolYear } from '../contexts/SchoolYearContext';

interface TeacherTransferModalProps {
    open: boolean;
    onClose: () => void;
}

const TeacherTransferModal: React.FC<TeacherTransferModalProps> = ({ open, onClose }) => {
    const { currentYear } = useSchoolYear();

    // Source State
    const [sourceTeachers, setSourceTeachers] = useState<any[]>([]);
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Destination State
    const [years, setYears] = useState<any[]>([]);
    const [destYearId, setDestYearId] = useState<string>('');
    const [destTeachers, setDestTeachers] = useState<any[]>([]);

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
            const response = await api.get('/teachers');
            setSourceTeachers(response.data);
        } catch (error) {
            console.error('Error fetching source teachers', error);
        }
    };

    const fetchYears = async () => {
        try {
            const res = await api.get('/school-years');
            setYears(res.data);
        } catch (e) { console.error(e); }
    };

    // Fetch Destination Teachers when Year Changes
    useEffect(() => {
        if (!destYearId) {
            setDestTeachers([]);
            return;
        }
        const fetchDestTeachers = async () => {
            try {
                const res = await api.get('/teachers', {
                    headers: { 'x-school-year-id': destYearId }
                });
                setDestTeachers(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchDestTeachers();
    }, [destYearId]);

    // Selection Logic
    const handleToggleTeacher = (id: number) => {
        setSelectedTeacherIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedTeacherIds([]);
        } else {
            setSelectedTeacherIds(sourceTeachers.map(t => t.id));
        }
        setSelectAll(!selectAll);
    };

    // Update selectAll checkbox when individual selections change
    useEffect(() => {
        if (sourceTeachers.length > 0 && selectedTeacherIds.length === sourceTeachers.length) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedTeacherIds, sourceTeachers]);

    // Transfer Action
    const handleTransfer = async () => {
        if (!destYearId || selectedTeacherIds.length === 0) return;

        setTransferring(true);
        setMessage(null);

        try {
            const payload = {
                teacherIds: selectedTeacherIds,
                destYearId: destYearId
            };

            const res = await api.post('/teachers/action/transfer', payload);

            setMessage({ type: 'success', text: `Transfert réussi ! ${res.data.count} enseignant(s) transféré(s).` });

            // Refresh Destination List
            const destRes = await api.get('/teachers', {
                headers: { 'x-school-year-id': destYearId }
            });

            setDestTeachers(destRes.data);
            setSelectedTeacherIds([]);
            setSelectAll(false);

        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur lors du transfert.' });
            console.error(error);
        } finally {
            setTransferring(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
            <DialogTitle>Transfert d'Enseignants</DialogTitle>
            <DialogContent dividers>
                {transferring && <LinearProgress sx={{ mb: 2 }} />}
                {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

                <Grid container spacing={3} sx={{ height: '600px' }}>

                    {/* LEFT: SOURCE */}
                    <Grid size={{ xs: 6 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Source (Année Courante)</Typography>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Sélectionner les enseignants</Typography>
                        </Box>

                        {/* Select All Checkbox */}
                        <Box sx={{ mb: 1 }}>
                            <ListItem disablePadding sx={{ borderBottom: '1px solid #ddd', bgcolor: '#f5f5f5' }}>
                                <ListItemButton onClick={handleSelectAll}>
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={selectAll}
                                            tabIndex={-1}
                                            disableRipple
                                        />
                                    </ListItemIcon>
                                    <ListItemText primary="Tous les enseignants" primaryTypographyProps={{ fontWeight: 'bold' }} />
                                </ListItemButton>
                            </ListItem>
                        </Box>

                        {/* Teacher List */}
                        <Paper sx={{ flexGrow: 1, overflow: 'auto', border: '1px solid #ddd' }}>
                            <List dense>
                                {sourceTeachers.map((teacher) => (
                                    <ListItem
                                        key={teacher.id}
                                        disablePadding
                                        sx={{ borderBottom: '1px solid #eee' }}
                                    >
                                        <ListItemButton onClick={() => handleToggleTeacher(teacher.id)}>
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={selectedTeacherIds.includes(teacher.id)}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={`${teacher.nom} ${teacher.prenom}`}
                                                secondary={teacher.email || teacher.tel}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                                {sourceTeachers.length === 0 && !loading && (
                                    <Typography sx={{ p: 2, color: 'text.secondary' }}>Aucun enseignant</Typography>
                                )}
                            </List>
                        </Paper>
                    </Grid>

                    {/* RIGHT: DESTINATION */}
                    <Grid size={{ xs: 6 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid #eee', pl: 3 }}>
                        <Typography variant="h6" gutterBottom>Destination</Typography>

                        <Box sx={{ mb: 2 }}>
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
                        </Box>

                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Enseignants dans l'année de destination :</Typography>

                        <Paper sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#f5f5f5', border: '1px solid #ddd' }}>
                            <List dense>
                                {destTeachers.map((teacher, idx) => (
                                    <ListItem key={teacher.id || idx} sx={{
                                        borderBottom: '1px solid #eee'
                                    }}>
                                        <ListItemText
                                            primary={`${teacher.nom} ${teacher.prenom}`}
                                            secondary={teacher.email || teacher.tel}
                                        />
                                    </ListItem>
                                ))}
                                {destTeachers.length === 0 && (
                                    <Typography sx={{ p: 2, color: 'text.secondary' }}>Aucun enseignant</Typography>
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
                    disabled={transferring || selectedTeacherIds.length === 0 || !destYearId}
                >
                    Valider le transfert {selectedTeacherIds.length > 0 && `(${selectedTeacherIds.length})`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TeacherTransferModal;
