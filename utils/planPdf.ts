/**
 * Premium PDF Plan Generator
 * Generates a beautifully styled HTML document and opens it for printing/saving as PDF.
 * Designed to look like a Claude or premium AI-generated report.
 */

interface PlanTask {
  title: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedTime?: number;
  subtasks?: string[];
}

interface SmartAnalysis {
  specific: boolean;
  measurable: boolean;
  achievable: boolean;
  relevant: boolean;
  timeBound: boolean;
}

const priorityConfig = {
  high: { label: 'HIGH', bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#ef4444' },
  medium: { label: 'MEDIUM', bg: '#fffbeb', border: '#fde68a', text: '#d97706', dot: '#f59e0b' },
  low: { label: 'LOW', bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', dot: '#22c55e' },
};

export function generatePlanPDF(goal: string, tasks: PlanTask[], smart?: SmartAnalysis) {
  const totalTime = tasks.reduce((s, t) => s + (t.estimatedTime || 0), 0);
  const totalSubtasks = tasks.reduce((s, t) => s + (t.subtasks?.length || 0), 0);
  const highCount = tasks.filter(t => t.priority === 'high').length;
  const dateRange = tasks.filter(t => t.dueDate).map(t => t.dueDate!).sort();
  const startDate = dateRange[0] || 'TBD';
  const endDate = dateRange[dateRange.length - 1] || 'TBD';
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const smartChecks = smart ? [
    { label: 'Specific', ok: smart.specific },
    { label: 'Measurable', ok: smart.measurable },
    { label: 'Achievable', ok: smart.achievable },
    { label: 'Relevant', ok: smart.relevant },
    { label: 'Time-bound', ok: smart.timeBound },
  ] : [];

  const taskCards = tasks.map((task, i) => {
    const p = priorityConfig[task.priority];
    const subtaskHtml = task.subtasks && task.subtasks.length > 0
      ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9">
          <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Subtasks</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${task.subtasks.map(st => `
              <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f8fafc;border-radius:8px;border:1px solid #f1f5f9">
                <div style="width:6px;height:6px;border-radius:50%;background:#a78bfa;flex-shrink:0"></div>
                <span style="font-size:11px;color:#475569">${st}</span>
              </div>
            `).join('')}
          </div>
        </div>`
      : '';

    return `
      <div style="background:white;border-radius:16px;border:1px solid #e2e8f0;padding:20px;margin-bottom:16px;page-break-inside:avoid;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
        <div style="display:flex;align-items:flex-start;gap:14px">
          <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#0ea5e9,#6366f1);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:13px;flex-shrink:0">${i + 1}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
              <h3 style="margin:0;font-size:15px;font-weight:700;color:#0f172a">${task.title}</h3>
              <span style="flex-shrink:0;font-size:9px;font-weight:800;letter-spacing:0.05em;padding:3px 8px;border-radius:6px;background:${p.bg};color:${p.text};border:1px solid ${p.border}">${p.label}</span>
            </div>
            ${task.notes ? `<p style="margin:6px 0 0;font-size:13px;color:#64748b;line-height:1.5">${task.notes}</p>` : ''}
            <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:10px">
              ${task.dueDate ? `<span style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#059669">📅 ${task.dueDate}</span>` : ''}
              ${task.estimatedTime ? `<span style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#2563eb">⏱ ${task.estimatedTime} min</span>` : ''}
              ${task.subtasks && task.subtasks.length > 0 ? `<span style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#7c3aed">📋 ${task.subtasks.length} subtasks</span>` : ''}
            </div>
            ${subtaskHtml}
          </div>
        </div>
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Study Plan – ${goal}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; color: #0f172a; }
    @media print {
      body { background: white; }
      .no-print { display: none !important; }
      .page-container { box-shadow: none !important; }
    }
  </style>
</head>
<body>
  <!-- Print button -->
  <div class="no-print" style="position:fixed;top:20px;right:20px;z-index:100;display:flex;gap:8px">
    <button onclick="window.print()" style="padding:10px 20px;background:#0ea5e9;color:white;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(14,165,233,0.3)">
      ⬇ Save as PDF
    </button>
    <button onclick="window.close()" style="padding:10px 16px;background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit">
      ✕ Close
    </button>
  </div>

  <div class="page-container" style="max-width:800px;margin:0 auto;padding:40px 32px;background:white;min-height:100vh;box-shadow:0 0 60px rgba(0,0,0,0.06)">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;padding-bottom:32px;border-bottom:2px solid #f1f5f9">
      <div style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:8px 20px;border-radius:50px;margin-bottom:16px">
        <span style="font-size:14px">✨</span>
        <span style="color:white;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">AI-Generated Study Plan</span>
      </div>
      <h1 style="font-size:28px;font-weight:900;color:#0f172a;line-height:1.2;margin-bottom:8px">${goal}</h1>
      <p style="font-size:13px;color:#94a3b8;font-weight:500">Generated by StudySphere AI · ${now}</p>
    </div>

    <!-- SMART Analysis -->
    ${smart ? `
    <div style="background:linear-gradient(135deg,#f0f9ff,#eff6ff);border:1px solid #bae6fd;border-radius:16px;padding:20px;margin-bottom:28px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:16px">🎯</span>
        <span style="font-size:12px;font-weight:800;color:#0369a1;text-transform:uppercase;letter-spacing:0.06em">SMART Goal Analysis</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${smartChecks.map(c => `
          <div style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:50px;font-size:12px;font-weight:700;${c.ok ? 'background:#dcfce7;color:#15803d;border:1px solid #bbf7d0' : 'background:#fef9c3;color:#a16207;border:1px solid #fde68a'}">
            ${c.ok ? '✓' : '⚠'} ${c.label}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px">
      <div style="text-align:center;padding:16px;background:#f8fafc;border-radius:14px;border:1px solid #f1f5f9">
        <div style="font-size:24px;font-weight:900;color:#0ea5e9">${tasks.length}</div>
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px">Tasks</div>
      </div>
      <div style="text-align:center;padding:16px;background:#f8fafc;border-radius:14px;border:1px solid #f1f5f9">
        <div style="font-size:24px;font-weight:900;color:#8b5cf6">${totalSubtasks}</div>
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px">Subtasks</div>
      </div>
      <div style="text-align:center;padding:16px;background:#f8fafc;border-radius:14px;border:1px solid #f1f5f9">
        <div style="font-size:24px;font-weight:900;color:#f59e0b">${highCount}</div>
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px">High Priority</div>
      </div>
      <div style="text-align:center;padding:16px;background:#f8fafc;border-radius:14px;border:1px solid #f1f5f9">
        <div style="font-size:24px;font-weight:900;color:#10b981">${totalTime > 0 ? Math.ceil(totalTime / 60) + 'h' : '—'}</div>
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px">Est. Time</div>
      </div>
    </div>

    <!-- Timeline -->
    ${dateRange.length > 0 ? `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;padding:14px 20px;background:linear-gradient(135deg,#fdf4ff,#faf5ff);border:1px solid #e9d5ff;border-radius:14px">
      <span style="font-size:16px">📆</span>
      <span style="font-size:12px;font-weight:700;color:#7c3aed">Timeline: ${startDate} → ${endDate}</span>
    </div>
    ` : ''}

    <!-- Tasks -->
    <div style="margin-bottom:32px">
      <h2 style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:20px;display:flex;align-items:center;gap:8px">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:8px;color:white;font-size:13px">📋</span>
        Task Roadmap
      </h2>
      ${taskCards}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:24px;border-top:2px solid #f1f5f9">
      <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 16px;background:#f1f5f9;border-radius:50px;margin-bottom:8px">
        <span style="font-size:12px">⚡</span>
        <span style="font-size:11px;font-weight:700;color:#64748b">Powered by StudySphere AI</span>
      </div>
      <p style="font-size:11px;color:#cbd5e1;margin-top:6px">This plan was generated using AI analysis. Review and adapt as needed for your study schedule.</p>
    </div>

  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onafterprint = () => URL.revokeObjectURL(url);
  }
}
