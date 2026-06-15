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

// ===== AI SETTINGS =====
let aiConfig = {
    provider: 'gemini',
    apiKey: '',
    model: ''
};

// Load AI settings from localStorage
function loadAISettings() {
    try {
        const saved = localStorage.getItem('kazipro_ai_settings');
        if (saved) {
            aiConfig = JSON.parse(saved);
            // Restore UI
            const radios = document.querySelectorAll('input[name="ai-provider"]');
            radios.forEach(r => { if (r.value === aiConfig.provider) r.checked = true; });
            const keyInput = document.getElementById('ai-api-key');
            if (keyInput) keyInput.value = aiConfig.apiKey;
            updateAIStatus();
        }
    } catch(e) {}
}

function saveAISettings() {
    const provider = document.querySelector('input[name="ai-provider"]:checked').value;
    const apiKey = document.getElementById('ai-api-key').value.trim();

    if (!apiKey) {
        showAITestResult('Please enter an API key.', 'error');
        return;
    }

    aiConfig.provider = provider;
    aiConfig.apiKey = apiKey;

    localStorage.setItem('kazipro_ai_settings', JSON.stringify(aiConfig));
    updateAIStatus();
    showAITestResult('Settings saved successfully!', 'success');
}

function updateAIProvider() {
    aiConfig.provider = document.querySelector('input[name="ai-provider"]:checked').value;
}

function updateAIStatus() {
    const statusBox = document.getElementById('ai-status-box');
    const statusText = document.getElementById('ai-status-text');
    if (aiConfig.apiKey) {
        statusBox.classList.add('connected');
        statusText.textContent = 'AI Connected (' + aiConfig.provider.charAt(0).toUpperCase() + aiConfig.provider.slice(1) + ')';
    } else {
        statusBox.classList.remove('connected');
        statusText.textContent = 'AI Not Connected';
    }
}

function toggleAPIKeyVisibility() {
    const input = document.getElementById('ai-api-key');
    const btn = event.target;
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'Hide';
    } else {
        input.type = 'password';
        btn.textContent = 'Show';
    }
}

function showAITestResult(msg, type) {
    const el = document.getElementById('ai-test-result');
    el.textContent = msg;
    el.className = 'ai-test-result ' + type;
    setTimeout(() => { el.className = 'ai-test-result'; }, 5000);
}

function requireAI() {
    if (!aiConfig.apiKey) {
        alert('Please set up your AI API key first.\n\nGo to AI Settings in the navigation menu to configure your free API key.');
        showSection('ai-settings');
        return false;
    }
    return true;
}

async function callAI(prompt) {
    if (aiConfig.provider === 'gemini') {
        return await callGemini(prompt);
    } else if (aiConfig.provider === 'openai') {
        return await callOpenAI(prompt);
    } else if (aiConfig.provider === 'cohere') {
        return await callCohere(prompt);
    } else if (aiConfig.provider === 'huggingface') {
        return await callHuggingFace(prompt);
    }
    throw new Error('Unknown AI provider');
}

async function callGemini(prompt) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + aiConfig.apiKey;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Gemini API error');
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(prompt) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + aiConfig.apiKey
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'OpenAI API error');
    return data.choices[0].message.content;
}

async function callCohere(prompt) {
    const url = 'https://api.cohere.ai/v1/generate';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + aiConfig.apiKey
        },
        body: JSON.stringify({
            model: 'command',
            prompt: prompt,
            max_tokens: 2000
        })
    });
    const data = await response.json();
    if (data.message) throw new Error(data.message || 'Cohere API error');
    return data.generations[0].text;
}

async function callHuggingFace(prompt) {
    const url = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + aiConfig.apiKey
        },
        body: JSON.stringify({ inputs: prompt })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error || 'Hugging Face API error');
    return Array.isArray(data) ? data[0].generated_text : data.generated_text || JSON.stringify(data);
}

async function testAIConnection() {
    if (!aiConfig.apiKey) {
        aiConfig.apiKey = document.getElementById('ai-api-key').value.trim();
        aiConfig.provider = document.querySelector('input[name="ai-provider"]:checked').value;
    }
    if (!aiConfig.apiKey) {
        showAITestResult('Please enter an API key first.', 'error');
        return;
    }
    showAITestResult('Testing connection...', 'success');
    try {
        const result = await callAI('Say "Connection successful" in exactly two words.');
        showAITestResult('Connection successful! AI is ready to use.', 'success');
        updateAIStatus();
    } catch(err) {
        showAITestResult('Connection failed: ' + err.message, 'error');
    }
}

// ===== AI POWERED FEATURES =====
async function aiGenerateResume() {
    if (!requireAI()) return;

    const name = document.getElementById('r-name').value.trim();
    const jobtitle = document.getElementById('r-jobtitle').value.trim();
    const summary = document.getElementById('r-summary').value.trim();
    const skills = document.getElementById('r-skills').value.trim();
    const experience = document.getElementById('r-experience').value.trim();
    const education = document.getElementById('r-education').value.trim();

    if (!name || !jobtitle) {
        alert('Please fill in at least your name and target job title.');
        return;
    }

    const preview = document.getElementById('resume-preview');
    preview.innerHTML = '<div class="ai-loading">AI is writing your resume...</div>';

    const prompt = `You are a professional resume writer. Generate a clean, ATS-friendly resume for the following person. Use simple text formatting (no markdown, no tables, no columns). Use ALL CAPS for section headers.

Name: ${name}
Target Job Title: ${jobtitle}
Professional Summary: ${summary || 'Write a 2-3 sentence professional summary tailored to this role.'}
Skills: ${skills || 'Infer relevant skills for this role.'}
Work Experience: ${experience || 'Write placeholder experience sections.'}
Education: ${education || 'Write placeholder education.'}

Generate a complete, professional resume with these sections:
- HEADER (name, contact info)
- PROFESSIONAL SUMMARY
- KEY SKILLS
- WORK EXPERIENCE (with bullet points showing achievements)
- EDUCATION

Make it sound professional, confident, and specific to the job title. Use strong action verbs and include measurable results where possible.`;

    try {
        const result = await callAI(prompt);
        preview.innerText = result;
    } catch(err) {
        preview.innerHTML = '<p style="color:red;">AI Error: ' + escapeHtml(err.message) + '</p>';
    }
}

async function aiGenerateCoverLetter() {
    if (!requireAI()) return;

    const name = document.getElementById('c-name').value.trim();
    const email = document.getElementById('c-email').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const jobtitle = document.getElementById('c-jobtitle').value.trim();
    const company = document.getElementById('c-company').value.trim();
    const manager = document.getElementById('c-manager').value.trim();
    const skills = document.getElementById('c-skills').value.trim();
    const experience = document.getElementById('c-experience').value.trim();
    const jobdesc = document.getElementById('c-jobdesc').value.trim();

    if (!name || !jobtitle || !company) {
        alert('Please fill in your name, job title, and company name.');
        return;
    }

    const preview = document.getElementById('cover-preview');
    preview.innerHTML = '<div class="ai-loading">AI is writing your cover letter...</div>';

    const prompt = `You are a professional cover letter writer. Generate a compelling, recruiter-friendly cover letter for the following job application. Use professional but confident tone.

APPLICANT DETAILS:
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Target Role: ${jobtitle}
Company: ${company}
Hiring Manager: ${manager || 'Hiring Manager'}
Key Skills: ${skills || 'Not specified'}
Experience Highlights: ${experience || 'Not specified'}

JOB DESCRIPTION:
${jobdesc || 'Write a general cover letter for this role.'}

Generate a complete cover letter with:
- Professional header with name and contact info
- Opening paragraph (mention specific role and company)
- Body paragraphs (connect experience to job requirements, use specific examples)
- Closing paragraph (express enthusiasm, call to action)
- Professional sign-off

Make it sound natural, specific, and tailored to this exact role and company. Do not use generic templates.`;

    try {
        const result = await callAI(prompt);
        preview.innerText = result;
    } catch(err) {
        preview.innerHTML = '<p style="color:red;">AI Error: ' + escapeHtml(err.message) + '</p>';
    }
}

async function aiMatchCVToJob() {
    if (!requireAI()) return;

    const cvText = document.getElementById('matcher-cv-text').value.trim();
    const jobTitle = document.getElementById('matcher-jobtitle').value.trim();
    const company = document.getElementById('matcher-company').value.trim();
    const jobDesc = document.getElementById('matcher-jobdesc').value.trim();
    const name = document.getElementById('matcher-name').value.trim();
    const email = document.getElementById('matcher-email').value.trim();
    const phone = document.getElementById('matcher-phone').value.trim();

    if (!cvText || !jobTitle || !company || !jobDesc) {
        alert('Please fill in your CV text, job title, company name, and job description.');
        return;
    }

    const preview = document.getElementById('match-cover-letter');
    const placeholder = document.getElementById('matcher-placeholder');
    placeholder.style.display = 'none';
    document.getElementById('match-cover-section').style.display = 'block';
    preview.innerHTML = '<div class="ai-loading">AI is analyzing your CV against the job description...</div>';

    const prompt = `You are an expert ATS (Applicant Tracking System) analyst and career coach. Analyze the following CV against the job description and provide a comprehensive match analysis.

CV TEXT:
${cvText}

JOB TITLE: ${jobTitle}
COMPANY: ${company}
JOB DESCRIPTION:
${jobDesc}

Provide your analysis in this exact format:

MATCH SCORE: [score out of 100]

MATCHED STRENGTHS:
- [list specific skills/experience from CV that match the job]

MISSING REQUIREMENTS:
- [list job requirements not found in CV]

KEYWORD GAPS:
- [list important keywords from job description missing in CV]

IMPROVEMENT SUGGESTIONS:
- [specific actionable advice to improve the CV for this role]

TAILORING TIPS:
- [how to customize the CV for this specific company/role]

Now write a tailored cover letter for this application:

APPLICANT: ${name}
EMAIL: ${email}
PHONE: ${phone || 'Not provided'}

The cover letter should:
- Address the specific role and company
- Reference matched strengths from the analysis
- Address potential gaps proactively
- Sound confident and specific
- Be professional but personable`;

    try {
        const result = await callAI(prompt);
        preview.innerText = result;
    } catch(err) {
        preview.innerHTML = '<p style="color:red;">AI Error: ' + escapeHtml(err.message) + '</p>';
    }
}

// Load AI settings on page load
loadAISettings();

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

// ===== CV MATCHER =====
let uploadedCVText = '';

// PDF.js worker setup
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// File upload handling
const uploadZone = document.getElementById('upload-zone');
const cvFileInput = document.getElementById('cv-file');

if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleCVFile(file);
    });

    uploadZone.addEventListener('click', () => cvFileInput.click());
}

if (cvFileInput) {
    cvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleCVFile(file);
    });
}

function handleCVFile(file) {
    const filename = document.getElementById('upload-filename');
    filename.textContent = 'Loaded: ' + file.name;
    filename.style.color = '#16A34A';

    if (file.type === 'application/pdf') {
        extractPDFText(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedCVText = e.target.result;
            document.getElementById('matcher-cv-text').value = uploadedCVText;
        };
        reader.readAsText(file);
    } else {
        alert('Please upload a PDF or TXT file.');
    }
}

async function extractPDFText(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        uploadedCVText = fullText;
        document.getElementById('matcher-cv-text').value = fullText;
    } catch (err) {
        alert('Error reading PDF. Please try pasting your CV text instead.');
        console.error(err);
    }
}

function matchCVToJob() {
    const cvText = document.getElementById('matcher-cv-text').value.trim();
    const jobTitle = document.getElementById('matcher-jobtitle').value.trim();
    const company = document.getElementById('matcher-company').value.trim();
    const jobDesc = document.getElementById('matcher-jobdesc').value.trim();
    const name = document.getElementById('matcher-name').value.trim();
    const email = document.getElementById('matcher-email').value.trim();

    if (!cvText) {
        alert('Please upload your CV or paste the CV text.');
        return;
    }
    if (!jobTitle || !company || !jobDesc) {
        alert('Please fill in the job title, company name, and job description.');
        return;
    }
    if (!name || !email) {
        alert('Please fill in your name and email for the cover letter.');
        return;
    }

    // Extract keywords from job description
    const jobKeywords = extractJobKeywords(jobDesc);
    const cvLower = cvText.toLowerCase();

    // Find matched keywords
    const matched = [];
    const missing = [];
    jobKeywords.forEach(kw => {
        if (cvLower.includes(kw.toLowerCase())) {
            matched.push(kw);
        } else {
            missing.push(kw);
        }
    });

    // Calculate match score
    const totalKeywords = jobKeywords.length || 1;
    const keywordScore = Math.round((matched.length / totalKeywords) * 60);

    // Check for other factors
    let bonusScore = 0;
    if (cvText.length > 500) bonusScore += 10;
    if (cvText.length > 1500) bonusScore += 5;
    if (/\d+/.test(cvText)) bonusScore += 10;
    if (jobTitle.toLowerCase().split(' ').some(w => cvLower.includes(w.toLowerCase()))) bonusScore += 10;
    if (company.toLowerCase().split(' ').some(w => cvLower.includes(w.toLowerCase()) && w.length > 3)) bonusScore += 5;

    const totalScore = Math.min(100, keywordScore + bonusScore);

    // Display score
    const scoreEl = document.getElementById('match-score-value');
    scoreEl.textContent = totalScore + '%';
    const scoreBox = document.getElementById('match-score-box');
    if (totalScore >= 75) {
        scoreBox.style.background = 'linear-gradient(135deg, #166534, #16A34A)';
    } else if (totalScore >= 50) {
        scoreBox.style.background = 'linear-gradient(135deg, #A16207, #EAB308)';
    } else {
        scoreBox.style.background = 'linear-gradient(135deg, #991B1B, #DC2626)';
    }

    // Show sections
    document.getElementById('matcher-placeholder').style.display = 'none';
    document.getElementById('match-summary-section').style.display = 'block';
    document.getElementById('match-keywords-section').style.display = 'block';
    document.getElementById('match-missing-section').style.display = 'block';
    document.getElementById('match-suggestions-section').style.display = 'block';
    document.getElementById('match-cover-section').style.display = 'block';

    // Summary
    let summaryHtml = '';
    summaryHtml += '<p><strong>' + escapeHtml(jobTitle) + '</strong> at <strong>' + escapeHtml(company) + '</strong></p>';
    summaryHtml += '<p>Your CV matches <strong>' + matched.length + ' of ' + totalKeywords + '</strong> key requirements from the job description.</p>';
    if (totalScore >= 75) {
        summaryHtml += '<p style="color:#16A34A;font-weight:600;">Strong match — Your CV aligns well with this role.</p>';
    } else if (totalScore >= 50) {
        summaryHtml += '<p style="color:#A16207;font-weight:600;">Moderate match — Consider adding missing keywords to strengthen your application.</p>';
    } else {
        summaryHtml += '<p style="color:#DC2626;font-weight:600;">Weak match — Significant gaps between your CV and job requirements.</p>';
    }
    document.getElementById('match-summary').innerHTML = summaryHtml;

    // Matched keywords
    let kwHtml = '';
    matched.forEach(kw => {
        kwHtml += '<span class="keyword-tag">' + escapeHtml(kw) + '</span>';
    });
    document.getElementById('match-keywords').innerHTML = kwHtml || '<p style="color:var(--gray-500);font-size:0.9rem;">No exact keyword matches found.</p>';

    // Missing keywords
    let missHtml = '';
    missing.forEach(kw => {
        missHtml += '<span class="keyword-tag">' + escapeHtml(kw) + '</span>';
    });
    document.getElementById('match-missing').innerHTML = missHtml || '<p style="color:var(--gray-500);font-size:0.9rem;">Great! No obvious keyword gaps detected.</p>';

    // Suggestions
    let sugHtml = '';
    if (missing.length > 0) {
        sugHtml += '<div class="suggestion-item"><span class="suggestion-icon">+</span>Add these missing keywords to your CV: ' + escapeHtml(missing.slice(0, 5).join(', ')) + '</div>';
    }
    if (cvText.length < 500) {
        sugHtml += '<div class="suggestion-item"><span class="suggestion-icon">+</span>Your CV seems short. Add more detail about your experience and achievements.</div>';
    }
    if (!/\d+/.test(cvText)) {
        sugHtml += '<div class="suggestion-item"><span class="suggestion-icon">+</span>Add measurable achievements (numbers, percentages, dollar amounts) to strengthen impact.</div>';
    }
    if (jobTitle.toLowerCase().split(' ').filter(w => w.length > 3).some(w => !cvLower.includes(w.toLowerCase()))) {
        sugHtml += '<div class="suggestion-item"><span class="suggestion-icon">+</span>Include the exact job title "' + escapeHtml(jobTitle) + '" in your CV summary or skills section.</div>';
    }
    sugHtml += '<div class="suggestion-item"><span class="suggestion-icon">+</span>Tailor your professional summary to specifically address this role at ' + escapeHtml(company) + '.</div>';
    document.getElementById('match-suggestions').innerHTML = sugHtml;

    // Generate tailored cover letter
    generateMatcherCoverLetter(cvText, jobTitle, company, jobDesc, matched, missing);
}

function extractJobKeywords(text) {
    const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','this','that','these','those','i','we','you','he','she','it','they','me','us','him','her','its','them','my','our','your','his','their','what','which','who','whom','where','when','why','how','all','each','every','both','few','more','most','other','some','such','no','not','only','own','same','than','too','very','just','about','above','after','again','also','am','as','because','before','between','during','into','through','until','while','ability','experience','working','knowledge','including','using','must','need','required','role','position','job','looking','candidate','ideal','plus','prefer','strong','excellent','good','well','ability','abilities','years','year','related','similar','relevant']);

    // Extract multi-word phrases first
    const phrases = [];
    const phrasePatterns = [
        /data analysis/gi, /machine learning/gi, /project management/gi, /business intelligence/gi,
        /problem.solving/gi, /critical thinking/gi, /communication skills/gi, /team leadership/gi,
        /stakeholder management/gi, /strategic planning/gi, /financial analysis/gi, /risk management/gi,
        /quality assurance/gi, /change management/gi, /agile methodology/gi, /scrum master/gi,
        /customer service/gi, /supply chain/gi, /human resources/gi, /content creation/gi,
        /social media/gi, /digital marketing/gi, /brand management/gi, /market research/gi,
        /product management/gi, /ux design/gi, /ui design/gi, /cloud computing/gi,
        /cyber security/gi, /information technology/gi, /software development/gi, /web development/gi,
        /mobile development/gi, /database management/gi, /network administration/gi,
        /system administration/gi, /devops/gi, /continuous integration/gi, /version control/gi,
        /unit testing/gi, /integration testing/gi, /performance testing/gi,
        /cross.functional/gi, /multi.tasking/gi, /time management/gi, /attention to detail/gi,
        /report writing/gi, /presentation skills/gi, /negotiation skills/gi,
        /customer relationship/gi, /business development/gi, /revenue growth/gi,
        /cost reduction/gi, /process improvement/gi, /operational efficiency/gi
    ];

    phrasePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(m => phrases.push(m));
        }
    });

    // Extract single important words
    const words = text.toLowerCase().replace(/[^a-z0-9\s\+\#\.]/g, ' ').split(/\s+/);
    const importantWords = [];
    const techKeywords = ['python','sql','java','javascript','react','angular','vue','node','django','flask','fastapi','aws','azure','gcp','docker','kubernetes','terraform','jenkins','git','github','gitlab','bitbucket','jira','confluence','tableau','powerbi','power bi','excel','word','ppt','html','css','sass','less','typescript','php','ruby','go','rust','kotlin','swift','flutter','react native','ionic','mongodb','mysql','postgresql','oracle','sql server','redis','elasticsearch','kafka','spark','hadoop','hive','airflow','dbt','snowflake','redshift','bigquery','looker','mode','metabase','superset','qlik','sas','spss','r','matlab','tensorflow','pytorch','scikit-learn','pandas','numpy','scipy','matplotlib','seaborn','plotly','d3.js','tableau','powerbi','alteryx','knime','rapidminer','data lake','data warehouse','etl','elt','api','rest','graphql','soap','microservices','serverless','lambda','ec2','s3','rds','dynamodb','sqs','sns','cloudfront','route53','iam','vpc','security group','load balancer','auto scaling','ci/cd','agile','scrum','kanban','lean','six sigma','pmp','prince2','itil','cobit','iso27001','gdpr','hipaa','sox','pci','cis','nist','owasp','penetration testing','vulnerability assessment','incident response','disaster recovery','business continuity','change management','release management','configuration management','asset management','service desk','it service management','customer success','account management','sales','marketing','finance','accounting','audit','compliance','regulatory','governance','hr','recruitment','talent acquisition','learning development','compensation benefits','employee relations','workplace safety','diversity inclusion','corporate social responsibility','sustainability','esg','circular economy','renewable energy','carbon footprint','climate change','environmental','social governance'];

    words.forEach(w => {
        if (w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w)) {
            techKeywords.forEach(tech => {
                if (w === tech || w.includes(tech)) {
                    importantWords.push(w);
                }
            });
            if (!importantWords.includes(w) && w.length > 4) {
                importantWords.push(w);
            }
        }
    });

    // Combine and deduplicate
    const allKeywords = [...new Set([...phrases.map(p => p.toLowerCase()), ...importantWords])];

    // Sort by length (longer phrases first) then frequency
    return allKeywords.sort((a, b) => b.length - a.length).slice(0, 25);
}

function generateMatcherCoverLetter(cvText, jobTitle, company, jobDesc, matched, missing) {
    const name = document.getElementById('matcher-name').value.trim();
    const email = document.getElementById('matcher-email').value.trim();
    const phone = document.getElementById('matcher-phone').value.trim();
    const portfolio = document.getElementById('matcher-portfolio').value.trim();
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Extract experience highlights from CV
    const experienceHighlights = extractExperienceHighlights(cvText);

    // Extract top skills from CV
    const cvSkills = extractCVSkills(cvText);

    let letter = '';
    letter += name + '\n';
    if (email) letter += email + '\n';
    if (phone) letter += phone + '\n';
    letter += '\n' + today + '\n\n';

    letter += 'Dear Hiring Manager,\n\n';

    // Opening paragraph - mention specific role and company
    letter += 'I am writing to express my strong interest in the ' + jobTitle + ' position at ' + company + '. ';

    if (matched.length > 0) {
        letter += 'My background in ' + matched.slice(0, 3).join(', ').toLowerCase() + ' aligns closely with the requirements of this role. ';
    }

    letter += 'I am confident that my skills and experience make me a strong candidate for this position.\n\n';

    // Body paragraph - use CV experience
    letter += 'In my previous roles, ';

    if (experienceHighlights.length > 0) {
        letter += experienceHighlights.slice(0, 2).join(' Additionally, ').toLowerCase() + '. ';
    } else {
        letter += 'I have developed strong expertise in ' + cvSkills.slice(0, 4).join(', ').toLowerCase() + '. ';
    }

    letter += 'These experiences have prepared me to contribute effectively to ' + company + '\'s goals and objectives.\n\n';

    // Skills paragraph - match with job requirements
    if (matched.length > 0) {
        letter += 'My key qualifications that directly match your requirements include:\n';
        matched.slice(0, 6).forEach(skill => {
            letter += '- ' + skill.charAt(0).toUpperCase() + skill.slice(1) + '\n';
        });
        letter += '\n';
    }

    // Address missing areas
    if (missing.length > 0 && missing.length <= 5) {
        letter += 'While my experience may not cover every aspect of the role, I am a quick learner and am committed to developing any additional skills needed. ';
        letter += 'My strong foundation in ' + cvSkills.slice(0, 2).join(' and ').toLowerCase() + ' will enable me to adapt quickly to new challenges.\n\n';
    }

    // Closing paragraph
    letter += 'I am excited about the opportunity to join ' + company + ' and contribute to your team\'s success. ';
    letter += 'I would welcome the chance to discuss how my qualifications align with your needs in more detail.\n\n';

    letter += 'Thank you for considering my application. I look forward to hearing from you.\n\n';
    letter += 'Sincerely,\n';
    letter += name;
    if (portfolio) letter += '\n' + portfolio;

    document.getElementById('match-cover-letter').innerText = letter;
}

function extractExperienceHighlights(cvText) {
    const highlights = [];
    const lines = cvText.split('\n');

    lines.forEach(line => {
        const trimmed = line.trim();
        // Look for lines with numbers/achievements
        if (/\d+%|\d+\+|\$\d+|increased|reduced|improved|achieved|managed|led|developed|implemented|delivered|generated|saved|grew|expanded|launched|optimized|streamlined|automated/i.test(trimmed) && trimmed.length > 20 && trimmed.length < 300) {
            highlights.push(trimmed);
        }
    });

    return highlights.slice(0, 5);
}

function extractCVSkills(cvText) {
    const skills = [];
    const skillPatterns = ['python','sql','java','javascript','react','angular','vue','node','django','flask','aws','azure','gcp','docker','kubernetes','tableau','power bi','excel','html','css','typescript','php','ruby','go','mongodb','mysql','postgresql','redis','spark','hadoop','airflow','snowflake','tensorflow','pytorch','scikit-learn','pandas','numpy','agile','scrum','project management','data analysis','machine learning','business intelligence','financial analysis','stakeholder management','strategic planning','communication','leadership','problem solving','team management','budget management','risk management','quality assurance','process improvement','customer service','sales','marketing','digital marketing','content creation','social media','seo','sem','crm','erp','sap','salesforce','jira','confluence','git','github','ci/cd','devops','linux','windows','networking','cybersecurity','information security','cloud computing','serverless','microservices','api','rest','graphql','etl','data warehouse','data lake','big data','business analytics','report writing','presentation','negotiation','time management','attention to detail','multitasking','critical thinking','creative thinking','analytical skills','research','survey design','statistical analysis','r','matlab','sas','spss','bi tools','data visualization','dashboard','kpi','metrics','okr','roi','kpis'];

    const cvLower = cvText.toLowerCase();
    skillPatterns.forEach(skill => {
        if (cvLower.includes(skill)) {
            skills.push(skill);
        }
    });

    return skills.length > 0 ? skills : ['relevant technical skills', 'professional experience', 'analytical abilities'];
}

function copyMatcherCover() {
    const el = document.getElementById('match-cover-letter');
    const text = el.innerText || el.textContent;
    navigator.clipboard.writeText(text).then(() => alert('Cover letter copied to clipboard!'));
}

function downloadMatcherCoverPDF() {
    const text = document.getElementById('match-cover-letter').innerText;
    const win = window.open('', '_blank');
    win.document.write('<html><head><title>Cover Letter</title><style>body{font-family:Calibri,sans-serif;padding:40px;font-size:12pt;line-height:1.8;color:#1a1a1a;white-space:pre-wrap;}</style></head><body>' + text + '</body></html>');
    win.document.close();
    win.print();
}

function downloadMatcherCoverWord() {
    const text = document.getElementById('match-cover-letter').innerText;
    const htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.8;white-space:pre-wrap;}</style></head><body>' + text + '</body></html>';
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    downloadBlob(blob, 'CoverLetter_' + document.getElementById('matcher-company').value.replace(/\s+/g, '_') + '.doc');
}

function clearMatcherForm() {
    document.getElementById('matcher-cv-text').value = '';
    document.getElementById('matcher-jobtitle').value = '';
    document.getElementById('matcher-company').value = '';
    document.getElementById('matcher-jobdesc').value = '';
    document.getElementById('matcher-name').value = '';
    document.getElementById('matcher-email').value = '';
    document.getElementById('matcher-phone').value = '';
    document.getElementById('matcher-portfolio').value = '';
    document.getElementById('cv-file').value = '';
    document.getElementById('upload-filename').textContent = '';
    uploadedCVText = '';

    document.getElementById('match-score-value').textContent = '--';
    document.getElementById('match-score-box').style.background = 'var(--navy)';
    document.getElementById('matcher-placeholder').style.display = 'block';
    document.getElementById('match-summary-section').style.display = 'none';
    document.getElementById('match-keywords-section').style.display = 'none';
    document.getElementById('match-missing-section').style.display = 'none';
    document.getElementById('match-suggestions-section').style.display = 'none';
    document.getElementById('match-cover-section').style.display = 'none';
}
