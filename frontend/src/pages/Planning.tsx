import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    IconButton,
    Typography
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../services/api';

interface Class {
    id: number;
    libelle: string;
}

interface Subject {
    id: number;
    nom: string;
    teacher?: {
        nom: string;
        prenom: string;
    };
}

interface Schedule {
    id: number;
    classe_id: number;
    subject_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    subject?: Subject;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 6); // 6h to 18h

const Planning: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
    const [formData, setFormData] = useState({
        classe_id: '',
        subject_id: '',
        day_of_week: '',
        start_time: '',
        end_time: ''
    });
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        fetchClasses();
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            fetchSchedules();
        }
    }, [selectedClassId]);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes');
            console.log('Classes fetched:', response.data);
            setClasses(response.data);
            if (response.data.length > 0) {
                setSelectedClassId(response.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchSchedules = async () => {
        try {
            const response = await api.get(`/schedules/class/${selectedClassId}`);
            setSchedules(response.data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await api.get('/subjects');
            setAllSubjects(response.data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    // Filter subjects by selected class in form
    const getFilteredSubjects = () => {
        if (!formData.classe_id) return [];
        return allSubjects.filter((s: any) => s.classe_id === parseInt(formData.classe_id));
    };

    const handleOpenDialog = (schedule?: Schedule) => {
        if (schedule) {
            setEditingSchedule(schedule);
            setFormData({
                classe_id: schedule.classe_id.toString(),
                subject_id: schedule.subject_id.toString(),
                day_of_week: schedule.day_of_week.toString(),
                start_time: schedule.start_time,
                end_time: schedule.end_time
            });
        } else {
            setEditingSchedule(null);
            setFormData({
                classe_id: selectedClassId?.toString() || '',
                subject_id: '',
                day_of_week: '',
                start_time: '',
                end_time: ''
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingSchedule(null);
    };

    const handleSubmit = async () => {
        try {
            console.log('Form data:', formData);
            const payload = {
                classe_id: parseInt(formData.classe_id),
                subject_id: parseInt(formData.subject_id),
                day_of_week: parseInt(formData.day_of_week),
                start_time: formData.start_time,
                end_time: formData.end_time
            };
            console.log('Payload to send:', payload);

            if (editingSchedule) {
                console.log('Updating schedule:', editingSchedule.id);
                await api.put(`/schedules/${editingSchedule.id}`, payload);
            } else {
                console.log('Creating new schedule');
                await api.post('/schedules', payload);
            }

            console.log('Schedule saved successfully');
            fetchSchedules();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Erreur lors de la sauvegarde du planning: ' + (error as any).message);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Supprimer ce créneau ?')) {
            try {
                await api.delete(`/schedules/${id}`);
                fetchSchedules();
            } catch (error) {
                console.error('Error deleting schedule:', error);
            }
        }
    };

    // Helper functions for layout (Cleaned up)


    return (
        <Box>
            {classes.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', mb: 2 }}>
                    <Typography variant="h6" color="text.secondary">
                        Aucune classe trouvée. Veuillez créer des classes dans l'onglet "Classes".
                    </Typography>
                </Paper>
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, overflowX: 'auto' }}>
                        {classes.map(cls => (
                            <Button
                                key={cls.id}
                                onClick={() => setSelectedClassId(cls.id)}
                                variant={selectedClassId === cls.id ? 'contained' : 'outlined'}
                                sx={{
                                    minWidth: 120,
                                    minHeight: 48,
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    textTransform: 'none',
                                    borderRadius: '8px 8px 0 0',
                                    borderBottom: 'none',
                                    ...(selectedClassId === cls.id ? {
                                        bgcolor: '#d32f2f',
                                        color: '#ffffff',
                                        border: '2px solid #d32f2f',
                                        '&:hover': {
                                            bgcolor: '#c62828',
                                            border: '2px solid #c62828'
                                        }
                                    } : {
                                        bgcolor: '#f5f5f5',
                                        color: '#333333',
                                        border: '2px solid #ddd',
                                        '&:hover': {
                                            bgcolor: '#e0e0e0'
                                        }
                                    })
                                }}
                            >
                                {cls.libelle}
                            </Button>
                        ))}
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }, ml: 2, minWidth: 200 }}
                    >
                        Ajouter un planning
                    </Button>
                </Box>
            )}

            {/* CALENDAR CONTAINER - Fit to screen (calc 100vh - header offsets) */}
            <Paper sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', overflow: 'hidden' }}>
                {/* HEADER (DAYS) */}
                <Box sx={{ display: 'flex', borderBottom: '1px solid #ddd', pl: '60px', pr: '16px', bgcolor: '#f5f5f5' }}> {/* pl=60px to align with rule */}
                    {DAYS.map((day, idx) => (
                        <Box key={idx} sx={{ flex: 1, textAlign: 'center', py: 1, fontWeight: 'bold', borderLeft: '1px solid #ddd', fontSize: '0.9rem' }}>
                            {day}
                        </Box>
                    ))}
                </Box>

                {/* FLEX BODY - Auto height */}
                <Box sx={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>

                    {/* TIME RULER (Y-AXIS) */}
                    <Box sx={{ width: '60px', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa', borderRight: '1px solid #ddd', py: '10px' }}> {/* py=10px for 6h/18h visibility */}
                        {HOURS.slice(0, 12).map((hour) => (
                            <Box key={hour} sx={{ flex: 1, position: 'relative', borderBottom: '1px solid #eee' }}>
                                {/* Hour Label */}
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: 'absolute',
                                        top: '-8px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        fontWeight: 'bold',
                                        bgcolor: '#fafafa',
                                        px: 0.5,
                                        zIndex: 2,
                                        color: '#666'
                                    }}
                                >
                                    {hour}h
                                </Typography>

                                {/* 5-minute ticks */}
                                {Array.from({ length: 11 }).map((_, i) => {
                                    const min = (i + 1) * 5;
                                    const topPos = (min / 60) * 100; // % position
                                    const isQuarter = min % 15 === 0;
                                    return (
                                        <Box
                                            key={min}
                                            sx={{
                                                position: 'absolute',
                                                top: `${topPos}%`,
                                                right: 0,
                                                width: isQuarter ? '12px' : '6px',
                                                borderTop: '1px solid #ddd'
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        ))}
                        {/* Final 18h Label at the bottom */}
                        <Box sx={{ position: 'relative', height: 0 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    position: 'absolute',
                                    top: '-8px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontWeight: 'bold',
                                    bgcolor: '#fafafa',
                                    px: 0.5,
                                    zIndex: 2,
                                    color: '#666'
                                }}
                            >
                                18h
                            </Typography>
                        </Box>
                    </Box>

                    {/* DAYS COLUMNS */}
                    <Box sx={{ display: 'flex', flex: 1, position: 'relative', py: '10px' }}> {/* Match padding with ruler */}
                        {/* Background Grid Lines (Horizontal) */}
                        <Box sx={{ position: 'absolute', top: '10px', left: 0, right: 0, bottom: '10px', pointerEvents: 'none', display: 'flex', flexDirection: 'column' }}>
                            {HOURS.slice(0, 12).map((hour) => (
                                <Box key={hour} sx={{ flex: 1, borderTop: '1px solid #f0f0f0', boxSizing: 'border-box' }} />
                            ))}
                            {/* Bottom border for 18h */}
                            <Box sx={{ borderTop: '1px solid #f0f0f0' }} />
                        </Box>

                        {DAYS.map((_, dayIdx) => (
                            <Box key={dayIdx} sx={{ flex: 1, borderLeft: '1px solid #eee', position: 'relative', height: '100%' }}>
                                {/* Render Schedules for this Day */}
                                {schedules
                                    .filter(s => s.day_of_week === dayIdx + 1)
                                    .map(schedule => {
                                        // Calculate Position using PERCENTAGES
                                        const startParts = schedule.start_time.split(':').map(Number);
                                        const endParts = schedule.end_time.split(':').map(Number);

                                        // Total range in minutes (6h to 18h = 12 hours)
                                        const startHourRange = HOURS[0];
                                        const totalRangeMinutes = 12 * 60;

                                        // Convert event times to minutes from start of range
                                        const eventStartTotal = (startParts[0] - startHourRange) * 60 + startParts[1];
                                        const eventEndTotal = (endParts[0] - startHourRange) * 60 + endParts[1];

                                        // Convert to percentages
                                        const topPercent = (eventStartTotal / totalRangeMinutes) * 100;
                                        const heightPercent = ((eventEndTotal - eventStartTotal) / totalRangeMinutes) * 100;

                                        // Helper to generate dark/vivid colors based on string
                                        const getSubjectColor = (str: string) => {
                                            const colors = [
                                                '#d32f2f', // Red 700
                                                '#7b1fa2', // Purple 700
                                                '#303f9f', // Indigo 700
                                                '#0288d1', // Light Blue 700
                                                '#00796b', // Teal 700
                                                '#388e3c', // Green 700
                                                '#f57c00', // Orange 700
                                                '#455a64', // Blue Grey 700
                                                '#c2185b', // Pink 700
                                                '#512da8'  // Deep Purple 700
                                            ];
                                            let hash = 0;
                                            for (let i = 0; i < str.length; i++) {
                                                hash = str.charCodeAt(i) + ((hash << 5) - hash);
                                            }
                                            return colors[Math.abs(hash) % colors.length];
                                        };

                                        const bgColor = getSubjectColor(schedule.subject?.nom || 'default');

                                        return (
                                            <Box
                                                key={schedule.id}
                                                sx={{
                                                    position: 'absolute',
                                                    top: `${topPercent}%`,
                                                    height: `${heightPercent}%`,
                                                    left: '2px',
                                                    right: '2px',
                                                    bgcolor: bgColor, // Dynamic dark/vivid color
                                                    color: 'white',
                                                    borderRadius: '4px',
                                                    p: 0.5,
                                                    overflow: 'hidden',
                                                    boxShadow: 2,
                                                    fontSize: '0.70rem',
                                                    borderLeft: '4px solid rgba(0,0,0,0.2)', // Subtle darken for border
                                                    zIndex: 10,
                                                    transition: 'all 0.2s',
                                                    '&:hover': { zIndex: 20, boxShadow: 4, transform: 'scale(1.02)' }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.70rem', lineHeight: 1.1, mb: 0.5 }}>
                                                        {schedule.subject?.nom}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1 }}> {/* Increased spacing with gap */}
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); handleOpenDialog(schedule); }}
                                                            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                                        >
                                                            <Edit sx={{ fontSize: 18 }} /> {/* Adjusted to 18px */}
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(schedule.id); }}
                                                            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                                        >
                                                            <Delete sx={{ fontSize: 18 }} /> {/* Adjusted to 18px */}
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                                <Typography variant="caption" sx={{ display: 'block', lineHeight: 1, fontSize: '0.65rem', opacity: 0.9 }}>
                                                    {schedule.start_time} - {schedule.end_time}
                                                </Typography>
                                                {schedule.subject?.teacher && (
                                                    <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', opacity: 0.8, fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {schedule.subject.teacher.prenom} {schedule.subject.teacher.nom}
                                                    </Typography>
                                                )}
                                            </Box>
                                        );
                                    })}
                            </Box>
                        ))}
                    </Box>

                </Box>
            </Paper>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingSchedule ? 'Modifier le planning' : 'Ajouter un planning'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            select
                            label="Sélectionner la classe"
                            value={formData.classe_id}
                            onChange={(e) => {
                                console.log('Selected class:', e.target.value);
                                setFormData({ ...formData, classe_id: e.target.value, subject_id: '' });
                            }}
                            fullWidth
                            required
                        >
                            {classes.length === 0 ? (
                                <MenuItem disabled sx={{ color: '#999' }}>
                                    Aucune classe disponible
                                </MenuItem>
                            ) : (
                                classes.map(cls => {
                                    console.log('Rendering class:', cls);
                                    return (
                                        <MenuItem key={cls.id} value={cls.id} sx={{ color: '#000 !important', backgroundColor: '#fff' }}>
                                            {cls.libelle}
                                        </MenuItem>
                                    );
                                })
                            )}
                        </TextField>
                        <TextField
                            select
                            label="Sélectionner la matière"
                            value={formData.subject_id}
                            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                            fullWidth
                            required
                            disabled={!formData.classe_id}
                            helperText={!formData.classe_id ? "Veuillez d'abord sélectionner une classe" : ""}
                        >
                            {getFilteredSubjects().map(subject => (
                                <MenuItem key={subject.id} value={subject.id} sx={{ color: '#000 !important', backgroundColor: '#fff' }}>
                                    {subject.nom}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            label="Jour de la semaine"
                            value={formData.day_of_week}
                            onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                            fullWidth
                            required
                        >
                            {DAYS.map((day, idx) => (
                                <MenuItem key={idx} value={idx + 1}>
                                    {day}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Heure de début"
                            type="time"
                            value={formData.start_time}
                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Heure de fin"
                            type="time"
                            value={formData.end_time}
                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                        disabled={!formData.classe_id || !formData.subject_id || !formData.day_of_week || !formData.start_time || !formData.end_time}
                    >
                        Valider
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Planning;
