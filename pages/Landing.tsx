import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  BookOpen,
  CheckCheck,
  Clock3,
  Download,
  FolderOpen,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Badge, Button, Card, SectionHeading } from '../components/UI';
import { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';

interface DeferredPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { data, injectDemoData, removeDemoData } = useData();
  
  const hasDemoData = React.useMemo(() => {
    const checkDemo = (items: any[]) => items.some(item => item.isDemo);
    const checkTasks = (tasks: any[]): boolean => tasks.some(t => t.isDemo || checkTasks(t.children || []));
    return checkTasks(data.tasks) || checkDemo(data.notes) || checkDemo(data.planner) || checkDemo(data.files);
  }, [data]);

  const isEmpty = data.tasks.length === 0 && data.notes.length === 0 && data.planner.length === 0 && data.files.length === 0;

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as DeferredPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      window.alert('Use your browser menu and choose "Install app" to add StudySphere to your device.');
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const features = [
    {
      icon: CheckCheck,
      title: 'Task system that feels actionable',
      description: 'Break work down fast and keep progress visible.',
      path: '/tasks',
    },
    {
      icon: BookOpen,
      title: 'Notes that stay organized',
      description: 'Capture ideas, revision notes, and study material in one place.',
      path: '/notes',
    },
    {
      icon: CalendarDays,
      title: 'Planner for real routines',
      description: 'Turn intentions into scheduled study blocks.',
      path: '/planner',
    },
    {
      icon: Clock3,
      title: 'Focus mode with momentum',
      description: 'Stay locked in with timers, alerts, and consistency tracking.',
      path: '/focus',
    },
    {
      icon: BrainCircuit,
      title: 'AI study generation',
      description: 'Turn files into summaries, flashcards, and quizzes.',
      path: '/files',
    },
    {
      icon: FolderOpen,
      title: 'Study resources in one vault',
      description: 'Keep documents, slides, and references easy to reach.',
      path: '/files',
    },
    {
      icon: ShieldCheck,
      title: 'Private and fast',
      description: 'Your workspace stays personal and responsive.',
    },
  ];

  const highlights = [
    'Plan, study, revise, and track progress from one workspace',
    'Every tool is built to push you toward action, not setup',
    'Clean enough to impress, practical enough to use every day',
  ];

  return (
    <div className="space-y-10 pb-10">
      <section className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <Badge color="cyan">Competition-ready student productivity platform</Badge>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-6xl">
              The student workspace that helps you plan, focus, and revise from the same place.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              StudySphere gives students one place to plan work, manage notes, stay focused, and generate revision material without bouncing between apps.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/dashboard')}>
              Open dashboard
              <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/tasks')}>
              Explore product
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="border-sky-300/60 bg-sky-500/10 text-sky-700 hover:bg-sky-500/15 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-200 dark:hover:bg-sky-500/20"
              onClick={handleInstall}
              disabled={isInstalled}
            >
              <Download size={18} />
              {isInstalled ? 'Installed' : 'Download app'}
            </Button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 text-sm text-cyan-800 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
            <Badge color="cyan">New</Badge>
            <span>Install StudySphere on mobile or desktop for a full-screen app experience with faster launch.</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div key={item} className="rounded-3xl border border-white/60 bg-white/75 px-4 py-4 text-sm text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/70 to-sky-100/60 text-slate-900 shadow-[0_30px_90px_-40px_rgba(14,165,233,0.35)] dark:border-cyan-500/10 dark:bg-[linear-gradient(145deg,rgba(8,15,35,0.96),rgba(15,23,42,0.92)_42%,rgba(17,24,39,0.9))] dark:text-white dark:shadow-[0_30px_90px_-40px_rgba(14,165,233,0.65)]">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-300">Live Snapshot</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">A smarter command center for ambitious students</h2>
              </div>
              <Sparkles className="text-cyan-500 dark:text-cyan-300" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm dark:border-cyan-400/10 dark:bg-slate-900/70">
                <div className="text-sm text-slate-500 dark:text-slate-300">Productivity stack</div>
                <div className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">6-in-1</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Tasks, notes, planner, focus, study lab, and revision AI</div>
              </div>
              <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-100 via-cyan-50 to-emerald-50 p-5 dark:border-cyan-300/10 dark:bg-gradient-to-br dark:from-cyan-500/18 dark:via-sky-500/10 dark:to-emerald-400/12">
                <div className="text-sm text-cyan-700 dark:text-cyan-200">Experience quality</div>
                <div className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">Pro</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Clear structure, stronger workflow, and smarter revision support</div>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/80 bg-white/75 p-5 shadow-sm dark:border-cyan-400/10 dark:bg-slate-900/65">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Snapshot highlights</span>
                <TrendingUp size={16} className="text-emerald-500 dark:text-emerald-300" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50/80 px-4 py-4 dark:bg-slate-800/70">
                  <div className="text-base font-semibold text-slate-900 dark:text-white">All-in-one workflow</div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Plan, notes, routines, and focus in one place.</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 px-4 py-4 dark:bg-slate-800/70">
                  <div className="text-base font-semibold text-slate-900 dark:text-white">AI-ready lab</div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Turn documents into flashcards and quizzes instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="demo-hub" className="relative overflow-hidden rounded-[40px] border border-cyan-100 bg-white shadow-2xl shadow-cyan-500/15 dark:border-cyan-500/20 dark:bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_50%)]" />
        <div className="relative flex flex-col items-center justify-between gap-10 p-8 lg:flex-row lg:p-14">
          <div className="max-w-xl space-y-6 text-center lg:text-left">
            <h2 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white lg:text-5xl">
              {hasDemoData ? "Sample Data Loaded" : "Want to test the App?"}
            </h2>
            <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              {hasDemoData 
                ? "You've successfully loaded the demo workspace. Explore all sections like Notes, Tasks, and the AI Study Lab. You can remove only these samples anytime."
                : "Experience StudySphere instantly. Click below to populate every section—Notes, Tasks, Planner, and Files—with curated study material for evaluation."
              }
            </p>
          </div>
          
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            {!hasDemoData ? (
              <Button 
                size="lg" 
                onClick={() => { injectDemoData(); navigate('/dashboard'); }} 
                className="h-16 rounded-2xl bg-cyan-600 px-10 text-lg font-bold text-white shadow-xl shadow-cyan-600/30 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600"
              >
                <Sparkles className="mr-2 h-6 w-6" />
                Load Demo Data
              </Button>
            ) : (
              <Button 
                size="lg" 
                variant="secondary"
                onClick={removeDemoData} 
                className="h-16 rounded-2xl border-rose-200 bg-rose-50 px-10 text-lg font-bold text-rose-700 shadow-lg hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
              >
                <TrendingUp className="mr-2 h-6 w-6 rotate-180" />
                Remove Demo Data
              </Button>
            )}
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => navigate('/dashboard')} 
              className="h-16 rounded-2xl border-slate-200 bg-white px-10 text-lg font-bold text-slate-700 shadow-md hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Skip to App
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Core Suite"
          title="Everything you need to move from overwhelm to execution"
          description="Each workspace is designed to support the next one, so planning, doing, and reflecting feel connected."
        />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <button
              key={feature.title}
              type="button"
              onClick={() => feature.path && navigate(feature.path)}
              className="group text-left"
            >
              <Card className="h-full transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_30px_70px_-45px_rgba(14,165,233,0.55)]">
                <div className="space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/10 text-cyan-700 dark:text-cyan-300">
                    <feature.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{feature.description}</p>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Landing;
