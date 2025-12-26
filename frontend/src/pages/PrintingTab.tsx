import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
    IconButton,
    Checkbox,
    CircularProgress
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import api from '../services/api';
import { useSettings } from '../contexts/SettingsContext';
import { BASE_URL } from '../config';
import { formatDate } from '../utils/formatDate';

interface Class {
    id: number;
    libelle: string;
}

interface Student {
    id: number;
    nom: string;
    prenom: string;
    classe_id?: number;
    category?: string; // Add category
}

interface Evaluation {
    id: number;
    nom: string;
    date_debut?: string; // Add dates
    date_fin?: string;
}

interface ExamRule {
    category: string;
    min_average: number;
    max_average: number;
    min_absence: number;
    max_absence: number;
    status: string;
}

interface Attendance {
    eleve_id: number;
    date: string;
    motif: string;
}

const PrintingTab: React.FC = () => {
    const { settings } = useSettings();

    // Data State
    const [classes, setClasses] = useState<Class[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

    // Print Tab State
    const [printEvaluation, setPrintEvaluation] = useState('');
    const [printClass, setPrintClass] = useState('');
    const [printStudents, setPrintStudents] = useState<Student[]>([]);
    const [showPrintTable, setShowPrintTable] = useState(false);
    const [printError, setPrintError] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [bulkReportData, setBulkReportData] = useState<any[] | null>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [openReportCard, setOpenReportCard] = useState(false);
    const [loading, setLoading] = useState(false);

    const [rules, setRules] = useState<ExamRule[]>([]);
    const [attendances, setAttendances] = useState<Attendance[]>([]);

    useEffect(() => {
        fetchClasses();
        fetchEvaluations();
        fetchRules();
        fetchAttendances();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await api.get('/exam-rules');
            setRules(response.data);
        } catch (err) {
            console.error('Error fetching rules', err);
        }
    };

    const fetchAttendances = async () => {
        try {
            const response = await api.get('/attendance');
            setAttendances(response.data);
        } catch (err) {
            console.error('Error fetching attendance', err);
        }
    };

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

    const handlePrintValidate = async () => {
        if (!printEvaluation || !printClass) {
            setPrintError('Veuillez sélectionner une évaluation et une classe.');
            return;
        }
        setPrintError('');
        setLoading(true);
        try {
            const response = await api.get('/students');
            const classStudents = response.data.filter((s: any) => s.classe_id === Number(printClass));
            setPrintStudents(classStudents);
            setShowPrintTable(true);
        } catch (err) {
            console.error('Error fetching students for print', err);
            setPrintError('Erreur lors du chargement des élèves.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedStudents(printStudents.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (studentId: number) => {
        setSelectedStudents(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId);
            } else {
                return [...prev, studentId];
            }
        });
    };

    const calculateLegacyObservation = (noteStr: string): string => {
        const note = parseFloat(noteStr);
        if (isNaN(note)) return '';

        if (note >= 0 && note <= 9.9) return 'Médiocre';
        if (note < 10) return 'Médiocre';
        if (note <= 12) return 'Assez bien';
        if (note <= 14) return 'Bien';
        if (note <= 18) return 'Très bien';
        return 'Excellent';
    };

    const calculateDynamicObservation = (average: number, absences: number, category: string): string => {
        // Normalize strings for comparison (ignore case and optional (e))
        const normalize = (str: string) => str ? str.toLowerCase().replace(/\(e\)/g, '').trim() : '';
        const targetCat = normalize(category);

        const matchingRule = rules.find(rule =>
            normalize(rule.category) === targetCat &&
            average >= rule.min_average && average <= rule.max_average &&
            absences >= rule.min_absence && absences <= rule.max_absence
        );

        if (matchingRule) return matchingRule.status;

        return 'N/A';
    };

    const fetchReports = async (targetStudents: Student[]) => {
        if (!printClass || !printEvaluation) {
            setPrintError('Veuillez sélectionner une évaluation et une classe.');
            return null;
        }

        setLoading(true);
        try {
            const classGradesRes = await api.get(`/grades/class/${printClass}?trimestre=${printEvaluation}`);
            const classGrades = classGradesRes.data;

            const subjectsRes = await api.get('/subjects');
            const classSubjects = subjectsRes.data.filter((s: any) => s.classe_id === Number(printClass));

            // Get Evaluation Dates
            const currentEval = evaluations.find(e => e.nom === printEvaluation);

            // Calculate Absences per student
            // Filter attendance by date range and 'absence non justifiée'
            const activeAttendances = attendances.filter(a => {
                if (a.motif !== 'absence non justifiée') return false;
                if (!currentEval || !currentEval.date_debut || !currentEval.date_fin) return true; // If no dates, count all? Or none? Safe to count all or warn. Let's count all if no dates defined to avoid 0.
                const aDate = new Date(a.date);
                const start = new Date(currentEval.date_debut);
                const end = new Date(currentEval.date_fin);
                return aDate >= start && aDate <= end;
            });

            const studentAverages: { studentId: number; average: number }[] = [];
            const gradesByStudent: { [key: number]: any[] } = {};

            classGrades.forEach((g: any) => {
                if (!gradesByStudent[g.eleve_id]) gradesByStudent[g.eleve_id] = [];
                gradesByStudent[g.eleve_id].push(g);
            });

            Object.keys(gradesByStudent).forEach(studentIdStr => {
                const sId = Number(studentIdStr);
                const sGrades = gradesByStudent[sId];
                let totalPoints = 0;
                let totalCoeffs = 0;

                classSubjects.forEach((subj: any) => {
                    const grade = sGrades.find((g: any) => g.matiere_id === subj.id);
                    const coeff = subj.coefficient || 1;
                    if (grade) {
                        totalPoints += parseFloat(grade.note) * coeff;
                    }
                    totalCoeffs += coeff;
                });

                const average = totalCoeffs > 0 ? totalPoints / totalCoeffs : 0;
                studentAverages.push({ studentId: sId, average });
            });

            studentAverages.sort((a, b) => b.average - a.average);

            const reports = targetStudents.map(student => {
                const currentStudentAvg = studentAverages.find(s => s.studentId === student.id);
                const rank = studentAverages.findIndex(s => s.studentId === student.id) + 1;
                const average = currentStudentAvg ? currentStudentAvg.average : 0;

                // Calculate absences count
                const studentAbsences = activeAttendances.filter(a => a.eleve_id === student.id).length;

                // Determine Observation
                // Default category if missing (should be in student object, need to ensure type has it) or fetch student details if simplified obj used
                const category = student.category || 'Non redoublant(e)';
                const observation = calculateDynamicObservation(average, studentAbsences, category);

                const studentGrades = classGrades.filter((g: any) => g.eleve_id === student.id);
                const reportRows = classSubjects.map((subj: any) => {
                    const grade = studentGrades.find((g: any) => g.matiere_id === subj.id);
                    const noteVal = grade ? parseFloat(grade.note) : 0;
                    const coeff = subj.coefficient || 1;
                    return {
                        matiere: subj.nom,
                        note: grade ? grade.note : 'N/A',
                        coefficient: coeff,
                        noteTotale: grade ? (noteVal * coeff) : 0,
                        observation: calculateLegacyObservation(grade ? grade.note : '0') // Row observation remains standard? User circled bottom observation.
                    };
                });

                return {
                    student,
                    evaluation: printEvaluation,
                    rows: reportRows,
                    average: average.toFixed(2),
                    rank,
                    className: classes.find(c => c.id === Number(printClass))?.libelle || '',
                    finalObservation: observation, // Pass calculated observation
                    absences: studentAbsences // Pass for display if needed
                };
            });

            return reports;

        } catch (err) {
            console.error('Error fetching report data', err);
            setPrintError('Erreur lors de la récupération des données du bulletin.');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleBulkPrint = async () => {
        if (selectedStudents.length === 0) {
            setPrintError('Veuillez sélectionner au moins un élève.');
            return;
        }

        const studentsToPrint = printStudents.filter(s => selectedStudents.includes(s.id));
        const reports = await fetchReports(studentsToPrint);

        if (reports && reports.length > 0) {
            setBulkReportData(reports);
            setReportData(null);
            setOpenReportCard(true);
        }
    };

    const handlePrintClick = async (student: Student) => {
        const reports = await fetchReports([student]);
        if (reports && reports.length > 0) {
            setReportData(reports[0]);
            setBulkReportData(null);
            setOpenReportCard(true);
        }
    };

    return (
        <Box>
            {/* Report Card Dialog */}
            {openReportCard && (reportData || bulkReportData) && createPortal(
                <>
                    {/* Print Styles */}
                    <style>{`
                        @media print {
                            #root { display: none !important; }
                            body > *:not(#report-card-print):not(style) { display: none !important; }
                            #report-card-print {
                                display: block !important;
                                position: absolute !important;
                                top: 0 !important;
                                left: 0 !important;
                                width: 100% !important;
                                height: auto !important;
                                background: white !important;
                                z-index: 99999 !important;
                            }
                            .no-print { display: none !important; }
                            @page { size: A4; margin: 0; }
                            html, body {
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 100% !important;
                                height: 100% !important;
                                overflow: visible !important;
                            }
                            body > * { display: none !important; }
                            #report-card-print {
                                display: block !important;
                                position: relative !important;
                                width: 100% !important;
                                height: auto !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background: white !important;
                            }
                            .print-container,
                            .modal-content-wrapper .print-container {
                                width: 100% !important;
                                height: auto !important;
                                min-height: 297mm !important;
                                margin: 0 !important;
                                padding: 10mm !important;
                                box-sizing: border-box !important;
                                border-radius: 0 !important;
                                box-shadow: none !important;
                                overflow: visible !important;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                                transform: none !important;
                            }
                            .modal-content-wrapper {
                                position: static !important;
                                transform: none !important;
                                width: 100% !important;
                                height: auto !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                max-width: none !important;
                                max-height: none !important;
                                display: block !important;
                                overflow: visible !important;
                            }
                            .print-content { page-break-inside: avoid !important; }
                            .print-container {
                                page-break-after: always !important;
                                page-break-inside: avoid !important;
                            }
                            .print-container:last-child {
                                page-break-after: auto !important;
                            }
                            .print-footer {
                                position: fixed !important;
                                bottom: 2mm !important;
                                left: 10mm !important;
                                width: auto !important;
                                margin: 0 !important;
                                z-index: 9999999 !important;
                                color: black !important;
                                display: block !important;
                            }
                            .MuiBox-root { margin-bottom: 4px !important; }
                            .MuiTypography-h5 { margin-bottom: 4px !important; font-size: 1rem !important; }
                            .MuiTableContainer-root { margin-bottom: 8px !important; }
                        }
                        .modal-overlay {
                            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                            background-color: rgba(0,0,0,0.5); z-index: 999998 !important;
                        }
                        .modal-content-wrapper {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            z-index: 999999 !important;
                            overflow-y: auto;
                            overflow-x: hidden;
                            padding: 5px 0;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                        }
                        .modal-content-wrapper .print-container {
                            transform: scale(0.7);
                            transform-origin: top center;
                            margin-bottom: -50px;
                        }
                        .modal-content-wrapper .print-container:last-child {
                            margin-bottom: 0;
                        }
                    `}</style>

                    <div className="modal-overlay no-print" onClick={() => setOpenReportCard(false)}></div>

                    <div id="report-card-print" className="modal-content-wrapper">
                        {(bulkReportData || [reportData]).map((data: any, index: number) => (
                            <Paper key={index} className="print-container" sx={{ width: '210mm', minHeight: '297mm', overflowY: 'auto', p: 4, position: 'relative', mx: 'auto', display: 'block' }}>
                                <div className="print-content">
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'flex-start' }}>
                                        <Box>
                                            <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '10pt' }}>{settings?.school_name || 'BOKELAND SCHOOL SYSTEM'}</Typography>
                                            <Typography variant="body2" sx={{ fontSize: '9pt' }}>{settings?.phone || '+237 690189297'}</Typography>
                                            <Typography variant="body2" sx={{ fontSize: '9pt' }}>{settings?.address || 'Carrefour BATA Nlongkak'}</Typography>
                                            <Typography variant="body2" sx={{ fontSize: '9pt' }}>{settings?.email || 'leuanasarl@gmail.com'}</Typography>
                                        </Box>
                                        <Box>
                                            {settings?.logo_url ? (
                                                <img
                                                    src={`${BASE_URL}${settings.logo_url}`}
                                                    alt="Logo"
                                                    style={{ width: '111px', height: '111px', objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <Typography variant="h4" color="primary" fontWeight="bold" sx={{ border: '2px solid #008080', px: 1, color: '#008080', fontSize: '1.5rem' }}>
                                                    leu<span style={{ color: 'black' }}>ana</span>
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Typography variant="h5" align="center" fontWeight="bold" sx={{ mb: 2, textTransform: 'uppercase', fontSize: '1.2rem' }}>
                                        BULLETIN DE NOTE
                                    </Typography>

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body1" sx={{ fontSize: '10pt' }}><strong>nom de l'élève :</strong> {data.student.nom} {data.student.prenom}</Typography>
                                        <Typography variant="body1" sx={{ fontSize: '10pt' }}><strong>classe :</strong> {data.className}</Typography>
                                        <Typography variant="body1" sx={{ fontSize: '10pt' }}><strong>évaluation :</strong> {data.evaluation}</Typography>
                                    </Box>

                                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, border: '1px solid black' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ borderRight: '1px solid #ccc', fontWeight: 'bold' }}>matière</TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #ccc', fontWeight: 'bold' }}>note</TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #ccc', fontWeight: 'bold' }}>coefficient</TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #ccc', fontWeight: 'bold' }}>note totale</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>observation</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.rows.map((row: any, idx: number) => (
                                                    <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#FFF5F0' } }}>
                                                        <TableCell sx={{ borderRight: '1px solid #ccc' }}>{row.matiere}</TableCell>
                                                        <TableCell align="center" sx={{ borderRight: '1px solid #ccc' }}>{row.note}</TableCell>
                                                        <TableCell align="center" sx={{ borderRight: '1px solid #ccc' }}>{row.coefficient}</TableCell>
                                                        <TableCell align="center" sx={{ borderRight: '1px solid #ccc' }}>{typeof row.noteTotale === 'number' ? row.noteTotale.toFixed(2) : row.noteTotale}</TableCell>
                                                        <TableCell align="center">{row.observation}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {Array.from({ length: Math.max(0, 16 - data.rows.length) }).map((_, idx) => (
                                                    <TableRow key={`empty-${idx}`} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#FFF5F0' } }}>
                                                        <TableCell sx={{ borderRight: '1px solid #ccc' }}>&nbsp;</TableCell>
                                                        <TableCell align="center" sx={{ borderRight: '1px solid #ccc' }}>&nbsp;</TableCell>
                                                        <TableCell align="center" sx={{ borderRight: '1px solid #ccc' }}>&nbsp;</TableCell>
                                                        <TableCell align="center" sx={{ borderRight: '1px solid #ccc' }}>&nbsp;</TableCell>
                                                        <TableCell align="center">&nbsp;</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Box sx={{ border: '1px solid black', p: 0, mb: 1 }}>
                                        <Grid container>
                                            <Grid item xs={2} sx={{ p: 1, borderRight: '1px solid black', bgcolor: '#FFF5F0' }}>
                                                <Typography align="center">moyenne</Typography>
                                            </Grid>
                                            <Grid item xs={2} sx={{ p: 1, borderRight: '1px solid black' }}>
                                                <Typography align="center" fontWeight="bold">{data.average}</Typography>
                                            </Grid>
                                            <Grid item xs={2} sx={{ p: 1, borderRight: '1px solid black', bgcolor: '#FFF5F0' }}>
                                                <Typography align="center">rang</Typography>
                                            </Grid>
                                            <Grid item xs={2} sx={{ p: 1, borderRight: '1px solid black' }}>
                                                <Typography align="center" fontWeight="bold">{data.rank}e</Typography>
                                            </Grid>
                                            <Grid item xs={2} sx={{ p: 1, borderRight: '1px solid black', bgcolor: '#FFF5F0' }}>
                                                <Typography align="center">observation</Typography>
                                            </Grid>
                                            <Grid item xs={2} sx={{ p: 1 }}>
                                                <Typography align="center">{data.finalObservation}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', px: 4 }}>
                                        <Typography variant="subtitle1" sx={{ fontSize: '11pt' }}>{formatDate(new Date())}</Typography>
                                        <Typography variant="subtitle1" sx={{ fontSize: '11pt' }}>Le principal</Typography>
                                    </Box>
                                </div>

                                <Box className="print-footer" sx={{ position: 'fixed', bottom: '2mm', left: '10mm', textAlign: 'left' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '9pt' }}>by LEUANA TECHNOLOGY</Typography>
                                </Box>
                            </Paper>
                        ))}

                        <IconButton
                            className="no-print"
                            onClick={() => setOpenReportCard(false)}
                            sx={{
                                position: 'fixed', right: 'calc(50% - 105mm - 60px)', top: '80px', bgcolor: 'error.main', color: 'white',
                                '&:hover': { bgcolor: 'error.dark' }, width: 48, height: 48, boxShadow: 3, zIndex: 1000001
                            }}
                        >
                            <CloseIcon fontSize="medium" />
                        </IconButton>

                        <IconButton
                            className="no-print"
                            onClick={() => window.print()}
                            sx={{
                                position: 'fixed', right: 'calc(50% - 105mm - 60px)', top: '50%', transform: 'translateY(-50%)', bgcolor: 'primary.main', color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' }, width: 56, height: 56, boxShadow: 3, zIndex: 1000000
                            }}
                        >
                            <PrintIcon fontSize="large" />
                        </IconButton>
                    </div>
                </>,
                document.body
            )}


            <Typography variant="h6" sx={{ mb: 2 }}>Impression des bulletins</Typography>

            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 1 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            label="Evaluation"
                            fullWidth
                            value={printEvaluation}
                            onChange={(e) => setPrintEvaluation(e.target.value)}
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
                            value={printClass}
                            onChange={(e) => setPrintClass(e.target.value)}
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
                        {/* Spacer */}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Button
                            variant="contained"
                            onClick={handlePrintValidate}
                            fullWidth
                            sx={{ height: '56px', bgcolor: '#ff6f00', '&:hover': { bgcolor: '#e65100' } }}
                        >
                            Valider
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {printError && <Alert severity="error" sx={{ mb: 2 }}>{printError}</Alert>}
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}

            {
                showPrintTable && (
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">Liste des élèves</Typography>
                            <Button
                                variant="contained"
                                startIcon={<PrintIcon />}
                                onClick={handleBulkPrint}
                                disabled={selectedStudents.length === 0}
                                sx={{ bgcolor: '#ff6f00', '&:hover': { bgcolor: '#e65100' } }}
                            >
                                Imprimer la sélection ({selectedStudents.length})
                            </Button>
                        </Box>
                        <TableContainer sx={{ maxHeight: 586 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                indeterminate={selectedStudents.length > 0 && selectedStudents.length < printStudents.length}
                                                checked={printStudents.length > 0 && selectedStudents.length === printStudents.length}
                                                onChange={handleSelectAll}
                                            />
                                        </TableCell>
                                        <TableCell>Nom</TableCell>
                                        <TableCell>Prénom</TableCell>
                                        <TableCell align="center">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {printStudents.map((student) => (
                                        <TableRow key={student.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fffaed' } }}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedStudents.includes(student.id)}
                                                    onChange={() => handleSelectStudent(student.id)}
                                                />
                                            </TableCell>
                                            <TableCell>{student.nom}</TableCell>
                                            <TableCell>{student.prenom}</TableCell>
                                            <TableCell align="center">
                                                <IconButton onClick={() => handlePrintClick(student)} color="primary">
                                                    <PrintIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )
            }
        </Box >
    );
};

export default PrintingTab;
