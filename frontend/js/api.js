const API = {
    // Automatically switch between local development, Render (same-origin), and Vercel (cross-origin)
    BASE_URL: (() => {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5000/api/v1';
        if (host.includes('vercel.app')) return 'https://elitequiz-0-1.onrender.com/api/v1';
        return '/api/v1'; // Default for same-origin (Render)
    })(),

    async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        const token = localStorage.getItem('token');

        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(url, { ...options, headers });
            
            // Check if response is empty
            const contentType = response.headers.get("content-type");
            let data = {};
            
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            }

            if (!response.ok) {
                // Handle expired token
                if (response.status === 401) {
                    Auth.logout();
                    App.showToast('Session expired. Please login again.', 'error');
                }
                throw new Error(data.message || `Server Error (${response.status})`);
            }

            return data;
        } catch (error) {
            if (error.name === 'SyntaxError') {
                throw new Error('Received invalid response from server. Check if backend is running.');
            }
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};
