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
    Typography,
    TextField,
    MenuItem,
    Alert,
    Grid,
    CircularProgress
} from '@mui/material';
import api from '../services/api';
import { useAuthContext } from '../App';

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
    teacher_id?: number;
}

interface GradeEntry {
    student_id: number;
    student_name: string;
    note: number | '';
    grade_id?: number;
}

const EVALUATIONS = ['Evaluation 1', 'Evaluation 2', 'Evaluation 3'];

const TeacherGradesView: React.FC = () => {
    const { user } = useAuthContext();
    const [selectedEvaluation, setSelectedEvaluation] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [teacherSubject, setTeacherSubject] = useState<Subject | null>(null);
    const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([]);
    const [showTable, setShowTable] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [classesRes, subjectsRes] = await Promise.all([
                api.get('/classes'),
                api.get('/subjects')
            ]);
            setClasses(classesRes.data);

            // Find teacher's subject
            const teacherSub = subjectsRes.data.find((s: Subject) => s.teacher_id === user?.teacher_id);
            setTeacherSubject(teacherSub || null);
        } catch (err) {
            console.error('Error fetching data', err);
            setError('Erreur lors du chargement des données');
        }
    };

    const handleValidate = async () => {
        if (!selectedEvaluation || !selectedClass || !teacherSubject) {
            setError('Veuillez sélectionner une évaluation et une classe');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Fetch students in selected class
            const studentsRes = await api.get(`/students?classe_id=${selectedClass}`);
            const classStudents = studentsRes.data.filter((s: Student) => s.classe_id === parseInt(selectedClass));
            setStudents(classStudents);

            // Fetch existing grades for this subject, class, and evaluation
            const gradesRes = await api.get(`/grades/class/${selectedClass}?trimestre=${selectedEvaluation}`);
            const existingGrades = gradesRes.data.filter((g: any) => g.matiere_id === teacherSubject.id);

            // Create grade entries for all students
            const entries: GradeEntry[] = classStudents.map((student: Student) => {
                const existingGrade = existingGrades.find((g: any) => g.eleve_id === student.id);
                return {
                    student_id: student.id,
                    student_name: `${student.nom} ${student.prenom}`,
                    note: existingGrade ? existingGrade.note : '',
                    grade_id: existingGrade?.id,
                };
            });

            setGradeEntries(entries);
            setShowTable(true);
        } catch (err) {
            console.error('Error loading grades', err);
            setError('Erreur lors du chargement des notes');
        } finally {
            setLoading(false);
        }
    };

    const handleNoteChange = (studentId: number, value: string) => {
        setGradeEntries(prev =>
            prev.map(entry =>
                entry.student_id === studentId
                    ? { ...entry, note: value === '' ? '' : parseFloat(value) }
                    : entry
            )
        );
    };

    const handleSaveGrades = async () => {
        if (!teacherSubject) return;

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const gradesToSave = gradeEntries
                .filter(entry => entry.note !== '')
                .map(entry => ({
                    eleve_id: entry.student_id,
                    matiere_id: teacherSubject.id,
                    trimestre: selectedEvaluation,
                    annee_scolaire: new Date().getFullYear().toString(),
                    note: entry.note,
                }));

            console.log('Saving grades:', gradesToSave);
            const response = await api.post('/grades/bulk', { grades: gradesToSave });
            console.log('Save response:', response.data);
            setSuccess('Notes enregistrées avec succès !');

            // Refresh grades
            handleValidate();
        } catch (err: any) {
            console.error('Error saving grades:', err);
            console.error('Error response:', err.response?.data);
            const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement des notes';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>Notes - {teacherSubject?.nom || 'Matière'}</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Paper sx={{ p: 3, mb: 3 }}>
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
                            <MenuItem value="">Sélectionner une évaluation</MenuItem>
                            {EVALUATIONS.map((evalName) => (
                                <MenuItem key={evalName} value={evalName}>{evalName}</MenuItem>
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
                            <MenuItem value="">Sélectionner une classe</MenuItem>
                            {classes.map((cls) => (
                                <MenuItem key={cls.id} value={cls.id.toString()}>{cls.libelle}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} />
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

            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}

            {showTable && !loading && (
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            {teacherSubject?.nom} - Coefficient: {teacherSubject?.coefficient}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleSaveGrades}
                            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
                        >
                            Enregistrer
                        </Button>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Élèves</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Note / 20</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Note Finale</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Observation</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {gradeEntries.map((entry) => {
                                    const noteValue = typeof entry.note === 'number' ? entry.note : 0;
                                    const finalGrade = noteValue * (teacherSubject?.coefficient || 1);
                                    const observation = noteValue >= 16 ? 'Excellent' :
                                        noteValue >= 14 ? 'Très Bien' :
                                            noteValue >= 12 ? 'Bien' :
                                                noteValue >= 10 ? 'Assez Bien' :
                                                    noteValue >= 8 ? 'Passable' :
                                                        noteValue > 0 ? 'Médiocre' : '';

                                    return (
                                        <TableRow key={entry.student_id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fffaed' } }}>
                                            <TableCell>{entry.student_name}</TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="number"
                                                    value={entry.note}
                                                    onChange={(e) => handleNoteChange(entry.student_id, e.target.value)}
                                                    inputProps={{ min: 0, max: 20, step: 0.5 }}
                                                    size="small"
                                                    sx={{ width: 100 }}
                                                />
                                            </TableCell>
                                            <TableCell>{entry.note !== '' ? finalGrade.toFixed(2) : ''}</TableCell>
                                            <TableCell>{observation}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>
    );
};

export default TeacherGradesView;
