const Auth = {
    save(data) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
    },
    user: () => JSON.parse(localStorage.getItem('user') || 'null'),
    token: () => localStorage.getItem('token'),
    logout: () => {
        localStorage.clear();
        window.location.hash = '#/login';
        window.location.reload();
    }
};

export default Auth;
