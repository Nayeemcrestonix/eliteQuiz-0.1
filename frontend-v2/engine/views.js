import Auth from '../services/auth.js';

const Views = {
    authLinks() {
        const user = Auth.user();
        if (!user) return `
            <a href="#/login" class="btn btn-outline" style="border:none">Sign In</a>
            <a href="#/register" class="btn btn-primary">Get Started</a>
        `;
        
        const hash = window.location.hash || '#/';
        const isActive = (h) => hash === h ? 'active-nav' : '';

        if (user.role === 'admin') {
            return `
                <div style="display: flex; gap: 2rem; align-items: center">
                    <a href="#/admin/home" class="btn-nav ${isActive('#/admin/home')}">DASHBOARD</a>
                    <a href="#/admin/exams" class="btn-nav ${isActive('#/admin/exams')}">EXAMS</a>
                    <a href="#/admin/results" class="btn-nav ${isActive('#/admin/results')}">ANALYTICS</a>
                    <div onclick="Auth.logout()" class="btn-logout" title="Exit Platform"><i class="fas fa-power-off"></i></div>
                </div>
            `;
        }

        return `
            <div style="display: flex; gap: 2.5rem; align-items: center">
                <nav style="display: flex; gap: 1.8rem; align-items: center; padding-right: 2rem; border-right: 1px solid var(--surface-border)">
                    <a href="#/student/dashboard" class="btn-nav ${isActive('#/student/dashboard')}">DASHBOARD</a>
                    <a href="#/student/exams" class="btn-nav ${isActive('#/student/exams')}">EXAMS</a>
                    <a href="#/student/leaderboard" class="btn-nav ${isActive('#/student/leaderboard')}">LEADERBOARD</a>
                    <a href="#/student/results" class="btn-nav ${isActive('#/student/results')}">RESULTS</a>
                    <a href="#/student/profile" class="btn-nav ${isActive('#/student/profile')}">PROFILE</a>
                </nav>
                <div style="display: flex; gap: 1.5rem; align-items: center">
                    <a href="#/student/notifications" style="position: relative; color: var(--text-muted); font-size: 1.25rem; transition: color 0.3s ease" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text-muted)'" title="Intelligence Feed">
                         <i class="far fa-bell"></i>
                         <span style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: var(--primary); border-radius: 50%; display: block; border: 2px solid var(--background); box-shadow: 0 0 12px var(--primary)" id="nav-notif-dot"></span>
                    </a>
                    <div onclick="Auth.logout()" class="btn-logout" title="De-authorize Session">
                        <i class="fas fa-sign-out-alt"></i>
                    </div>
                </div>
            </div>
        `;
    },

    landing() {
        return `
            <div class="container animate-up" style="padding-top: 8vh; text-align: center">
                <div style="display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.6rem 1.5rem; background: var(--primary-glow); border-radius: 100px; border: 1px solid rgba(99, 102, 241, 0.2); margin-bottom: 2.5rem">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary); display: inline-block; box-shadow: 0 0 10px var(--primary)"></span>
                    <span style="font-size: 0.85rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.1em">V2.0 PROMETHEUS PROTOCOL</span>
                </div>
                <h1 style="font-size: 5.5rem; line-height: 1.05; margin-bottom: 2.5rem; font-weight: 900">Elite <span style="background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent">Assessments</span></h1>
                <p style="color: var(--text-muted); font-size: 1.35rem; max-width: 700px; margin: 0 auto 4.5rem; line-height: 1.8; font-weight: 400">The definitive examination engine for high-stakes certifications. Validate expertise with military-grade precision and neural-feed data synchronization.</p>
                <div style="display: flex; gap: 1.5rem; justify-content: center; margin-bottom: 10rem">
                    <button class="btn btn-primary" style="padding: 1.4rem 3.5rem" onclick="window.location.hash='#/register'">Initialize Start</button>
                    <button class="btn btn-outline" style="padding: 1.4rem 3.5rem" onclick="window.location.hash='#/exams'">Browse Catalog</button>
                </div>
            </div>
        `;
    },

    login() {
        return `
            <div class="container animate-up" style="display: flex; justify-content: center; padding-top: 10vh">
                <div class="glass-card" style="width: 100%; max-width: 480px; padding: 4rem">
                    <div style="text-align: center; margin-bottom: 3.5rem">
                        <div style="font-size: 0.7rem; font-weight: 800; color: var(--primary); letter-spacing: 0.2em; margin-bottom: 0.5rem">IDENTITY GATEWAY</div>
                        <h2 style="font-size: 2.75rem">Authenticate</h2>
                    </div>
                    <form onsubmit="App.handleLogin(event)">
                        <div class="input-group">
                            <label>Identification Hash (Email)</label>
                            <input type="email" name="email" class="input-field" placeholder="candidate@elitequiz.io" required>
                        </div>
                        <div class="input-group">
                            <label>Access Key (Password)</label>
                            <input type="password" name="password" class="input-field" placeholder="••••••••" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 2rem; padding: 1.25rem">Sign In</button>
                    </form>
                    <p style="margin-top: 2.5rem; text-align: center; color: var(--text-muted); font-size: 0.9rem">
                        New candidate? <a href="#/register" style="color: var(--primary); font-weight: 700; text-decoration: none">Register Identity</a>
                    </p>
                </div>
            </div>
        `;
    },

    register() {
        return `
            <div class="container animate-up" style="display: flex; justify-content: center; padding-top: 8vh">
                <div class="glass-card" style="width: 100%; max-width: 500px; padding: 4rem">
                    <div style="text-align: center; margin-bottom: 3.5rem">
                        <div style="font-size: 0.7rem; font-weight: 800; color: var(--primary); letter-spacing: 0.2em; margin-bottom: 0.5rem">PROFILE INITIALIZATION</div>
                        <h2 style="font-size: 2.75rem">Join the Elite</h2>
                    </div>
                    
                    <form onsubmit="App.handleRegister(event)">
                        <div class="input-group">
                            <label>Legal Full Name</label>
                            <input type="text" name="name" class="input-field" placeholder="John Doe" required>
                        </div>
                        <div class="input-group">
                            <label>Primary Email Address</label>
                            <input type="email" name="email" class="input-field" placeholder="john@example.com" required>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem">
                            <div class="input-group">
                                <label>Target Role</label>
                                <select name="role" class="input-field" style="appearance: none">
                                    <option value="student">Student (Candidate)</option>
                                    <option value="admin">Platform Authority (Admin)</option>
                                </select>
                            </div>
                        </div>
                        <div class="input-group">
                            <label>Security Key (Password)</label>
                            <input type="password" name="password" class="input-field" placeholder="••••••••" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 2rem; padding: 1.25rem">Initialize Account</button>
                    </form>
                    
                    <p style="margin-top: 2.5rem; text-align: center; color: var(--text-muted); font-size: 0.9rem">
                        Already registered? <a href="#/login" style="color: var(--primary); font-weight: 700; text-decoration: none">Sign In</a>
            </div>
        `;
    },

    studentDashboard(data) {
        const { summary = {}, upcoming = [], results = [], notifications = [] } = data;
        const user = Auth.user();
        
        return `
            <div class="container animate-up">
                <header style="margin-bottom: 5rem">
                    <div style="font-size: 0.7rem; font-weight: 800; color: var(--primary); letter-spacing: 0.2em; margin-bottom: 0.5rem">CANDIDATE PORTAL // ALPHA PROTOCOL</div>
                    <h1 style="font-size: 3.5rem; letter-spacing: -0.02em">Welcome, <span style="font-weight: 300; opacity: 0.6">${user.name}</span></h1>
                    <p style="color: var(--text-muted); margin-top: 1rem">All neural certification windows and performance logs are synchronized.</p>
                </header>

                <!-- MISSION SUMMARY -->
                <div class="stats-grid" style="margin-bottom: 5rem">
                    <div class="glass-card stat-item">
                        <div class="stat-value">${summary.totalUpcoming || 0}</div>
                        <div class="stat-label">Deployments Found</div>
                    </div>
                    <div class="glass-card stat-item" style="border-color: var(--primary-glow)">
                        <div class="stat-value" style="color: var(--primary)">${summary.liveCount || 0}</div>
                        <div class="stat-label">Channels Live</div>
                    </div>
                    <div class="glass-card stat-item">
                        <div class="stat-value">${summary.totalCompleted || 0}</div>
                        <div class="stat-label">Certifications Held</div>
                    </div>
                    <div class="glass-card stat-item" style="background: var(--primary-glow)">
                        <div class="stat-value" style="font-size: 1.5rem; margin-top: 0.5rem">${summary.currentRank || 'N/A'}</div>
                        <div class="stat-label">Global Rank</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 4rem">
                    <div style="display: flex; flex-direction: column; gap: 4rem">
                        
                        <!-- UPCOMING DEPLOYMENTS -->
                        <section>
                            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--surface-border)">
                                <h3>Next Certification Windows</h3>
                                <a href="#/student/exams" style="font-size: 0.8rem; color: var(--primary); font-weight: 700; text-decoration: none">View All Archives</a>
                            </div>
                            
                            <div style="display: grid; gap: 1.5rem">
                                ${upcoming.map(u => {
                                    const now = new Date();
                                    const start = new Date(u.start_time);
                                    const end = u.end_time ? new Date(u.end_time) : null;
                                    
                                    let status = 'Upcoming';
                                    let badgeClass = 'badge-upcoming';
                                    
                                    if (u.attempt_id) {
                                        status = 'Completed';
                                        badgeClass = 'badge-completed';
                                    } else if (now >= start && (!end || now <= end)) {
                                        status = 'LIVE NOW';
                                        badgeClass = 'badge-live';
                                    }

                                    return `
                                        <div class="glass-card exam-card-v2">
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start">
                                                <div style="flex: 1">
                                                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem">
                                                        <span class="badge ${badgeClass}">${status}</span>
                                                        <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700">${u.question_count} TEST NODES</span>
                                                    </div>
                                                    <h4 style="font-size: 1.5rem; margin-bottom: 0.75rem">${u.title}</h4>
                                                    <div style="display: flex; gap: 1.5rem; font-size: 0.8rem; color: var(--text-muted)">
                                                        <span><i class="far fa-clock" style="margin-right: 0.5rem"></i> ${u.duration}m Duration</span>
                                                        <span><i class="far fa-calendar" style="margin-right: 0.5rem"></i> ${new Date(u.start_time).toLocaleDateString()}</span>
                                                        <span><i class="fas fa-check-double" style="margin-right: 0.5rem"></i> Pass: ${u.passing_score}%</span>
                                                    </div>
                                                </div>
                                                
                                                <div style="text-align: right; min-width: 150px">
                                                    ${status === 'LIVE NOW' ? `
                                                        <button class="btn btn-primary" style="width: 100%; padding: 1rem" onclick="window.location.hash='#/exam/${u.id}'">INITIALIZE TERMINAL</button>
                                                    ` : status === 'Completed' ? `
                                                        <button class="btn btn-outline" style="width: 100%; padding: 1rem; border-color: var(--success); color: var(--success); cursor: default">ARCHIVED</button>
                                                    ` : `
                                                        <div class="v2-timer" data-until="${u.start_time}">00:00:00</div>
                                                        <div style="font-size: 0.6rem; color: var(--text-muted); margin-top: 0.25rem; font-weight: 700; letter-spacing: 0.1em">TILL DEPLOYMENT</div>
                                                    `}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                                ${upcoming.length === 0 ? '<div class="glass-card" style="padding: 4rem; text-align: center; color: var(--text-muted)">No neural windows currently scheduled.</div>' : ''}
                            </div>
                        </section>

                        <!-- RECENT INTELLIGENCE -->
                        <section>
                            <div style="margin-bottom: 2.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--surface-border)">
                                <h3>Recent Performance Logs</h3>
                            </div>
                            <div class="glass-card" style="padding: 0; overflow: hidden">
                                ${results.length > 0 ? results.map(r => `
                                    <div style="padding: 2rem; border-bottom: 1px solid var(--surface-border); display: flex; justify-content: space-between; align-items: center; transition: background 0.3s" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                        <div>
                                            <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.25rem">${r.exam_title}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted)">${new Date(r.submit_time).toDateString()} at ${new Date(r.submit_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </div>
                                        <div style="text-align: right">
                                            <div style="font-weight: 800; font-size: 1.25rem; color: ${r.status === 'Pass' ? 'var(--success)' : 'var(--error)'}">${r.score}%</div>
                                            <div style="font-size: 0.6rem; font-weight: 800; opacity: 0.5; text-transform: uppercase">${r.status} // CONFIRMED</div>
                                        </div>
                                    </div>
                                `).join('') : `
                                    <div style="padding: 4rem; text-align: center; color: var(--text-muted)">No performance logs available.</div>
                                `}
                            </div>
                        </section>
                    </div>

                    <aside style="display: flex; flex-direction: column; gap: 4rem">
                        <!-- INTELLIGENCE FEED (Notifications) -->
                        <div class="glass-card" style="padding: 3rem">
                            <h3 style="margin-bottom: 2.5rem; font-size: 1.25rem">Intelligence Feed</h3>
                            <div style="display: flex; flex-direction: column; gap: 2rem">
                                ${notifications.map(n => `
                                    <div style="position: relative; padding-left: 1.5rem">
                                        <span style="position: absolute; left: 0; top: 0.5rem; width: 6px; height: 6px; border-radius: 50%; background: ${n.type === 'success' ? 'var(--success)' : 'var(--primary)'}; box-shadow: 0 0 10px ${n.type === 'success' ? 'var(--success)' : 'var(--primary)'}"></span>
                                        <p style="font-size: 0.85rem; line-height: 1.6; color: var(--text-main)">${n.message}</p>
                                        <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.5rem; font-weight: 600">${new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                `).join('')}
                                ${notifications.length === 0 ? '<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 2rem">Neural feed is quiet.</p>' : ''}
                            </div>
                            ${notifications.length > 0 ? `<button class="btn btn-outline" style="width: 100%; margin-top: 3rem; font-size: 0.75rem">Mark all as acknowledged</button>` : ''}
                        </div>

                        <!-- QUICK ACTIONS -->
                        <div class="glass-card" style="padding: 3rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05))">
                             <h4 style="margin-bottom: 1.5rem">Support Matrix</h4>
                             <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 2rem">Need help during a certification? Contact the Neural Authority directly.</p>
                             <button class="btn btn-outline" style="width: 100%">Open Ticket</button>
                        </div>
                    </aside>
                </div>
            </div>
        `;
    },

    adminHome(data) {
        return `
            <div class="container animate-up">
                <header style="margin-bottom: 4rem">
                    <h1 style="font-size: 3rem">Authority <span style="font-weight: 300; opacity: 0.6">Terminal</span></h1>
                </header>
                <div class="stats-grid">
                    <div class="glass-card stat-item">
                        <div class="stat-value">${data.totalExams || 0}</div>
                        <div class="stat-label">Total Certifications</div>
                    </div>
                    <div class="glass-card stat-item">
                        <div class="stat-value">${data.totalStudents || 0}</div>
                        <div class="stat-label">Verified Candidates</div>
                    </div>
                    <div class="glass-card stat-item">
                        <div class="stat-value">${data.totalSubmissions || 0}</div>
                        <div class="stat-label">Submissions</div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 4rem; margin-top: 4rem">
                    <div class="glass-card" style="padding: 3rem">
                        <h3>Real-time Performance Cloud</h3>
                        <canvas id="v2-admin-chart" style="margin-top: 2rem; max-height: 300px"></canvas>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 1.5rem">
                         <button class="btn btn-primary" style="width: 100%; padding: 1.5rem" onclick="window.location.hash='#/admin/exams/new'">Initialize New Exam</button>
                         <button class="btn btn-outline" style="width: 100%; padding: 1.5rem" onclick="window.location.hash='#/admin/students'">Manage Candidates</button>
                    </div>
                </div>
            </div>
        `;
    },

    adminExams(exams) {
        return `
            <div class="container animate-up">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4rem">
                    <h1>Certification <span style="font-weight: 300; opacity: 0.6">Archives</span></h1>
                    <button class="btn btn-primary" onclick="window.location.hash='#/admin/exams/new'">New Entry</button>
                </div>
                <div class="glass-card" style="overflow: hidden">
                    <table style="width: 100%; border-collapse: collapse">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.02)">
                                <th style="padding: 2rem; text-align: left; color: var(--text-muted); font-size: 0.75rem; font-weight: 800">CERTIFICATION</th>
                                <th style="padding: 2rem; text-align: left; color: var(--text-muted); font-size: 0.75rem; font-weight: 800">STATUS</th>
                                <th style="padding: 2rem; text-align: right; color: var(--text-muted); font-size: 0.75rem; font-weight: 800">OPERATIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${exams.map(e => `
                                <tr style="border-bottom: 1px solid var(--surface-border)">
                                    <td style="padding: 2rem; font-weight: 700">${e.title}</td>
                                    <td style="padding: 2rem">
                                        <span style="font-size: 0.7rem; font-weight: 800; color: ${e.is_published ? 'var(--success)' : 'var(--error)'}">${e.is_published ? 'ACTIVE' : 'DRAFT'}</span>
                                    </td>
                                    <td style="padding: 2rem; text-align: right">
                                        <div style="display: flex; gap: 1rem; justify-content: flex-end">
                                            <button class="btn btn-outline btn-sm" onclick="App.previewExam(${e.id})">Configure</button>
                                            <button class="btn btn-outline btn-sm" style="color: var(--error); border-color: rgba(244,63,94,0.1)" onclick="App.deleteExam(${e.id})"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    examPreview(data) {
        const { exam, questions } = data;
        return `
            <div class="container animate-up">
                <header style="margin-bottom: 4rem; border-bottom: 1px solid var(--surface-border); padding-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end">
                    <div>
                        <h1 style="font-size: 3rem">${exam.title}</h1>
                        <p style="color: var(--text-muted)">Duration: <strong>${exam.duration} Min</strong> | Threshold: <strong>${exam.passing_score}%</strong></p>
                    </div>
                    <button class="btn btn-primary" onclick="App.publishExam(${exam.id})">
                        <i class="fas fa-check-double"></i> Publish Certification
                    </button>
                </header>
                <div style="display: grid; grid-template-columns: 1fr 350px; gap: 4rem">
                    <div>
                         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem">
                             <h3>Knowledge Assets</h3>
                             <button class="btn btn-primary btn-sm" onclick="App.showQuestionAdd(${exam.id})">Add Instance</button>
                         </div>
                         ${['mcq', 'short', 'coding'].map(type => `
                            <div style="margin-bottom: 3rem">
                                <h4 style="text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; color: var(--primary); margin-bottom: 1.5rem">${type} Module</h4>
                                ${(questions[type] || []).map(q => `
                                    <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1rem; border-left: 4px solid var(--primary); display: flex; justify-content: space-between; align-items: center">
                                        <p style="font-weight: 600">${q.question_text}</p>
                                        <i class="fas fa-trash" style="color: var(--error); cursor: pointer; opacity: 0.5" onclick="App.deleteQuestion(${q.id}, ${exam.id})"></i>
                                    </div>
                                `).join('')}
                                ${(!questions[type] || questions[type].length === 0) ? '<p style="font-size: 0.85rem; color: var(--text-muted)">No questions in this sector.</p>' : ''}
                            </div>
                         `).join('')}
                    </div>
                    <aside>
                        <div class="glass-card" style="padding: 2.5rem; text-align: center">
                            <i class="fas fa-file-excel" style="font-size: 3rem; color: var(--success); margin-bottom: 1.5rem"></i>
                            <h4>Mass Ingestion</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 1rem 0 2rem">Automatically populate this certification using a standardized Excel template.</p>
                            <input type="file" id="v2-excel-input" style="display: none" accept=".xlsx" onchange="App.handleExcelImport(event, ${exam.id})">
                            <button class="btn btn-primary" style="width: 100%" onclick="document.getElementById('v2-excel-input').click()">Bulk Ingest (Auto)</button>
                            <button class="btn btn-outline" style="width: 100%; margin-top: 1rem" onclick="App.downloadTemplate()">Download Template</button>
                        </div>
                    </aside>
                </div>
            </div>
        `;
    },

    createExam() {
        return `
            <div class="container animate-up" style="max-width: 800px">
                <h1 style="margin-bottom: 3rem">Initialize <span style="font-weight: 300; opacity: 0.6">Certification</span></h1>
                <div class="glass-card" style="padding: 4rem">
                    <form onsubmit="App.handleCreateExam(event)">
                        <div class="input-group">
                            <label>Certification Title</label>
                            <input type="text" name="title" class="input-field" placeholder="ex: Senior Node.js Architect" required>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem">
                            <div class="input-group">
                                <label>Duration (Minutes)</label>
                                <input type="number" name="duration" class="input-field" value="60" required>
                            </div>
                            <div class="input-group">
                                <label>Passing Threshold (%)</label>
                                <input type="number" name="passing_score" class="input-field" value="40" required>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem">
                            <div class="input-group">
                                <label>Deployment Window (Start)</label>
                                <input type="datetime-local" name="start_time" class="input-field" required>
                            </div>
                            <div class="input-group">
                                <label>Lockdown Window (End)</label>
                                <input type="datetime-local" name="end_time" class="input-field" required>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 2rem; padding: 1.25rem">Provision Certification</button>
                    </form>
                </div>
            </div>
        `;
    },

    examTerminal(exam, questions) {
        return `
            <div class="terminal-header">
                <div class="container" style="display: flex; justify-content: space-between; align-items: center">
                    <div>
                        <h4 style="margin: 0">${exam.title}</h4>
                        <p style="font-size: 0.7rem; color: var(--text-muted); margin: 0">SECURE TERMINAL ACTIVE</p>
                    </div>
                    <div class="timer-box" id="v2-countdown">00:00</div>
                    <button class="btn btn-primary" style="padding: 0.6rem 1.5rem" onclick="App.submitExam()">Finalize</button>
                </div>
            </div>
            <div class="container" style="padding-top: 4rem; display: grid; grid-template-columns: 1fr 300px; gap: 4rem">
                <div id="q-container" class="animate-up">
            <div class="exam-layout animate-up">
                <!-- MISSION HUD -->
                <header class="exam-header glass-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%">
                        <div>
                            <div style="font-size: 0.6rem; font-weight: 800; color: var(--primary); letter-spacing: 0.2em; margin-bottom: 0.25rem">MISSION ARCHIVE</div>
                            <h2 style="font-size: 1.5rem">${exam.title}</h2>
                        </div>
                        <div style="text-align: center">
                            <div id="v2-countdown" style="font-size: 2.5rem; font-weight: 900; font-family: 'JetBrains Mono', monospace; color: var(--primary)">${exam.duration}:00</div>
                            <div style="font-size: 0.6rem; letter-spacing: 0.1em; opacity: 0.6">TIME REMAINING</div>
                        </div>
                        <div style="text-align: right">
                            <button class="btn btn-primary" onclick="App.submitExam()">FINAL SUBMISSION</button>
                        </div>
                    </div>
                </header>

                <main class="exam-content">
                    <!-- QUESTION HUB -->
                    <div id="q-container" style="flex: 1"></div>

                    <!-- KNOWLEDGE PALETTE -->
                    <aside class="exam-palette glass-card">
                         <h5 style="font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 2rem; opacity: 0.6">KNOWLEDGE PALETTE</h5>
                         <div class="palette-grid">
                            ${questions.map((_, i) => `
                                <button class="palette-item" id="p-item-${i}" onclick="App.jumpToQuestion(${i})">${i + 1}</button>
                            `).join('')}
                         </div>
                         
                         <div style="margin-top: 4rem; display: flex; flex-direction: column; gap: 1rem">
                            <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.7rem">
                                <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary)"></span>
                                <span>ANSWERED</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.7rem">
                                <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--error)"></span>
                                <span>FLAGGED</span>
                            </div>
                         </div>
                    </aside>
                </main>

                <!-- NAVIGATION HUB -->
                <footer class="exam-footer glass-card">
                    <div style="display: flex; gap: 2rem; align-items: center">
                        <button class="btn btn-outline" onclick="App.prevQuestion()"><i class="fas fa-arrow-left"></i> PREV</button>
                        <div id="save-status" style="font-size: 0.7rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace">STREAMING DATA...</div>
                        <button class="btn btn-outline" onclick="App.nextQuestion()">NEXT <i class="fas fa-arrow-right"></i></button>
                    </div>
                    <div>
                        <button class="btn btn-outline" style="border-color: var(--error); color: var(--error)" id="btn-flag" onclick="App.toggleFlag()">FLAG FOR REVIEW</button>
                    </div>
                </footer>
            </div>
        `;
    },

    questionRenderer(q, index, total, answer = null) {
        return `
            <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center">
                <span style="font-weight: 800; color: var(--primary)">STEP ${index + 1} OF ${total}</span>
                <span style="font-size: 0.8rem; color: var(--text-muted)">POINTS: ${q.marks || 4}</span>
            </div>
            <h2 style="margin-bottom: 3rem; line-height: 1.4">${q.question_text}</h2>
            
            <div class="answer-matrix">
                ${q.type === 'mcq' ? `
                    <div style="display: grid; gap: 1rem">
                        ${q.options.split(',').map((opt, i) => `
                            <div class="glass-card opt-card ${answer === opt.trim() ? 'active' : ''}" 
                                 style="padding: 1.5rem; cursor: pointer; border-radius: 16px" 
                                 onclick="App.saveAnswer(${q.id}, '${opt.trim()}', ${index})">
                                ${opt.trim()}
                            </div>
                        `).join('')}
                    </div>
                ` : q.type === 'short' ? `
                    <textarea class="input-field" style="height: 200px" placeholder="Initialize theoretical response..." onchange="App.saveAnswer(${q.id}, this.value, ${index})">${answer || ''}</textarea>
                ` : `
                    <div class="glass-card" style="padding: 0; overflow: hidden; border-color: #334155">
                        <div style="background: #1e293b; padding: 0.75rem 1.5rem; border-bottom: 1px solid #334155; display: flex; justify-content: space-between">
                            <span style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted)">SOLVER.PY</span>
                            <button class="btn btn-outline btn-sm" onclick="App.simulateCode(${q.id})">Run Test</button>
                        </div>
                        <textarea id="code-editor" class="input-field" style="border: none; border-radius: 0; font-family: 'JetBrains Mono'; height: 300px; background: #0f172a" onchange="App.saveAnswer(${q.id}, this.value, ${index})">${answer || ''}</textarea>
                    </div>
                    <div id="v2-code-output" style="margin-top: 1rem; font-family: 'JetBrains Mono'; font-size: 0.8rem; color: var(--success); display: none"></div>
                `}
            </div>

            <div style="margin-top: 4rem; display: flex; gap: 1rem">
                <button class="btn btn-outline" onclick="App.jumpToQuestion(${index - 1})" ${index === 0 ? 'disabled' : ''}>Previous</button>
                <button class="btn btn-primary" onclick="App.jumpToQuestion(${index + 1})" ${index === total - 1 ? 'disabled' : ''}>Next Protocol</button>
            </div>
        `;
    },

    leaderboard(users) {
        return `
            <div class="container animate-up">
                <h1 style="margin-bottom: 4rem; text-align: center">Platform <span style="font-weight: 300; opacity: 0.6">Elite</span></h1>
                <div class="glass-card" style="max-width: 900px; margin: 0 auto; padding: 0; overflow: hidden">
                    <table style="width: 100%; border-collapse: collapse">
                         <thead style="background: rgba(255,255,255,0.02)">
                            <tr>
                                <th style="padding: 2rem; text-align: left; width: 80px">RANK</th>
                                <th style="padding: 2rem; text-align: left">CANDIDATE</th>
                                <th style="padding: 2rem; text-align: right">ACCURACY</th>
                                <th style="padding: 2rem; text-align: right">LATENCY</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map((u, i) => `
                                <tr style="border-bottom: 1px solid var(--surface-border)">
                                    <td style="padding: 2rem; font-weight: 800; color: ${i < 3 ? 'var(--primary)' : 'var(--text-muted)'}">#${i + 1}</td>
                                    <td style="padding: 2rem">
                                        <div style="font-weight: 700">${u.user_name || u.name}</div>
                                        <div style="font-size: 0.7rem; color: var(--text-muted)">${u.email || ''}</div>
                                    </td>
                                    <td style="padding: 2rem; text-align: right; font-weight: 800">${u.score} PTS</td>
                                    <td style="padding: 2rem; text-align: right; color: var(--text-muted)">${u.time_taken || u.latency || 'N/A'}s</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    adminResults(exams) {
        return `
            <div class="container animate-up">
                <header style="margin-bottom: 4rem">
                    <h1>Results <span style="font-weight: 300; opacity: 0.6">Intelligence</span></h1>
                    <p style="color: var(--text-muted)">Select a certification to analyze its neural performance data.</p>
                </header>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem">
                    ${exams.map(e => `
                        <div class="glass-card" style="padding: 2rem; cursor: pointer" onclick="window.location.hash='#/admin/results/${e.id}'">
                            <div style="font-size: 0.7rem; font-weight: 800; color: var(--primary); margin-bottom: 1rem">ARCHIVE #${e.id}</div>
                            <h3 style="margin-bottom: 1.5rem">${e.title}</h3>
                            <div style="display: flex; justify-content: space-between; align-items: center">
                                <span style="font-size: 0.8rem; color: var(--text-muted)">Published</span>
                                <i class="fas fa-chevron-right" style="opacity: 0.3"></i>
                            </div>
                        </div>
                    `).join('')}
                    ${exams.length === 0 ? '<p>No certification data found.</p>' : ''}
                </div>
            </div>
        `;
    },

    adminResultsDetail(exam, data) {
        const { stats, leaderboard, missed, distribution } = data;
        const passRate = ((stats.pass_count / (stats.total_attempts || 1)) * 100).toFixed(1);

        return `
            <div class="container animate-up">
                <header style="margin-bottom: 4rem; display: flex; justify-content: space-between; align-items: flex-end">
                    <div style="cursor: pointer" onclick="window.location.hash='#/admin/results'">
                        <i class="fas fa-arrow-left" style="margin-bottom: 1rem; opacity: 0.5"></i>
                        <h1 style="font-size: 2.5rem">${exam.title}</h1>
                    </div>
                    <div style="display: flex; gap: 1rem">
                        <button class="btn btn-outline" onclick="App.exportResults('excel', ${exam.id})"><i class="fas fa-file-excel"></i> Excel</button>
                        <button class="btn btn-primary" onclick="App.exportResults('pdf', ${exam.id})"><i class="fas fa-file-pdf"></i> PDF Report</button>
                    </div>
                </header>

                <div class="stats-grid">
                    <div class="glass-card stat-item">
                        <div class="stat-value">${stats.total_attempts}</div>
                        <div class="stat-label">Submissions</div>
                    </div>
                    <div class="glass-card stat-item">
                        <div class="stat-value">${Math.round(stats.average_score)}</div>
                        <div class="stat-label">Avg Accuracy</div>
                    </div>
                    <div class="glass-card stat-item" style="border-color: var(--success-glow)">
                        <div class="stat-value" style="color: var(--success)">${passRate}%</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                    <div class="glass-card stat-item">
                        <div class="stat-value">${stats.highest_score}</div>
                        <div class="stat-label">Peak Performance</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 3rem; margin-top: 4rem">
                    <div class="glass-card" style="padding: 2.5rem">
                        <h3 style="margin-bottom: 2rem">Score Distribution</h3>
                        <canvas id="distribution-chart" style="max-height: 350px"></canvas>
                    </div>
                    <div class="glass-card" style="padding: 2.5rem">
                        <h3 style="margin-bottom: 2rem">Common Failure Nodes</h3>
                        ${missed.map(m => `
                            <div style="margin-bottom: 1.5rem">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem">
                                    <span style="font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px">${m.question_text}</span>
                                    <span style="font-size: 0.8rem; color: var(--error)">${Math.round(m.failure_rate)}% Missed</span>
                                </div>
                                <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px">
                                    <div style="width: ${m.failure_rate}%; height: 100%; background: var(--error); border-radius: 10px"></div>
                                </div>
                            </div>
                        `).join('')}
                        ${missed.length === 0 ? '<p style="color: var(--text-muted)">Perfect performance recorded.</p>' : ''}
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 4rem; padding: 0; overflow: hidden">
                    <div style="padding: 2.5rem; display: flex; justify-content: space-between; align-items: center">
                        <h3>Candidate Performance Matrix</h3>
                        <div style="position: relative">
                            <i class="fas fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.4"></i>
                            <input type="text" placeholder="Search hash..." class="input-field" style="padding: 0.75rem 1rem 0.75rem 3rem; width: 300px" oninput="App.filterResults(this.value)">
                        </div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.02); text-transform: uppercase; border-bottom: 1px solid var(--surface-border)">
                                <th style="padding: 1.5rem 2.5rem; text-align: left; font-size: 0.7rem; font-weight: 800; cursor: pointer" onclick="App.sortResults('name')">Candidate</th>
                                <th style="padding: 1.5rem 2.5rem; text-align: center; font-size: 0.7rem; font-weight: 800; cursor: pointer" onclick="App.sortResults('score')">Score</th>
                                <th style="padding: 1.5rem 2.5rem; text-align: center; font-size: 0.7rem; font-weight: 800">Latency</th>
                                <th style="padding: 1.5rem 2.5rem; text-align: center; font-size: 0.7rem; font-weight: 800">Status</th>
                                <th style="padding: 1.5rem 2.5rem; text-align: right; font-size: 0.7rem; font-weight: 800">Protocol</th>
                            </tr>
                        </thead>
                        <tbody id="results-table-body">
                            ${this.renderResultsTableRows(leaderboard, exam.passing_score)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderResultsTableRows(leaderboard, passingScore) {
        return leaderboard.map(l => {
            const isPass = l.score >= passingScore;
            return `
                <tr style="border-bottom: 1px solid var(--surface-border); transition: background 0.3s" onmouseover="this.style.background='rgba(255,255,255,0.01)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 1.5rem 2.5rem">
                        <div style="font-weight: 700">${l.user_name}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted)">${new Date(l.submit_time).toLocaleString()}</div>
                    </td>
                    <td style="padding: 1.5rem 2.5rem; text-align: center; font-weight: 800; color: var(--primary)">${l.score}</td>
                    <td style="padding: 1.5rem 2.5rem; text-align: center; opacity: 0.6">${l.time_taken}s</td>
                    <td style="padding: 1.5rem 2.5rem; text-align: center">
                        <span style="font-size: 0.65rem; font-weight: 800; padding: 0.4rem 1rem; border-radius: 100px; background: ${isPass ? 'var(--success-glow)' : 'var(--error-glow)'}; color: ${isPass ? 'var(--success)' : 'var(--error)'}">
                            ${isPass ? 'CLEARED' : 'FAILED'}
                        </span>
                    </td>
                    <td style="padding: 1.5rem 2.5rem; text-align: right">
                        <button class="btn btn-outline btn-sm" onclick="App.showAnswerSheet(${l.id})">Inspect</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    answerSheetModal(audit, info) {
        return `
            <div id="modal-container" style="position: fixed; inset: 0; z-index: 20000; overflow-y: auto; padding: 4rem 2rem; background: rgba(11, 15, 26, 0.9); backdrop-filter: blur(10px)">
                <div class="glass-card container animate-up" style="max-width: 1000px; padding: 0; position: relative">
                    <button onclick="document.getElementById('modal-container').remove()" style="position: absolute; top: 2rem; right: 2rem; background: none; border: none; color: white; cursor: pointer; font-size: 1.5rem">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div style="padding: 4rem; border-bottom: 1px solid var(--surface-border)">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3rem">
                            <div>
                                <h4 style="color: var(--primary); margin-bottom: 1rem">Neural Access Audit</h4>
                                <h1 style="font-size: 2.5rem; margin: 0">${info.user_name}</h1>
                                <p style="color: var(--text-muted); margin-top: 1rem">Session ID: #${info.id} | Timestamp: ${new Date(info.submit_time).toLocaleString()}</p>
                            </div>
                            <div style="text-align: right">
                                <div style="font-size: 4rem; font-weight: 800; line-height: 1">${info.score}</div>
                                <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted)">TOTAL POINTS AWARDED</div>
                            </div>
                        </div>
                    </div>

                    <div style="padding: 4rem">
                        <h3 style="margin-bottom: 2rem">Response Stream</h3>
                        ${audit.map((a, i) => `
                            <div style="margin-bottom: 3rem; padding-bottom: 3rem; border-bottom: 1px solid var(--surface-border)">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem">
                                    <span style="font-weight: 800; color: var(--primary)">NODE ${i + 1} // ${a.type.toUpperCase()}</span>
                                    <span style="font-size: 0.75rem; font-weight: 800; color: ${a.status === 'Correct' ? 'var(--success)' : 'var(--error)'}">
                                        ${a.status.toUpperCase()} (${a.marks} PTS)
                                    </span>
                                </div>
                                <h4 style="font-size: 1.25rem; line-height: 1.5; margin-bottom: 2rem">${a.question_text}</h4>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem">
                                    <div style="padding: 1.5rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid var(--surface-border)">
                                        <div style="font-size: 0.6rem; color: var(--text-muted); margin-bottom: 0.5rem">CANDIDATE RESPONSE</div>
                                        <p style="font-family: inherit; font-size: 0.95rem; line-height: 1.6">${a.user_answer || '<i style="opacity:0.3">No data provided</i>'}</p>
                                    </div>
                                    <div style="padding: 1.5rem; background: var(--success-glow); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2)">
                                        <div style="font-size: 0.6rem; color: var(--success); margin-bottom: 0.5rem">VERIFIED HASH (CORRECT ANSWER)</div>
                                        <p style="font-weight: 600; font-size: 0.95rem">${a.correct_answer}</p>
                                    </div>
                                </div>
                                
                                ${a.explanation ? `
                                    <div style="margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted)">
                                        <strong style="color: var(--primary)">Rationale:</strong> ${a.explanation}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    studentHistory(attempts) {
        return `
            <div class="container animate-up">
                <header style="margin-bottom: 5rem; display: flex; justify-content: space-between; align-items: flex-end">
                    <div>
                        <h1 style="font-size: 3.5rem; letter-spacing: -0.02em">Certification <span style="font-weight: 300; opacity: 0.6">History</span></h1>
                        <p style="color: var(--text-muted); margin-top: 1rem">A complete audit log of your cognitive deployments.</p>
                    </div>
                    <div style="display: flex; gap: 1rem">
                        <button class="btn btn-outline btn-sm active">ALL</button>
                        <button class="btn btn-outline btn-sm">CLEARED</button>
                        <button class="btn btn-outline btn-sm">FAILED</button>
                    </div>
                </header>

                <div class="glass-card" style="padding: 0; overflow: hidden">
                    <table style="width: 100%; border-collapse: collapse">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.02); text-transform: uppercase; border-bottom: 1px solid var(--surface-border)">
                                <th style="padding: 1.5rem 2.5rem; text-align: left; font-size: 0.7rem; font-weight: 800">Certification</th>
                                <th style="padding: 1.5rem 2.5rem; text-align: center; font-size: 0.7rem; font-weight: 800">Score</th>
                                <th style="padding: 1.5rem 2.5rem; text-align: center; font-size: 0.7rem; font-weight: 800">Status</th>
                                <th style="padding: 1.5rem 2.5rem; text-align: right; font-size: 0.7rem; font-weight: 800">Audit</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${attempts.map(a => `
                                <tr style="border-bottom: 1px solid var(--surface-border)">
                                    <td style="padding: 1.5rem 2.5rem">
                                        <div style="font-weight: 700">${a.exam_title}</div>
                                        <div style="font-size: 0.7rem; color: var(--text-muted)">${new Date(a.submit_time).toLocaleString()}</div>
                                    </td>
                                    <td style="padding: 1.5rem 2.5rem; text-align: center; font-weight: 800">${a.score}</td>
                                    <td style="padding: 1.5rem 2.5rem; text-align: center">
                                        <span class="badge" style="background: ${a.score >= 40 ? 'var(--success-glow)' : 'var(--error-glow)'}; color: ${a.score >= 40 ? 'var(--success)' : 'var(--error)'}">
                                            ${a.score >= 40 ? 'CLEARED' : 'FAILED'}
                                        </span>
                                    </td>
                                    <td style="padding: 1.5rem 2.5rem; text-align: right">
                                        <button class="btn btn-outline btn-sm" onclick="App.showDetailedResult(${a.id})">Review Sheet</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    profilePage(data) {
        const { user, stats } = data;
        return `
            <div class="container animate-up">
                <header style="margin-bottom: 5rem">
                    <h1 style="font-size: 3.5rem; letter-spacing: -0.02em">Candidate <span style="font-weight: 300; opacity: 0.6">Identity</span></h1>
                </header>

                <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 4rem">
                    <aside>
                        <div class="glass-card" style="padding: 3rem; text-align: center">
                            <div style="width: 120px; height: 120px; border-radius: 50%; background: var(--primary-glow); margin: 0 auto 2rem; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: var(--primary); font-weight: 800">
                                ${user.name[0].toUpperCase()}
                            </div>
                            <h2 style="margin-bottom: 0.5rem">${user.name}</h2>
                            <p style="color: var(--text-muted); font-size: 0.9rem">${user.email}</p>
                            
                            <div style="margin-top: 3rem; padding-top: 3rem; border-top: 1px solid var(--surface-border); display: grid; gap: 2rem">
                                <div style="text-align: left">
                                    <div style="font-size: 0.65rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem">ACCESS LEVEL</div>
                                    <div style="font-weight: 700">Level 1 - Candidate</div>
                                </div>
                                <div style="text-align: left">
                                    <div style="font-size: 0.65rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem">REGISTERED</div>
                                    <div style="font-weight: 700">${new Date(user.created_at || Date.now()).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div style="display: flex; flex-direction: column; gap: 4rem">
                        <div class="glass-card" style="padding: 3rem">
                             <h3 style="margin-bottom: 2.5rem">Cognitive Metrics</h3>
                             <div class="stats-grid" style="grid-template-columns: 1fr 1fr; gap: 2rem">
                                <div class="glass-card" style="padding: 2rem; border-color: rgba(255,255,255,0.03)">
                                    <div style="font-size: 2.5rem; font-weight: 800">${stats.total_exams || 0}</div>
                                    <div style="font-size: 0.7rem; color: var(--text-muted)">TOTAL ATTEMPTS</div>
                                </div>
                                <div class="glass-card" style="padding: 2rem; border-color: rgba(255,255,255,0.03)">
                                    <div style="font-size: 2.5rem; font-weight: 800; color: var(--success)">${Math.round(stats.avg_score || 0)}%</div>
                                    <div style="font-size: 0.7rem; color: var(--text-muted)">AVG ACCURACY</div>
                                </div>
                             </div>
                        </div>

                        <div class="glass-card" style="padding: 3rem">
                            <h3 style="margin-bottom: 2.5rem">Identity Shield</h3>
                            <form onsubmit="App.handlePasswordUpdate(event)">
                                <div class="input-group">
                                    <label>Current Credentials</label>
                                    <input type="password" name="oldPassword" class="input-field" required placeholder="••••••••">
                                </div>
                                <div class="input-group">
                                    <label>New Secret Hash</label>
                                    <input type="password" name="newPassword" class="input-field" required placeholder="••••••••">
                                </div>
                                <button type="submit" class="btn btn-primary" style="margin-top: 2rem; width: 100%">Synchronize Security</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    studentExams(data) {
        const { upcoming = [], live = [], completed = [] } = data;
        return `
            <div class="container animate-up">
                <header style="margin-bottom: 4rem">
                    <h1 style="font-size: 3rem">Neural <span style="font-weight: 300; opacity: 0.6">Archives</span></h1>
                    <p style="color: var(--text-muted); margin-top: 1rem">Global certification manifest and scheduling availability.</p>
                </header>

                <div class="glass-card" style="padding: 0; background: transparent; border: none">
                    <div style="display: flex; gap: 2rem; margin-bottom: 3rem; border-bottom: 1px solid var(--surface-border)">
                        <button class="tab-btn active" onclick="App.switchExamTab('live')">Live Now (${live.length})</button>
                        <button class="tab-btn" onclick="App.switchExamTab('upcoming')">Upcoming (${upcoming.length})</button>
                        <button class="tab-btn" onclick="App.switchExamTab('completed')">Archived (${completed.length})</button>
                    </div>

                    <div id="exam-tab-content">
                         ${this.renderExamTab('live', live)}
                    </div>
                </div>
            </div>
        `;
    },

    renderExamTab(type, exams) {
        if (exams.length === 0) return `<div style="padding: 5rem; text-align: center; color: var(--text-muted)">No certifications found with this temporal status.</div>`;
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem">
                ${exams.map(e => `
                    <div class="glass-card exam-card-v2 animate-up">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem">
                            <span class="badge ${type === 'live' ? 'badge-live' : type === 'upcoming' ? 'badge-upcoming' : 'badge-completed'}">${type.toUpperCase()}</span>
                            <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700">${e.duration} MINS</span>
                        </div>
                        <h4 style="font-size: 1.25rem; margin-bottom: 1rem">${e.title}</h4>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid var(--surface-border)">
                            <div style="font-size: 0.75rem; color: var(--text-muted)">
                                <div>Scheduled: ${new Date(e.start_time).toLocaleDateString()}</div>
                                <div style="margin-top: 0.25rem">Threshold: ${e.passing_score}% Accuracy</div>
                            </div>
                            ${type === 'live' ? `<button class="btn btn-primary" onclick="window.location.hash='#/exam/${e.id}'">Initialize</button>` : ''}
                            ${type === 'upcoming' ? `<div class="v2-timer" data-until="${e.start_time}">00:00:00</div>` : ''}
                            ${type === 'completed' ? `<button class="btn btn-outline" style="border-color: var(--success); color: var(--success); cursor: default">Verified</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    leaderboard(users, examTitle = "Global Consensus") {
        return `
            <div class="container animate-up">
                <header style="margin-bottom: 4rem; text-align: center">
                    <h1 style="font-size: 3rem">${examTitle} <span style="font-weight: 300; opacity: 0.6">Rankings</span></h1>
                    <p style="color: var(--text-muted); margin-top: 1rem">Real-time performance benchmarking across the neural network.</p>
                </header>

                <div class="glass-card" style="padding: 0; overflow: hidden">
                    <table style="width: 100%; border-collapse: collapse">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.02); text-align: left">
                                <th style="padding: 1.5rem 2rem; font-size: 0.75rem; letter-spacing: 0.1em">RANK</th>
                                <th style="padding: 1.5rem 2rem; font-size: 0.75rem; letter-spacing: 0.1em">CANDIDATE</th>
                                <th style="padding: 1.5rem 2rem; font-size: 0.75rem; letter-spacing: 0.1em">SCORE</th>
                                <th style="padding: 1.5rem 2rem; font-size: 0.75rem; letter-spacing: 0.1em">LATENCY</th>
                                <th style="padding: 1.5rem 2rem; font-size: 0.75rem; letter-spacing: 0.1em">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map((u, i) => `
                                <tr style="border-bottom: 1px solid var(--surface-border)">
                                    <td style="padding: 2rem; font-weight: 800; font-size: 1.25rem; color: ${i < 3 ? 'var(--primary)' : 'var(--text-muted)'}">#${i + 1}</td>
                                    <td style="padding: 2rem">
                                        <div style="font-weight: 700">${u.user_name}</div>
                                        <div style="font-size: 0.7rem; color: var(--text-muted)">ID: ${String(u.id).substring(0, 8)}</div>
                                    </td>
                                    <td style="padding: 2rem; font-weight: 800">${u.score}</td>
                                    <td style="padding: 2rem">${u.time_taken}s</td>
                                    <td style="padding: 2rem">
                                        <span class="badge ${u.score > 0 ? 'badge-live' : 'badge-completed'}">VERIFIED</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    studentResultsSummary(attempts) {
        return `
            <div class="container animate-up">
                <header style="margin-bottom: 5rem">
                    <h1 style="font-size: 3.5rem; letter-spacing: -0.02em">Cognitive <span style="font-weight: 300; opacity: 0.6">Intelligence</span></h1>
                    <p style="color: var(--text-muted); margin-top: 1rem">Detailed analysis of your certification deployments and performance hashes.</p>
                </header>

                <div style="display: grid; gap: 1.5rem">
                    ${attempts.filter(a => a.submit_time).map(a => `
                        <div class="glass-card" style="padding: 3rem; display: flex; justify-content: space-between; align-items: center">
                            <div style="display: flex; gap: 3rem; align-items: center">
                                <div style="text-align: center; border-right: 1px solid var(--surface-border); padding-right: 3rem">
                                    <div style="font-size: 2.5rem; font-weight: 800; line-height: 1">${a.percentage}%</div>
                                    <div style="font-size: 0.65rem; font-weight: 800; color: var(--text-muted); margin-top: 0.5rem">ACCURACY</div>
                                </div>
                                <div>
                                    <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem">${a.exam_title}</h3>
                                    <p style="font-size: 0.85rem; color: var(--text-muted)">
                                        Captured ${new Date(a.submit_time).toLocaleString()} | Latency: ${a.time_taken_seconds || 'N/A'}s
                                    </p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1.5rem; align-items: center">
                                <span class="badge ${a.pass_fail_status === 'Passed' ? 'badge-live' : 'badge-upcoming'}" style="padding: 0.6rem 1.2rem">
                                    ${(a.pass_fail_status || 'GRADED').toUpperCase()}
                                </span>
                                <button class="btn btn-outline" onclick="App.showDetailedResult('${a.id}')">AUDIT SHEET</button>
                            </div>
                        </div>
                    `).join('')}
                    ${attempts.filter(a => a.submit_time).length === 0 ? `
                        <div style="padding: 8rem; text-align: center; color: var(--text-muted)">
                            <i class="fas fa-microchip" style="font-size: 3rem; opacity: 0.2; margin-bottom: 2rem"></i>
                            <h3>No validated results in current sector.</h3>
                            <a href="#/student/exams" class="btn btn-primary" style="margin-top: 2rem">Initialize Certification</a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    notificationsList(notifications = []) {
        return `
            <div class="container animate-up" style="max-width: 800px">
                <header style="margin-bottom: 4rem; text-align: center">
                    <h1 style="font-size: 3rem">Intelligence <span style="font-weight: 300; opacity: 0.6">Feed</span></h1>
                </header>

                <div style="display: grid; gap: 1.5rem">
                    ${notifications.map(n => `
                        <div class="glass-card" style="padding: 2.5rem; display: flex; gap: 2rem">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--primary); margin-top: 0.5rem"></div>
                            <div>
                                <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 1rem">${n.message}</p>
                                <span style="font-size: 0.75rem; color: var(--text-muted)">${new Date(n.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    `).join('')}
                    ${notifications.length === 0 ? '<div style="padding: 5rem; text-align: center; color: var(--text-muted)">No active intelligence alerts.</div>' : ''}
                </div>
            </div>
        `;
    },

    answerSheetModal(audit, info) {
        return `
            <div class="modal-backdrop" id="audit-modal" onclick="if(event.target === this) this.remove()">
                <div class="glass-card modal-content animate-scale" style="max-width: 900px; padding: 0">
                    <div style="padding: 3rem; background: rgba(99, 102, 241, 0.05); border-bottom: 1px solid var(--surface-border); display: flex; justify-content: space-between; align-items: center">
                        <div>
                            <div style="font-size: 0.7rem; font-weight: 800; color: var(--primary); letter-spacing: 0.2em; margin-bottom: 0.5rem">SESSION AUDIT // ALPHA</div>
                            <h2 style="font-size: 2rem">${info.user_name}</h2>
                        </div>
                        <div style="text-align: right">
                            <div style="font-size: 2.5rem; font-weight: 800; line-height: 1">${info.score}%</div>
                            <div style="font-size: 0.7rem; font-weight: 800; opacity: 0.5; margin-top: 0.5rem">ACCURACY</div>
                        </div>
                    </div>
                    
                    <div style="padding: 3rem; max-height: 60vh; overflow-y: auto">
                        <div style="display: grid; gap: 3rem">
                            ${audit.map((q, i) => `
                                <div>
                                    <h4 style="margin-bottom: 1.5rem; line-height: 1.5">${i + 1}. ${q.question_text}</h4>
                                    <div style="padding: 1.5rem; border-radius: 12px; background: ${q.is_correct ? 'var(--success-glow)' : 'var(--error-glow)'}; border: 1px solid rgba(255,255,255,0.03)">
                                        <div style="font-size: 0.7rem; font-weight: 800; color: ${q.is_correct ? 'var(--success)' : 'var(--error)'}">RESPONSE</div>
                                        <div style="font-weight: 600; margin-top: 0.5rem">${q.student_answer || 'NO RESPONSE'}</div>
                                    </div>
                                    ${!q.is_correct ? `
                                        <div style="margin-top: 1rem; padding: 1.5rem; border-radius: 12px; background: var(--success-glow); border: 1px solid rgba(16, 185, 129, 0.1)">
                                            <div style="font-size: 0.7rem; font-weight: 800; color: var(--success)">CORRECT HASH</div>
                                            <div style="font-weight: 600; margin-top: 0.5rem">${q.correct_answer}</div>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="padding: 2.5rem 3rem; border-top: 1px solid var(--surface-border); display: flex; justify-content: space-between; align-items: center">
                        <button class="btn btn-outline" onclick="App.exportAuditToPDF('${info.id}')">Download Audit</button>
                        <button class="btn btn-primary" onclick="document.getElementById('audit-modal').remove()">Close Archive</button>
                    </div>
                </div>
            </div>
        `;
    },

    examTerminal(exam, questions) {
        return `
            <div class="exam-layout animate-up">
                <!-- Header: Mission Intelligence -->
                <div class="exam-header glass-card">
                    <div class="container" style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 0">
                        <div style="display: flex; align-items: center; gap: 1.5rem">
                            <div style="padding: 0.75rem 1rem; background: var(--primary-glow); border-radius: 8px; border: 1px solid var(--primary); font-family: 'JetBrains Mono', monospace; font-weight: 800; color: var(--primary)" id="v2-countdown">
                                00:00:00
                            </div>
                            <div>
                                <h2 style="font-size: 1.5rem; letter-spacing: -0.02em">${exam.title}</h2>
                                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.25rem">SESSION ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: center">
                            <div id="save-status" style="font-size: 0.65rem; font-weight: 800; color: var(--success); letter-spacing: 0.1em">DATA PERSISTED</div>
                            <button class="btn btn-primary" style="background: var(--error); border-color: var(--error)" onclick="App.submitExam()">SUBMIT CERTIFICATION</button>
                        </div>
                    </div>
                </div>

                <div class="container" style="display: grid; grid-template-columns: 1fr 350px; gap: 2.5rem; margin-top: 130px; align-items: start">
                    <!-- Question Focus Area -->
                    <div id="q-container" class="glass-card" style="padding: 4rem; min-height: 400px">
                        <!-- Question Renderer Injects Here -->
                    </div>

                    <!-- Side Panel: Intelligence & Navigation -->
                    <div style="display: grid; gap: 2.5rem; position: sticky; top: 130px">
                        <div class="glass-card" style="padding: 2.5rem">
                            <h4 style="font-size: 0.8rem; letter-spacing: 0.1em; margin-bottom: 2rem; opacity: 0.6">QUESTION PALETTE</h4>
                            <div class="palette-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px">
                                ${questions.map((_, i) => `
                                    <button class="palette-item" id="p-item-${i}" onclick="App.jumpToQuestion(${i})">${i + 1}</button>
                                `).join('')}
                            </div>
                            
                            <div style="margin-top: 2.5rem; display: grid; gap: 1rem">
                                <button class="btn btn-outline" style="width: 100%; font-size: 0.75rem" id="btn-flag" onclick="App.toggleFlag()">FLAG FOR REVIEW</button>
                            </div>
                        </div>

                        <div class="glass-card" style="padding: 2rem; background: rgba(99, 102, 241, 0.03)">
                            <div style="display: flex; gap: 1rem; align-items: start">
                                <i class="fas fa-info-circle" style="color: var(--primary); margin-top: 0.25rem"></i>
                                <div style="font-size: 0.85rem; line-height: 1.6; color: var(--text-muted)">
                                    Selection is auto-saved every 3 seconds. Ensure your network connection remains stable.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    questionRenderer(q, idx, total, studentAnswer) {
        return `
            <div class="animate-up">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem">
                    <span style="font-size: 0.8rem; font-weight: 800; color: var(--primary); letter-spacing: 0.1em">QUERY ${idx + 1} OF ${total}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700">${q.marks || 1} MARKS</span>
                </div>

                <h3 style="font-size: 1.8rem; line-height: 1.5; margin-bottom: 3rem; font-weight: 600">${q.question_text}</h3>

                <div class="answer-zone">
                    ${this.renderSpecificInput(q, studentAnswer)}
                </div>

                <div style="margin-top: 4rem; display: flex; justify-content: space-between; padding-top: 3rem; border-top: 1px solid var(--surface-border)">
                    <button class="btn btn-outline" style="padding: 1rem 2rem" onclick="App.prevQuestion()" ${idx === 0 ? 'disabled' : ''}>PREVIOUS</button>
                    <button class="btn btn-primary" style="padding: 1rem 3rem" onclick="App.nextQuestion()">${idx === total - 1 ? 'FINISH & REVIEW' : 'NEXT QUESTION'}</button>
                </div>
            </div>
        `;
    },

    renderSpecificInput(q, studentAnswer) {
        if (q.type === 'mcq') {
            const options = JSON.parse(q.options || '[]');
            return `
                <div style="display: grid; gap: 1rem">
                    ${options.map((opt, i) => `
                        <label class="option-card ${studentAnswer === opt ? 'selected' : ''}" onclick="App.saveAnswer('${q.id}', '${opt}', ${App.currentQuestionIdx})">
                            <input type="radio" name="q-${q.id}" value="${opt}" ${studentAnswer === opt ? 'checked' : ''} style="display: none">
                            <div class="radio-bubble"></div>
                            <span style="font-size: 1.1rem">${opt}</span>
                        </label>
                    `).join('')}
                </div>
            `;
        } else if (q.type === 'short') {
            return `
                <div class="input-group">
                    <label>YOUR RESPONSE</label>
                    <textarea class="input-field" style="min-height: 150px; padding: 2rem; font-size: 1.25rem" 
                              oninput="App.saveAnswer('${q.id}', this.value, ${App.currentQuestionIdx})"
                              placeholder="Type your structured answer here...">${studentAnswer || ''}</textarea>
                </div>
            `;
        } else if (q.type === 'coding') {
            return `
                <div class="code-editor-v2">
                    <div class="editor-header">
                        <div style="display: flex; gap: 0.5rem">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: #ff5f56"></div>
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: #ffbd2e"></div>
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: #27c93f"></div>
                        </div>
                        <span style="font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; opacity: 0.5">SOURCE ENGINE // PYTHON</span>
                    </div>
                    <textarea class="code-input" 
                              oninput="App.saveAnswer('${q.id}', this.value, ${App.currentQuestionIdx})"
                              placeholder="# Enter your solution logic here...&#10;def solution():&#10;    pass"
                              spellcheck="false">${studentAnswer || ''}</textarea>
                    <div style="padding: 1rem; background: rgba(0,0,0,0.2); border-top: 1px solid var(--surface-border); display: flex; justify-content: flex-end">
                        <button class="btn btn-outline" style="font-size: 0.7rem; padding: 0.5rem 1rem" onclick="App.runDiagnostics('${q.id}')">RUN DIAGNOSTICS</button>
                    </div>
                    <div id="v2-code-output" class="code-output" style="display: none"></div>
                </div>
            `;
        }
    }
};

export default Views;
