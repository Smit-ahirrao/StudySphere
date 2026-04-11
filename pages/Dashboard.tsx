import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Download, FileText, NotebookPen, Target, Upload } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../context/DataContext';
import { Badge, Button, Card, SectionHeading } from '../components/UI';
import { exportData } from '../utils/storage';
import { countCompletedTasks, countTasks, flattenTasks } from '../utils/taskHelpers';
import { formatDisplayDate, getLast7Days, getLocalDateKey } from '../utils/date';

const Dashboard: React.FC = () => {
  const { data, importBackup } = useData();
  const navigate = useNavigate();
  const stripHtml = (html: string) => new DOMParser().parseFromString(html, 'text/html').body.textContent || '';

  const stats = useMemo(() => {
    const totalTasks = countTasks(data.tasks);
    const completedTasks = countCompletedTasks(data.tasks);
    const notes = data.notes.filter((note) => !note.trashed);
    const todayKey = getLocalDateKey(new Date());
    const focusedToday = data.focusHistory
      .filter((session) => getLocalDateKey(new Date(session.completedAt)) === todayKey && session.mode === 'focus')
      .reduce((sum, session) => sum + session.duration, 0);
    const plannerToday = data.planner.filter((event) => event.day === todayKey);

    const focusTrend = getLast7Days().map((dateKey) => {
      const minutes = data.focusHistory
        .filter((session) => getLocalDateKey(new Date(session.completedAt)) === dateKey && session.mode === 'focus')
        .reduce((sum, session) => sum + session.duration, 0);

      return {
        label: formatDisplayDate(dateKey),
        minutes,
      };
    });

    return {
      totalTasks,
      completedTasks,
      completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
      notesCount: notes.length,
      focusedToday,
      plannerToday,
      focusTrend,
    };
  }, [data]);

  const flattenedTasks = flattenTasks(data.tasks);
  const urgentTasks = flattenedTasks
    .filter((task) => !task.completed)
    .sort((a, b) => Number(b.priority === 'high') - Number(a.priority === 'high'))
    .slice(0, 4);
  const recentNotes = [...data.notes]
    .filter((note) => !note.trashed)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      alert(importBackup(result) ? 'Backup imported successfully.' : 'The selected file is not a valid StudySphere backup.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Mission Control"
        title="Your work at a glance"
        description="This dashboard surfaces progress, focus consistency, and what needs attention next so you can decide quickly and start moving."
        action={
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center">
              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-slate-800">
                <Upload size={16} />
                Import backup
              </span>
            </label>
            <Button variant="secondary" onClick={() => exportData(data)}>
              <Download size={16} />
              Export data
            </Button>
          </div>
        }
      />

      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Target} label="Task completion" value={`${stats.completionRate}%`} caption={`${stats.completedTasks} of ${stats.totalTasks} finished`} accent="cyan" />
        <MetricCard icon={NotebookPen} label="Active notes" value={String(stats.notesCount)} caption="Knowledge captured and ready" accent="amber" />
        <MetricCard icon={Clock3} label="Focused today" value={`${stats.focusedToday}m`} caption="Tracked through the focus timer" accent="emerald" />
        <MetricCard icon={CalendarDays} label="Planned today" value={String(stats.plannerToday.length)} caption="Sessions on your current schedule" accent="violet" />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card
          title="Focus momentum"
          action={<Badge color="cyan">Last 7 days</Badge>}
          className="min-h-[360px] min-w-0"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.focusTrend}>
                <defs>
                  <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '18px',
                    border: '1px solid rgba(226,232,240,0.85)',
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 20px 40px rgba(15,23,42,0.08)',
                  }}
                />
                <Area type="monotone" dataKey="minutes" stroke="#0891b2" strokeWidth={3} fill="url(#focusFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Quick launch">
            <div className="grid gap-3">
              <QuickLink icon={CheckCircle2} title="Capture a task" subtitle="Turn coursework into a visible plan" onClick={() => navigate('/tasks')} />
              <QuickLink icon={FileText} title="Write a note" subtitle="Create a study note or revision sheet" onClick={() => navigate('/notes')} />
              <QuickLink icon={Clock3} title="Start focus mode" subtitle="Kick off a Pomodoro session" onClick={() => navigate('/focus')} />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <Card title="Priority queue" action={<Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>Open tasks <ArrowRight size={14} /></Button>}>
          <div className="space-y-3">
            {urgentTasks.length === 0 ? (
              <EmptyMessage title="No pending tasks yet" description="Add tasks and this space will surface your next highest-impact work." />
            ) : (
              urgentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="truncate font-medium text-slate-900 dark:text-white">{task.title}</div>
                    <div className="mt-1 truncate text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{task.priority} priority</div>
                  </div>
                  <div className="shrink-0">
                    <Badge color={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'gray'}>{task.completed ? 'Done' : 'Open'}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Recent notes" action={<Button variant="ghost" size="sm" onClick={() => navigate('/notes')}>Open notes <ArrowRight size={14} /></Button>}>
          <div className="space-y-3">
            {recentNotes.length === 0 ? (
              <EmptyMessage title="No notes captured" description="Your freshest ideas, summaries, and revision notes will appear here." />
            ) : (
              recentNotes.map((note) => (
                <div key={note.id} className="rounded-3xl border border-slate-100 bg-white/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/55 min-w-0">
                  <div className="truncate font-medium text-slate-900 dark:text-white">{note.title}</div>
                  <p className="mt-2 line-clamp-2 overflow-hidden text-sm text-slate-600 dark:text-slate-400">{stripHtml(note.content) || 'Empty note'}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const MetricCard = ({
  icon: Icon,
  label,
  value,
  caption,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  caption: string;
  accent: 'cyan' | 'amber' | 'emerald' | 'violet';
}) => {
  const accents = {
    cyan: 'from-cyan-400/18 to-sky-500/5 text-cyan-700 dark:text-cyan-300',
    amber: 'from-amber-300/18 to-orange-400/5 text-amber-700 dark:text-amber-300',
    emerald: 'from-emerald-400/18 to-teal-500/5 text-emerald-700 dark:text-emerald-300',
    violet: 'from-violet-400/18 to-fuchsia-500/5 text-violet-700 dark:text-violet-300',
  };

  return (
    <Card className={`border-none bg-gradient-to-br ${accents[accent]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
          <div className="mt-2 text-4xl font-semibold text-slate-950 dark:text-white">{value}</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{caption}</div>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 text-slate-900 shadow-sm dark:bg-slate-900/60 dark:text-white">
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
};

const QuickLink = ({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50/70 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-sky-700 dark:hover:bg-slate-900"
  >
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-white p-3 text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-300">
        <Icon size={18} />
      </div>
      <div>
        <div className="font-medium text-slate-900 dark:text-white">{title}</div>
        <div className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</div>
      </div>
    </div>
    <ArrowRight size={16} className="text-slate-400" />
  </button>
);

const EmptyMessage = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-800">
    <p className="font-medium text-slate-900 dark:text-white">{title}</p>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
  </div>
);

export default Dashboard;
