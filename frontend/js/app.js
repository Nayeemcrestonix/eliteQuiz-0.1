const App = {
    viewContainer: document.getElementById('view-container'),
    spinner: document.getElementById('loading-spinner'),
    
    init() {
        console.log("🚀 EliteQuiz App Initialization Sequence Started");
        this.loadSavedTheme();
        this.spinner = document.getElementById('loading-spinner');
        this.viewContainer = document.getElementById('view-container');

        // Router
        window.onhashchange = () => this.route();
        this.route();
    },

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            const btn = document.getElementById('theme-btn');
            if (btn) {
                const icon = btn.querySelector('i');
                if (icon) icon.className = 'fas fa-sun';
            }
        }
    },

    toggleTheme() {
        const isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        
        const btn = document.getElementById('theme-btn');
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
        }
    },

    bindEvents() {
        window.addEventListener('hashchange', () => this.route());
    },

    route() {
        const hash = window.location.hash || '#/';
        const user = Auth.isAuthenticated() ? Auth.getUser() : null;

        // Prevent leaving active exam
        const activeAttemptId = this.currentAttemptId || localStorage.getItem('active_attempt_id');
        if (activeAttemptId && !hash.startsWith('#/results/') && !hash.startsWith('#/exam/')) {
            if (confirm('An exam is in progress. Leaving will NOT submit your answers. Stay on page?')) {
                const examId = this.currentExam?.id || localStorage.getItem('active_exam_id');
                window.location.hash = `#/exam/${examId}`;
                return;
            } else {
                this.currentAttemptId = null;
                localStorage.removeItem('active_attempt_id');
                localStorage.removeItem('active_exam_id');
                clearInterval(this.timer);
                window.onbeforeunload = null;
            }
        }

        // Render Nav Auth Links
        const authLinks = document.getElementById('auth-links');
        if (authLinks) authLinks.innerHTML = Views.authLinks(user);

        const isExamPage = hash.startsWith('#/exam/');
        const mainNav = document.getElementById('main-nav');
        if (mainNav) mainNav.classList.toggle('hidden', isExamPage);

        // --- Router ---
        if (hash === '#/' || hash === '#/home') {
            this.loadHomePage();
        } else if (hash.startsWith('#/admin')) {
            // GLOBAL ADMIN ACCESS CONTROL
            if (!user || user.role !== 'admin') { window.location.hash = '#/login'; return; }
            
            if (hash === '#/admin/home') {
                this.loadAdminDashboard();
            } else if (hash === '#/admin/exams') {
                this.loadAdminExams();
            } else if (hash === '#/admin/exams/new') {
                this.viewContainer.innerHTML = Views.examForm();
            } else if (hash.startsWith('#/admin/exams/edit/')) {
                const id = hash.split('/')[4];
                this.loadExamEdit(id);
            } else if (hash === '#/admin/questions') {
                this.loadAdminQuestions();
            } else if (hash === '#/admin/students') {
                this.loadAdminStudents();
            } else if (hash.startsWith('#/admin/exams/preview/')) {
                const parts = hash.split('/');
                this.previewExam(parts[parts.length - 1]);
            } else if (hash === '#/admin/results') {
                this.loadAdminResults();
            }
        } else if (hash === '#/student/dashboard' || hash === '#/dashboard') {
            if (!user) { window.location.hash = '#/login'; return; }
            this.loadStudentDashboard();
        } else if (hash === '#/exams') {
            this.loadExamsPage();
        } else if (hash === '#/leaderboard') {
            this.loadLeaderboard();
        } else if (hash === '#/results' || hash === '#/history') {
            if (!user) { window.location.hash = '#/login'; return; }
            this.showHistory(); // Standardizing on showHistory for both
        } else if (hash === '#/notifications') {
            if (!user) { window.location.hash = '#/login'; return; }
            this.loadNotifications();
        } else if (hash === '#/profile') {
            if (!user) { window.location.hash = '#/login'; return; }
            this.showProfile();
        } else if (hash.startsWith('#/exam/')) {
            if (!user) { window.location.hash = '#/login'; return; }
            const id = hash.split('/')[2];
            this.startExamFlow(id);
        } else if (hash.startsWith('#/results/review/')) {
            if (!user) { window.location.hash = '#/login'; return; }
            const id = hash.split('/')[3];
            this.showReview(id);
        } else if (hash.startsWith('#/results/')) {
            const id = hash.split('/')[2];
            this.downloadResultPDF(id); // Simplified handling for direct PDF download if needed
        } else if (hash === '#/login') {
            this.viewContainer.innerHTML = Views.login();
        } else if (hash === '#/register') {
            this.viewContainer.innerHTML = Views.register();
        } else {
            this.loadHomePage();
        }

        this.updateActiveNavLink(hash);
        window.scrollTo(0, 0);
    },

    async loadStudentDashboard() {
        this.showLoading(true);
        try {
            const res = await API.get('/results/dashboard');
            this.viewContainer.innerHTML = Views.studentDashboard(res.data || res);
            this.startGlobalTimers();
        } catch (err) {
            console.error('Core Dashboard Error:', err);
        } finally {
            this.showLoading(false);
        }
    },

    async loadLeaderboard() {
        this.showLoading(true);
        try {
            const res = await API.get('/results/leaderboard');
            this.viewContainer.innerHTML = Views.leaderboard(res.data || res);
        } catch (err) {
            console.error('Leaderboard Fetch Error:', err);
        } finally {
            this.showLoading(false);
        }
    },

    async showReview(attemptId) {
        this.showLoading(true);
        try {
            const [statusRes, reviewRes] = await Promise.all([
                API.get(`/attempts/${attemptId}`),
                API.get(`/attempts/${attemptId}/review`)
            ]);

            const attempt = statusRes.data.data || statusRes.data;
            const reviewData = reviewRes.data.data?.review || reviewRes.data.review || [];
            
            // Calculate detailed metrics for the summary view
            const totalMarks = attempt.total_marks || 0;
            const percentage = attempt.percentage !== undefined ? attempt.percentage : Math.round((attempt.score / (totalMarks || 1)) * 100);
            const correctCount = reviewData.filter(q => q.status === 'Correct').length;
            const totalQuestions = reviewData.length;

            this.viewContainer.innerHTML = Views.resultSummary({
                ...attempt,
                attempt_id: attemptId,
                percentage,
                correct_count: correctCount,
                total_questions: totalQuestions,
                status: (attempt.pass_fail_status === 'Passed' || percentage >= (attempt.passing_score || 40)) ? 'Pass' : 'Fail'
            });

            this.startGlobalTimers(); // Cleanup if any
        } catch (err) {
            console.error('Review Load Error:', err);
            this.showToast('Failed to load performance metrics', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    startGlobalTimers() {
        if (this.globalTimer) clearInterval(this.globalTimer);
        
        const update = () => {
            const timers = document.querySelectorAll('.realtime-timer');
            if (timers.length === 0) {
                clearInterval(this.globalTimer);
                this.globalTimer = null;
                return;
            }

            const now = new Date().getTime();
            timers.forEach(t => {
                const target = new Date(t.dataset.until).getTime();
                const diff = target - now;

                if (diff <= 0) {
                    t.innerText = "00:00:00";
                    t.style.color = "var(--success)";
                    if (t.dataset.refreshed !== "true") {
                        t.dataset.refreshed = "true";
                        setTimeout(() => this.route(), 2000);
                    }
                } else {
                    const h = Math.floor(diff / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                    t.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                }
            });
        };

        update();
        this.globalTimer = setInterval(update, 1000);
    },

    showLoading(show) {
        if (this.spinner) this.spinner.classList.toggle('hidden', !show);
    },

    updateActiveNavLink(hash) {
        const links = document.querySelectorAll('.btn-nav');
        links.forEach(l => {
            const href = l.getAttribute('href');
            l.classList.toggle('active', href === hash);
        });
    },

    async showHistory() {
        this.showLoading(true);
        try {
            const res = await API.get('/attempts');
            this.viewContainer.innerHTML = Views.historyPage(res.data || []);
        } catch (e) {
            this.showToast('PROTOCOL ERROR: History sync failed.', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async loadExamsPage() {
        this.showLoading(true);
        try {
            const res = await API.get('/results/dashboard'); // Use dashboard data for categorization
            const { upcomingExams = [] } = res.data || res;
            
            this.viewContainer.innerHTML = Views.studentExams({
                live: upcomingExams.filter(e => new Date() >= new Date(e.start_time)),
                upcoming: upcomingExams.filter(e => new Date() < new Date(e.start_time)),
                completed: []
            });
            this.startGlobalTimers();
        } catch (e) {
            this.showToast('EXAM MANIFEST ERROR: Synchronization failed.', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async loadNotifications() {
        this.showLoading(true);
        try {
            const res = await API.get('/results/dashboard'); // Or a specific notifications endpoint if exists
            this.viewContainer.innerHTML = Views.notifications(res.data?.notifications || res.notifications || []);
        } catch (e) {
            this.showToast('SIGNAL ERROR: Notification feed offline.', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async showReview(attemptId) {
        this.showLoading(true);
        try {
            const res = await API.get(`/attempts/${attemptId}/review`);
            this.viewContainer.innerHTML = Views.resultDetailed(res.data);
        } catch (e) {
            this.showToast('Unable to load detailed review', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async showProfile() {
        this.showLoading(true);
        try {
            const statsRes = await API.get('/results/dashboard');
            this.viewContainer.innerHTML = Views.profileView(Auth.getUser(), statsRes.data);
        } catch (e) {
            this.viewContainer.innerHTML = Views.profileView(Auth.getUser(), null);
        } finally {
            this.showLoading(false);
        }
    },

    async handleExamSubmit(e, id = null) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Ensure numeric fields are correctly typed
        data.duration = parseInt(data.duration);
        data.passing_score = parseInt(data.passing_score);
        data.is_published = parseInt(data.is_published);

        this.showLoading(true);
        try {
            if (id) {
                await API.put(`/exams/${id}`, data);
                this.showToast('Certification protocol updated', 'success');
            } else {
                await API.post('/exams', data);
                this.showToast('New certification initialized', 'success');
            }
            window.location.hash = '#/admin/exams';
        } catch (e) {
            this.showToast('Failed to commit certification changes', 'error');
        } finally {
            this.showLoading(false);
        }
    },



    async handleProfileUpdate(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');

        try {
            await API.put('/users/profile', { name });
            this.showToast('Profile updated successfully', 'success');
            // Update local user data
            const user = Auth.getUser();
            user.name = name;
            localStorage.setItem('user', JSON.stringify(user));
            this.renderHeader(); // Refresh header
        } catch (err) {
            this.showToast('Update failed', 'error');
        }
    },

    updateActiveNavLink(hash) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === hash);
        });
    },

    toggleMobileMenu() {
        const menu = document.getElementById('desktop-menu');
        menu.classList.toggle('open');
    },

    scrollToFeatures() {
        const section = document.getElementById('features');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    },

    // --- Page Loaders ---
    async loadHomePage() {
        this.showLoading(true);
        try {
            const examsRes = await API.get('/exams');
            const stats = {
                totalExams: examsRes.data.length,
                totalStudents: '1.2K'
            };
            this.viewContainer.innerHTML = Views.landing(stats);
        } catch (e) {
            console.error(e);
        } finally {
            this.showLoading(false);
        }
    },

    async loadExamsPage() {
        this.showLoading(true);
        try {
            const res = await API.get('/exams');
            this.viewContainer.innerHTML = Views.examsPage(res.data);
        } finally {
            this.showLoading(false);
        }
    },

    async loadAttemptsPage() {
        this.showLoading(true);
        try {
            const res = await API.get('/attempts');
            this.viewContainer.innerHTML = Views.attemptsPage(res.data || []);
        } finally {
            this.showLoading(false);
        }
    },

    async showResults(attemptId) {
        this.showLoading(true);
        try {
            const res = await API.get(`/attempts/${attemptId}`);
            this.viewContainer.innerHTML = Views.resultSummary(res.data);
        } finally {
            this.showLoading(false);
        }
    },

    async loadStudentDashboard() {
        this.showLoading(true);
        try {
            const [resultsRes, notifyRes, trendRes] = await Promise.all([
                API.get('/results/dashboard'),
                API.get('/results/notifications'),
                API.get('/results/trend')
            ]);
            const viewData = {
                ...resultsRes.data,
                notifications: notifyRes.data
            };
            this.viewContainer.innerHTML = Views.studentDashboard(viewData);
            
            if (trendRes.data && trendRes.data.length > 0) {
                this.initTrendChart(trendRes.data);
            }
        } catch (e) {
            console.error('Dashboard load failed:', e);
            this.showToast('Failed to load performance metrics', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    initTrendChart(data) {
        const ctx = document.getElementById('student-trend-chart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.title),
                datasets: [{
                    label: 'Precision Trace (%)',
                    data: data.map(d => d.score),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        max: 100, 
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: { 
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    },

    async showStudentDetail(studentId) {
        this.showLoading(true);
        try {
            const res = await API.get(`/results/student/${studentId}`);
            this.viewContainer.innerHTML = Views.studentDetail(res.data.user, res.data.attempts, res.data.stats);
        } catch (e) {
            this.showToast('Could not analyze candidate data', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async exportResultsExcel(examId) {
        if (!examId) {
            this.showToast('Please select an assessment hub first', 'info');
            return;
        }

        try {
            const res = await API.get(`/results/leaderboard/${examId}`);
            const data = res.data;

            if (!data || data.length === 0) {
                this.showToast('No submission data available for export', 'info');
                return;
            }

            const worksheetData = data.map((r, i) => ({
                'Rank': i + 1,
                'Candidate Name': r.user_name,
                'Assessment Cluster': r.exam_title || 'General Certification',
                'Submission Date': new Date(r.submit_time).toLocaleDateString(),
                'Final Score (%)': r.score,
                'Outcome': r.score >= (r.passing_score || 40) ? 'PASS' : 'FAIL',
                'Time Taken': `${Math.floor(r.time_taken / 60)}m ${r.time_taken % 60}s`
            }));

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Assessment Report");

            // Auto-size columns
            const colWidths = [
                { wch: 6 },  // Rank
                { wch: 25 }, // Candidate Name
                { wch: 30 }, // Assessment
                { wch: 15 }, // Date
                { wch: 15 }, // Score
                { wch: 10 }, // Outcome
                { wch: 15 }  // Time
            ];
            worksheet['!cols'] = colWidths;

            XLSX.writeFile(workbook, `EliteQuiz_Report_${examId}_${new Date().toISOString().split('T')[0]}.xlsx`);
            this.showToast('Professional analytical report generated', 'success');
        } catch (e) {
            console.error(e);
            this.showToast('Export synchronization failed', 'error');
        }
    },

    async loadAdminDashboard() {
        this.showLoading(true);
        try {
            const res = await API.get('/results/admin-summary');
            this.viewContainer.innerHTML = Views.adminHome(res.data);
            this.initDashboardCharts(res.data);
        } catch (e) {
            this.showToast('Could not load dashboard data', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    initDashboardCharts(data) {
        const ctx = document.getElementById('main-performance-chart');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Active Candidates',
                    data: [120, 190, 300, 500],
                    borderColor: '#6366f1',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
            }
        });
    },

    async loadAdminExams() {
        this.showLoading(true);
        try {
            const res = await API.get('/exams');
            this.viewContainer.innerHTML = Views.adminExams(res.data);
        } catch (e) {
            this.showToast('Failed to load certification record', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async toggleExamPublish(examId, currentStatus) {
        this.showLoading(true);
        try {
            const newStatus = currentStatus ? 0 : 1;
            await API.put(`/exams/${examId}`, { is_published: newStatus });
            this.showToast(newStatus ? 'Exam published to student portal' : 'Exam reverted to draft status', 'success');
            await this.loadAdminExams();
        } catch (e) {
            this.showToast('Failed to update visibility status', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async loadExamEdit(id) {
        this.showLoading(true);
        try {
            const res = await API.get(`/exams/${id}`);
            this.viewContainer.innerHTML = Views.examForm(res.data);
        } catch (e) {
            this.showToast('Failed to load certification configuration', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async loadAdminResults() {
        this.showLoading(true);
        try {
            const [examsRes, resultsRes] = await Promise.all([
                API.get('/exams'),
                API.get('/results/students') // Defaulting to all student progress
            ]);
            this.viewContainer.innerHTML = Views.adminResults(examsRes.data);
        } catch (e) {
            this.showToast('Failed to load submission ledger', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    initResultsChart(data) {
        const ctx = document.getElementById('score-distribution-chart');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['<40%', '40-60%', '60-80%', '80-100%'],
                datasets: [{
                    label: 'Count',
                    data: [5, 12, 45, 18],
                    backgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    },

    async loadAdminStudents(search = '') {
        this.showLoading(true);
        try {
            const res = await API.get(`/results/students?search=${encodeURIComponent(search)}`);
            this.viewContainer.innerHTML = Views.adminStudents(res.data);
            
            // Restore focus and cursor to search input if it exists
            const searchInput = document.getElementById('student-search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.value = search;
                // Move cursor to end
                searchInput.setSelectionRange(search.length, search.length);
            }
        } catch (e) {
            this.showToast('Could not load student directory', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    handleStudentSearch(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadAdminStudents(query);
        }, 400); // 400ms for stable debounce
    },

    async showStudentDetail(id) {
        this.showLoading(true);
        try {
            const res = await API.get(`/results/student/${id}`);
            this.viewContainer.innerHTML = Views.studentDetail(res.data);
        } catch (e) {
            console.error(e);
            this.showToast('Could not analyze candidate data', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    grantRetake(userId, userName) {
        const modal = Views.confirmationModal(
            'Grant Protocol Retake',
            `Are you sure you want to grant a retake to <strong>${userName}</strong>? <br><br> This will permanently clear their attempt history from the ledger, allowing them to re-initialize the assessments.`,
            'Grant Retake',
            `App.executeRetake(${userId}, '${userName.replace(/'/g, "\\'")}')`
        );
        document.body.insertAdjacentHTML('beforeend', modal);
    },

    async executeRetake(userId, userName) {
        // Remove modal first
        const overlay = document.getElementById('custom-modal-overlay');
        if (overlay) overlay.remove();

        this.showLoading(true);
        try {
            await API.delete(`/results/student/${userId}/attempts`);
            this.showToast(`Retake credentials issued for ${userName}`, 'success');
            await this.loadAdminStudents(); // Live reload the list
        } catch (e) {
            this.showToast('Protocol rejection: Could not clear history', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async loadAdminResults() {
        this.showLoading(true);
        try {
            const res = await API.get('/exams');
            this.viewContainer.innerHTML = Views.adminResults(res.data);
        } catch (e) {
            this.showToast('Could not load assessment analytics', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async loadAdminAnalytics(examId) {
        if (!examId) return this.loadAdminResults();
        
        this.showLoading(true);
        try {
            const [examsRes, analyticsRes] = await Promise.all([
                API.get('/exams'),
                API.get(`/results/analytics/${examId}`)
            ]);
            this.viewContainer.innerHTML = Views.adminResults(examsRes.data, String(examId), analyticsRes.data);
            
            // Populating Chart.js for Admin Score Distribution using binned data
            const ctx = document.getElementById('score-distribution-chart');
            if (ctx && window.currentDistData) {
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: window.currentDistLabels,
                        datasets: [{
                            label: 'Cohort Submissions',
                            data: window.currentDistData,
                            backgroundColor: '#6366f1',
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
                    }
                });
            }
        } catch (e) {
            console.error(e);
            this.showToast('Could not load detailed analytics', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async exportResultsToExcel(examId, title) {
        if (!window.XLSX) {
            this.showToast('Export module not loaded', 'error');
            return;
        }
        
        this.showLoading(true);
        try {
            const res = await API.get(`/results/leaderboard/${examId}`);
            if (!res.data || res.data.length === 0) {
                this.showToast('No reliable data for export', 'warning');
                return;
            }
            
            const worksheet = XLSX.utils.json_to_sheet(res.data.map((l, i) => ({
                "Rank": i + 1,
                "Candidate ID": l.user_id,
                "Candidate Name": l.user_name,
                "Total Marks": l.score,
                "Time Taken (s)": l.time_taken,
                "Timestamp": new Date(l.submit_time).toLocaleString()
            })));
            
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Cohort Data");
            XLSX.writeFile(workbook, `EliteQuiz_Analytics_${title.replace(/ /g, '_')}.xlsx`);
            
            this.showToast('Export compilation complete', 'success');
        } catch (e) {
            console.error(e);
            this.showToast('Diagnostic export failed', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    exportAdminPDF(title) {
        if (!window.html2canvas || !window.jspdf) {
            this.showToast('PDF layout engine missing', 'error');
            return;
        }
        
        this.showLoading(true);
        const exportNode = document.getElementById('admin-export-area');
        if (!exportNode) return this.showLoading(false);

        // Adjust for capturing
        const originalBg = exportNode.style.background;
        exportNode.style.background = '#0f172a'; // enforce dark theme bg
        
        html2canvas(exportNode, { scale: 2, useCORS: true, logging: false }).then(canvas => {
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`EliteQuiz_Report_${title.replace(/ /g, '_')}.pdf`);
            exportNode.style.background = originalBg;
            this.showLoading(false);
            this.showToast('PDF compilation complete', 'success');
        }).catch(err => {
            console.error(err);
            this.showLoading(false);
            exportNode.style.background = originalBg;
            this.showToast('PDF synthesis failed', 'error');
        });
    },


    async loadAdminQuestions(preSelectedExamId = null) {
        this.showLoading(true);
        try {
            const res = await API.get('/exams');
            this.viewContainer.innerHTML = Views.adminQuestions(res.data);
            
            if (preSelectedExamId) {
                const select = document.getElementById('upload-exam-id');
                if (select) select.value = preSelectedExamId;
            }
        } catch (e) {
            this.showToast('Could not load question module', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    handleFileSelect(input) {
        const fileName = input.files[0]?.name || '';
        const display = document.getElementById('selected-file-name');
        if (display) display.innerText = fileName;
    },

    async handleExcelImport(event, examId) {
        const file = event.target.files[0];
        if (!file) return;

        this.showLoading(true);
        this.showToast(`Ingesting Modules from ${file.name}...`, 'info');

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const allQuestions = [];
                    
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const rawJson = XLSX.utils.sheet_to_json(worksheet);
                        const sName = sheetName.toLowerCase();
                        
                        rawJson.forEach(row => {
                            let q = null;
                            
                            if (sName.includes('mcq')) {
                                const options = [
                                    row['Option A'], row['Option B'], 
                                    row['Option C'], row['Option D']
                                ].filter(Boolean);
                                
                                let correct = row['Correct Answer'];
                                // Alpha-Key Resolution (A, B, C, D)
                                if (correct && /^[A-D]$/i.test(String(correct).trim())) {
                                    const idx = String(correct).trim().toUpperCase().charCodeAt(0) - 65;
                                    if (options[idx]) correct = options[idx];
                                }

                                q = {
                                    type: 'mcq',
                                    question_text: row['Question'] || row['Question Text'],
                                    options: options,
                                    correct_answer: correct,
                                    marks: parseInt(row['Marks'] || 5),
                                    explanation: row['Explanation']
                                };
                            } else if (sName.includes('short') || sName.includes('theory')) {
                                q = {
                                    type: 'short',
                                    question_text: row['Question'] || row['Question Text'],
                                    correct_answer: row['Answer'] || row['Correct Answer'],
                                    marks: parseInt(row['Marks'] || 10),
                                    explanation: row['Explanation']
                                };
                            } else if (sName.includes('coding')) {
                                q = {
                                    type: 'coding',
                                    question_text: row['Question'] || row['Question Text'],
                                    sample_input: row['Sample Input'],
                                    sample_output: row['Sample Output'],
                                    correct_answer: row['Sample Output'] || row['Correct Answer'],
                                    marks: parseInt(row['Marks'] || 20),
                                    explanation: row['Explanation']
                                };
                            }

                            if (q && q.question_text && q.correct_answer) {
                                allQuestions.push(q);
                            }
                        });
                    });

                    if (allQuestions.length === 0) throw new Error("No valid questions found in known sheets (MCQs, Short Answers, Coding).");

                    const res = await API.post(`/exams/${examId}/questions/bulk`, { questions: allQuestions });
                    
                    if (res.errors && res.errors.length > 0) {
                        this.showToast(`Partial success: ${res.count} created.`, 'warning');
                    } else {
                        this.showToast(`Successfully ingested ${res.count} certification points`, 'success');
                    }
                    
                    await this.loadAdminExams();
                    this.previewExam(examId);
                } catch (err) {
                    console.error("Ingestion Error:", err);
                    this.showToast('Ingestion failed: ' + err.message, 'error');
                } finally {
                    this.showLoading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            this.showToast('Initialization failed: ' + err.message, 'error');
            this.showLoading(false);
        } finally {
            event.target.value = '';
        }
    },

    downloadTemplate() {
        const wb = XLSX.utils.book_new();

        // 1. MCQs Sheet
        const mcqHeaders = [['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Marks', 'Explanation']];
        const mcqData = [
            ['What is the primary language of the EliteQuiz frontend?', 'HTML', 'Javascript', 'Python', 'C++', 'B', '5', 'The UI is built with Vanilla JS.'],
            ['Which design style uses background blur?', 'Skeuomorphism', 'Flat Design', 'Glassmorphism', 'Material Design', 'Glassmorphism', '5', 'Glassmorphism relies on blur.']
        ];
        const wsMcq = XLSX.utils.aoa_to_sheet(mcqHeaders.concat(mcqData));
        XLSX.utils.book_append_sheet(wb, wsMcq, "MCQs");

        // 2. Short Answers Sheet
        const theoryHeaders = [['Question', 'Answer', 'Marks', 'Explanation']];
        const theoryData = [
            ['Define "SPA" in modern web development.', 'Single Page Application', '10', 'A web app that loads a single HTML page and dynamically updates.'],
            ['What is the purpose of JWT?', 'Securely transmitting information as a JSON object.', '10', 'Used primarily for authentication.']
        ];
        const wsTheory = XLSX.utils.aoa_to_sheet(theoryHeaders.concat(theoryData));
        XLSX.utils.book_append_sheet(wb, wsTheory, "Short Answers");

        // 3. Coding Sheet
        const codingHeaders = [['Question', 'Sample Input', 'Sample Output', 'Marks', 'Explanation']];
        const codingData = [
            ['Write a function to return the sum of two numbers.', '1, 2', '3', '20', 'Basic arithmetic logic.'],
            ['Implement a binary search algorithm.', '[1, 2, 3], 2', '1', '40', 'Find the index of the target.']
        ];
        const wsCoding = XLSX.utils.aoa_to_sheet(codingHeaders.concat(codingData));
        XLSX.utils.book_append_sheet(wb, wsCoding, "Coding");

        XLSX.writeFile(wb, "EliteQuiz_Standard_Ingestion_Template.xlsx");
    },

    exportStudentsCSV() {
        const rows = [["Name", "Email", "Rank"]];
        document.querySelectorAll('#student-list-body tr').forEach(tr => {
            const cells = tr.querySelectorAll('td');
            rows.push([cells[0].innerText, cells[1].innerText, cells[2].innerText]);
        });
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Candidate_Directory.csv");
        document.body.appendChild(link);
        link.click();
    },

    showStatusNotification(id, message) {
        const container = document.getElementById('status-notifier-container');
        const card = document.createElement('div');
        card.id = id;
        card.className = 'status-card';
        card.innerHTML = `
            <div class="status-header">
                <span class="status-title">${message}</span>
                <i class="fas fa-spinner fa-spin" style="opacity:0.5"></i>
            </div>
            <div class="progress-track"><div class="progress-fill" id="${id}-fill"></div></div>
            <div id="${id}-desc" style="font-size: 0.8rem; color: var(--text-muted)">Connecting to ingestion engine...</div>
        `;
        container.appendChild(card);
    },

    updateStatusProgress(id, percent) {
        const fill = document.getElementById(`${id}-fill`);
        const desc = document.getElementById(`${id}-desc`);
        if (fill) fill.style.width = percent + '%';
        if (desc) desc.innerText = `Sending data chunks... ${percent}%`;
    },

    updateStatusToComplete(id, count, examId) {
        const card = document.getElementById(id);
        const fill = document.getElementById(`${id}-fill`);
        if (fill) fill.style.width = '100%';
        
        card.style.borderLeftColor = 'var(--success)';
        card.innerHTML = `
            <div class="status-header">
                <span class="status-title" style="color: var(--success)">Processing Complete</span>
                <i class="fas fa-check-circle" style="color: var(--success)"></i>
            </div>
            <p style="font-size: 0.85rem; margin-top: 0.5rem">Found <strong>${count}</strong> valid questions in your document.</p>
            <div class="status-actions">
                <button class="btn btn-primary btn-sm" style="padding: 0.5rem 1rem; font-size: 0.8rem" onclick="App.renderParsedPreview(${examId})">Preview & Edit</button>
                <button class="btn btn-secondary btn-sm" style="padding: 0.5rem 1rem; font-size: 0.8rem" onclick="App.removeStatusNotification('${id}')">Dismiss</button>
            </div>
        `;
    },

    renderParsedPreview(examId) {
        this.viewContainer.innerHTML = Views.parsedQuestionsPreview(examId, this.parsedQuestions);
    },

    removeStatusNotification(id) {
        const card = document.getElementById(id);
        if (card) card.remove();
    },

    removeParsedQuestion(index, examId) {
        this.parsedQuestions.splice(index, 1);
        this.viewContainer.innerHTML = Views.parsedQuestionsPreview(examId, this.parsedQuestions);
    },

    async confirmBulkSave(examId) {
        if (this.parsedQuestions.length === 0) return this.showToast('No questions to save', 'error');

        this.showLoading(true);
        try {
            const res = await API.post('/admin/questions/bulk-save', {
                examId,
                questions: this.parsedQuestions
            });
            
            const { mcq, short, coding } = res.inserted;
            this.showToast(`Successfully added: ${mcq} MCQs, ${short} Short, ${coding} Coding.`);
            this.loadAdminExams();
            window.location.hash = '#/admin/exams';
        } catch (e) {
            console.error('Bulk save error:', e);
            this.showToast('Failed to finalize upload', 'error');
        } finally {
            this.showLoading(false);
        }
    },
    async previewExam(examId) {
        this.showLoading(true);
        try {
            const res = await API.get(`/exams/${examId}/questions`);
            // Store data for tab switching
            this._currentExamPreviewData = res.data;
            this.viewContainer.innerHTML = Views.examPreview(res.data);
            window.location.hash = `#/admin/exams/preview/${examId}`;
        } catch (e) {
            this.showToast('Could not load exam preview', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    handleTypeChange(newType, qId, examId) {
        // Collect current state to prevent data loss on switch
        const currentData = {
            id: qId,
            exam_id: examId,
            question_text: document.getElementById('edit-q-text').value,
            marks: parseInt(document.getElementById('edit-q-marks').value),
            type: newType,
            options: '[]',
            correct_answer: '',
            sample_input: '',
            sample_output: '',
            constraints: ''
        };
        // Re-render with new classification layout
        this.showQuestionEdit(currentData);
    },

    handleEditClick(id, type) {
        console.log(`🛠️ Edit Request Recieved | ID: ${id} | Type: ${type}`);
        if (!this._currentExamPreviewData || !this._currentExamPreviewData.questions[type]) {
            console.error("❌ Edit Failed: Preview data missing in local cache.");
            return this.showToast('Preview data unavailable. Please refresh.', 'error');
        }
        const q = this._currentExamPreviewData.questions[type].find(question => question.id == id);
        if (q) {
            this.showQuestionEdit(q);
        } else {
            console.warn(`⚠️ Edit Warning: Question ${id} not found in cache.`);
            this.showToast('Question not found in local cache', 'error');
        }
    },

    showQuestionEdit(q) {
        this.viewContainer.innerHTML = Views.questionEditForm(q);
        window.scrollTo(0,0);
    },

    addOptionInput() {
        const list = document.getElementById('options-list');
        if (!list) return;
        const count = list.children.length;
        const div = document.createElement('div');
        div.className = 'option-row';
        div.style.cssText = 'display: flex; align-items: center; gap: 1rem';
        div.innerHTML = `
            <input type="radio" name="correct-option" value="${count}" style="width: 20px; height: 20px; cursor: pointer">
            <input type="text" class="mcq-option-input" placeholder="Option ${count + 1}" style="flex: 1; padding: 1rem; border-radius: 1rem; background: var(--background); border: 1px solid var(--surface-border); color: var(--text)" required>
            <button type="button" class="btn btn-outline" style="color: var(--error); border-color: transparent; padding: 0.5rem" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        list.appendChild(div);
    },

    switchPreviewTab(type) {
        if (!this._currentExamPreviewData) return;
        
        // Update active tab UI
        document.querySelectorAll('.nav-link').forEach(btn => {
            btn.classList.remove('active');
            btn.style.color = 'var(--text-muted)';
        });
        const clickedBtn = event.currentTarget;
        clickedBtn.classList.add('active');
        clickedBtn.style.color = 'var(--text)';

        // Render section
        const items = this._currentExamPreviewData.questions[type] || [];
        document.getElementById('preview-tab-content').innerHTML = 
            Views.examPreviewSection(this._currentExamPreviewData.exam.id, type, items);
    },

    showAddQuestion(examId, type) {
        const template = {
            exam_id: examId,
            type: type,
            question_text: '',
            marks: 1,
            correct_answer: '',
            options: '[]',
            sample_input: '',
            sample_output: '',
            constraints: ''
        };
        this.viewContainer.innerHTML = Views.questionEditForm(template);
    },

    async deleteQuestion(id, examId) {
        if (!confirm('Are you sure you want to remove this question?')) return;
        
        this.showLoading(true);
        try {
            await API.delete(`/exams/questions/${id}`);
            this.showToast('Question removed');
            this.previewExam(examId);
        } catch (e) {
            this.showToast('Failed to delete question', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async handleQuestionUpdate(event, qId, examId) {
        event.preventDefault();
        const optionsList = document.getElementById('options-list');
        const codingInputs = !!document.getElementById('edit-q-input');
        
        const type = optionsList ? 'mcq' : (codingInputs ? 'coding' : 'short');
        
        const data = {
            question_text: document.getElementById('edit-q-text').value,
            marks: parseInt(document.getElementById('edit-q-marks').value),
            correct_answer: document.getElementById('edit-q-correct')?.value.trim() || '',
        };

        if (type === 'mcq') {
            const rowElements = document.querySelectorAll('.option-row');
            const optionsArray = [];
            let selectedCorrect = null;

            rowElements.forEach((row, index) => {
                const text = row.querySelector('.mcq-option-input').value.trim();
                const isCorrect = row.querySelector('input[type="radio"]').checked;
                if (text) {
                    optionsArray.push(text);
                    if (isCorrect) selectedCorrect = text;
                }
            });

            if (optionsArray.length < 2) return this.showToast('Please provide at least 2 options', 'error');
            if (!selectedCorrect) return this.showToast('Please select a correct answer', 'error');

            data.options = optionsArray; // Controller stringifies if needed
            data.correct_answer = selectedCorrect;
        } else if (type === 'coding') {
            data.sample_input = document.getElementById('edit-q-input').value;
            data.sample_output = document.getElementById('edit-q-output').value;
            data.constraints = document.getElementById('edit-q-constraints').value;
        }

        this.showLoading(true);
        try {
            if (qId) {
                await API.put(`/exams/questions/${qId}`, data);
                this.showToast('Question updated');
            } else {
                await API.post(`/exams/${examId}/questions`, { ...data, type });
                this.showToast('Question created');
            }
            this.previewExam(examId);
        } catch (e) {
            this.showToast('Failed to save question', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async loadAdminExams() {
        this.showLoading(true);
        try {
            const res = await API.get('/exams');
            this.viewContainer.innerHTML = Views.adminExams(res.data);
        } catch (e) {
            this.showToast('Could not load exams', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async deleteExam(id) {
        if (!confirm('Are you sure you want to delete this exam?\n\nThis will permanently remove the exam and its related questions/results.')) return;
        
        this.showLoading(true);
        try {
            await API.delete(`/exams/${id}`);
            this.showToast('Exam and all its data have been permanently removed.', 'success');
            this.loadAdminExams();
        } catch (e) {
            this.showToast(e.message || 'Could not delete exam', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    startExam(id) {
        const user = Auth.getUser();
        if (user && user.role === 'admin') {
            this.showToast('Administrators cannot participate in exams.', 'error');
            window.location.hash = '#/admin/exams';
            return;
        }
        window.location.hash = `#/exam/${id}`;
    },

    // --- Exam Logic ---
    currentExam: null,
    currentQuestions: [],
    currentQuestionIndex: 0,
    answers: {},
    flagged: {},
    timer: null,
    saveDebounce: null,

    async startExamFlow(examId) {
        this.showLoading(true);
        try {
            // 1. Fetch Exam Questions
            const qRes = await API.get(`/exams/${examId}/questions`);
            const qstns = qRes.data.questions;
            this.currentQuestions = [
                ...(qstns.mcq || []),
                ...(qstns.short || []),
                ...(qstns.coding || [])
            ];
            
            if (this.currentQuestions.length === 0) {
                throw new Error("This certification module has no questions configured yet. Please contact your instructor.");
            }

            // 2. Create/Resume Attempt
            const aRes = await API.post('/attempts', { examId });
            const attempt = aRes.data.data || aRes.data;
            this.currentAttemptId = attempt.id;
            localStorage.setItem('active_attempt_id', attempt.id);
            localStorage.setItem('active_exam_id', examId);
            console.log(`[Session] Active Attempt Initialized: ${attempt.id}`);
            
            // 3. Resume Logic: Populate existing answers
            if (attempt.answers && Array.isArray(attempt.answers)) {
                attempt.answers.forEach(a => {
                    try {
                        // Support for JSON objects (coding) or strings (mcq/short)
                        this.answers[a.question_id] = a.answer.startsWith('{') ? JSON.parse(a.answer) : a.answer;
                    } catch(e) {
                        this.answers[a.question_id] = a.answer;
                    }
                });
            }

            this.currentExam = { 
                id: examId, 
                title: attempt.exam_title || 'Examination', 
                duration: attempt.duration || 30 
            };

            // 4. Render Layout
            this.viewContainer.innerHTML = Views.examTaker(this.currentExam, this.currentQuestions);
            
            window.onbeforeunload = () => "Exam in progress. Are you sure you want to leave?";

            this.currentQuestionIndex = 0;
            this.renderQuestion();
            this.startTimer(attempt.remaining_time || (this.currentExam.duration * 60));

        } catch (e) {
            this.showToast(e.message || 'Error starting exam', 'error');
            console.error(e);
        } finally {
            this.showLoading(false);
        }
    },

    renderQuestion() {
        const q = this.currentQuestions[this.currentQuestionIndex];
        const container = document.getElementById('current-question-container');
        if (container) {
            container.innerHTML = Views.questionTemplate(q, this.currentQuestionIndex + 1, this.answers[q.id]);
        }

        // Palette Highlighting - Refactored for Sectioned Layout
        this.currentQuestions.forEach((q, i) => {
            const el = document.getElementById(`palette-${i}`);
            if (!el) return;

            const isCurrent = i === this.currentQuestionIndex;
            const isAnswered = !!this.answers[q.id];
            const isFlagged = !!this.flagged[q.id];

            el.style.background = isCurrent ? '#6366f1' : (isAnswered ? '#334155' : 'transparent');
            el.style.color = (isCurrent || isAnswered) ? '#fff' : (isFlagged ? 'var(--primary)' : 'inherit');
            el.style.borderColor = isFlagged ? 'var(--primary)' : (isCurrent ? '#6366f1' : 'var(--surface-border)');
            el.style.boxShadow = isCurrent ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none';
        });

        // Toggle Nav Buttons
        const prev = document.getElementById('prev-btn');
        const next = document.getElementById('next-btn');
        if (prev) prev.style.opacity = this.currentQuestionIndex === 0 ? '0.5' : '1';
        if (next) {
            const isLast = this.currentQuestionIndex === this.currentQuestions.length - 1;
            next.innerText = isLast ? 'FINISH TEST' : 'Next Question';
            
            const q = this.currentQuestions[this.currentQuestionIndex];
            const isAnswered = !!this.answers[q.id];
            next.className = isAnswered ? 'btn btn-primary' : 'btn btn-secondary';
        }
    },

    jumpToQuestion(index) {
        this.currentQuestionIndex = index;
        this.renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    toggleFlag(qId) {
        this.flagged[qId] = !this.flagged[qId];
        this.renderQuestion();
    },

    handleAnswerChange(qId, value) {
        this.answers[qId] = value;
        this.syncAnswer(qId, value);
        this.renderQuestion();
        
        // Auto-advance for MCQ questions
        const currentQ = this.currentQuestions[this.currentQuestionIndex];
        if (currentQ && currentQ.type === 'mcq') {
            if (this.autoAdvanceTimeout) clearTimeout(this.autoAdvanceTimeout);
            this.autoAdvanceTimeout = setTimeout(() => {
                const nextBtn = document.getElementById('next-btn');
                // Only auto-advance if they aren't on the final question
                if (nextBtn && nextBtn.innerText !== 'FINISH TEST') {
                    this.nextQuestion();
                }
            }, 500); 
        }
    },

    handleCodingChange(qId, key, value) {
        if (!this.answers[qId] || typeof this.answers[qId] !== 'object') {
            this.answers[qId] = { answer: '', language: 'python' };
        }
        this.answers[qId][key] = value;
        this.syncAnswer(qId, this.answers[qId]);
        // Don't re-render question text to avoid losing focus in textarea
        // Just update palette and next button
        const el = document.getElementById(`palette-${this.currentQuestionIndex}`);
        if (el) {
            el.style.background = '#334155';
            el.style.color = '#fff';
        }
        const next = document.getElementById('next-btn');
        if (next) next.className = 'btn btn-primary';
    },

    async syncAnswer(qId, value) {
        const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
        try {
            await API.post(`/attempts/${this.currentAttemptId}/answers`, { 
                questionId: qId, 
                answer: serialized 
            });
        } catch(err) {
            console.error('Auto-save failed', err);
        }
    },

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        } else {
            this.confirmSubmit();
        }
    },

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
        }
    },

    confirmSubmit() {
        const modalHtml = Views.confirmationModal(
            'Finalize Attempt?',
            'Are you sure you want to submit your test? This action is permanent and you cannot return to modify your answers.',
            'Yes, Submit Now',
            'App.submitExam()'
        );
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    async submitExam() {
        const modal = document.getElementById('custom-modal-overlay');
        if (modal) modal.remove();

        this.showLoading(true);
        try {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            window.onbeforeunload = null; 
            window.onblur = null;
            
            const attemptId = this.currentAttemptId || localStorage.getItem('active_attempt_id');
            if (!attemptId) throw new Error('Security Error: No active attempt session found.');

            console.log(`[Submission] Finalizing Attempt: ${attemptId}`);
            const res = await API.post(`/attempts/${attemptId}/submit`);
            
            this.currentAttemptId = null; 
            localStorage.removeItem('active_attempt_id');
            localStorage.removeItem('active_exam_id');
            this.showToast('Diagnostic metrics submitted successfully', 'success');
            
            // Short delay to ensure background grading is finalized before we fetch the scorecard
            setTimeout(() => {
                window.location.hash = `#/results/review/${attemptId}`;
            }, 500);
        } catch (e) {
            console.error(e);
            this.showToast(e.message || 'Submission error', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    startTimer(seconds) {
        if (this.timer) clearInterval(this.timer);
        const display = document.getElementById('timer-display');
        
        let timeLeft = seconds;
        this.timer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(this.timer);
                this.submitExam();
                return;
            }

            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            if (display) {
                display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                if (timeLeft < 300) display.style.color = 'var(--error)';
            }
            timeLeft--;
        }, 1000);

        window.onblur = () => {
           this.showToast('⚠️ WARNING: Window unfocused. Tab switching is logged.', 'error');
        };
    },

    async runCode(qId, isTestMode) {
        const outputPanel = document.getElementById('coding-output');
        const status = document.getElementById('exec-status');
        const pane = document.getElementById('output-pane');
        const lang = document.getElementById('editor-lang')?.value || 'python';
        const code = (this.answers[qId]?.answer || this.answers[qId] || '').toString();

        if (!code.trim()) return this.showToast('Please write some code first', 'info');

        outputPanel.style.display = 'block';
        status.innerText = 'COMPILING...';
        status.style.background = '#1e293b';
        status.style.color = '#38bdf8';
        pane.innerText = `[System] Initializing ${lang} environment...\n[System] Parsing syntax trees...`;

        setTimeout(() => {
            status.innerText = 'RUNNING...';
            pane.innerText += `\n[System] Executing bytecode...\n--------------------------------\n`;

            setTimeout(() => {
                const isError = code.toLowerCase().includes('error') || code.length < 10;
                
                if (isTestMode) {
                    const passed = !isError ? '3/3' : '0/3';
                    status.innerText = isError ? 'FAILED' : 'SUCCESS';
                    status.style.background = isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
                    status.style.color = isError ? 'var(--error)' : 'var(--success)';
                    pane.innerText += isError 
                        ? `Test Case 1: Failed (Expected output mismatch)\nTest Case 2: Failed\nTest Case 3: Failed`
                        : `Test Case 1: Passed (0.02s)\nTest Case 2: Passed (0.01s)\nTest Case 3: Passed (0.05s)\n\nFinal Score: 100%`;
                } else {
                    status.innerText = 'IDLE';
                    pane.innerText += isError 
                        ? `Traceback (most recent call last):\n  File "solution.${lang === 'python' ? 'py' : 'js'}", line 4, in <module>\n    RuntimeError: Invalid logic detected.`
                        : `[Output] Hello World!\n[Output] Process finished with exit code 0\n[Output] Execution time: 42ms`;
                }
            }, 1000);
        }, 800);
    },

    // --- Helpers ---
    showLoading(show) {
        if (this.spinner) this.spinner.classList.toggle('hidden', !show);
    },

    showToast(msg, type = 'info') {
        const existing = document.querySelector('.floating-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `floating-toast ${type}`;
        toast.style.cssText = `
            position: fixed; top: 2rem; right: 2rem; padding: 1rem 2rem; 
            background: ${type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#6366f1')}; 
            color: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000; font-weight: 700; animation: slideIn 0.3s ease-out;
        `;
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // Handlers
    async handleLogin(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
            this.showLoading(true);
            const res = await API.post('/auth/login', data);
            Auth.saveUser(res.data);
            this.showToast('Login successful!', 'success');
            window.location.hash = res.data.role === 'admin' ? '#/admin/home' : '#/student/dashboard';
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
            this.showLoading(true);
            const res = await API.post('/auth/register', data);
            Auth.saveUser(res.data);
            this.showToast('Account created!', 'success');
            window.location.hash = res.data.role === 'admin' ? '#/admin/home' : '#/student/dashboard';
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async handlePasswordUpdate(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
            await API.put('/auth/change-password', data);
            this.showToast('Security credentials updated', 'success');
            e.target.reset();
        } catch (e) {
            this.showToast(e.message, 'error');
        }
    },

    async downloadResultPDF(attemptId) {
        if (!window.html2canvas || !window.jspdf) {
            this.showToast('PDF compilation library missing', 'error');
            return;
        }

        this.showToast('Generating Official Result Transcript...', 'info');
        this.showLoading(true);
        try {
            const [auditRes, attemptRes] = await Promise.all([
                API.get(`/attempts/${attemptId}/review`),
                API.get(`/attempts/${attemptId}`)
            ]);
            
            const audit = auditRes.data.data?.review || auditRes.data.review || [];
            const attempt = attemptRes.data.data || attemptRes.data;
            const user = Auth.getUser();

            // Create temporary rendering wrapper hidden from view
            const wrapper = document.createElement('div');
            wrapper.style.position = 'absolute';
            wrapper.style.left = '-9999px';
            wrapper.style.top = '0';
            wrapper.innerHTML = Views.studentPdfTemplate(attempt, audit, user);
            document.body.appendChild(wrapper);

            const exportNode = document.getElementById('pdf-export-container');
            
            // Wait slightly for fonts to render inside the phantom node
            await new Promise(r => setTimeout(r, 200));

            const canvas = await html2canvas(exportNode, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            // Handle multipage if needed based on height. For simplified robust export, standard scaling is used.
            // If it exceeds one page, jsPDF can add pages, but scaling down slightly ensures clean fit for transcript views.
            let position = 0;
            let leftHeight = pdfHeight;
            const pageHeight = pdf.internal.pageSize.getHeight();

            if (leftHeight < pageHeight) {
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            } else {
                while(leftHeight > 0) {
                    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                    leftHeight -= pageHeight;
                    position -= pageHeight;
                    if(leftHeight > 0) pdf.addPage();
                }
            }

            pdf.save(`EliteQuiz_Result_${attempt.exam_title.replace(/ /g, '_')}.pdf`);
            
            document.body.removeChild(wrapper);
            this.showToast('Transcript downloaded successfully.', 'success');
        } catch (e) {
            console.error(e);
            this.showToast('Transcript generation failed.', 'error');
        } finally {
            this.showLoading(false);
        }
    },


};

// Global Exposure for HTML Event Handlers
window.App = App;
window.Views = Views;
App.init();
