import React, { useState } from 'react';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { Menu as MenuIcon, Dashboard, People, School, Payment, EventAvailable, Grade, Settings, ExitToApp, Book, AccountBalance, AccountCircle, Assignment, PriceChange, DateRange } from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../App';
import SchoolYearSelector from '../components/SchoolYearSelector';

import { useSettings } from '../contexts/SettingsContext';
import { BASE_URL } from '../config';

const drawerWidth = 240;

// Define menu items with specific colors for icons
const menuItems = [
    { text: 'Dashboard', title: 'Tableau de Bord', icon: <Dashboard />, path: '/', color: '#1976d2' }, // Blue
    { text: 'Classes', title: 'Gestion des Classes', icon: <AccountBalance />, path: '/classes', color: '#e65100' }, // Orange
    { text: 'Staff', title: 'Gestion du Personnel', icon: <People />, path: '/staff', color: '#c2185b' }, // Pink (Admin color)
    { text: 'Matières', title: 'Gestion des Matières', icon: <Book />, path: '/subjects', color: '#00897b' }, // Teal
    { text: 'Élèves', title: 'Gestion des Élèves', icon: <School />, path: '/students', color: '#5e35b1' }, // Deep Purple
    { text: 'Planning', title: 'Planning Scolaire', icon: <DateRange />, path: '/planning', color: '#2e7d32' }, // Green
    { text: 'Examens', title: 'Gestion des Examens', icon: <Assignment />, path: '/examens', color: '#d32f2f' }, // Red
    { text: 'Notes', title: 'Gestion des Notes', icon: <Grade />, path: '/grades', color: '#ff6f00' }, // Amber
    { text: 'Pensions', title: 'Gestion des Pensions', icon: <Payment />, path: '/payments', color: '#fbc02d' }, // Yellow
    { text: 'Présences', title: 'Gestion des Présences', icon: <EventAvailable />, path: '/attendance', color: '#1e88e5' }, // Blue
    { text: 'Utilisateurs', title: 'Gestion des Utilisateurs', icon: <AccountCircle />, path: '/users', color: '#8e24aa' }, // Purple
    { text: 'Charges', title: 'Gestion des Charges', icon: <PriceChange />, path: '/expenses', color: '#795548' }, // Brown
    { text: 'Paramètres', title: 'Paramètres Généraux', icon: <Settings />, path: '/settings', color: '#607d8b' }, // Blue Grey
];

const DashboardLayout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, hasPermission, user } = useAuthContext();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // ... inside component
    const { settings } = useSettings();

    // Map menu paths to permission keys
    const getPermissionKey = (path: string): string => {
        const pathMap: { [key: string]: string } = {
            '/students': 'eleves',
            '/classes': 'classes',
            '/teachers': 'enseignants',
            '/subjects': 'matieres',
            '/examens': 'examens',
            '/grades': 'notes',
            '/payments': 'paiements',
            '/attendance': 'presences',
            '/users': 'utilisateurs',
            '/settings': 'parametres',
            '/administration': 'administration',
            '/reports': 'rapports',
            '/planning': 'planning',
        };
        return pathMap[path] || path.substring(1);
    };

    // Filter menu items based on user permissions
    const filteredMenuItems = menuItems.filter(item => {
        if (item.path === '/') return true; // Dashboard always visible
        return hasPermission(getPermissionKey(item.path));
    });

    const drawer = (
        <div>
            <SchoolYearSelector />
            <Toolbar sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <img
                    src={settings?.logo_url ? `${BASE_URL}${settings.logo_url}` : "/logo.jpg"}
                    alt={settings?.school_name || "Leuana School Management Software"}
                    style={{ width: '111px', height: '111px', objectFit: 'contain' }}
                />
            </Toolbar>
            <List>
                {filteredMenuItems.map((item) => {
                    const isSelected = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                onClick={() => navigate(item.path)}
                                selected={isSelected}
                                sx={{
                                    '&.Mui-selected': {
                                        backgroundColor: `${item.color}15`, // Very light background of the icon color
                                        borderRight: `4px solid ${item.color}`,
                                        '&:hover': {
                                            backgroundColor: `${item.color}25`,
                                        },
                                    },
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ color: item.color, minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontWeight: isSelected ? 'bold' : 'medium',
                                        color: isSelected ? item.color : 'textPrimary'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
                <ListItem disablePadding sx={{ mt: 2, borderTop: '1px solid #eee' }}>
                    <ListItemButton onClick={handleLogout}>
                        <ListItemIcon sx={{ color: '#d32f2f', minWidth: 40 }}><ExitToApp /></ListItemIcon>
                        <ListItemText primary="Déconnexion" primaryTypographyProps={{ color: '#d32f2f' }} />
                    </ListItemButton>
                </ListItem>
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    backgroundColor: '#fff',
                    color: '#333',
                    boxShadow: '0px 1px 4px rgba(0,0,0,0.1)'
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        {(() => {
                            const currentItem = menuItems.find(item => item.path === location.pathname);
                            return currentItem?.title || currentItem?.text || 'Tableau de Bord';
                        })()}
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #eee' },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, backgroundColor: '#f5f5f5', minHeight: '100vh' }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default DashboardLayout;
