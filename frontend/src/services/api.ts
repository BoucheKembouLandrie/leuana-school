import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5005/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Inject selected school year
    const savedYear = localStorage.getItem('currentSchoolYear');
    if (savedYear) {
        try {
            const parsed = JSON.parse(savedYear);
            // Verify if parsed object has id property before injecting
            if (parsed && typeof parsed === 'object' && 'id' in parsed) {
                if (!config.headers['x-school-year-id']) {
                    config.headers['x-school-year-id'] = parsed.id;
                }
            }
        } catch (e) {
            // Passive failure - just don't inject header if parse fails
        }
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: any) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            localStorage.removeItem('token');
            localStorage.removeItem('isAuth');
            localStorage.removeItem('user');

            // Prevent infinite loop if already on login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
