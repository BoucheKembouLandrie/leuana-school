import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Box, Button, TextField, Typography, Paper, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    RadioGroup, FormControlLabel, Radio, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import api from '../services/api';
import { useAuthContext } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import { BASE_URL } from '../config';

const schema = z.object({
    username: z.string().min(1, 'Nom d\'utilisateur requis'),
    password: z.string().min(1, 'Mot de passe requis'),
});

type FormData = z.infer<typeof schema>;

const CAROUSEL_IMAGES = [
    { src: '/assets/carousel/video_surveillance.jpg', title: 'vidéo surveillance' },
    { src: '/assets/carousel/formations.jpg', title: 'site internet' },
    { src: '/assets/carousel/logiciels.jpg', title: 'logiciels' },
    { src: '/assets/carousel/applications_mobiles.jpg', title: 'applications mobiles' },
    { src: '/assets/carousel/site_internet.jpg', title: 'formations' },
];

const Login: React.FC = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });
    const navigate = useNavigate();
    const { login } = useAuthContext();
    const { settings } = useSettings();
    const [error, setError] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Forgot password state
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'admin' | 'secretary' | 'teacher'>('admin');
    const [email, setEmail] = useState('');
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
    const [sendingEmail, setSendingEmail] = useState(false);

    // Auto-rotate carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    };

    const onSubmit = async (data: FormData) => {
        try {
            const response = await api.post('/auth/login', data);
            localStorage.setItem('token', response.data.token);
            login(response.data.user);
            navigate('/');
        } catch (err) {
            console.error('Login failed', err);
            setError('Identifiants incorrects');
        }
    };

    const handleForgotPasswordOpen = () => {
        setForgotPasswordOpen(true);
        setForgotPasswordMessage(null);
        setEmail('');
        setSelectedRole('admin');
    };

    const handleForgotPasswordClose = () => {
        setForgotPasswordOpen(false);
        setForgotPasswordMessage(null);
        setEmail('');
    };

    const handleForgotPasswordSubmit = async () => {
        if (selectedRole === 'admin') {
            if (!email || !email.includes('@')) {
                setForgotPasswordMessage({ type: 'error', text: 'Veuillez entrer une adresse email valide' });
                return;
            }

            setSendingEmail(true);
            try {
                await api.post('/auth/forgot-password', { email, role: 'admin' });
                setForgotPasswordMessage({
                    type: 'success',
                    text: 'Un email de réinitialisation a été envoyé à votre adresse email.'
                });
                setEmail('');
            } catch (error) {
                setForgotPasswordMessage({
                    type: 'error',
                    text: 'Erreur lors de l\'envoi de l\'email. Veuillez vérifier votre adresse email.'
                });
            } finally {
                setSendingEmail(false);
            }
        } else {
            // For secretary and teacher
            setForgotPasswordMessage({
                type: 'info',
                text: 'Veuillez contacter l\'administrateur pour réinitialiser votre mot de passe.'
            });
        }
    };

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundImage: 'url(/assets/login_background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                zIndex: 0
            }
        }}>
            {/* Top Section: Centered Card with Logo & Form */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, position: 'relative', zIndex: 1 }}>
                <Paper
                    elevation={3}
                    sx={{
                        display: 'flex',
                        width: '100%',
                        maxWidth: 900,
                        bgcolor: 'white',
                        borderRadius: 2,
                        overflow: 'hidden',
                        minHeight: 400
                    }}
                >
                    {/* Left: Logo */}
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, borderRight: '1px solid rgba(0,0,0,0.05)' }}>
                        {settings?.logo_url ? (
                            <img
                                src={`${BASE_URL}${settings.logo_url}`}
                                alt="Logo"
                                style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain' }}
                            />
                        ) : (
                            <Box sx={{ width: 200, height: 200, border: '1px solid #ccc', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'white' }}>
                                <Typography color="text.secondary">Logo</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Right: Login Form */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 4, bgcolor: '#008888', position: 'relative' }}>
                        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%', maxWidth: 350 }}>
                            <Typography component="h1" variant="h5" sx={{ mb: 4, textAlign: 'center', color: 'white' }}>
                                Connexion
                            </Typography>
                            <TextField
                                margin="normal"
                                fullWidth
                                label="Nom d'utilisateur"
                                autoComplete="username"
                                autoFocus
                                {...register('username')}
                                error={!!errors.username}
                                helperText={errors.username?.message}
                                sx={{
                                    mb: 2,
                                    bgcolor: '#008888',
                                    '& .MuiInputBase-root': { color: 'white' },
                                    '& .MuiInputLabel-root': { color: 'white' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                    '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                            />
                            <TextField
                                margin="normal"
                                fullWidth
                                label="Mot de passe"
                                type="password"
                                autoComplete="current-password"
                                {...register('password')}
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                sx={{
                                    mb: 3,
                                    bgcolor: '#008888',
                                    '& .MuiInputBase-root': { color: 'white' },
                                    '& .MuiInputLabel-root': { color: 'white' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                    '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="outlined"
                                sx={{
                                    py: 1.5,
                                    bgcolor: 'white',
                                    color: 'text.primary',
                                    borderColor: 'rgba(0, 0, 0, 0.23)',
                                    '&:hover': {
                                        borderColor: 'text.primary',
                                        bgcolor: '#f5f5f5'
                                    }
                                }}
                            >
                                se connecter
                            </Button>

                            {error && (
                                <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
                                    {error}
                                </Typography>
                            )}

                            {/* Forgot Password Link */}
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Button
                                    onClick={handleForgotPasswordOpen}
                                    sx={{
                                        color: 'white',
                                        textTransform: 'none',
                                        textDecoration: 'underline',
                                        '&:hover': {
                                            bgcolor: 'transparent',
                                            textDecoration: 'underline'
                                        }
                                    }}
                                >
                                    Mot de passe oublié ?
                                </Button>
                            </Box>
                        </Box>

                        {/* Footer Links */}
                        <Box sx={{
                            position: 'absolute',
                            bottom: 5,
                            left: 0,
                            right: 0,
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 3,
                            px: 2
                        }}>
                            <Typography
                                variant="caption"
                                sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                onClick={() => alert('Mentions légales à venir')}
                            >
                                Mentions légales
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                            >
                                Version 1.0.0
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Bottom Section: Carousel */}
            <Box sx={{ height: 'auto', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4, position: 'relative', zIndex: 1 }}>
                <IconButton onClick={handlePrevImage} sx={{ mr: 2 }}>
                    <ChevronLeft fontSize="large" />
                </IconButton>

                <Box sx={{
                    display: 'flex',
                    width: '100%',
                    maxWidth: '1000px',
                    height: '200px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    overflow: 'hidden',
                    px: 1,
                    bgcolor: 'white'
                }}>
                    {[0, 1, 2, 3, 4].map((offset) => {
                        const index = (currentImageIndex + offset) % CAROUSEL_IMAGES.length;
                        const item = CAROUSEL_IMAGES[index];
                        return (
                            <Box
                                key={index}
                                sx={{
                                    flex: 1,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    transition: 'all 0.5s ease',
                                    mx: 0.5
                                }}
                            >
                                <Box sx={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    <img
                                        src={item.src}
                                        alt={item.title}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                </Box>
                                <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>
                                    <Typography variant="caption" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{item.title}</Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>

                <IconButton onClick={handleNextImage} sx={{ ml: 2 }}>
                    <ChevronRight fontSize="large" />
                </IconButton>
            </Box>

            {/* Forgot Password Dialog */}
            <Dialog open={forgotPasswordOpen} onClose={handleForgotPasswordClose} maxWidth="sm" fullWidth>
                <DialogTitle>Mot de passe oublié</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 3 }}>
                        Sélectionnez votre rôle pour réinitialiser votre mot de passe :
                    </Typography>

                    <RadioGroup value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as any)}>
                        <FormControlLabel value="admin" control={<Radio />} label="Administrateur" />
                        <FormControlLabel value="secretary" control={<Radio />} label="Secrétaire" />
                        <FormControlLabel value="teacher" control={<Radio />} label="Enseignant" />
                    </RadioGroup>

                    {selectedRole === 'admin' && (
                        <TextField
                            fullWidth
                            label="Adresse email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ mt: 3 }}
                            placeholder="votre.email@example.com"
                        />
                    )}

                    {forgotPasswordMessage && (
                        <Alert severity={forgotPasswordMessage.type} sx={{ mt: 2 }}>
                            {forgotPasswordMessage.text}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleForgotPasswordClose}>Annuler</Button>
                    <Button
                        onClick={handleForgotPasswordSubmit}
                        variant="contained"
                        disabled={sendingEmail}
                    >
                        {sendingEmail ? 'Envoi...' : 'Valider'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Login;
