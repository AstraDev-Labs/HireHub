import axios from 'axios';

// Helper to read a cookie value by name
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

let baseURL = process.env.NEXT_PUBLIC_API_URL || '';
if (baseURL && !baseURL.endsWith('/api')) {
    baseURL = baseURL.replace(/\/$/, '') + '/api';
}

const api = axios.create({
    baseURL: baseURL, // Requires NEXT_PUBLIC_API_URL in production
    withCredentials: true, // Send HttpOnly cookies with every request
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        // Send Bearer token for backward compatibility
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Send CSRF token on mutating requests
        if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
            const csrfToken = getCookie('csrfToken');
            if (csrfToken) {
                config.headers['X-CSRF-Token'] = csrfToken;
            }
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Prevent interceptor from catching 401s on login/refresh itself
            if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;
            try {
                // Refresh token is now sent via HttpOnly cookie automatically
                const response = await api.post('/auth/refresh-token');
                const { token } = response.data;
                if (token) {
                    localStorage.setItem('token', token);
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return api(originalRequest);
            } catch (err) {
                // If refresh fails, log out
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
