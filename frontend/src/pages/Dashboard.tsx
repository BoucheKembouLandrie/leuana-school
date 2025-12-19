import React, { useEffect, useState } from 'react';
import { Paper, Typography, Box, CircularProgress, TextField, Button, Autocomplete } from '@mui/material';
import { People, School, Payment, AccountBalance } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import api from '../services/api';
import { useSchoolYear } from '../contexts/SchoolYearContext';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading }) => (
    <Paper sx={{
        p: 4,
        backgroundColor: color,
        color: 'white',
        borderRadius: 3,
        boxShadow: `0 4px 12px ${color}40`,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minHeight: '160px'
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                {title}
            </Typography>
            <Box sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                p: 1.5,
                display: 'flex'
            }}>
                {icon}
            </Box>
        </Box>
        <Typography variant="h2" sx={{ fontWeight: 700 }}>
            {loading ? <CircularProgress size={48} sx={{ color: 'white' }} /> : value}
        </Typography>
    </Paper>
);

const Dashboard: React.FC = () => {
    const { currentYear } = useSchoolYear();
    const [stats, setStats] = useState({
        students: 0,
        classes: 0,
        teachers: 0,
        payments: 0,
    });
    const [loading, setLoading] = useState(true);
    const [financialData, setFinancialData] = useState({
        income: 0,
        expenses: 0
    });

    // Success Rate State
    const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [successRateData, setSuccessRateData] = useState<any>(null);
    const [successEvaluations, setSuccessEvaluations] = useState<any[]>([]);
    const [successClasses, setSuccessClasses] = useState<any[]>([]);

    const successChartData = successRateData ? [
        { name: 'Réussite', value: successRateData.success, color: '#4CAF50' },
        { name: 'Échec', value: successRateData.failure, color: '#f44336' }
    ] : [];

    useEffect(() => {
        const fetchStats = async () => {
            if (!currentYear) return;

            setLoading(true);
            try {
                const [studentsRes, classesRes, teachersRes, paymentsRes, expensesRes] = await Promise.all([
                    api.get('/students'),
                    api.get('/classes'),
                    api.get('/teachers'),
                    api.get('/payments'),
                    api.get('/expenses'),
                ]);

                // Filter data by the selected school year

                // 1. Classes: Filter by year name (e.g. "2024-2025")
                // Be flexible with property name if API varies
                const yearClasses = classesRes.data.filter((c: any) => c.annee === currentYear.name);
                const yearClassIds = yearClasses.map((c: any) => c.id);

                // 2. Students: Filter by classes that belong to this year
                const yearStudents = studentsRes.data.filter((s: any) => yearClassIds.includes(s.classe_id));

                // 3. Teachers: Currently global (unless we link them to classes/years later)
                const teachersCount = teachersRes.data.length;

                // 4. Payments & Expenses: Filter by date range
                // Fallback parsing if startYear/endYear missing (legacy/migration)
                let startYear = currentYear.startYear;
                let endYear = currentYear.endYear;

                if (!startYear || !endYear) {
                    const match = currentYear.name.match(/^(\d{4})-(\d{4})$/);
                    if (match) {
                        startYear = parseInt(match[1]);
                        endYear = parseInt(match[2]);
                    } else {
                        // Ultimate fallback: Use current year logic (legacy behavior)
                        const now = new Date();
                        const curM = now.getMonth();
                        startYear = curM < 7 ? now.getFullYear() - 1 : now.getFullYear();
                        endYear = startYear + 1;
                    }
                }

                const academicYearStart = new Date(startYear, 7, 1); // Aug 1st, StartYear
                const academicYearEnd = new Date(endYear, 6, 31, 23, 59, 59); // July 31st, EndYear

                const yearPayments = paymentsRes.data.filter((payment: any) => {
                    const payDate = new Date(payment.date_paiement);
                    return payDate >= academicYearStart && payDate <= academicYearEnd;
                });

                const yearExpenses = expensesRes.data.filter((expense: any) => {
                    const expDate = new Date(expense.date_depense);
                    return expDate >= academicYearStart && expDate <= academicYearEnd;
                });

                setStats({
                    students: yearStudents.length,
                    classes: yearClasses.length,
                    teachers: teachersCount,
                    payments: yearPayments.length,
                });

                // Calculate Finances
                const totalIncome = yearPayments.reduce((sum: number, p: any) => sum + Number(p.montant || 0), 0);
                const totalExpenses = yearExpenses.reduce((sum: number, e: any) => sum + Number(e.montant || 0), 0);

                setFinancialData({
                    income: totalIncome,
                    expenses: totalExpenses
                });

            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        // Reset filters when year changes
        setSelectedClass(null);
        setSelectedEvaluation(null);
        setSuccessRateData(null);
        fetchSuccessRateOptions(); // Refresh options for dropdowns
    }, [currentYear]);

    // Fetch success rate options (Classes should be filtered by year)
    const fetchSuccessRateOptions = async () => {
        if (!currentYear) return;
        try {
            const [evaluationsRes, classesRes] = await Promise.all([
                api.get('/evaluations'),
                api.get('/classes')
            ]);
            setSuccessEvaluations(evaluationsRes.data);

            // Filter classes for dropdown to only show current year's classes
            const yearClasses = classesRes.data.filter((c: any) => c.annee === currentYear.name);
            setSuccessClasses(yearClasses);

        } catch (error) {
            console.error('Error fetching success rate options:', error);
        }
    };

    // Fetch success rate data when filters change
    // Fetch success rate data when filters change
    useEffect(() => {
        fetchSuccessRate();
    }, [selectedEvaluation, selectedClass]);

    const fetchSuccessRate = async () => {
        try {
            const params: any = {};

            if (selectedEvaluation) {
                params.evaluation = selectedEvaluation.nom;
            }

            if (selectedClass) {
                params.classe_id = selectedClass.id;
            }

            const response = await api.get('/grades/success-rate', { params });
            setSuccessRateData(response.data);
        } catch (error) {
            console.error('Error fetching success rate:', error);
        }
    };

    const chartData = [
        { name: 'Entrées (Pensions)', value: financialData.income, color: '#4CAF50' },
        { name: 'Sorties (Dépenses)', value: financialData.expenses, color: '#f44336' }
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
                <Box sx={{ flex: 1 }}>
                    <StatCard
                        title="Élèves"
                        value={stats.students}
                        icon={<School />}
                        color="#1976d2"
                        loading={loading}
                    />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <StatCard
                        title="Classes"
                        value={stats.classes}
                        icon={<AccountBalance />}
                        color="#2e7d32"
                        loading={loading}
                    />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <StatCard
                        title="Enseignants"
                        value={stats.teachers}
                        icon={<People />}
                        color="#ed6c02"
                        loading={loading}
                    />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <StatCard
                        title="Paiements"
                        value={stats.payments}
                        icon={<Payment />}
                        color="#9c27b0"
                        loading={loading}
                    />
                </Box>
            </Box>

            <Box sx={{ mt: 4, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Bienvenue dans le système de gestion scolaire Leuana School
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Utilisez le menu de gauche pour naviguer entre les différents modules.
                </Typography>
            </Box>

            {/* 4-column layout for financial overview */}
            <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
                {/* Column 1: Pie Chart */}
                <Paper sx={{ flex: 1.5, p: 3, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                        Aperçu Financier (Année Scolaire)
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
                        Période : Août {currentYear?.startYear || (currentYear?.name ? parseInt(currentYear.name.split('-')[0]) : '...')} - Juillet {currentYear?.endYear || (currentYear?.name ? parseInt(currentYear.name.split('-')[1]) : '...')}
                    </Typography>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-around' }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" color="textSecondary">Total Entrées</Typography>
                            <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                                {financialData.income.toLocaleString()} FCFA
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" color="textSecondary">Total Sorties</Typography>
                            <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 600 }}>
                                {financialData.expenses.toLocaleString()} FCFA
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ mt: 'auto', width: '100%' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ percent }) => `${((percent || 0) * 100).toFixed(1)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${value.toLocaleString()} FCFA`} />
                                <Legend
                                    content={
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
                                            {chartData.map((entry, index) => (
                                                <Box key={`legend-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 12, height: 12, backgroundColor: entry.color, borderRadius: '2px' }} />
                                                    <Typography variant="body2" sx={{ color: entry.color, fontWeight: 500 }}>
                                                        {entry.name}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    }
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>

                {/* Column 2: Success Rate Chart */}
                <Paper sx={{ flex: 1.5, p: 3, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                        Taux de Réussite
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
                        Réussite: Moyenne ≥ 10/20
                    </Typography>

                    {/* Filters */}
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mb: 2 }}>
                        <Autocomplete
                            options={successEvaluations}
                            getOptionLabel={(option) => option.nom}
                            value={selectedEvaluation}
                            onChange={(_, newValue) => setSelectedEvaluation(newValue)}
                            renderOption={(props, option) => (
                                <li {...props}>
                                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                        {option.nom}
                                    </Typography>
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Évaluations"
                                    size="small"
                                    placeholder="Sélectionner une évaluation"
                                />
                            )}
                            sx={{ flex: 1 }}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                        />

                        <Autocomplete
                            options={successClasses}
                            getOptionLabel={(option) => option.libelle}
                            value={selectedClass}
                            onChange={(_, newValue) => setSelectedClass(newValue)}
                            renderOption={(props, option) => (
                                <li {...props}>
                                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                        {option.libelle}
                                    </Typography>
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Classes"
                                    size="small"
                                    placeholder="Sélectionner une classe"
                                />
                            )}
                            sx={{ flex: 1 }}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                        />
                    </Box>

                    {successRateData && (
                        <>
                            <Box sx={{ mt: 'auto', width: '100%' }}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={successChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ percent }) => `${((percent || 0) * 100).toFixed(1)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {successChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend
                                            content={
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
                                                    {successChartData.map((entry, index) => (
                                                        <Box key={`legend-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Box sx={{ width: 12, height: 12, backgroundColor: entry.color, borderRadius: '2px' }} />
                                                            <Typography variant="body2" sx={{ color: entry.color, fontWeight: 500 }}>
                                                                {entry.name}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>

                        </>
                    )}
                </Paper>



                {/* Column 4: Suggestion Form */}
                <Paper sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                        Boîte à Suggestions
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
                        Partagez vos idées pour améliorer le logiciel
                    </Typography>
                    <Box component="form" onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const data = {
                            name: formData.get('name') as string,
                            email: formData.get('email') as string,
                            message: formData.get('message') as string
                        };

                        try {
                            await api.post('/suggestions', data);
                            alert('Suggestion envoyée avec succès !');
                            e.currentTarget.reset();
                        } catch (error) {
                            alert('Erreur lors de l\'envoi de la suggestion');
                        }
                    }} sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                            <TextField
                                name="name"
                                label="Nom"
                                required
                                fullWidth
                                size="small"
                            />
                            <TextField
                                name="email"
                                label="Email"
                                type="email"
                                fullWidth
                                size="small"
                            />
                            <TextField
                                name="message"
                                label="Message"
                                multiline
                                required
                                fullWidth
                                size="small"
                                sx={{ flexGrow: 1 }}
                                InputProps={{
                                    sx: {
                                        height: '100%',
                                        alignItems: 'flex-start'
                                    }
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                            >
                                Envoyer
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default Dashboard;
