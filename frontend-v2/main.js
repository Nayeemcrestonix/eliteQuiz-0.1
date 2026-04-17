import API from './services/api.js';
import Auth from './services/auth.js';
import Views from './engine/views.js';

const App = {
    viewTerminal: document.getElementById('view-terminal'),
    navLinks: document.getElementById('auth-links'),
    spinner: document.getElementById('global-spinner'),
    
    // Exam Session Hub
    currentExam: null,
    currentQuestions: [],
    currentQuestionIdx: 0,
    answers: {}, // Live sync storage
    timer: null,
    currentResultsData: null,
    filteredResults: [],
    sortKey: 'score',
    sortDir: 'desc',

    async init() {
        console.log("💎 EliteQuiz Engine initialized");
        this.loadTheme();
        window.onhashchange = () => this.route();
        this.route();
    },

    toggleTheme() {
        const isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem('v2-theme', isLight ? 'light' : 'dark');
        this.updateThemeIcon(isLight);
    },

    loadTheme() {
        const saved = localStorage.getItem('v2-theme');
        if (saved === 'light') {
            document.body.classList.add('light-mode');
            this.updateThemeIcon(true);
        }
    },

    updateThemeIcon(isLight) {
        const icon = document.querySelector('#v2-theme-toggle i');
        if (icon) icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
    },

    setLoading(isLoading) {
        if (this.spinner) this.spinner.classList.toggle('hidden', !isLoading);
    },

    showToast(msg, type = 'info') {
        const container = document.getElementById('toast-notifications');
        const toast = document.createElement('div');
        toast.className = 'glass-card animate-up';
        toast.style.cssText = `
            padding: 1rem 2rem; border-left: 4px solid ${type === 'error' ? 'var(--error)' : (type === 'success' ? 'var(--success)' : 'var(--primary)')};
            background: rgba(15, 23, 42, 0.95); min-width: 300px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        toast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}" style="margin-right:0.75rem; opacity:0.7"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => { if(toast) toast.remove(); }, 4000);
    },

    async route() {
        const hash = window.location.hash || '#/';
        const user = Auth.user();
        this.navLinks.innerHTML = Views.authLinks();

        try {
            if (hash === '#/' || hash === '#/home') {
                this.viewTerminal.innerHTML = Views.landing();
            } else if (hash === '#/login') {
                this.viewTerminal.innerHTML = Views.login();
            } else if (hash === '#/register') {
                this.viewTerminal.innerHTML = Views.register();
            } else if (hash.startsWith('#/admin')) {
                if (!user || user.role !== 'admin') { window.location.hash = '#/login'; return; }
                
                if (hash === '#/admin/home') {
                    this.setLoading(true);
                    const res = await API.get('/admin/dashboard');
                    this.viewTerminal.innerHTML = Views.adminHome(res.data);
                    this.initAdminChart();
                } else if (hash === '#/admin/exams') {
                    this.setLoading(true);
                    const res = await API.get('/exams'); 
                    this.viewTerminal.innerHTML = Views.adminExams(res.data);
                } else if (hash === '#/admin/exams/new') {
                    this.viewTerminal.innerHTML = Views.createExam();
                } else if (hash.startsWith('#/admin/exams/preview/')) {
                    const id = hash.split('/').pop();
                    this.previewExam(id);
                }
            } else if (hash === '#/student/dashboard') {
                if (!user) { window.location.hash = '#/login'; return; }
                this.setLoading(true);
                const data = await API.get('/results/dashboard');
                this.viewTerminal.innerHTML = Views.studentDashboard(data.data || data);
                this.startGlobalTimers();
            } else if (hash === '#/student/exams') {
                if (!user) { window.location.hash = '#/login'; return; }
                await this.loadStudentExams();
            } else if (hash === '#/student/leaderboard') {
                if (!user) { window.location.hash = '#/login'; return; }
                await this.loadLeaderboard();
            } else if (hash === '#/student/results') {
                if (!user) { window.location.hash = '#/login'; return; }
                this.setLoading(true);
                const res = await API.get('/attempts');
                this.viewTerminal.innerHTML = Views.studentResultsSummary(res.data);
            } else if (hash === '#/student/history') {
                if (!user) { window.location.hash = '#/login'; return; }
                this.setLoading(true);
                const res = await API.get('/attempts');
                this.viewTerminal.innerHTML = Views.studentHistory(res.data);
            } else if (hash === '#/student/profile') {
                if (!user) { window.location.hash = '#/login'; return; }
                this.setLoading(true);
                const res = await API.get(`/admin/students/analysis/${user.id}`);
                this.viewTerminal.innerHTML = Views.profilePage(res.data);
            } else if (hash === '#/student/notifications') {
                if (!user) { window.location.hash = '#/login'; return; }
                await this.loadNotifications();
            } else if (hash.startsWith('#/result/')) {
                const id = hash.split('/').pop();
                await this.showDetailedResult(id);
            } else if (hash === '#/exams') {
                const res = await API.get('/exams');
                this.viewTerminal.innerHTML = Views.adminExams(res.data); // Shared list for now
            } else if (hash.startsWith('#/exam/')) {
                const id = hash.split('/').pop();
                this.startExamSequence(id);
            } else if (hash === '#/admin/results') {
                if (!user || user.role !== 'admin') { window.location.hash = '#/login'; return; }
                this.setLoading(true);
                const res = await API.get('/exams');
                this.viewTerminal.innerHTML = Views.adminResults(res.data);
            } else if (hash.startsWith('#/admin/results/')) {
                const id = hash.split('/').pop();
                await this.loadExamResults(id);
            } else {
                this.viewTerminal.innerHTML = `<div class="container" style="padding: 10rem; text-align: center"><h3>Neural Section oscillating in maintenance mode</h3><a href="#/" class="btn btn-primary" style="margin-top: 2rem">Return to Home</a></div>`;
            }
        } catch (err) {
            this.showToast(err.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    // --- Identity Loop ---
    async handleLogin(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        this.setLoading(true);
        try {
            const res = await API.post('/auth/login', data);
            Auth.save(res.data || res);
            this.showToast('Terminal Synchronized.', 'success');
            window.location.hash = (res.data?.role || res.role) === 'admin' ? '#/admin/home' : '#/student/dashboard';
        } catch (err) {
            this.showToast(err.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        this.setLoading(true);
        try {
            const res = await API.post('/auth/register', data);
            Auth.save(res.data || res);
            this.showToast('Profile Initialized.', 'success');
            window.location.hash = (res.data?.role || res.role) === 'admin' ? '#/admin/home' : '#/student/dashboard';
        } catch (err) {
            this.showToast(err.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    // --- Admin Operations ---
    async handleCreateExam(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        this.setLoading(true);
        try {
            await API.post('/exams', data);
            this.showToast('Certification Provisioned.', 'success');
            window.location.hash = '#/admin/exams';
        } catch (err) {
            this.showToast(err.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async publishExam(id) {
        this.setLoading(true);
        try {
            await API.put(`/admin/exams/${id}/publish`);
            this.showToast('Certification is now LIVE.', 'success');
            this.previewExam(id);
        } catch (err) {
            this.showToast('Lockdown failed', 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async deleteExam(id) {
        if (!confirm('Are you sure you want to permanently remove this certification?\n\nAll candidate attempts and question data will be lost.')) return;
        this.setLoading(true);
        try {
            await API.delete(`/exams/${id}`);
            this.showToast('Certification removed from archives.', 'success');
            // Refresh list or go back
            if (window.location.hash.includes('preview')) {
                window.location.hash = '#/admin/exams';
            } else {
                const res = await API.get('/exams'); 
                this.viewTerminal.innerHTML = Views.adminExams(res.data);
            }
        } catch (err) {
            this.showToast('Erasure failed: ' + err.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async deleteQuestion(id, examId) {
        if (!confirm('Delete this knowledge asset?')) return;
        this.setLoading(true);
        try {
            await API.delete(`/exams/questions/${id}`);
            this.showToast('Asset removed.', 'info');
            this.previewExam(examId);
        } catch (err) {
            this.showToast('Asset removal frozen: ' + err.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    startGlobalTimers() {
        if (this.globalInterval) clearInterval(this.globalInterval);
        
        const update = async () => {
            const timers = document.querySelectorAll('.v2-timer');
            const now = new Date().getTime();
            
            // 1. Update Visual countdowns
            timers.forEach(timer => {
                const until = new Date(timer.dataset.until).getTime();
                const diff = until - now;
                
                if (diff <= 0) {
                    timer.innerHTML = '<span style="color: var(--success); font-weight: 800; letter-spacing: 0.1em">WINDOW OPEN</span>';
                    return;
                }
                
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                
                timer.innerText = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            });

            // 2. High-Frequency Notification Sync (Every 30s)
            const secondCount = Math.floor(now / 1000);
            if (secondCount % 30 === 0) {
                try {
                    const res = await API.get('/results/dashboard');
                    const data = res.data || res;
                    const dot = document.getElementById('nav-notif-dot');
                    if (dot) dot.style.display = (data.notifications && data.notifications.length > 0) ? 'block' : 'none';
                } catch (e) { /* silent fail */ }
            }
        };
        
        update();
        this.globalInterval = setInterval(update, 1000);
    },

    async loadStudentExams() {
        this.setLoading(true);
        try {
            const res = await API.get('/exams'); 
            const exams = res.data || res;
            const now = new Date();
            
            // Check attempts to find completed ones
            const attemptsRes = await API.get('/attempts');
            const completedIds = (attemptsRes.data || attemptsRes).map(a => a.exam_id);

            const processed = exams.map(e => ({
                ...e,
                isCompleted: completedIds.includes(e.id)
            }));

            this.currentExamsData = {
                live: processed.filter(e => !e.isCompleted && new Date(e.start_time) <= now && (!e.end_time || new Date(e.end_time) >= now)),
                upcoming: processed.filter(e => !e.isCompleted && new Date(e.start_time) > now),
                completed: processed.filter(e => e.isCompleted)
            };

            this.viewTerminal.innerHTML = Views.studentExams(this.currentExamsData);
            this.startGlobalTimers();
        } catch (err) {
            this.showToast('Failed to load certification manifest', 'error');
        } finally {
            this.setLoading(false);
        }
    },

    switchExamTab(type) {
        const content = document.getElementById('exam-tab-content');
        const btns = document.querySelectorAll('.tab-btn');
        
        btns.forEach(b => {
            b.classList.toggle('active', b.innerText.toLowerCase().includes(type));
        });

        if (content) {
            content.innerHTML = Views.renderExamTab(type, this.currentExamsData[type]);
            this.startGlobalTimers();
        }
    },

    async loadLeaderboard() {
        this.setLoading(true);
        try {
            // By default, fetch results for the most recent exam
            const dashRes = await API.get('/results/dashboard');
            const dashData = dashRes.data || dashRes;
            
            let examId = null;
            let title = "Global Benchmarking";

            if (dashData.results && dashData.results.length > 0) {
                examId = dashData.results[0].exam_id;
                title = dashData.results[0].exam_title;
            } else if (dashData.upcoming && dashData.upcoming.length > 0) {
                examId = dashData.upcoming[0].id;
                title = dashData.upcoming[0].title;
            }

            if (examId) {
                const res = await API.get(`/results/leaderboard/${examId}`);
                this.viewTerminal.innerHTML = Views.leaderboard(res.data, title);
            } else {
                this.viewTerminal.innerHTML = Views.leaderboard([], "Neural Consensus");
            }
        } catch (err) {
            this.showToast('Ranking sync failed', 'error');
        } finally {
            this.setLoading(false);
        }
    },

    jumpToQuestion(idx) {
        if (idx < 0 || idx >= this.currentQuestions.length) return;
        this.currentQuestionIdx = idx;
        const q = this.currentQuestions[idx];
        const container = document.getElementById('q-container');
        if (container) {
            container.innerHTML = Views.questionRenderer(q, idx, this.currentQuestions.length, this.answers[q.id]);
            this.updateFlagButton();
        }
        this.updatePalette();
    },

    saveAnswer(qId, val, idx) {
        this.answers[qId] = val;
        this.updatePalette();
        
        // Visual feedback for save (immediate)
        const btn = document.querySelector(`.palette-item#p-item-${idx}`);
        if(btn) btn.classList.add('answered');
    },

    startCountdown(seconds) {
        if (this.timer) clearInterval(this.timer);
        let timeLeft = seconds;
        const display = document.getElementById('v2-countdown');
        
        this.timer = setInterval(() => {
            if (timeLeft <= -30) { // Hard limit: official duration + 30s grace
                clearInterval(this.timer);
                this.forceSubmit();
                return;
            }

            if (timeLeft <= 0) {
                if (display) {
                    display.innerText = '00:00:00';
                    display.style.background = 'var(--error-glow)';
                    display.style.borderColor = 'var(--error)';
                    display.style.color = 'var(--error)';
                }
                const status = document.getElementById('save-status');
                if (status) status.innerHTML = '<span style="color:var(--error)">OFFICIAL TIME EXPIRED // AUTO-SYNCING</span>';
                
                // Allow up to 30s for any final in-flight syncs before hard closing
            } else {
                const mins = Math.floor(timeLeft / 60);
                const secs = timeLeft % 60;
                if (display) display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
            timeLeft--;
        }, 1000);
    },

    async forceSubmit() {
        this.showToast('Official session duration reached. Synchronizing final state...', 'warning');
        if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
        try {
            await API.post(`/attempts/${this.currentExam.id}/submit`);
            this.showToast('Certification protocol auto-finalized.', 'success');
            window.onbeforeunload = null;
            window.location.hash = '#/student/results';
        } catch (e) {
            window.location.hash = '#/student/dashboard';
        }
    },

    // --- Candidate Terminal Loop ---
    async startExamSequence(id) {
        this.setLoading(true);
        try {
            // Check if attempt already exists (Resume support)
            const attemptRes = await API.post('/attempts', { examId: id });
            const attempt = attemptRes.data || attemptRes;
            
            const questionsRes = await API.get(`/exams/${id}/questions`);
            const { exam, questions } = questionsRes.data;
            
            this.currentExam = { ...exam, ...attempt }; 
            this.currentQuestions = [...questions.mcq, ...questions.short, ...questions.coding];
            
            // Resume state
            this.currentQuestionIdx = attempt.last_question_idx || 0;
            this.answers = {};
            if (attempt.answers) {
                attempt.answers.forEach(a => {
                    this.answers[a.question_id] = a.answer;
                });
            }
            this.flaggedQuestions = JSON.parse(attempt.flagged_questions || '[]');
            
            this.viewTerminal.innerHTML = Views.examTerminal(exam, this.currentQuestions);
            this.jumpToQuestion(this.currentQuestionIdx);
            
            // Start Server-synced Timer
            this.startCountdown(attempt.remaining_time || (exam.duration * 60));
            
            // Initialize Auto-Save Interval (3s Heartbeat)
            if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = setInterval(() => this.performAutoSave(), 3000);
            
            // Distraction Free Persistence
            window.onbeforeunload = (e) => {
                e.preventDefault();
                return "Critical certification in progress. Unscheduled termination will result in protocol failure.";
            };
            
            // Disable right click and dev tools common keys
            document.oncontextmenu = (e) => e.preventDefault();
            document.onkeydown = (e) => {
                if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 's')) e.preventDefault();
                if (e.key === 'F12') e.preventDefault();
            };
        } catch (err) {
            this.showToast('Access to terminal denied: ' + err.message, 'error');
            window.location.hash = '#/student/dashboard';
        } finally {
            this.setLoading(false);
        }
    },

    async performAutoSave() {
        if (!this.currentExam || !this.currentQuestions) return;
        
        const status = document.getElementById('save-status');
        if (status) status.innerText = 'SYNCING...';

        try {
            const currentQ = this.currentQuestions[this.currentQuestionIdx];
            await API.post(`/attempts/${this.currentExam.id}/answers`, {
                questionId: currentQ.id,
                answer: this.answers[currentQ.id] || '',
                last_question_idx: this.currentQuestionIdx,
                flagged_questions: this.flaggedQuestions
            });
            if (status) status.innerText = 'DATA PERSISTED';
        } catch (err) {
            if (status) status.innerText = 'OFFLINE';
        }
    },

    nextQuestion() {
        if (this.currentQuestionIdx < this.currentQuestions.length - 1) {
            this.jumpToQuestion(this.currentQuestionIdx + 1);
        }
    },

    prevQuestion() {
        if (this.currentQuestionIdx > 0) {
            this.jumpToQuestion(this.currentQuestionIdx - 1);
        }
    },

    toggleFlag() {
        const qId = this.currentQuestions[this.currentQuestionIdx].id;
        const exists = this.flaggedQuestions.indexOf(qId);
        if (exists > -1) {
            this.flaggedQuestions.splice(exists, 1);
        } else {
            this.flaggedQuestions.push(qId);
        }
        this.updatePalette();
        this.updateFlagButton();
    },

    updateFlagButton() {
        const btn = document.getElementById('btn-flag');
        if (!btn) return;
        const qId = this.currentQuestions[this.currentQuestionIdx].id;
        const isFlagged = this.flaggedQuestions.includes(qId);
        btn.innerHTML = isFlagged ? '<i class="fas fa-flag"></i> UNFLAG' : 'FLAG FOR REVIEW';
        btn.style.background = isFlagged ? 'rgba(239, 68, 68, 0.1)' : 'transparent';
    },

    updatePalette() {
        this.currentQuestions.forEach((q, i) => {
            const btn = document.getElementById(`p-item-${i}`);
            if (btn) {
                btn.classList.toggle('active', i === this.currentQuestionIdx);
                btn.classList.toggle('answered', !!this.answers[q.id]);
                btn.classList.toggle('flagged', this.flaggedQuestions.includes(q.id));
            }
        });
    },

    async simulateCode(qId) {
        const output = document.getElementById('v2-code-output');
        const code = this.answers[qId] || '';
        
        output.style.display = 'block';
        output.style.color = 'var(--text-muted)';
        output.innerText = 'Initializing isolated sandbox...';

        try {
            const res = await API.post('/exams/run-code', {
                code,
                language: 'python', // Default for now
                questionId: qId
            });
            output.style.color = res.data.status === 'success' ? 'var(--success)' : 'var(--error)';
            output.innerText = res.data.output || res.data.stderr;
        } catch (err) {
            output.style.color = 'var(--error)';
            output.innerText = 'Execution Engine Timeout: ' + err.message;
        }
    },

    async submitExam() {
        if (!confirm('Proceed with Final Submission? This action will freeze your response hash and finalize the certification protocol.')) return;
        
        if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
        if (this.timer) clearInterval(this.timer);

        this.setLoading(true);
        try {
            await API.post(`/attempts/${this.currentExam.id}/submit`);
            this.showToast('Certification protocol successfully finalized.', 'success');
            window.onbeforeunload = null;
            document.onkeydown = null;
            document.oncontextmenu = null;
            window.location.hash = '#/student/results';
        } catch (err) {
            this.showToast('Protocol rejection: ' + err.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async showDetailedResult(id) {
        this.setLoading(true);
        try {
            const auditRes = await API.get(`/results/audit/${id}`);
            const attemptRes = await API.get(`/results/me`); // To get summary info
            const attempt = attemptRes.data.find(a => a.id == id);
            
            const modalHtml = Views.answerSheetModal(auditRes.data, attempt || { id, user_name: this.currentUser.name, score: 'N/A' });
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        } catch (err) {
            this.showToast('Audit access denied: ' + err.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    // --- Utilities ---
    async runDiagnostics(qId) {
        const textarea = document.querySelector('textarea.code-input');
        const code = textarea ? textarea.value : '';
        const output = document.getElementById('v2-code-output');
        
        output.style.display = 'block';
        output.style.color = 'var(--text-muted)';
        output.innerText = 'INITIALIZING ISOLATED SANDBOX...';

        try {
            const res = await API.post('/exams/run-code', {
                code,
                language: 'python', // Default for now
                questionId: qId
            });
            output.style.color = res.data.status === 'success' ? 'var(--success)' : 'var(--error)';
            output.innerText = (res.data.output || res.data.stderr) + '\n\n-----------------\nEXECUTION TIME: ' + res.data.executionTime;
        } catch (err) {
            output.style.color = 'var(--error)';
            output.innerText = 'EXECUTION ENGINE TIMEOUT: ' + err.message;
        }
    },

    initAdminChart() {
        const ctx = document.getElementById('v2-admin-chart');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Efficiency',
                    data: [65, 59, 80, 81],
                    borderColor: '#6366f1',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    },

    // --- Results & Analytics Protocol ---
    async loadExamResults(id) {
        this.setLoading(true);
        try {
            const [examRes, analyticsRes] = await Promise.all([
                API.get(`/exams/${id}`),
                API.get(`/results/analytics/${id}`)
            ]);
            
            this.currentResultsData = analyticsRes.data;
            this.filteredResults = [...analyticsRes.data.leaderboard];
            
            this.viewTerminal.innerHTML = Views.adminResultsDetail(examRes.data, analyticsRes.data);
            this.initResultChart(analyticsRes.data.distribution);
        } catch (err) {
            this.showToast('Synchronization failed: ' + err.message, 'error');
            window.location.hash = '#/admin/results';
        } finally {
            this.setLoading(false);
        }
    },

    initResultChart(distribution) {
        const ctx = document.getElementById('distribution-chart');
        if (!ctx) return;

        const labels = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
        const dataMap = distribution.reduce((acc, d) => {
            acc[d.range] = d.count;
            return acc;
        }, {});
        const counts = labels.map(l => dataMap[l] || 0);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Candidates',
                    data: counts,
                    backgroundColor: 'rgba(99, 102, 241, 0.5)',
                    borderColor: '#6366f1',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    },

    sortResults(key) {
        if (this.sortKey === key) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortKey = key;
            this.sortDir = 'desc';
        }
        
        this.filteredResults.sort((a, b) => {
            const valA = key === 'name' ? a.user_name : a[key];
            const valB = key === 'name' ? b.user_name : b[key];
            return this.sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
        
        this.renderResultsTable();
    },

    filterResults(val) {
        const q = val.toLowerCase();
        this.filteredResults = this.currentResultsData.leaderboard.filter(l => 
            l.user_name.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q)
        );
        this.renderResultsTable();
    },

    renderResultsTable() {
        const tbody = document.getElementById('results-table-body');
        if (tbody) {
            tbody.innerHTML = Views.renderResultsTableRows(this.filteredResults, this.currentResultsData.stats.passing_score || 40);
        }
    },

    async showAnswerSheet(attemptId) {
        this.setLoading(true);
        try {
            const auditRes = await API.get(`/results/audit/${attemptId}`);
            // Find candidate info from current leaderboard
            const info = this.currentResultsData.leaderboard.find(l => l.id == attemptId);
            
            const modalHtml = Views.answerSheetModal(auditRes.data, info);
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        } catch (err) {
            this.showToast('Audit extraction failed', 'error');
        } finally {
            this.setLoading(false);
        }
    },

    exportResults(format, examId) {
        const { stats, leaderboard } = this.currentResultsData;
        const examTitle = document.querySelector('h1')?.innerText || 'Report';

        if (format === 'excel') {
            const data = leaderboard.map(l => ({
                Candidate: l.user_name,
                Score: l.score,
                'Time Taken (s)': l.time_taken,
                Timestamp: new Date(l.submit_time).toLocaleString(),
                Status: l.score >= stats.passing_score ? 'Pass' : 'Fail'
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Results");
            XLSX.writeFile(wb, `${examTitle}_Results.xlsx`);
        } else {
            // PDF Export
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(22);
            doc.text(examTitle, 14, 20);
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
            
            doc.setFontSize(14);
            doc.text('Summary Metrics', 14, 40);
            doc.setFontSize(10);
            doc.text([
                `Total Submissions: ${stats.total_attempts}`,
                `Average Accuracy: ${Math.round(stats.average_score)}%`,
                `Highest Score: ${stats.highest_score}`,
                `Pass Rate: ${((stats.pass_count / stats.total_attempts) * 100).toFixed(1)}%`
            ], 14, 48);

            // Capture Chart
            const canvas = document.getElementById('distribution-chart');
            if (canvas) {
                const imgData = canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 14, 70, 180, 80);
            }

            // Table
            doc.autoTable({
                startY: 160,
                head: [['Candidate', 'Score', 'Latency (s)', 'Status']],
                body: leaderboard.map(l => [
                    l.user_name, 
                    l.score, 
                    l.time_taken, 
                    l.score >= stats.passing_score ? 'PASS' : 'FAIL'
                ])
            });

            doc.save(`${examTitle}_Report.pdf`);
        }
    },
    async showDetailedResult(attemptId) {
        this.setLoading(true);
        try {
            const auditRes = await API.get(`/results/audit/${attemptId}`);
            // Fetch attempt info too if needed, or just the audit
            const info = {
                user_name: Auth.user().name,
                id: attemptId,
                score: auditRes.data.reduce((acc, q) => acc + (q.marks_earned || 0), 0)
            };
            const modalHtml = Views.answerSheetModal(auditRes.data, info);
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        } catch (err) {
            this.showToast('Audit extraction failed: ' + err.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async handlePasswordUpdate(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        this.setLoading(true);
        try {
            await API.put('/auth/change-password', data);
            this.showToast('Security Hash Synchronized.', 'success');
            e.target.reset();
        } catch (err) {
            this.showToast('Protocol rejection: ' + err.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async exportAuditToPDF(attemptId) {
        this.setLoading(true);
        try {
            const res = await API.get(`/results/audit/${attemptId}`);
            const audit = res.data;
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFont("Outfit", "bold");
            doc.setFontSize(22);
            doc.text("CERTIFICATION AUDIT", 14, 20);
            
            doc.setFontSize(10);
            doc.setFont("Inter", "normal");
            doc.text(`SESSION ID: ${attemptId}`, 14, 28);
            doc.text(`AUDIT TIMESTAMP: ${new Date().toLocaleString()}`, 14, 34);
            
            doc.autoTable({
                startY: 50,
                head: [['#', 'QUESTION NODE', 'RESPONSE', 'STATUS', 'SCORE']],
                body: audit.map((q, i) => [
                    i + 1,
                    q.question_text.length > 50 ? q.question_text.substring(0, 47) + '...' : q.question_text,
                    q.student_answer || 'NONE',
                    q.is_correct ? 'VERIFIED' : 'REJECTED',
                    q.marks_earned || 0
                ]),
                theme: 'grid',
                headStyles: { fillColor: [99, 102, 241] }
            });

            doc.save(`Audit_${attemptId}.pdf`);
            this.showToast('Audit Log Synchronized to PDF', 'success');
        } catch (err) {
            this.showToast('PDF Export Protocol Failure', 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async loadNotifications() {
        this.setLoading(true);
        try {
            const res = await API.get('/results/dashboard');
            const data = res.data || res;
            this.viewTerminal.innerHTML = Views.notificationsList(data.notifications || []);
        } catch (err) {
            this.showToast('Neural feed sync failure', 'error');
        } finally {
            this.setLoading(false);
        }
    },
};

window.App = App;
window.Auth = Auth;
App.init();
