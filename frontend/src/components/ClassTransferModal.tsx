import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, Typography, Button, Box, MenuItem, TextField,
    Checkbox, List, ListItem, ListItemText, ListItemIcon, ListItemButton,
    Paper, LinearProgress, Alert
} from '@mui/material';
import api from '../services/api';
import { useSchoolYear } from '../contexts/SchoolYearContext';

interface ClassTransferModalProps {
    open: boolean;
    onClose: () => void;
}

const ClassTransferModal: React.FC<ClassTransferModalProps> = ({ open, onClose }) => {
    const { currentYear } = useSchoolYear();

    // Source State
    const [sourceClasses, setSourceClasses] = useState<any[]>([]);
    const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Destination State
    const [years, setYears] = useState<any[]>([]);
    const [destYearId, setDestYearId] = useState<string>('');
    const [destClasses, setDestClasses] = useState<any[]>([]);

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

    // Selection Logic
    const handleToggleClass = (id: number) => {
        setSelectedClassIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedClassIds([]);
        } else {
            setSelectedClassIds(sourceClasses.map(c => c.id));
        }
        setSelectAll(!selectAll);
    };

    // Update selectAll checkbox when individual selections change
    useEffect(() => {
        if (sourceClasses.length > 0 && selectedClassIds.length === sourceClasses.length) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedClassIds, sourceClasses]);

    // Transfer Action
    const handleTransfer = async () => {
        if (!destYearId || selectedClassIds.length === 0) return;

        setTransferring(true);
        setMessage(null);

        try {
            const payload = {
                classIds: selectedClassIds,
                destYearId: destYearId
            };

            const res = await api.post('/classes/action/transfer', payload);

            setMessage({ type: 'success', text: `Transfert réussi ! ${res.data.count} classe(s) transférée(s).` });

            // Refresh Destination List
            const destRes = await api.get('/classes', {
                headers: { 'x-school-year-id': destYearId }
            });

            setDestClasses(destRes.data);
            setSelectedClassIds([]);
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
            <DialogTitle>Transfert de Classes</DialogTitle>
            <DialogContent dividers>
                {transferring && <LinearProgress sx={{ mb: 2 }} />}
                {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

                <Grid container spacing={3} sx={{ height: '600px' }}>

                    {/* LEFT: SOURCE */}
                    <Grid size={{ xs: 6 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Source (Année Courante)</Typography>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Sélectionner la classe</Typography>
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
                                    <ListItemText primary="Toutes les classes" primaryTypographyProps={{ fontWeight: 'bold' }} />
                                </ListItemButton>
                            </ListItem>
                        </Box>

                        {/* Class List */}
                        <Paper sx={{ flexGrow: 1, overflow: 'auto', border: '1px solid #ddd' }}>
                            <List dense>
                                {sourceClasses.map((classe) => (
                                    <ListItem
                                        key={classe.id}
                                        disablePadding
                                        sx={{ borderBottom: '1px solid #eee' }}
                                    >
                                        <ListItemButton onClick={() => handleToggleClass(classe.id)}>
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={selectedClassIds.includes(classe.id)}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <ListItemText primary={classe.libelle} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                                {sourceClasses.length === 0 && !loading && (
                                    <Typography sx={{ p: 2, color: 'text.secondary' }}>Aucune classe</Typography>
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

                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Classes dans l'année de destination :</Typography>

                        <Paper sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#f5f5f5', border: '1px solid #ddd' }}>
                            <List dense>
                                {destClasses.map((classe, idx) => (
                                    <ListItem key={classe.id || idx} sx={{
                                        borderBottom: '1px solid #eee'
                                    }}>
                                        <ListItemText
                                            primary={classe.libelle}
                                            secondary={`Niveau: ${classe.niveau}`}
                                        />
                                    </ListItem>
                                ))}
                                {destClasses.length === 0 && (
                                    <Typography sx={{ p: 2, color: 'text.secondary' }}>Aucune classe</Typography>
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
                    disabled={transferring || selectedClassIds.length === 0 || !destYearId}
                >
                    Valider le transfert {selectedClassIds.length > 0 && `(${selectedClassIds.length})`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ClassTransferModal;
