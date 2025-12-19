import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

interface SchoolYear {
    id: number;
    name: string;
    startYear: number;
    endYear: number;
}

interface SchoolYearContextType {
    years: SchoolYear[];
    currentYear: SchoolYear | null;
    loading: boolean;
    selectYear: (year: SchoolYear) => void;
    fetchYears: () => Promise<void>;
    createYear: (name: string) => Promise<void>;
    deleteYear: (id: number) => Promise<void>;
}

const SchoolYearContext = createContext<SchoolYearContextType | undefined>(undefined);

export const SchoolYearProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [currentYear, setCurrentYear] = useState<SchoolYear | null>(() => {
        const saved = localStorage.getItem('currentSchoolYear');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(false);

    const fetchYears = async () => {
        try {
            setLoading(true);
            const response = await api.get('/school-years');
            setYears(response.data);

            // Auto-select first year if none selected
            // Auto-select based on current date if none selected
            if (!currentYear && response.data.length > 0) {
                const now = new Date();
                const month = now.getMonth(); // 0-11
                const currentCalendarYear = now.getFullYear();

                // Logic: 
                // Aug (7) to Dec (11) -> Start Year = Current Year
                // Jan (0) to Jul (6) -> Start Year = Current Year - 1
                const targetStartYear = month >= 7 ? currentCalendarYear : currentCalendarYear - 1;

                const matchingYear = response.data.find((y: SchoolYear) => y.startYear === targetStartYear);

                if (matchingYear) {
                    selectYear(matchingYear);
                } else {
                    // Fallback to the most recent one (assuming list is sorted or just taking first)
                    selectYear(response.data[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch school years:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectYear = (year: SchoolYear) => {
        setCurrentYear(year);
        localStorage.setItem('currentSchoolYear', JSON.stringify(year));
        // Force full page reload to ensure clean state
        window.location.href = '/';
    };

    const createYear = async (name: string) => {
        try {
            const response = await api.post('/school-years', { name });
            setYears(prev => [response.data, ...prev]);

            // Wait for the user to see the progress bar before reloading
            await new Promise(resolve => setTimeout(resolve, 2000));
            selectYear(response.data);
        } catch (error: any) {
            // Propagate error to component for handling
            throw error;
        }
    };

    const deleteYear = async (id: number) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cette année scolaire? Toutes les données associées seront perdues.')) {
            return;
        }

        try {
            await api.delete(`/school-years/${id}`);
            setYears(years.filter(y => y.id !== id));

            // Si on supprime l'année courante, sélectionner la première restante
            if (currentYear?.id === id) {
                const remaining = years.filter(y => y.id !== id);
                if (remaining.length > 0) {
                    selectYear(remaining[0]);
                } else {
                    setCurrentYear(null);
                    localStorage.removeItem('currentSchoolYear');
                }
            }
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Erreur lors de la suppression');
            throw error;
        }
    };

    useEffect(() => {
        fetchYears();
    }, []);

    return (
        <SchoolYearContext.Provider value={{ years, currentYear, loading, selectYear, fetchYears, createYear, deleteYear }}>
            {children}
        </SchoolYearContext.Provider>
    );
};

export const useSchoolYear = () => {
    const context = useContext(SchoolYearContext);
    if (!context) {
        throw new Error('useSchoolYear must be used within SchoolYearProvider');
    }
    return context;
};
