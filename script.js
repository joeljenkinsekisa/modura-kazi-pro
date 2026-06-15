// ===== NAVIGATION =====
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.remove('active');
}

function toggleNav() {
    document.getElementById('navLinks').classList.toggle('active');
}

// ===== LOCAL STORAGE =====
function saveFormData(section, data) {
    try {
        localStorage.setItem('kazipro_' + section, JSON.stringify(data));
    } catch(e) {}
}

function loadFormData(section) {
    try {
        const data = localStorage.getItem('kazipro_' + section);
        return data ? JSON.parse(data) : null;
    } catch(e) {
        return null;
    }
}

function restoreFormFields(ids, section) {
    const saved = loadFormData(section);
    if (!saved) return;
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && saved[id] !== undefined) el.value = saved[id];
    });
}

function autoSaveForm(ids, section) {
    const data = {};
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) data[id] = el.value;
    });
    saveFormData(section, data);
}

// ===== RESUME BUILDER =====
const resumeFields = ['r-name','r-phone','r-email','r-location','r-linkedin','r-portfolio','r-jobtitle','r-summary','r-skills','r-experience','r-projects','r-education','r-certifications','r-tools'];

restoreFormFields(resumeFields, 'resume');
resumeFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => autoSaveForm(resumeFields, 'resume'));
});

function generateResume() {
    const name = document.getElementById('r-name').value.trim();
    const phone = document.getElementById('r-phone').value.trim();
    const email = document.getElementById('r-email').value.trim();
    const location = document.getElementById('r-location').value.trim();
    const linkedin = document.getElementById('r-linkedin').value.trim();
    const portfolio = document.getElementById('r-portfolio').value.trim();
    const jobtitle = document.getElementById('r-jobtitle').value.trim();
    const summary = document.getElementById('r-summary').value.trim();
    const skills = document.getElementById('r-skills').value.trim();
    const experience = document.getElementById('r-experience').value.trim();
    const projects = document.getElementById('r-projects').value.trim();
    const education = document.getElementById('r-education').value.trim();
    const certifications = document.getElementById('r-certifications').value.trim();
    const tools = document.getElementById('r-tools').value.trim();

    if (!name || !phone || !email || !jobtitle || !summary || !skills || !education) {
        alert('Please fill in all required fields (marked with *).');
        return;
    }

    let html = '<div class="resume-preview-content">';

    // Header
    html += '<h1>' + escapeHtml(name) + '</h1>';
    let contactParts = [];
    if (phone) contactParts.push(escapeHtml(phone));
    if (email) contactParts.push(escapeHtml(email));
    if (location) contactParts.push(escapeHtml(location));
    html += '<div class="contact-line">' + contactParts.join(' | ') + '</div>';
    let links = [];
    if (linkedin) links.push(escapeHtml(linkedin));
    if (portfolio) links.push(escapeHtml(portfolio));
    if (links.length) html += '<div class="contact-line">' + links.join(' | ') + '</div>';

    // Target Title
    html += '<p><strong>' + escapeHtml(jobtitle) + '</strong></p>';

    // Summary
    html += '<h2>Professional Summary</h2>';
    html += '<p>' + escapeHtml(summary) + '</p>';

    // Skills
    if (skills) {
        html += '<h2>Key Skills</h2>';
        const skillList = skills.split('\n').filter(s => s.trim());
        html += '<p>' + skillList.map(s => escapeHtml(s.trim())).join(' | ') + '</p>';
    }

    // Experience
    if (experience) {
        html += '<h2>Work Experience</h2>';
        const blocks = experience.split('\n\n');
        blocks.forEach(block => {
            const lines = block.split('\n').filter(l => l.trim());
            if (lines.length === 0) return;
            const header = lines[0].split('|').map(p => p.trim());
            html += '<div class="job-header">' + escapeHtml(header[0]);
            if (header[1]) html += ' | ' + escapeHtml(header[1]);
            if (header[2]) html += ' | ' + escapeHtml(header[2]);
            html += '</div>';
            if (lines.length > 1) {
                html += '<ul>';
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) html += '<li>' + escapeHtml(lines[i].trim()) + '</li>';
                }
                html += '</ul>';
            }
        });
    }

    // Projects
    if (projects) {
        html += '<h2>Projects</h2>';
        html += '<p>' + escapeHtml(projects).replace(/\n/g, '<br>') + '</p>';
    }

    // Education
    if (education) {
        html += '<h2>Education</h2>';
        education.split('\n').filter(l => l.trim()).forEach(line => {
            const parts = line.split('|').map(p => p.trim());
            html += '<p><strong>' + escapeHtml(parts[0]) + '</strong>';
            if (parts[1]) html += ' | ' + escapeHtml(parts[1]);
            if (parts[2]) html += ' | ' + escapeHtml(parts[2]);
            html += '</p>';
        });
    }

    // Certifications
    if (certifications) {
        html += '<h2>Certifications</h2>';
        certifications.split('\n').filter(l => l.trim()).forEach(line => {
            html += '<p>' + escapeHtml(line.trim()) + '</p>';
        });
    }

    // Tools
    if (tools) {
        html += '<h2>Tools & Technologies</h2>';
        html += '<p>' + escapeHtml(tools) + '</p>';
    }

    html += '</div>';
    document.getElementById('resume-preview').innerHTML = html;
}

function getResumeText() {
    const el = document.getElementById('resume-preview');
    return el.innerText || el.textContent;
}

function copyResume() {
    const text = getResumeText();
    if (text.includes('Fill in the form')) {
        alert('Please generate a resume first.');
        return;
    }
    navigator.clipboard.writeText(text).then(() => alert('Resume copied to clipboard!'));
}

function downloadResumePDF() {
    const content = document.getElementById('resume-preview').innerHTML;
    if (content.includes('placeholder-text')) {
        alert('Please generate a resume first.');
        return;
    }
    const win = window.open('', '_blank');
    win.document.write('<html><head><title>Resume</title><style>body{font-family:Segoe UI,sans-serif;padding:40px;font-size:14px;line-height:1.6;color:#1a1a1a;}h1{font-size:22px;margin-bottom:4px;}h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #0A1628;padding-bottom:4px;margin:16px 0 8px;}.contact-line{font-size:12px;color:#555;margin-bottom:8px;}.job-header{font-weight:600;margin-bottom:4px;}ul{margin:0 0 8px 20px;}li{margin-bottom:4px;}</style></head><body>' + content + '</body></html>');
    win.document.close();
    win.print();
}

function downloadResumeWord() {
    const content = document.getElementById('resume-preview').innerHTML;
    if (content.includes('placeholder-text')) {
        alert('Please generate a resume first.');
        return;
    }
    const htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.5;}h1{font-size:16pt;margin-bottom:4pt;}h2{font-size:11pt;text-transform:uppercase;border-bottom:1pt solid #000;padding-bottom:2pt;margin:12pt 0 6pt;}.contact-line{font-size:9pt;color:#555;}.job-header{font-weight:bold;}</style></head><body>' + content + '</body></html>';
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    downloadBlob(blob, 'Resume.doc');
}

function clearResumeForm() {
    resumeFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    localStorage.removeItem('kazipro_resume');
    document.getElementById('resume-preview').innerHTML = '<p class="placeholder-text">Fill in the form and click "Generate Resume" to see your ATS-friendly resume here.</p>';
}

// ===== COVER LETTER BUILDER =====
const coverFields = ['c-name','c-email','c-phone','c-jobtitle','c-company','c-manager','c-skills','c-experience','c-jobdesc'];

restoreFormFields(coverFields, 'cover');
coverFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => autoSaveForm(coverFields, 'cover'));
});

function generateCoverLetter() {
    const name = document.getElementById('c-name').value.trim();
    const email = document.getElementById('c-email').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const jobtitle = document.getElementById('c-jobtitle').value.trim();
    const company = document.getElementById('c-company').value.trim();
    const manager = document.getElementById('c-manager').value.trim();
    const skills = document.getElementById('c-skills').value.trim();
    const experience = document.getElementById('c-experience').value.trim();
    const jobdesc = document.getElementById('c-jobdesc').value.trim();

    if (!name || !email || !jobtitle || !company || !skills || !experience) {
        alert('Please fill in all required fields (marked with *).');
        return;
    }

    const skillList = skills.split('\n').filter(s => s.trim()).map(s => s.trim());
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let letter = '';
    letter += name + '\n';
    if (email) letter += email + '\n';
    if (phone) letter += phone + '\n';
    letter += '\n' + today + '\n\n';

    letter += 'Dear ' + (manager ? escapeHtml(manager) : 'Hiring Manager') + ',\n\n';

    letter += 'I am writing to express my strong interest in the ' + escapeHtml(jobtitle) + ' position at ' + escapeHtml(company) + '. With my background in ' + skillList.slice(0, 3).join(', ').toLowerCase() + ' and a proven track record of delivering results, I am confident in my ability to contribute meaningfully to your team.\n\n';

    letter += 'In my recent roles, ' + escapeHtml(experience).replace(/\n/g, ' ') + ' This experience has equipped me with the skills and perspective needed to excel in this role and add immediate value to ' + escapeHtml(company) + '.\n\n';

    if (jobdesc) {
        const keywords = extractKeywords(jobdesc);
        if (keywords.length > 0) {
            letter += 'My expertise aligns closely with the requirements of this role. Specifically, my skills in ' + keywords.slice(0, 4).join(', ').toLowerCase() + ' directly match what you are looking for in this position.\n\n';
        }
    }

    letter += 'I am particularly drawn to ' + escapeHtml(company) + ' because of its reputation for innovation and impact. I am eager to bring my analytical mindset, problem-solving abilities, and passion for ' + skillList[0].toLowerCase() + ' to your organization.\n\n';

    letter += 'I would welcome the opportunity to discuss how my qualifications align with your needs. I am available for an interview at your convenience and look forward to the possibility of contributing to ' + escapeHtml(company) + '.\n\n';

    letter += 'Thank you for considering my application.\n\n';
    letter += 'Sincerely,\n';
    letter += escapeHtml(name);

    document.getElementById('cover-preview').innerText = letter;
}

function getCoverText() {
    const el = document.getElementById('cover-preview');
    return el.innerText || el.textContent;
}

function copyCoverLetter() {
    const text = getCoverText();
    if (text.includes('Fill in the form')) {
        alert('Please generate a cover letter first.');
        return;
    }
    navigator.clipboard.writeText(text).then(() => alert('Cover letter copied to clipboard!'));
}

function downloadCoverPDF() {
    const text = getCoverText();
    if (text.includes('Fill in the form')) {
        alert('Please generate a cover letter first.');
        return;
    }
    const win = window.open('', '_blank');
    win.document.write('<html><head><title>Cover Letter</title><style>body{font-family:Calibri,sans-serif;padding:40px;font-size:12pt;line-height:1.8;color:#1a1a1a;white-space:pre-wrap;}</style></head><body>' + text + '</body></html>');
    win.document.close();
    win.print();
}

function downloadCoverWord() {
    const text = getCoverText();
    if (text.includes('Fill in the form')) {
        alert('Please generate a cover letter first.');
        return;
    }
    const htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.8;white-space:pre-wrap;}</style></head><body>' + text + '</body></html>';
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    downloadBlob(blob, 'CoverLetter.doc');
}

function clearCoverForm() {
    coverFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    localStorage.removeItem('kazipro_cover');
    document.getElementById('cover-preview').innerHTML = '<p class="placeholder-text">Fill in the form and click "Generate Cover Letter" to preview your cover letter here.</p>';
}

// ===== JOB EMAIL BUILDER =====
const emailFields = ['e-name','e-email','e-phone','e-recipient','e-jobtitle','e-company','e-portfolio','e-value'];

restoreFormFields(emailFields, 'jobemail');
emailFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => autoSaveForm(emailFields, 'jobemail'));
});

function generateEmail() {
    const name = document.getElementById('e-name').value.trim();
    const email = document.getElementById('e-email').value.trim();
    const phone = document.getElementById('e-phone').value.trim();
    const recipient = document.getElementById('e-recipient').value.trim();
    const jobtitle = document.getElementById('e-jobtitle').value.trim();
    const company = document.getElementById('e-company').value.trim();
    const portfolio = document.getElementById('e-portfolio').value.trim();
    const value = document.getElementById('e-value').value.trim();

    if (!name || !email || !recipient || !jobtitle || !company) {
        alert('Please fill in all required fields (marked with *).');
        return;
    }

    let emailText = '';
    emailText += 'To: ' + escapeHtml(recipient) + '\n';
    emailText += 'Subject: Application for ' + escapeHtml(jobtitle) + ' - ' + escapeHtml(name) + '\n\n';

    emailText += 'Dear Hiring Manager,\n\n';

    emailText += 'I am writing to express my interest in the ' + escapeHtml(jobtitle) + ' position at ' + escapeHtml(company) + '.\n\n';

    if (value) {
        emailText += escapeHtml(value) + '\n\n';
    }

    emailText += 'I have attached my resume for your review. I would welcome the opportunity to discuss how my skills and experience align with your team\'s needs.\n\n';

    if (portfolio) {
        emailText += 'Portfolio: ' + escapeHtml(portfolio) + '\n';
    }
    emailText += 'Email: ' + escapeHtml(email) + '\n';
    if (phone) emailText += 'Phone: ' + escapeHtml(phone) + '\n';

    emailText += '\nThank you for your time and consideration.\n\n';
    emailText += 'Best regards,\n';
    emailText += escapeHtml(name);

    document.getElementById('email-preview').innerText = emailText;
}

function copyEmail() {
    const el = document.getElementById('email-preview');
    const text = el.innerText || el.textContent;
    if (text.includes('Fill in the form')) {
        alert('Please generate an email first.');
        return;
    }
    navigator.clipboard.writeText(text).then(() => alert('Email copied to clipboard!'));
}

function clearEmailForm() {
    emailFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    localStorage.removeItem('kazipro_jobemail');
    document.getElementById('email-preview').innerHTML = '<p class="placeholder-text">Fill in the form and click "Generate Email" to preview your job application email here.</p>';
}

// ===== ATS CHECKLIST =====
function checkATSScore() {
    const jobtitle = document.getElementById('ats-jobtitle').value.trim();
    const summary = document.getElementById('ats-summary').value.trim();
    const skills = document.getElementById('ats-skills').value.trim();
    const experience = document.getElementById('ats-experience').value.trim();
    const education = document.getElementById('ats-education').value.trim();
    const achievements = document.getElementById('ats-achievements').value;
    const keywords = document.getElementById('ats-keywords').value;

    const checks = [
        { label: 'Has clear job title', pass: jobtitle.length > 0, points: 10 },
        { label: 'Has professional summary', pass: summary.length > 20, points: 15 },
        { label: 'Has measurable achievements', pass: achievements === 'yes', points: 15 },
        { label: 'Has relevant keywords from job description', pass: keywords === 'yes', points: 15 },
        { label: 'Has skills section', pass: skills.length > 10, points: 15 },
        { label: 'Has work experience', pass: experience.length > 20, points: 15 },
        { label: 'Has education section', pass: education.length > 5, points: 10 },
        { label: 'Uses simple formatting (ATS-compatible)', pass: true, points: 5 },
    ];

    let score = 0;
    checks.forEach(c => { if (c.pass) score += c.points; });

    // Display score
    const scoreEl = document.getElementById('ats-score-value');
    scoreEl.textContent = score + '/100';

    // Score box color
    const scoreBox = document.getElementById('ats-score-box');
    if (score >= 80) {
        scoreBox.style.background = 'linear-gradient(135deg, #166534, #16A34A)';
    } else if (score >= 60) {
        scoreBox.style.background = 'linear-gradient(135deg, #A16207, #EAB308)';
    } else {
        scoreBox.style.background = 'linear-gradient(135deg, #991B1B, #DC2626)';
    }

    // Build feedback
    let html = '<h4>ATS Compliance Checklist</h4>';
    checks.forEach(c => {
        html += '<div class="checklist-item">';
        html += '<div class="checklist-icon ' + (c.pass ? 'pass' : 'fail') + '">' + (c.pass ? '&#10003;' : '&#10007;') + '</div>';
        html += '<div class="checklist-text">' + c.label + ' (' + c.points + ' pts)</div>';
        html += '</div>';
    });

    // Status
    let statusClass, statusText;
    if (score >= 80) {
        statusClass = 'strong';
        statusText = 'Strong ATS Resume — Well optimized for applicant tracking systems.';
    } else if (score >= 60) {
        statusClass = 'good';
        statusText = 'Good but needs improvement — Add more measurable achievements and keywords.';
    } else {
        statusClass = 'weak';
        statusText = 'Weak resume — Needs serious editing to pass ATS screening.';
    }
    html += '<div class="ats-status ' + statusClass + '">' + statusText + '</div>';

    // Tips
    html += '<div style="margin-top:20px;padding:15px;background:#F3F4F6;border-radius:6px;">';
    html += '<h4 style="margin-bottom:8px;">Quick Tips to Improve Your Score</h4>';
    html += '<ul style="margin-left:18px;font-size:0.9rem;color:#374151;">';
    if (!jobtitle) html += '<li>Add a clear target job title at the top of your resume.</li>';
    if (summary.length <= 20) html += '<li>Write a professional summary of 2-4 sentences highlighting your experience.</li>';
    if (achievements === 'no') html += '<li>Include measurable achievements: numbers, percentages, dollar amounts.</li>';
    if (keywords === 'no') html += '<li>Match keywords from the job description in your resume.</li>';
    if (skills.length <= 10) html += '<li>Add a dedicated skills section with 8-15 relevant skills.</li>';
    if (experience.length <= 20) html += '<li>Add detailed work experience with bullet points.</li>';
    if (education.length <= 5) html += '<li>Add your education with degree, institution, and year.</li>';
    html += '</ul></div>';

    document.getElementById('ats-feedback').innerHTML = html;
}

// ===== UTILITIES =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function extractKeywords(text) {
    const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','this','that','these','those','i','we','you','he','she','it','they','me','us','him','her','its','them','my','our','your','his','their','what','which','who','whom','where','when','why','how','all','each','every','both','few','more','most','other','some','such','no','not','only','own','same','than','too','very','just','about','above','after','again','also','am','as','because','before','between','during','into','through','until','while']);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    const freq = {};
    words.forEach(w => {
        if (w.length > 2 && !stopWords.has(w)) {
            freq[w] = (freq[w] || 0) + 1;
        }
    });
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(e => e[0]);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
