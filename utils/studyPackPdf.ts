import { StudyPack, LearningMode } from '../types';

const MODE_THEMES: Record<LearningMode, { gradient: string; accent: string; badge: string; label: string; emoji: string }> = {
  'quick-revision': { gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4, #14b8a6)', accent: '#0ea5e9', badge: '#ecfeff', label: 'Quick Revision', emoji: '⚡' },
  'exam-mode': { gradient: 'linear-gradient(135deg, #f59e0b, #ef4444, #dc2626)', accent: '#ef4444', badge: '#fff7ed', label: 'Exam Mode', emoji: '🎯' },
  'deep-learning': { gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7, #6366f1)', accent: '#8b5cf6', badge: '#f5f3ff', label: 'Deep Learning', emoji: '🧠' },
  'question-solver': { gradient: 'linear-gradient(135deg, #10b981, #059669, #047857)', accent: '#10b981', badge: '#ecfdf5', label: 'Question Solver', emoji: '🧩' },
};

const esc = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const generateStudyPackPDF = async (pack: StudyPack, fileName: string) => {
  const mode = pack.modeUsed || 'quick-revision';
  const theme = MODE_THEMES[mode];
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const modeSpecificSections = buildModeSpecificHTML(pack, mode, theme);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Study Pack - ${esc(fileName)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#fff;color:#1e293b;line-height:1.6}
.page{padding:40px 48px;max-width:850px;margin:0 auto}
.header{background:${theme.gradient};color:white;padding:44px 40px;border-radius:24px;margin-bottom:28px;position:relative;overflow:hidden}
.header::after{content:'';position:absolute;right:-40px;top:-40px;width:200px;height:200px;background:rgba(255,255,255,0.08);border-radius:50%}
.header::before{content:'';position:absolute;right:60px;bottom:-60px;width:150px;height:150px;background:rgba(255,255,255,0.06);border-radius:50%}
.header .brand{font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;opacity:0.75;margin-bottom:12px}
.header h1{font-size:26px;font-weight:900;line-height:1.2;margin-bottom:8px}
.header .meta{font-size:12px;opacity:0.8}
.header .mode-badge{display:inline-block;background:rgba(255,255,255,0.2);backdrop-filter:blur(10px);padding:5px 14px;border-radius:20px;font-size:11px;font-weight:700;margin-top:12px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
.stat{background:#f8fafc;border:2px solid #e2e8f0;border-radius:16px;padding:18px;text-align:center}
.stat .num{font-size:28px;font-weight:900;color:${theme.accent}}
.stat .lbl{font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.15em;margin-top:4px;font-weight:700}
.topics{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:24px}
.topic{background:${theme.badge};color:${theme.accent};padding:4px 12px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid ${theme.accent}22}
section{margin-bottom:24px;page-break-inside:avoid}
.section-head{display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${theme.accent}22}
.section-head h2{font-size:16px;font-weight:800;color:${theme.accent}}
.section-head .emoji{font-size:18px}
.card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;margin-bottom:10px;page-break-inside:avoid}
.card p{font-size:12px;color:#475569;line-height:1.7}
.card h3{font-size:13px;font-weight:700;margin-bottom:5px;color:#1e293b}
.card-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fc{border-left:3px solid ${theme.accent}}
.fc .q{font-size:12px;font-weight:700;color:#1e293b;margin-bottom:6px}
.fc .a{font-size:11px;color:#475569;padding-top:6px;border-top:1px dashed #e2e8f0}
.fc .tag{display:inline-block;background:${theme.badge};color:${theme.accent};padding:2px 8px;border-radius:10px;font-size:8px;font-weight:700;margin-top:6px}
.quiz-q{border-left:3px solid ${theme.accent};margin-bottom:14px}
.quiz-opt{padding:6px 12px;margin:3px 0;border-radius:8px;font-size:11px;background:#f1f5f9;color:#475569}
.quiz-correct{background:#dcfce7;color:#166534;font-weight:700}
.quiz-exp{margin-top:6px;font-size:10px;color:${theme.accent};font-style:italic}
.danger{background:#fef2f2;border:1px solid #fecaca;border-left:3px solid #ef4444}
.danger h3{color:#dc2626}
.formula{background:#fffbeb;border:1px solid #fde68a;border-left:3px solid #f59e0b}
.formula h3{color:#d97706}
.deep{background:#f5f3ff;border:1px solid #ddd6fe;border-left:3px solid #8b5cf6}
.deep h3{color:#7c3aed}
.deep .analogy{background:#ede9fe;border-radius:8px;padding:8px 12px;margin-top:8px;font-size:10px;color:#6d28d9}
table.comparison{width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;margin-bottom:16px;font-size:11px}
table.comparison th{background:${theme.accent};color:white;padding:10px 14px;text-align:left;font-weight:700}
table.comparison td{padding:8px 14px;border-bottom:1px solid #e2e8f0}
table.comparison tr:nth-child(even) td{background:#f8fafc}
table.comparison tr:nth-child(odd) td{background:#fff}
.plan-step{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px}
.plan-num{width:28px;height:28px;border-radius:50%;background:${theme.gradient};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}
.plan-text{font-size:12px;color:#475569;padding-top:4px}
.footer{text-align:center;margin-top:36px;padding:20px;border-top:2px solid #e2e8f0;color:#94a3b8;font-size:10px;font-weight:600}
.mnemonic{background:linear-gradient(135deg,#ecfeff,#f0fdfa);border:1px solid #99f6e4;border-radius:12px;padding:12px 14px;margin-bottom:8px}
.mnemonic p{font-size:12px;color:#0f766e;font-weight:600}
.tip{background:linear-gradient(135deg,#f0f9ff,#ecfeff);border:1px solid #bae6fd;border-radius:12px;padding:10px 14px;margin-bottom:8px}
.tip p{font-size:12px;color:#0369a1;font-weight:500}
</style></head><body>
<div class="page">
<div class="header">
<div class="brand">📚 STUDYSPHERE AI STUDY LAB</div>
<h1>${esc(pack.summary.headline)}</h1>
<div class="meta">${esc(fileName)} · Generated ${now}</div>
<div class="mode-badge">${theme.emoji} ${theme.label}</div>
</div>

${mode === 'question-solver' ? `
<div class="stats">
<div class="stat"><div class="num">${pack.questionSolutions?.length ?? 0}</div><div class="lbl">Solutions</div></div>
<div class="stat"><div class="num">${pack.keyTopics.length}</div><div class="lbl">Topics</div></div>
<div class="stat"><div class="num">${pack.difficulty}</div><div class="lbl">Difficulty</div></div>
</div>

<div class="topics">${pack.keyTopics.map(t => `<span class="topic">${esc(t)}</span>`).join('')}</div>

<section>
<div class="section-head"><span class="emoji">🧩</span><h2>Question Solutions</h2></div>
${(pack.questionSolutions || []).map((sol, i) => `<div class="card" style="border-left:3px solid ${theme.accent}; margin-bottom:14px">
<h3>Q${i + 1}: ${esc(sol.question)}${sol.marks ? ` <span style="float:right;background:${theme.badge};color:${theme.accent};padding:2px 10px;border-radius:12px;font-size:10px;font-weight:700">${sol.marks} Marks</span>` : ''}</h3>
<div style="margin-top:10px;padding:12px;background:#f0fdf4;border-radius:10px"><p style="white-space:pre-wrap">${esc(sol.answer)}</p></div>
${sol.explanation ? `<div style="margin-top:8px;font-size:10px;color:${theme.accent};font-style:italic">💡 ${esc(sol.explanation)}</div>` : ''}
</div>`).join('')}
</section>

<div class="footer">Generated by StudySphere AI Study Lab · ${theme.emoji} ${theme.label} · ${now}</div>` : `
<div class="stats">
<div class="stat"><div class="num">${pack.keyTopics.length}</div><div class="lbl">Topics</div></div>
<div class="stat"><div class="num">${pack.flashcards.length}</div><div class="lbl">Flashcards</div></div>
<div class="stat"><div class="num">${pack.quiz.length}</div><div class="lbl">Quiz Questions</div></div>
<div class="stat"><div class="num">${pack.difficulty}</div><div class="lbl">Difficulty</div></div>
</div>

<div class="topics">${pack.keyTopics.map(t => `<span class="topic">${esc(t)}</span>`).join('')}</div>

${pack.heroImageUrl ? `<div style="margin-bottom: 28px; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
  <img src="${pack.heroImageUrl}" style="width: 100%; height: auto; display: block;" alt="Study Hero" />
</div>` : ''}

<section>
<div class="section-head"><span class="emoji">📝</span><h2>Summary</h2></div>
<div class="card"><p>${esc(pack.summary.concise)}</p></div>
</section>

<section>
<div class="section-head"><span class="emoji">🔑</span><h2>Key Points</h2></div>
${pack.summary.bullets.map(b => `<div class="card"><p>${esc(b)}</p></div>`).join('')}
</section>

${modeSpecificSections}

<section>
<div class="section-head"><span class="emoji">💡</span><h2>Memory Hooks</h2></div>
${(pack.summary.memoryHooks || []).map(h => `<div class="card"><p>${esc(h)}</p></div>`).join('')}
</section>

<section>
<div class="section-head"><span class="emoji">🃏</span><h2>Flashcards</h2></div>
<div class="card-grid">
${pack.flashcards.map((f, i) => `<div class="card fc"><div class="q">Q${i + 1}: ${esc(f.question)}</div><div class="a"><strong>A:</strong> ${esc(f.answer)}</div><span class="tag">${esc(f.topic)}</span></div>`).join('')}
</div>
</section>

<section>
<div class="section-head"><span class="emoji">📋</span><h2>Quiz</h2></div>
${pack.quiz.map((q, i) => `<div class="card quiz-q"><h3>Q${i + 1}: ${esc(q.question)}</h3>${q.options.map(o => `<div class="quiz-opt${o === q.correctAnswer ? ' quiz-correct' : ''}">${ o === q.correctAnswer ? '✅ ' : '○ '}${esc(o)}</div>`).join('')}<div class="quiz-exp">💡 ${esc(q.explanation)}</div></div>`).join('')}
</section>

<section>
<div class="section-head"><span class="emoji">📅</span><h2>Study Plan</h2></div>
${pack.studyPlan.map((s, i) => `<div class="plan-step"><div class="plan-num">${i + 1}</div><div class="plan-text">${esc(s)}</div></div>`).join('')}
</section>

<section>
<div class="section-head"><span class="emoji">✅</span><h2>Concept Checks</h2></div>
${pack.conceptChecks.map(c => `<div class="card"><p>${esc(c)}</p></div>`).join('')}
</section>

<div class="footer">Generated by StudySphere AI Study Lab · ${theme.emoji} ${theme.label} · ${now}</div>`}
</div></body></html>`;

  // Use html2pdf.js
  const html2pdf = (await import('html2pdf.js')).default;
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '850px';
  document.body.appendChild(container);

  try {
    await html2pdf().set({
      margin: 0,
      filename: `StudyPack_${fileName.replace(/\.[^.]+$/, '')}_${mode}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'px', format: [850, container.scrollHeight + 40], orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css'] },
    }).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
};

function buildModeSpecificHTML(pack: StudyPack, mode: LearningMode, theme: { accent: string }): string {
  if (mode === 'quick-revision') {
    let html = '';
    if (pack.quickTips?.length) {
      html += `<section><div class="section-head"><span class="emoji">⚡</span><h2>Quick Tips</h2></div>
        ${pack.quickTips.map(t => `<div class="tip"><p>${esc(t)}</p></div>`).join('')}</section>`;
    }
    if (pack.mnemonics?.length) {
      html += `<section><div class="section-head"><span class="emoji">🧠</span><h2>Mnemonics & Memory Tricks</h2></div>
        ${pack.mnemonics.map(m => `<div class="mnemonic"><p>${esc(m)}</p></div>`).join('')}</section>`;
    }
    return html;
  }

  if (mode === 'exam-mode') {
    let html = '';
    if (pack.examTraps?.length) {
      html += `<section><div class="section-head"><span class="emoji">⚠️</span><h2>Exam Traps & Common Mistakes</h2></div>
        ${pack.examTraps.map(t => `<div class="card danger"><p>${esc(t)}</p></div>`).join('')}</section>`;
    }
    if (pack.formulaSheet?.length) {
      html += `<section><div class="section-head"><span class="emoji">📋</span><h2>Formula Sheet</h2></div>
        ${pack.formulaSheet.map(f => `<div class="card formula"><p>${esc(f)}</p></div>`).join('')}</section>`;
    }
    if (pack.summary.examSignals?.length) {
      html += `<section><div class="section-head"><span class="emoji">🎯</span><h2>Exam Signals</h2></div>
        ${pack.summary.examSignals.map(s => `<div class="card"><p>${esc(s)}</p></div>`).join('')}</section>`;
    }
    return html;
  }

  // Deep Learning
  let html = '';
  if (pack.deepDiveExplanations?.length) {
    html += `<section><div class="section-head"><span class="emoji">🔬</span><h2>Deep Dive Explanations</h2></div>
      ${pack.deepDiveExplanations.map(d => `<div class="card deep"><h3>${d.emoji} ${esc(d.concept)}</h3><p>${esc(d.explanation)}</p><div class="analogy">🔗 Analogy: ${esc(d.analogy)}</div></div>`).join('')}</section>`;
  }
  if (pack.comparisonTable) {
    const ct = pack.comparisonTable;
    html += `<section><div class="section-head"><span class="emoji">📊</span><h2>${esc(ct.title)}</h2></div>
      <table class="comparison"><thead><tr>${ct.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${ct.rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></section>`;
  }
  return html;
}
