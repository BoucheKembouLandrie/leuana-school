import React, { useState, useEffect, useRef } from 'react';
import { useSchoolYear } from '../contexts/SchoolYearContext';
import { Add as Plus, Delete as Trash2 } from '@mui/icons-material';
import { Tabs, Tab, IconButton, Menu, MenuItem, Box, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Typography, Tooltip, LinearProgress } from '@mui/material';

const SchoolYearSelector: React.FC = () => {
    const { years, currentYear, selectYear, createYear, deleteYear } = useSchoolYear();
    const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; id: number } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Split input state
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
    const endYearRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        const selected = years.find(y => y.id === newValue);
        if (selected) {
            selectYear(selected);
        }
    };

    const handleContextMenu = (event: React.MouseEvent, id: number) => {
        event.preventDefault();
        setContextMenu(
            contextMenu === null
                ? {
                    mouseX: event.clientX + 2,
                    mouseY: event.clientY - 6,
                    id,
                }
                : null,
        );
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleDelete = async () => {
        if (contextMenu) {
            await deleteYear(contextMenu.id);
            handleCloseContextMenu();
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const newYearName = `${startYear}-${endYear}`;

        if (startYear.length === 4 && endYear.length === 4) {
            try {
                setIsSubmitting(true);
                await createYear(newYearName);
                setStartYear('');
                setEndYear('');
                setIsModalOpen(false);
            } catch (err: any) {
                // Display error in modal
                setError(err?.response?.data?.message || 'Erreur lors de la création');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <React.Fragment>
            <Box sx={{
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                pt: 1, // Add space top
                px: 1
            }}>
                <Tabs
                    value={currentYear?.id || false}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="school years tabs"
                    TabIndicatorProps={{
                        sx: { display: 'none' } // Hide default bottom indicator
                    }}
                    sx={{
                        flexGrow: 1,
                        minHeight: '40px',
                        '& .MuiTabs-flexContainer': {
                            gap: '4px' // Space between tabs
                        },
                        // Style for Scroll Buttons (Navigation < >)
                        '& .MuiButtonBase-root.MuiTabs-scrollButtons': {
                            color: 'white',
                            bgcolor: '#2e7d32', // Green
                            borderRadius: '4px',
                            width: '40px',
                            '&:hover': {
                                bgcolor: '#1b5e20', // Darker Green
                            },
                            '&.Mui-disabled': {
                                opacity: 0.3,
                                bgcolor: '#2e7d32', // Keep green but transparent
                                color: 'white'
                            },
                            mx: '2px' // Spacing
                        }
                    }}
                >
                    {years.map((year) => (
                        <Tab
                            key={year.id}
                            label={year.name}
                            value={year.id}
                            onContextMenu={(e) => handleContextMenu(e, year.id)}
                            sx={{
                                minHeight: '40px',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                borderTopLeftRadius: '8px',
                                borderTopRightRadius: '8px',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderBottom: 'none',
                                bgcolor: currentYear?.id === year.id ? '#1976d2' : '#f5f5f5', // Blue active, Grey inactive
                                color: currentYear?.id === year.id ? 'white !important' : 'text.secondary',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: currentYear?.id === year.id ? '#1565c0' : '#e0e0e0',
                                }
                            }}
                        />
                    ))}
                </Tabs>
                <Tooltip title="Nouvelle année scolaire">
                    <IconButton
                        size="small"
                        onClick={() => setIsModalOpen(true)}
                        sx={{
                            ml: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '4px',
                            bgcolor: '#d32f2f', // Red
                            color: 'white',
                            height: '40px',
                            width: '40px',
                            '&:hover': { bgcolor: '#b71c1c' }
                        }}
                    >
                        <Plus fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Context Menu */}
            <Menu
                open={contextMenu !== null}
                onClose={handleCloseContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <Trash2 fontSize="small" sx={{ mr: 1 }} />
                    Supprimer l'année
                </MenuItem>
            </Menu>

            {/* Create Modal */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleCreate}>
                    <DialogTitle>Nouvelle Année Scolaire</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            Entrez le nom de la nouvelle année (ex: 2025-2026).
                            Une fois créée, l'interface se rechargera automatiquement.
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Début"
                                type="text"
                                variant="outlined"
                                value={startYear}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    setStartYear(val);
                                    if (val.length === 4) {
                                        endYearRef.current?.focus();
                                        // Auto-fill next year if empty
                                        if (!endYear) {
                                            setEndYear((parseInt(val) + 1).toString());
                                        }
                                    }
                                    setError('');
                                }}
                                placeholder="YYYY"
                                required
                                inputProps={{ maxLength: 4, style: { textAlign: 'center' } }}
                                disabled={isSubmitting}
                                error={!!error}
                                sx={{ flex: 1 }}
                            />
                            <Typography variant="h5" color="text.secondary">-</Typography>
                            <TextField
                                inputRef={endYearRef}
                                margin="dense"
                                label="Fin"
                                type="text"
                                variant="outlined"
                                value={endYear}
                                onChange={(e) => {
                                    setEndYear(e.target.value.replace(/\D/g, '').slice(0, 4));
                                    setError('');
                                }}
                                placeholder="YYYY"
                                required
                                inputProps={{ maxLength: 4, style: { textAlign: 'center' } }}
                                disabled={isSubmitting}
                                error={!!error}
                                sx={{ flex: 1 }}
                            />
                        </Box>
                        {error && <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>{error}</Typography>}

                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                setIsModalOpen(false);
                                setError('');
                                setStartYear('');
                                setEndYear('');
                            }}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isSubmitting || startYear.length !== 4 || endYear.length !== 4}
                        >
                            {isSubmitting ? 'Création...' : 'Créer'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Loading Dialog */}
            <Dialog open={isSubmitting} disableEscapeKeyDown>
                <DialogTitle>Création de l'environnement...</DialogTitle>
                <DialogContent sx={{ width: '400px', textAlign: 'center', py: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Configuration de l'année scolaire <strong>{startYear}-{endYear}</strong>
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                        <LinearProgress />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Veuillez patienter pendant la création de la base de données isolée...
                    </Typography>
                </DialogContent>
            </Dialog>

        </React.Fragment>
    );
};

export default SchoolYearSelector;
