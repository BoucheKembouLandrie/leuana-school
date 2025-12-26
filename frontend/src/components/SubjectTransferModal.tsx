import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, Typography, Button, Box, MenuItem, TextField,
    Checkbox, List, ListItem, ListItemText, ListItemIcon, ListItemButton,
    Paper, LinearProgress, Alert
} from '@mui/material';
import api from '../services/api';
import { useSchoolYear } from '../contexts/SchoolYearContext';

interface SubjectTransferModalProps {
    open: boolean;
    onClose: () => void;
}

const SubjectTransferModal: React.FC<SubjectTransferModalProps> = ({ open, onClose }) => {
    const { currentYear } = useSchoolYear();

    // Source State
    const [sourceSubjects, setSourceSubjects] = useState<any[]>([]);
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Destination State
    const [years, setYears] = useState<any[]>([]);
    const [destYearId, setDestYearId] = useState<string>('');
    const [destSubjects, setDestSubjects] = useState<any[]>([]);

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
            const response = await api.get('/subjects');
            setSourceSubjects(response.data);
        } catch (error) {
            console.error('Error fetching source subjects', error);
        }
    };

    const fetchYears = async () => {
        try {
            const res = await api.get('/school-years');
            setYears(res.data);
        } catch (e) { console.error(e); }
    };

    // Fetch Destination Subjects when Year Changes
    useEffect(() => {
        if (!destYearId) {
            setDestSubjects([]);
            return;
        }
        const fetchDestSubjects = async () => {
            try {
                const res = await api.get('/subjects', {
                    headers: { 'x-school-year-id': destYearId }
                });
                setDestSubjects(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchDestSubjects();
    }, [destYearId]);

    // Selection Logic
    const handleToggleSubject = (id: number) => {
        setSelectedSubjectIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedSubjectIds([]);
        } else {
            setSelectedSubjectIds(sourceSubjects.map(s => s.id));
        }
        setSelectAll(!selectAll);
    };

    // Update selectAll checkbox when individual selections change
    useEffect(() => {
        if (sourceSubjects.length > 0 && selectedSubjectIds.length === sourceSubjects.length) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedSubjectIds, sourceSubjects]);

    // Transfer Action
    const handleTransfer = async () => {
        if (!destYearId || selectedSubjectIds.length === 0) return;

        setTransferring(true);
        setMessage(null);

        try {
            const payload = {
                subjectIds: selectedSubjectIds,
                destYearId: destYearId
            };

            const res = await api.post('/subjects/action/transfer', payload);

            let msg = `Transfert réussi ! ${res.data.count} matière(s) transférée(s).`;
            if (res.data.classesCreated > 0) {
                msg += ` ${res.data.classesCreated} classe(s) créée(s) automatiquement.`;
            }
            setMessage({ type: 'success', text: msg });

            // Refresh Destination List
            const destRes = await api.get('/subjects', {
                headers: { 'x-school-year-id': destYearId }
            });

            setDestSubjects(destRes.data);
            setSelectedSubjectIds([]);
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
            <DialogTitle>Transfert de Matières</DialogTitle>
            <DialogContent dividers>
                {transferring && <LinearProgress sx={{ mb: 2 }} />}
                {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

                <Grid container spacing={3} sx={{ height: '600px' }}>

                    {/* LEFT: SOURCE */}
                    <Grid size={{ xs: 6 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Source (Année Courante)</Typography>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Sélectionner les matières</Typography>
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
                                    <ListItemText primary="Toutes les matières" primaryTypographyProps={{ fontWeight: 'bold' }} />
                                </ListItemButton>
                            </ListItem>
                        </Box>

                        {/* Subject List */}
                        <Paper sx={{ flexGrow: 1, overflow: 'auto', border: '1px solid #ddd' }}>
                            <List dense>
                                {sourceSubjects.map((subject) => (
                                    <ListItem
                                        key={subject.id}
                                        disablePadding
                                        sx={{ borderBottom: '1px solid #eee' }}
                                    >
                                        <ListItemButton onClick={() => handleToggleSubject(subject.id)}>
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={selectedSubjectIds.includes(subject.id)}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={subject.nom}
                                                secondary={`Coefficient: ${subject.coefficient} - Classe: ${subject.class?.libelle || 'Non assignée'}`}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                                {sourceSubjects.length === 0 && !loading && (
                                    <Typography sx={{ p: 2, color: 'text.secondary' }}>Aucune matière</Typography>
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

                        <Alert severity="info" sx={{ mb: 2 }}>
                            Note: Les matières transférées devront être réassignées à des enseignants et classes dans la nouvelle année.
                        </Alert>

                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Matières dans l'année de destination :</Typography>

                        <Paper sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#f5f5f5', border: '1px solid #ddd' }}>
                            <List dense>
                                {destSubjects.map((subject, idx) => (
                                    <ListItem key={subject.id || idx} sx={{
                                        borderBottom: '1px solid #eee'
                                    }}>
                                        <ListItemText
                                            primary={subject.nom}
                                            secondary={`Coefficient: ${subject.coefficient}`}
                                        />
                                    </ListItem>
                                ))}
                                {destSubjects.length === 0 && (
                                    <Typography sx={{ p: 2, color: 'text.secondary' }}>Aucune matière</Typography>
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
                    disabled={transferring || selectedSubjectIds.length === 0 || !destYearId}
                >
                    Valider le transfert {selectedSubjectIds.length > 0 && `(${selectedSubjectIds.length})`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SubjectTransferModal;
