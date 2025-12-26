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
    TextField,
    MenuItem,
    Alert,
    Grid,
    Autocomplete,
    CircularProgress
} from '@mui/material';
import api from '../services/api';

interface Class {
    id: number;
    libelle: string;
}

interface Student {
    id: number;
    nom: string;
    prenom: string;
    classe_id?: number;
}

interface Subject {
    id: number;
    nom: string;
    coefficient: number;
    classe_id?: number;
}

interface GradeEntry {
    matiere_id: number;
    matiere_nom: string;
    coefficient: number;
    note: string;
    note_finale: number;
    observation: string;
}

interface Evaluation {
    id: number;
    nom: string;
    date_debut: string;
    date_fin: string;
}

const GradesTab: React.FC = () => {
    // Selection State
    const [selectedEvaluation, setSelectedEvaluation] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');

    // Data State
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showTable, setShowTable] = useState(false);

    useEffect(() => {
        fetchClasses();
        fetchEvaluations();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStudents(selectedClass);
        } else {
            setStudents([]);
            setSelectedStudent('');
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes');
            setClasses(response.data);
        } catch (err) {
            console.error('Error fetching classes', err);
        }
    };

    const fetchEvaluations = async () => {
        try {
            const response = await api.get('/evaluations');
            setEvaluations(response.data);
        } catch (err) {
            console.error('Error fetching evaluations', err);
        }
    };

    const fetchStudents = async (classId: string) => {
        try {
            const response = await api.get('/students');
            const classStudents = response.data.filter((s: any) => s.classe_id === Number(classId));
            setStudents(classStudents);
        } catch (err) {
            console.error('Error fetching students', err);
        }
    };

    const handleValidate = async () => {
        if (!selectedEvaluation || !selectedClass || !selectedStudent) {
            setError('Veuillez sélectionner une évaluation, une classe et un élève.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setShowTable(false);

        try {
            const subjectsRes = await api.get('/subjects');
            const classSubjects = subjectsRes.data.filter((s: any) => s.classe_id === Number(selectedClass));

            const gradesRes = await api.get(`/grades/student/${selectedStudent}`);
            const existingGrades = gradesRes.data.filter((g: any) => g.trimestre === selectedEvaluation);

            const entries: GradeEntry[] = classSubjects.map((subject: Subject) => {
                const existingGrade = existingGrades.find((g: any) => g.matiere_id === subject.id);
                const note = existingGrade ? existingGrade.note.toString() : '';
                const coefficient = subject.coefficient || 1;

                return {
                    matiere_id: subject.id,
                    matiere_nom: subject.nom,
                    coefficient: coefficient,
                    note: note,
                    note_finale: calculateFinalGrade(note, coefficient),
                    observation: calculateObservation(note),
                };
            });

            setGradeEntries(entries);
            setShowTable(true);
        } catch (err) {
            console.error('Error fetching data', err);
            setError('Erreur lors du chargement des données.');
        } finally {
            setLoading(false);
        }
    };

    const calculateFinalGrade = (noteStr: string, coeff: number): number => {
        const note = parseFloat(noteStr);
        if (isNaN(note)) return 0;
        return note * coeff;
    };

    const calculateObservation = (noteStr: string): string => {
        const note = parseFloat(noteStr);
        if (isNaN(note)) return '';

        if (note >= 0 && note <= 9.9) return 'Médiocre';
        if (note < 10) return 'Médiocre';
        if (note <= 12) return 'Assez bien';
        if (note <= 14) return 'Bien';
        if (note <= 18) return 'Très bien';
        return 'Excellent';
    };

    const handleNoteChange = (index: number, value: string) => {
        const newEntries = [...gradeEntries];
        const entry = newEntries[index];

        const numVal = parseFloat(value);
        if (value !== '' && (isNaN(numVal) || numVal < 0 || numVal > 20)) {
            return;
        }

        entry.note = value;
        entry.note_finale = calculateFinalGrade(value, entry.coefficient);
        entry.observation = calculateObservation(value);

        setGradeEntries(newEntries);
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const gradesToSave = gradeEntries
                .filter(entry => entry.note !== '')
                .map(entry => ({
                    eleve_id: Number(selectedStudent),
                    matiere_id: entry.matiere_id,
                    trimestre: selectedEvaluation,
                    annee_scolaire: '2024-2025',
                    note: parseFloat(entry.note)
                }));

            if (gradesToSave.length === 0) {
                setError('Aucune note à enregistrer.');
                setLoading(false);
                return;
            }

            await api.post('/grades/bulk', { grades: gradesToSave });
            setSuccess('Notes enregistrées avec succès !');
        } catch (err) {
            console.error('Error saving grades', err);
            setError("Erreur lors de l'enregistrement des notes.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 1 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            label="Evaluation"
                            fullWidth
                            value={selectedEvaluation}
                            onChange={(e) => setSelectedEvaluation(e.target.value)}
                            SelectProps={{ displayEmpty: true }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <MenuItem value="">
                                Sélectionner une évaluation
                            </MenuItem>
                            {evaluations.map((evaluation) => (
                                <MenuItem key={evaluation.id} value={evaluation.nom}>{evaluation.nom}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            label="Classe"
                            fullWidth
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            SelectProps={{ displayEmpty: true }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <MenuItem value="">
                                Sélectionner une classe
                            </MenuItem>
                            {classes.map((cls) => (
                                <MenuItem key={cls.id} value={cls.id.toString()}>{cls.libelle}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Autocomplete
                            fullWidth
                            options={students}
                            getOptionLabel={(option) => `${option.nom} ${option.prenom}`}
                            value={students.find(s => s.id.toString() === selectedStudent) || null}
                            onChange={(_, newValue) => setSelectedStudent(newValue ? newValue.id.toString() : '')}
                            disabled={!selectedClass}
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
                            variant="contained"
                            onClick={handleValidate}
                            fullWidth
                            sx={{ height: '56px', bgcolor: '#ff6f00', '&:hover': { bgcolor: '#e65100' } }}
                        >
                            Valider
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}

            {showTable && (
                <Paper sx={{ p: 3 }}>
                    <TableContainer sx={{ maxHeight: 586 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Matière</TableCell>
                                    <TableCell align="center">Coefficient</TableCell>
                                    <TableCell align="center">Note / 20</TableCell>
                                    <TableCell align="center">Note Finale</TableCell>
                                    <TableCell align="center">Observation</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {gradeEntries.map((entry, index) => (
                                    <TableRow key={entry.matiere_id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fffaed' } }}>
                                        <TableCell>{entry.matiere_nom}</TableCell>
                                        <TableCell align="center">{entry.coefficient}</TableCell>
                                        <TableCell align="center">
                                            <TextField
                                                value={entry.note}
                                                onChange={(e) => handleNoteChange(index, e.target.value)}
                                                size="small"
                                                inputProps={{ style: { textAlign: 'center' } }}
                                                sx={{ width: '80px' }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">{entry.note_finale}</TableCell>
                                        <TableCell align="center">{entry.observation}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            sx={{ bgcolor: '#ff6f00', '&:hover': { bgcolor: '#e65100' } }}
                        >
                            Enregistrer
                        </Button>
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default GradesTab;
