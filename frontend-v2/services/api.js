const BASE_URL = 'http://localhost:5000/api/v1';

const API = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                window.location.hash = '#/login';
            }
            throw new Error(data.message || 'Transmission error');
        }
        return data;
    },

    get: (url) => API.request(url, { method: 'GET' }),
    post: (url, body) => API.request(url, { method: 'POST', body: JSON.stringify(body) }),
    delete: (url) => API.request(url, { method: 'DELETE' })
};

export default API;
