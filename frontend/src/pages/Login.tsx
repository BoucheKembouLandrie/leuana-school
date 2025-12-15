import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Button, TextField, Typography, Paper, IconButton } from '@mui/material';
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
                backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay instead of blur
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
                        bgcolor: 'white', // White background
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
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, bgcolor: '#008888' }}>
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
                                    '& .MuiInputBase-root': {
                                        color: 'white',
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'white',
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: 'white',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                    },
                                    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                    },
                                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'white',
                                    },
                                    '& .MuiFormHelperText-root': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    }
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
                                    '& .MuiInputBase-root': {
                                        color: 'white',
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'white',
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: 'white',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                    },
                                    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                    },
                                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'white',
                                    },
                                    '& .MuiFormHelperText-root': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    }
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


                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Bottom Section: Carousel */}
            <Box sx={{ height: 'auto', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4, position: 'relative', zIndex: 1 }}>

                {/* Left Arrow - Outside */}
                <IconButton
                    onClick={handlePrevImage}
                    sx={{ mr: 2 }}
                >
                    <ChevronLeft fontSize="large" />
                </IconButton>

                {/* Framed Carousel Container */}
                <Box sx={{
                    display: 'flex',
                    width: '100%',
                    maxWidth: '1000px', // Limit width
                    height: '200px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    overflow: 'hidden',
                    px: 1, // Small padding inside frame
                    bgcolor: 'white' // White background for the carousel frame
                }}>
                    {/* Display all 5 images */}
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
                                    justifyContent: 'flex-end', // Align content to bottom
                                    transition: 'all 0.5s ease',
                                    mx: 0.5 // Reduced spacing (gap)
                                }}
                            >
                                {/* Image - No border */}
                                <Box sx={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    <img
                                        src={item.src}
                                        alt={item.title}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                </Box>
                                {/* Title - No border, just text */}
                                <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>
                                    <Typography variant="caption" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{item.title}</Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>

                {/* Right Arrow - Outside */}
                <IconButton
                    onClick={handleNextImage}
                    sx={{ ml: 2 }}
                >
                    <ChevronRight fontSize="large" />
                </IconButton>
            </Box>
        </Box>
    );
};

export default Login;
