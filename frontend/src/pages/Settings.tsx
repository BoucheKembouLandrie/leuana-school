
import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    TextField,
    Alert,
    CircularProgress,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    LinearProgress
} from '@mui/material';
import { Edit, Save, Cancel, CloudDownload, CloudUpload, DeleteForever } from '@mui/icons-material';
import api from '../services/api';

interface SchoolSettings {
    id: number;
    school_name: string;
    website: string;
    address: string;
    phone: string;
    email: string;
    logo_url: string;
}

import { useSettings } from '../contexts/SettingsContext';
import { BASE_URL } from '../config';

const Settings: React.FC = () => {
    const { refreshSettings } = useSettings();
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    // Data Management State
    const [openResetDialog, setOpenResetDialog] = useState(false);
    const [openImportModeDialog, setOpenImportModeDialog] = useState(false);
    const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0); // Fake progress for better UX

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setSettings(response.data);
        } catch (err) {
            console.error('Error fetching settings', err);
            setError('Erreur lors du chargement des paramètres.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (field: keyof SchoolSettings, value: string) => {
        setEditingField(field);
        setEditValue(value);
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setEditValue('');
    };

    const handleSaveEdit = async (field: keyof SchoolSettings) => {
        if (!settings) return;

        try {
            const updatedSettings = { ...settings, [field]: editValue };
            await api.put('/settings', updatedSettings);
            setSettings(updatedSettings);
            await refreshSettings();
            setSuccess('Paramètre mis à jour avec succès.');
            setEditingField(null);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating settings', err);
            setError('Erreur lors de la mise à jour.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleLogoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('logo', file);

        try {
            const response = await api.post('/settings/logo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (settings) {
                setSettings({ ...settings, logo_url: response.data.logo_url });
                await refreshSettings();
            }
            setSuccess('Logo mis à jour avec succès.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error uploading logo', err);
            setError("Erreur lors de l'upload du logo.");
            setTimeout(() => setError(''), 3000);
        }
    };

    // --- Data Management Functions ---

    const simulateProgress = () => {
        setProcessing(true);
        setProgress(0);
        const interval = setInterval(() => {
            setProgress((oldProgress) => {
                if (oldProgress === 100) {
                    clearInterval(interval);
                    return 100;
                }
                const diff = Math.random() * 10;
                return Math.min(oldProgress + diff, 90); // Cap at 90 until done
            });
        }, 500);
        return interval;
    };

    const handleExport = async () => {
        const interval = simulateProgress();
        try {
            const response = await api.get('/data/export', {
                responseType: 'blob', // Important for file download
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'school_data.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();

            setProgress(100);
            setSuccess('Exportation réussie.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            console.error('Export error full:', err);
            const msg = err.response?.data?.message || err.message || 'Erreur inconnue';
            setError(`Erreur lors de l'exportation: ${msg}`);
            setTimeout(() => setError(''), 5000);
        } finally {
            clearInterval(interval);
            setTimeout(() => setProcessing(false), 500); // Delay close to show 100%
        }
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Instead of importing directly, store file and show mode selection dialog
        setPendingImportFile(file);
        setOpenImportModeDialog(true);
    };

    const handleImportModeSelect = async (mode: 'skip' | 'update' | 'duplicate') => {
        setOpenImportModeDialog(false);
        if (!pendingImportFile) return;

        const interval = simulateProgress();
        const formData = new FormData();
        formData.append('file', pendingImportFile);
        formData.append('mode', mode);

        try {
            await api.post('/data/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProgress(100);
            setSuccess('Importation réussie.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Import error', err);
            setError('Erreur lors de l\'importation. Vérifiez le fichier.');
            setTimeout(() => setError(''), 3000);
        } finally {
            clearInterval(interval);
            setTimeout(() => setProcessing(false), 500);
            setPendingImportFile(null);
            if (importInputRef.current) importInputRef.current.value = ''; // Reset input
        }
    };

    const handleResetConfirm = async () => {
        setOpenResetDialog(false);
        const interval = simulateProgress();
        try {
            await api.delete('/data/reset');
            setProgress(100);
            setSuccess('Base de données vidée avec succès.');
            setTimeout(() => setSuccess(''), 3000);
            // Optionally force logout or refresh
        } catch (err) {
            console.error('Reset error', err);
            setError('Erreur lors de la réinitialisation.');
            setTimeout(() => setError(''), 3000);
        } finally {
            clearInterval(interval);
            setTimeout(() => setProcessing(false), 500);
        }
    };


    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

    const renderFieldRow = (label: string, field: keyof SchoolSettings, value: string, index: number) => (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                py: 2,
                borderBottom: '1px solid #e0e0e0',
                bgcolor: index % 2 === 0 ? 'white' : '#f2f4f5'
            }}
        >
            <Box sx={{ width: '250px', borderRight: '1px solid #e0e0e0', pr: 2, pl: 4 }}>
                <Typography variant="subtitle1" fontWeight="medium">{label}</Typography>
            </Box>
            <Box sx={{ flexGrow: 1, px: 2 }}>
                {editingField === field ? (
                    <TextField
                        fullWidth
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        size="small"
                        autoFocus
                    />
                ) : (
                    <Typography variant="body1">{value || '-'}</Typography>
                )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, pr: 2 }}>
                {editingField === field ? (
                    <>
                        <IconButton onClick={() => handleSaveEdit(field)} color="primary" size="small">
                            <Save />
                        </IconButton>
                        <IconButton onClick={handleCancelEdit} color="error" size="small">
                            <Cancel />
                        </IconButton>
                    </>
                ) : (
                    <>
                        <IconButton onClick={() => handleEditClick(field, value)} size="small" color="primary">
                            <Edit />
                        </IconButton>
                    </>
                )}
            </Box>
        </Box>
    );

    return (
        <Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Paper sx={{ p: 4, mb: 4, border: '1px solid #e0e0e0' }}>
                {/* Logo Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                        logo (taille recommandée à 111 x 111 px)
                    </Typography>
                    <Box
                        sx={{
                            width: 150,
                            height: 150,
                            border: '1px solid #ccc',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            '&:hover .upload-overlay': { opacity: 1 }
                        }}
                        onClick={handleLogoClick}
                    >
                        {settings?.logo_url ? (
                            <img
                                src={`${BASE_URL}${settings.logo_url} `}
                                alt="Logo"
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                        ) : (
                            <Box sx={{ width: 100, height: 100, borderRadius: '50%', border: '1px solid #000' }} />
                        )}

                        {/* Edit Icon Overlay */}
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 5,
                                right: 5,
                                bgcolor: 'white',
                                borderRadius: '50%',
                                p: 0.5,
                                boxShadow: 1,
                                display: 'flex'
                            }}
                        >
                            <Edit fontSize="small" color="action" />
                        </Box>
                    </Box>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </Box>

                {/* Fields List */}
                <Box sx={{ border: '1px solid #e0e0e0', borderBottom: 'none' }}>
                    {renderFieldRow("Nom de l'établissement", 'school_name', settings?.school_name || '', 0)}
                    {renderFieldRow("site internet", 'website', settings?.website || '', 1)}
                    {renderFieldRow("localisation", 'address', settings?.address || '', 2)}
                    {renderFieldRow("numero de téléphone", 'phone', settings?.phone || '', 3)}
                    {renderFieldRow("adresse email", 'email', settings?.email || '', 4)}
                </Box>
            </Paper>

            {/* Data Management Section */}
            <Paper sx={{ p: 4, mb: 4, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                    Gestion des Données
                </Typography>

                {processing && (
                    <Box sx={{ width: '100%', mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Traitement en cours...
                        </Typography>
                        <LinearProgress variant="determinate" value={progress} />
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        startIcon={<CloudDownload />}
                        onClick={handleExport}
                        disabled={processing}
                    >
                        Exporter les données
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        onClick={handleImportClick}
                        disabled={processing}
                    >
                        Importer des données
                    </Button>
                    <input
                        type="file"
                        ref={importInputRef}
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls"
                        onChange={handleImportFileChange}
                    />

                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteForever />}
                        onClick={() => setOpenResetDialog(true)}
                        disabled={processing}
                        sx={{ ml: 'auto' }}
                    >
                        Supprimer les données
                    </Button>
                </Box>
            </Paper>

            {/* Import Mode Selection Dialog */}
            <Dialog
                open={openImportModeDialog}
                onClose={() => setOpenImportModeDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Mode d'importation</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 3 }}>
                        Des données existent déjà dans la base de données. Comment voulez-vous gérer les enregistrements en double ?
                    </DialogContentText>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => handleImportModeSelect('skip')}
                            fullWidth
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 2 }}
                        >
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">Ignorer les doublons</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Ne pas importer les enregistrements qui ont le même ID
                                </Typography>
                            </Box>
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => handleImportModeSelect('update')}
                            fullWidth
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 2 }}
                        >
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">Mettre à jour les existants</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Remplacer les données existantes avec celles du fichier
                                </Typography>
                            </Box>
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => handleImportModeSelect('duplicate')}
                            fullWidth
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 2 }}
                        >
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">Créer des doublons</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Créer de nouveaux enregistrements avec de nouveaux IDs
                                </Typography>
                            </Box>
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenImportModeDialog(false)}>
                        Annuler
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reset Confirmation Dialog */}
            <Dialog
                open={openResetDialog}
                onClose={() => setOpenResetDialog(false)}
            >
                <DialogTitle>Confirmation de suppression</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Êtes-vous sûr de vouloir supprimer TOUTES les données du logiciel ?
                        Cette action est irréversible et effacera tous les élèves, classes, notes, paiements, etc.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenResetDialog(false)} color="primary">
                        Annuler
                    </Button>
                    <Button onClick={handleResetConfirm} color="error" variant="contained" autoFocus>
                        Confirmer la suppression
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default Settings;
