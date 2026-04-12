import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Download, FileText, NotebookPen, Sparkles, Target, Upload } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Badge, Button, Card, SectionHeading } from '../components/UI';
import { exportData } from '../utils/storage';
import { countCompletedTasks, countTasks, flattenTasks } from '../utils/taskHelpers';
import { getLocalDateKey } from '../utils/date';

const RANKS = [
  { name: 'Novice', minXp: 0, nextXp: 500 },
  { name: 'Apprentice', minXp: 500, nextXp: 2000 },
  { name: 'Adept', minXp: 2000, nextXp: 5000 },
  { name: 'Scholar', minXp: 5000, nextXp: Infinity },
] as const;

const Dashboard: React.FC = () => {
  const { data, importBackup, injectDemoData } = useData();
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

    return {
      totalTasks,
      completedTasks,
      completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
      notesCount: notes.length,
      focusedToday,
      plannerToday,
    };
  }, [data]);

  const focusXp = useMemo(() => {
    const focusMinutes = data.focusHistory.filter((session) => session.mode === 'focus').reduce((sum, session) => sum + session.duration, 0);
    const totalXp = focusMinutes * 10;
    const currentRank =
      [...RANKS].reverse().find((rank) => totalXp >= rank.minXp) || RANKS[0];
    const nextRank = RANKS.find((rank) => rank.minXp > currentRank.minXp) || null;
    const xpIntoRank = totalXp - currentRank.minXp;
    const xpSpan = nextRank ? nextRank.minXp - currentRank.minXp : 1;
    const progress = nextRank ? Math.min(100, Math.round((xpIntoRank / xpSpan) * 100)) : 100;

    return {
      totalXp,
      focusMinutes,
      currentRank,
      nextRank,
      progress,
      xpIntoRank,
      xpToNext: nextRank ? Math.max(0, nextRank.minXp - totalXp) : 0,
    };
  }, [data.focusHistory]);

  const heatmapDays = useMemo(() => {
    const minutesByDate = new Map<string, number>();
    data.focusHistory.forEach((session) => {
      if (session.mode !== 'focus') return;
      const key = getLocalDateKey(new Date(session.completedAt));
      minutesByDate.set(key, (minutesByDate.get(key) || 0) + session.duration);
    });

    return Array.from({ length: 90 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (89 - index));
      const key = getLocalDateKey(date);
      const minutes = minutesByDate.get(key) || 0;
      return {
        key,
        label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        minutes,
        intensity:
          minutes === 0 ? 'none' : minutes <= 25 ? 'low' : minutes <= 60 ? 'mid' : 'high',
      };
    });
  }, [data.focusHistory]);

  const flattenedTasks = flattenTasks(data.tasks);
  const urgentTasks = flattenedTasks
    .filter((task) => !task.completed)
    .sort((a, b) => Number(b.priority === 'high') - Number(a.priority === 'high'))
    .slice(0, 4);
  const recentNotes = [...data.notes]
    .filter((note) => !note.trashed)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);
  const canLoadDemoData = data.tasks.length === 0 && data.notes.length === 0 && data.focusHistory.length === 0;

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
            {canLoadDemoData ? (
              <Button variant="secondary" onClick={injectDemoData}>
                <Sparkles size={16} />
                Load Demo Data
              </Button>
            ) : null}
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

      <div className="grid grid-cols-1 min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Target} label="Task completion" value={`${stats.completionRate}%`} caption={`${stats.completedTasks} of ${stats.totalTasks} finished`} accent="cyan" />
        <MetricCard icon={NotebookPen} label="Active notes" value={String(stats.notesCount)} caption="Knowledge captured and ready" accent="amber" />
        <MetricCard icon={Clock3} label="Focused today" value={`${stats.focusedToday}m`} caption="Tracked through the focus timer" accent="emerald" />
        <MetricCard icon={CalendarDays} label="Planned today" value={String(stats.plannerToday.length)} caption="Sessions on your current schedule" accent="violet" />
      </div>

      <div className="grid grid-cols-1 min-w-0 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6 min-w-0 overflow-hidden">
          <Card className="min-w-0 overflow-hidden border-none bg-[linear-gradient(145deg,rgba(14,165,233,0.12),rgba(99,102,241,0.12),rgba(255,255,255,0.9))] dark:bg-[linear-gradient(145deg,rgba(14,165,233,0.18),rgba(79,70,229,0.16),rgba(2,6,23,0.92))]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">
                    <Sparkles size={15} />
                    Scholar Level
                  </div>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{focusXp.currentRank.name}</h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {focusXp.totalXp.toLocaleString()} XP earned from {focusXp.focusMinutes} minutes of deep work.
                  </p>
                </div>
                <Badge color="blue">{focusXp.nextRank ? `${focusXp.xpToNext} XP to ${focusXp.nextRank.name}` : 'Top rank reached'}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>{focusXp.currentRank.name}</span>
                  <span>{focusXp.nextRank ? focusXp.nextRank.name : 'Maxed out'}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-white/75 shadow-inner dark:bg-slate-900/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-500 transition-all duration-700"
                    style={{ width: `${focusXp.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
                  <span>{focusXp.xpIntoRank.toLocaleString()} XP in this rank</span>
                  <span>{focusXp.progress}% complete</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Focus heatmap" action={<Badge color="cyan">Last 90 days</Badge>} className="min-w-0 overflow-hidden">
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                A brighter grid means stronger study consistency. Keep the chain alive.
              </p>
              <div className="overflow-x-auto pb-2">
                <div className="grid min-w-max grid-flow-col grid-rows-7 gap-2">
                  {heatmapDays.map((day) => (
                    <div
                      key={day.key}
                      title={`${day.label}: ${day.minutes} focus min`}
                      className={`h-3.5 w-3.5 rounded-[4px] border border-white/70 shadow-sm dark:border-slate-950/50 ${
                        day.intensity === 'none'
                          ? 'bg-slate-200 dark:bg-slate-800'
                          : day.intensity === 'low'
                          ? 'bg-sky-300 dark:bg-sky-900/55'
                          : day.intensity === 'mid'
                          ? 'bg-sky-500 dark:bg-sky-700'
                          : 'bg-sky-600 dark:bg-sky-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Less</span>
                  <span className="h-3 w-3 rounded-[4px] border border-white/70 bg-slate-200 shadow-sm dark:border-slate-950/50 dark:bg-slate-800" />
                  <span className="h-3 w-3 rounded-[4px] border border-white/70 bg-sky-300 shadow-sm dark:border-slate-950/50 dark:bg-sky-900/55" />
                  <span className="h-3 w-3 rounded-[4px] border border-white/70 bg-sky-500 shadow-sm dark:border-slate-950/50 dark:bg-sky-700" />
                  <span className="h-3 w-3 rounded-[4px] border border-white/70 bg-sky-600 shadow-sm dark:border-slate-950/50 dark:bg-sky-500" />
                  <span>More</span>
                </div>
                <span>{heatmapDays.filter((day) => day.minutes > 0).length} active days</span>
              </div>
            </div>
          </Card>
        </div>

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

      <div className="grid grid-cols-1 min-w-0 gap-6 xl:grid-cols-2">
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
