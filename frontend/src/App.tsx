import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/fr';
import { theme } from './theme/theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Classes from './pages/Classes';
import Teachers from './pages/Teachers';
import Subjects from './pages/Subjects';
import Examens from './pages/Examens';
import Grades from './pages/Grades';
import Payments from './pages/Payments';
import Attendance from './pages/Attendance';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Administration from './pages/Administration';
import Staff from './pages/Staff';
import Expenses from './pages/Expenses';
import Planning from './pages/Planning';
import DashboardLayout from './layouts/DashboardLayout';
import { SettingsProvider } from './contexts/SettingsContext';
import { SchoolYearProvider } from './contexts/SchoolYearContext';

// User interface
interface UserInfo {
  id: number;
  username: string;
  role: 'admin' | 'secretary' | 'teacher';
  is_default?: boolean;
  teacher_id?: number | null;
  permissions?: string[] | null;
}

// Simple auth state management without Redux
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    return localStorage.getItem('isAuth') === 'true';
  });

  const [user, setUser] = React.useState<UserInfo | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (userData: UserInfo) => {
    localStorage.setItem('isAuth', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('isAuth');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';
  const isTeacher = () => user?.role === 'teacher';
  const isSecretary = () => user?.role === 'secretary';
  const hasPermission = (tab: string) => {
    if (isAdmin()) return true;
    if (isTeacher()) return tab === 'notes';
    if (isSecretary()) return user?.permissions?.includes(tab) || false;
    return false;
  };

  return { isAuthenticated, user, login, logout, isAdmin, isTeacher, isSecretary, hasPermission };
};

// Auth context
const AuthContext = React.createContext<{
  isAuthenticated: boolean;
  user: UserInfo | null;
  login: (userData: UserInfo) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isSecretary: () => boolean;
  hasPermission: (tab: string) => boolean;
}>({
  isAuthenticated: false,
  user: null,
  login: () => { },
  logout: () => { },
  isAdmin: () => false,
  isTeacher: () => false,
  isSecretary: () => false,
  hasPermission: () => false,
});

export const useAuthContext = () => React.useContext(AuthContext);

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        <SchoolYearProvider>
          <SettingsProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <DashboardLayout />
                      </PrivateRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="students" element={<Students />} />
                    <Route path="classes" element={<Classes />} />
                    <Route path="teachers" element={<Teachers />} />
                    <Route path="subjects" element={<Subjects />} />
                    <Route path="examens" element={<Examens />} />
                    <Route path="grades" element={<Grades />} />
                    <Route path="payments" element={<Payments />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="users" element={<Users />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="administration" element={<Administration />} />
                    <Route path="staff" element={<Staff />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="planning" element={<Planning />} />
                  </Route>
                  {/* Redirect any unknown route to login */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Router>
            </ThemeProvider>
          </SettingsProvider>
        </SchoolYearProvider>
      </LocalizationProvider>
    </AuthContext.Provider>
  );
};

export default App;
