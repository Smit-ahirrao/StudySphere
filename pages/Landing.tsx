import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  BookOpen,
  CheckCheck,
  Clock3,
  FolderOpen,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Badge, Button, Card, SectionHeading } from '../components/UI';

const Landing: React.FC = () => {
  const navigate = useNavigate();

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
                <span className="text-sm text-slate-600 dark:text-slate-300">Why choose StudySphere</span>
                <TrendingUp size={16} className="text-emerald-500 dark:text-emerald-300" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50/80 px-4 py-4 dark:bg-slate-800/70">
                  <div className="text-base font-semibold text-slate-900 dark:text-white">All-in-one workflow</div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Plan work, collect notes, schedule sessions, and revise without context switching.</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 px-4 py-4 dark:bg-slate-800/70">
                  <div className="text-base font-semibold text-slate-900 dark:text-white">AI-ready revision</div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Convert real study material into ready-to-use revision assets in a few clicks.</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 px-4 py-4 dark:bg-slate-800/70">
                  <div className="text-base font-semibold text-slate-900 dark:text-white">Focus that feels modern</div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Focus sessions, music support, and progress tracking make staying locked in easier.</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 px-4 py-4 dark:bg-slate-800/70">
                  <div className="text-base font-semibold text-slate-900 dark:text-white">Polished and practical</div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">The product feels presentation-ready while still being useful for everyday student work.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
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
