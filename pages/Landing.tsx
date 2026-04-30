import { useEffect, useRef, useState } from 'react';
import type { ComponentType, RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionTemplate, useScroll, useSpring, useTransform, useMotionValue, useAnimationFrame } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarRange,
  CheckSquare,
  Clock3,
  Files,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Target,
  Zap,
} from 'lucide-react';
import { useData } from '../context/DataContext';

const proofItems = [
  { label: 'Unified command center', value: 'Tasks, notes, files, focus' },
  { label: 'Built for momentum', value: 'See the next move instantly' },
  { label: 'Designed to feel premium', value: 'Calm, bright, and deliberate' },
] as const;

const storySteps = [
  {
    label: 'Dashboard',
    title: 'Start from a clear aerial view of your academic life.',
    body: 'Deadlines, progress, active notes, and focus history stay visible in one elegant control layer so decisions happen faster.',
    icon: LayoutDashboard,
    tint: 'sky',
    accent: 'from-sky-500/18 via-cyan-300/8 to-white',
  },
  {
    label: 'Tasks',
    title: 'Turn scattered coursework into a plan that keeps moving.',
    body: 'Capture quickly, organize by priority, and let the interface highlight what deserves attention right now.',
    icon: CheckSquare,
    tint: 'emerald',
    accent: 'from-emerald-500/18 via-cyan-300/8 to-white',
  },
  {
    label: 'Notes',
    title: 'Keep knowledge structured instead of trapped in messy documents.',
    body: 'Your notes become part of a wider study system, connected to sessions, files, and revision flow.',
    icon: StickyNote,
    tint: 'indigo',
    accent: 'from-indigo-500/18 via-sky-300/8 to-white',
  },
  {
    label: 'Focus',
    title: 'Drop into deep work with a ritual that feels intentional.',
    body: 'Sessions, streaks, and timing surfaces are presented with enough energy to motivate, without ever becoming noisy.',
    icon: Clock3,
    tint: 'teal',
    accent: 'from-teal-500/18 via-emerald-300/8 to-white',
  },
] as const;

const pillars = [
  {
    icon: Brain,
    title: 'Clarity first',
    text: 'The entire product is arranged to reduce cognitive clutter and surface the next useful decision.',
  },
  {
    icon: Files,
    title: 'Everything connected',
    text: 'Files, notes, planning, and focus sessions feel like one ecosystem instead of separate tools.',
  },
  {
    icon: Zap,
    title: 'Motion with purpose',
    text: 'Depth and motion guide the eye, strengthen hierarchy, and keep the experience feeling alive.',
  },
  {
    icon: ShieldCheck,
    title: 'Calm visual trust',
    text: 'Bright surfaces, restrained color, and layered glass panels create a polished premium atmosphere.',
  },
] as const;

export default function Landing() {
  const navigate = useNavigate();
  const { injectDemoData } = useData();

  const heroRef = useRef<HTMLElement | null>(null);
  const experienceRef = useRef<HTMLElement | null>(null);
  const systemRef = useRef<HTMLElement | null>(null);
  const launchRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const { scrollYProgress } = useScroll();
  const smoothPage = useSpring(scrollYProgress, { stiffness: 110, damping: 22, mass: 0.24 });

  const { scrollYProgress: experienceProgress } = useScroll({
    target: experienceRef,
    offset: ['start center', 'end center'],
  });
  const smoothExperience = useSpring(experienceProgress, { stiffness: 90, damping: 20, mass: 0.2 });

  // --- 3D ORBITING CAROUSEL ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 35, damping: 30, mass: 1.2 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 35, damping: 30, mass: 1.2 });
  const sceneRotateX = useTransform(smoothMouseY, [-1, 1], [8, -8]);
  const sceneRotateY = useTransform(smoothMouseX, [-1, 1], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Orbit angle state
  const orbitAngle = useMotionValue(0);
  const [isPaused, setIsPaused] = useState(false);

  useAnimationFrame((_, delta) => {
    if (!isPaused) {
      orbitAngle.set(orbitAngle.get() + delta * 0.018);
    }
  });

  const heroSceneY = useTransform(smoothPage, [0, 0.18], [0, -70]);
  const heroGlowScale = useTransform(smoothPage, [0, 0.22], [0.9, 1.2]);
  const progressWidth = useTransform(smoothPage, [0, 1], ['0%', '100%']);

  const stageY = useTransform(smoothExperience, [0, 1], [20, -20]);

  const timeline = [0, 0.175, 0.325, 0.425, 0.575, 0.675, 0.825, 1];

  // Dashboard
  const dashboardY = useTransform(smoothExperience, timeline, [0, 0, -40, -40, -80, -80, -160, -160]);
  const dashboardScale = useTransform(smoothExperience, timeline, [1.0, 1.0, 0.92, 0.92, 0.84, 0.84, 0.75, 0.75]);
  const dashboardOpacity = useTransform(smoothExperience, timeline, [1.0, 1.0, 0.7, 0.7, 0.3, 0.3, 0.0, 0.0]);
  const dashboardBlur = useMotionTemplate`blur(${useTransform(smoothExperience, timeline, [0, 0, 4, 4, 8, 8, 12, 12])}px)`;

  // Tasks
  const tasksY = useTransform(smoothExperience, timeline, [400, 400, 0, 0, -40, -40, -80, -80]);
  const tasksScale = useTransform(smoothExperience, timeline, [1.1, 1.1, 1.0, 1.0, 0.92, 0.92, 0.84, 0.84]);
  const tasksOpacity = useTransform(smoothExperience, timeline, [0, 0, 1.0, 1.0, 0.7, 0.7, 0.3, 0.3]);
  const tasksBlur = useMotionTemplate`blur(${useTransform(smoothExperience, timeline, [8, 8, 0, 0, 4, 4, 8, 8])}px)`;

  // Notes
  const notesY = useTransform(smoothExperience, timeline, [400, 400, 400, 400, 0, 0, -40, -40]);
  const notesScale = useTransform(smoothExperience, timeline, [1.1, 1.1, 1.1, 1.1, 1.0, 1.0, 0.92, 0.92]);
  const notesOpacity = useTransform(smoothExperience, timeline, [0, 0, 0, 0, 1.0, 1.0, 0.7, 0.7]);
  const notesBlur = useMotionTemplate`blur(${useTransform(smoothExperience, timeline, [8, 8, 8, 8, 0, 0, 4, 4])}px)`;

  // Focus
  const focusY = useTransform(smoothExperience, timeline, [400, 400, 400, 400, 400, 400, 0, 0]);
  const focusScale = useTransform(smoothExperience, timeline, [1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.0, 1.0]);
  const focusOpacity = useTransform(smoothExperience, timeline, [0, 0, 0, 0, 0, 0, 1.0, 1.0]);
  const focusBlur = useMotionTemplate`blur(${useTransform(smoothExperience, timeline, [8, 8, 8, 8, 8, 8, 0, 0])}px)`;

  const orbitGlowOpacity = useTransform(smoothExperience, [0, 0.5, 1], [0.45, 0.8, 0.5]);
  const orbitGlowScale = useTransform(smoothExperience, [0, 0.5, 1], [0.85, 1.2, 0.95]);
  const orbitBackground = useMotionTemplate`radial-gradient(circle at 50% 50%, rgba(56, 189, 248, ${orbitGlowOpacity}), rgba(186, 230, 253, 0.20) 30%, rgba(255,255,255,0) 72%)`;

  const handleEnter = async () => {
    try {
      await injectDemoData();
    } catch (error) {
      console.error('Failed to initialize workspace:', error);
    } finally {
      navigate('/dashboard');
    }
  };

  const scrollTo = (ref: RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className="relative overflow-clip bg-[linear-gradient(180deg,#f7fbff_0%,#edf5fb_38%,#f8fbfd_100%)] text-slate-900"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <motion.div className="fixed inset-x-0 top-0 z-[90] h-1 origin-left bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400" style={{ width: progressWidth }} />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(125,211,252,0.22),transparent_24%),radial-gradient(circle_at_85%_12%,rgba(16,185,129,0.12),transparent_20%),radial-gradient(circle_at_52%_72%,rgba(148,163,184,0.12),transparent_30%)]" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:96px_96px]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/60 bg-white/72 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => scrollTo(heroRef)} className="flex items-center gap-3 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#ffffff,#dff2fe)] shadow-[0_18px_50px_-25px_rgba(14,165,233,0.6)] ring-1 ring-sky-100">
              <BookOpen size={20} className="text-sky-600" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-slate-950">StudySphere</div>
              <div className="text-xs text-slate-500">Plan smart. Focus deep.</div>
            </div>
          </button>

          <nav className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/80 p-1 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] lg:flex">
            <NavPill label="Home" onClick={() => scrollTo(heroRef)} />
            <NavPill label="Experience" onClick={() => scrollTo(experienceRef)} />
            <NavPill label="System" onClick={() => scrollTo(systemRef)} />
            <NavPill label="Launch" onClick={() => scrollTo(launchRef)} />
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollTo(experienceRef)}
              className="hidden rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700 sm:inline-flex"
            >
              Explore
            </button>
            <button
              type="button"
              onClick={handleEnter}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.82)] transition hover:-translate-y-0.5 hover:bg-sky-600"
            >
              Open workspace
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-28">
        <section 
          ref={heroRef} 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="mx-auto grid max-w-7xl gap-10 px-4 pb-28 pt-10 sm:px-6 sm:pb-32 lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:pb-24 lg:pt-14 [perspective:2000px]"
        >
          <div className="max-w-3xl pt-6 lg:pt-18">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm"
            >
              <Sparkles size={14} />
              Academic operating system
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.86, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 text-5xl font-semibold tracking-[-0.07em] text-slate-950 sm:text-6xl lg:text-[5.7rem] lg:leading-[0.94]"
            >
              The premium workspace for focused students.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.16 }}
              className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl"
            >
              StudySphere brings your tasks, notes, files, planner, and focus rituals into one polished environment built to help you think clearly and move faster.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.24 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <button
                type="button"
                onClick={handleEnter}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-7 py-4 text-base font-semibold text-white shadow-[0_34px_80px_-28px_rgba(2,132,199,0.65)] transition hover:-translate-y-0.5 hover:bg-sky-500"
              >
                Launch StudySphere
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollTo(experienceRef)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/92 px-7 py-4 text-base font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-700"
              >
                See the experience
              </button>
            </motion.div>

            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {proofItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.72, delay: 0.22 + index * 0.08 }}
                  className="rounded-[28px] border border-white/80 bg-white/82 p-5 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.35)] backdrop-blur-xl"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">{item.label}</div>
                  <div className="mt-3 text-sm leading-6 text-slate-600">{item.value}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div
            className="relative min-h-[640px] sm:min-h-[700px] lg:min-h-[760px] flex items-center justify-center"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => { setIsPaused(false); handleMouseLeave(); }}
          >
            {/* Background glow */}
            <motion.div
              style={{ y: heroSceneY, scale: heroGlowScale }}
              className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.35),rgba(255,255,255,0)_70%)] blur-3xl"
            />

            {/* 3D Scene container */}
            <motion.div
              style={{ rotateX: sceneRotateX, rotateY: sceneRotateY }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-[520px] w-full max-w-[620px] [perspective:1200px] [transform-style:preserve-3d]"
              onMouseMove={handleMouseMove}
            >
              {/* Central glowing core */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[5]">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="h-32 w-32 rounded-full border border-sky-200/40"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-2 rounded-full border border-dashed border-cyan-300/30"
                />
                <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.5),rgba(14,165,233,0.15)_60%,transparent_80%)] blur-sm" />
                <div className="absolute inset-[18px] rounded-full bg-white/90 shadow-[0_0_40px_rgba(56,189,248,0.4)] flex items-center justify-center">
                  <BookOpen size={28} className="text-sky-600" />
                </div>
              </div>

              {/* Orbit track ring */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[540px] rounded-[50%] border border-sky-100/50 [transform:rotateX(65deg)]" />

              {/* Orbiting cards */}
              <OrbitCard
                angle={orbitAngle}
                offsetDeg={0}
                icon={LayoutDashboard}
                label="Dashboard"
                tone="bg-sky-100 text-sky-700"
                accentShadow="rgba(14,165,233,0.4)"
              >
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="rounded-xl bg-sky-50 p-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Focus</div>
                    <div className="text-lg font-bold text-slate-900">124h</div>
                  </div>
                  <div className="rounded-xl bg-cyan-50 p-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Tasks</div>
                    <div className="text-lg font-bold text-slate-900">18</div>
                  </div>
                </div>
                <div className="mt-3 flex h-14 items-end gap-1 rounded-xl bg-slate-50/80 px-2 pb-2">
                  {[30, 48, 56, 74, 66, 90, 82].map((h, i) => (
                    <div key={i} className="flex-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        className={`rounded-t bg-gradient-to-t ${i > 4 ? 'from-sky-600 to-cyan-300' : 'from-slate-300 to-slate-100'}`}
                      />
                    </div>
                  ))}
                </div>
              </OrbitCard>

              <OrbitCard
                angle={orbitAngle}
                offsetDeg={90}
                icon={Clock3}
                label="Focus Mode"
                tone="bg-emerald-100 text-emerald-700"
                accentShadow="rgba(16,185,129,0.4)"
              >
                <div className="mt-3 rounded-2xl bg-slate-950 p-4 text-white">
                  <motion.div
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-3xl font-bold tracking-tighter"
                  >
                    25:00
                  </motion.div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-white/15">
                    <motion.div
                      animate={{ width: ['0%', '66%'] }}
                      transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
                    />
                  </div>
                </div>
              </OrbitCard>

              <OrbitCard
                angle={orbitAngle}
                offsetDeg={180}
                icon={StickyNote}
                label="Notes + AI"
                tone="bg-indigo-50 text-indigo-700"
                accentShadow="rgba(99,102,241,0.35)"
              >
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/90 p-2.5">
                    <div className="text-xs font-semibold text-slate-800">Revision guide</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Auto-generated from notes</div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-2.5">
                    <div className="text-xs font-semibold text-slate-800">Study pack</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Flashcards + outlines</div>
                  </div>
                </div>
              </OrbitCard>

              <OrbitCard
                angle={orbitAngle}
                offsetDeg={270}
                icon={CheckSquare}
                label="Tasks"
                tone="bg-teal-50 text-teal-700"
                accentShadow="rgba(20,184,166,0.35)"
              >
                <div className="mt-3 space-y-1.5">
                  {['Linear Algebra Ch.5', 'CS Project Draft', 'Lab Report'].map((task, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50/80 px-3 py-2">
                      <div className={`h-3 w-3 rounded border-2 ${i === 0 ? 'border-teal-500 bg-teal-500' : 'border-slate-300'}`}>
                        {i === 0 && <CheckSquare size={8} className="text-white" />}
                      </div>
                      <span className={`text-xs font-medium ${i === 0 ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task}</span>
                    </div>
                  ))}
                </div>
              </OrbitCard>
            </motion.div>
          </div>
        </section>

        <section ref={experienceRef} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mt-4 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-10">
              {storySteps.map((step, index) => (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-12% 0px -10% 0px' }}
                  transition={{ duration: 0.7, delay: index * 0.04 }}
                  className={`min-h-[35vh] rounded-[36px] border border-white/90 bg-gradient-to-br ${step.accent} p-8 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-10`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${toneClass(step.tint)} shadow-sm`}>
                      <step.icon size={22} />
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">{step.label}</div>
                  </div>
                  <h3 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.4rem] sm:leading-[1.05]">
                    {step.title}
                  </h3>
                  <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{step.body}</p>
                </motion.article>
              ))}
            </div>

            <div className="relative">
              <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
                <div className="relative flex h-[560px] items-center justify-center overflow-hidden rounded-[42px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,245,249,0.88))] shadow-[0_42px_120px_-56px_rgba(15,23,42,0.45)] lg:h-full">
                  <motion.div className="absolute inset-0" style={{ background: orbitBackground }} />
                  <motion.div
                    style={{ scale: orbitGlowScale }}
                    className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.98),rgba(186,230,253,0.45),rgba(255,255,255,0)_72%)] blur-xl"
                  />

                  <motion.div
                    style={{ y: stageY }}
                    className="relative h-[520px] w-[min(92%,620px)] scale-[1.35] sm:scale-[1.5] origin-center"
                  >
                    <div className="relative h-full w-full">
                      {/* Dashboard */}
                      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                        <motion.div
                          style={{ y: dashboardY, scale: dashboardScale, opacity: dashboardOpacity, filter: dashboardBlur }}
                          className="w-[360px] rounded-[30px] border border-white/90 bg-white/96 p-6 shadow-[0_28px_90px_-48px_rgba(14,165,233,0.65)]"
                        >
                          <PanelHeader icon={LayoutDashboard} label="Dashboard" subtitle="Deadlines, output, progress" tone="bg-sky-100 text-sky-700" />
                          <div className="mt-6 grid grid-cols-2 gap-4">
                            <StageMetric label="Today" value="07" />
                            <StageMetric label="Focus" value="3.4h" />
                          </div>
                          <div className="mt-5 rounded-[22px] bg-slate-50 p-5">
                            <div className="flex h-24 items-end gap-2">
                              {[36, 44, 56, 72, 66, 84].map((height) => (
                                <div key={height} className="flex-1 rounded-t-xl bg-gradient-to-t from-sky-500 to-cyan-300" style={{ height: `${height}%` }} />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Tasks */}
                      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                        <motion.div
                          style={{ y: tasksY, scale: tasksScale, opacity: tasksOpacity, filter: tasksBlur }}
                          className="w-[340px] rounded-[30px] border border-white/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(240,253,250,0.92))] p-6 shadow-[0_28px_90px_-50px_rgba(16,185,129,0.54)]"
                        >
                          <PanelHeader icon={CheckSquare} label="Tasks" subtitle="Priority made visible" tone="bg-emerald-100 text-emerald-700" />
                          <div className="mt-6 space-y-4">
                            <StageListItem label="Review lecture notes" meta="High priority" />
                            <StageListItem label="Finish problem set" meta="Due today" />
                            <StageListItem label="Plan revision block" meta="Ready next" />
                          </div>
                        </motion.div>
                      </div>

                      {/* Notes */}
                      <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
                        <motion.div
                          style={{ y: notesY, scale: notesScale, opacity: notesOpacity, filter: notesBlur }}
                          className="w-[320px] rounded-[28px] border border-white/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(238,242,255,0.92))] p-6 shadow-[0_28px_80px_-50px_rgba(99,102,241,0.5)]"
                        >
                          <PanelHeader icon={StickyNote} label="Notes" subtitle="Knowledge that compounds" tone="bg-indigo-100 text-indigo-700" />
                          <div className="mt-6 rounded-[22px] bg-white/90 p-5 shadow-inner">
                            <div className="text-sm font-semibold text-slate-900">Neural plasticity</div>
                            <div className="mt-2 text-sm leading-6 text-slate-500">Connected summaries, flashcards, and revision context.</div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Focus */}
                      <div className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2">
                        <motion.div
                          style={{ y: focusY, scale: focusScale, opacity: focusOpacity, filter: focusBlur }}
                          className="w-[300px] rounded-[28px] border border-white/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(236,253,245,0.92))] p-6 shadow-[0_24px_70px_-48px_rgba(5,150,105,0.56)]"
                        >
                          <PanelHeader icon={Clock3} label="Focus" subtitle="Energy stays protected" tone="bg-teal-100 text-teal-700" />
                          <div className="mt-8 rounded-[22px] bg-slate-950 p-5 text-white">
                            <div className="text-xs uppercase tracking-[0.24em] text-white/45">Next session</div>
                            <div className="mt-3 text-5xl font-semibold tracking-[-0.05em]">25:00</div>
                            <div className="mt-5 h-2 rounded-full bg-white/10">
                              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" />
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={systemRef} className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm"
              >
                <ShieldCheck size={14} />
                Visual system
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl"
              >
                Bright, calm, and engineered to feel composed under pressure.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className="mt-5 text-lg leading-8 text-slate-600"
              >
                The interface keeps depth, contrast, and motion working together so the product feels premium without becoming flashy or exhausting.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-8 rounded-[34px] border border-white/90 bg-white/86 p-6 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.35)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <CalendarRange size={22} />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-950">Built for long sessions</div>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Large type, bright surfaces, and carefully controlled motion make the product feel clear even when the workload gets dense.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {pillars.map((pillar, index) => (
                <motion.article
                  key={pillar.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
                  transition={{ duration: 0.65, delay: index * 0.05 }}
                  whileHover={{ y: -8, rotateX: 2, rotateY: index % 2 === 0 ? -2 : 2 }}
                  className="rounded-[32px] border border-white/86 bg-white/82 p-6 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.4)] backdrop-blur-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_16px_40px_-22px_rgba(15,23,42,0.6)]">
                    <pillar.icon size={20} />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{pillar.title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{pillar.text}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-[38px] border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(240,249,255,0.88),rgba(224,242,254,0.74))] p-8 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.45)]"
            >
              <div className="absolute -right-8 top-0 h-36 w-36 rounded-full bg-sky-200/60 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                  <Brain size={18} />
                  Designed for cognition
                </div>
                <p className="mt-6 max-w-2xl text-2xl leading-10 text-slate-700">
                  The page constantly feels active, but never frantic. Motion highlights hierarchy, reinforces progress, and keeps the eye moving through the workspace naturally.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="rounded-[38px] border border-white/90 bg-white/86 p-8 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.45)]"
            >
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                <Files size={18} />
                Inside the workspace
              </div>
              <div className="mt-6 grid gap-4">
                <FeatureRow icon={LayoutDashboard} label="A dashboard that clarifies the whole week" />
                <FeatureRow icon={CheckSquare} label="Task structure that actually keeps moving" />
                <FeatureRow icon={StickyNote} label="Notes that connect instead of pile up" />
                <FeatureRow icon={Clock3} label="Focus rituals that feel motivating" />
              </div>
            </motion.div>
          </div>
        </section>

        <section ref={launchRef} className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[44px] border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(240,249,255,0.92),rgba(236,253,245,0.82))] px-6 py-12 shadow-[0_36px_120px_-60px_rgba(15,23,42,0.5)] sm:px-10 lg:px-14 lg:py-14"
          >
            <div className="absolute -right-16 -top-10 h-56 w-56 rounded-full bg-sky-200/50 blur-3xl" />
            <div className="absolute -bottom-12 left-10 h-44 w-44 rounded-full bg-emerald-200/50 blur-3xl" />
            <div className="relative z-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Launch the workspace</div>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
                  Enter the app and pick up your work in a space that already feels under control.
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                  Open StudySphere with demo data loaded so the full system is immediately ready to explore.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
                <button
                  type="button"
                  onClick={handleEnter}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-4 text-base font-semibold text-white shadow-[0_28px_70px_-32px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-sky-600"
                >
                  Open StudySphere
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo(heroRef)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-7 py-4 text-base font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                >
                  Back to top
                </button>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}

function NavPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
    >
      {label}
    </button>
  );
}

function PanelHeader({
  icon: Icon,
  label,
  subtitle,
  tone,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  subtitle: string;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-lg font-semibold tracking-tight text-slate-950">{label}</div>
        <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>
        <Icon size={18} />
      </div>
    </div>
  );
}

function HeroMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-[22px] border border-white/80 ${tone} p-4 shadow-sm`}>
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
    </div>
  );
}

function StageMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-100 bg-slate-50 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function StageListItem({ label, meta }: { label: string; meta: string }) {
  return (
    <div className="rounded-[18px] border border-emerald-100 bg-white/82 p-3">
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">{meta}</div>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-slate-100 bg-slate-50/80 px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
        <Icon size={18} />
      </div>
      <div className="font-medium text-slate-700">{label}</div>
    </div>
  );
}

function toneClass(tint: string) {
  switch (tint) {
    case 'sky':
      return 'bg-sky-100 text-sky-700';
    case 'emerald':
      return 'bg-emerald-100 text-emerald-700';
    case 'indigo':
      return 'bg-indigo-100 text-indigo-700';
    case 'teal':
      return 'bg-teal-100 text-teal-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function OrbitCard({
  angle,
  offsetDeg,
  icon: Icon,
  label,
  tone,
  accentShadow,
  children,
}: {
  angle: import('framer-motion').MotionValue<number>;
  offsetDeg: number;
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  tone: string;
  accentShadow: string;
  children: React.ReactNode;
}) {
  const offsetRad = (offsetDeg * Math.PI) / 180;
  const radiusX = 260;
  const radiusZ = 160;
  const verticalSpread = 120;

  const x = useTransform(angle, (a) => Math.cos(a + offsetRad) * radiusX);
  const z = useTransform(angle, (a) => Math.sin(a + offsetRad) * radiusZ);
  const yOffset = useTransform(angle, (a) => -Math.sin(a + offsetRad) * verticalSpread);

  // Depth-based scale and opacity
  const depthScale = useTransform(z, [-radiusZ, radiusZ], [0.7, 1.1]);
  const depthOpacity = useTransform(z, [-radiusZ, radiusZ], [0.4, 1]);
  const depthBlur = useTransform(z, [-radiusZ, 0, radiusZ], [3, 0.5, 0]);
  const zIndex = useTransform(z, [-radiusZ, radiusZ], [1, 20]);

  const blur = useMotionTemplate`blur(${depthBlur}px)`;

  return (
    <motion.div
      style={{
        x,
        y: yOffset,
        scale: depthScale,
        opacity: depthOpacity,
        filter: blur,
        zIndex,
      }}
      className="absolute left-1/2 top-1/2 -ml-[110px] -mt-[100px] w-[220px]"
    >
      <div
        className="rounded-[26px] border border-white/85 bg-white/92 p-4 backdrop-blur-2xl"
        style={{ boxShadow: `0 30px 80px -30px ${accentShadow}` }}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold tracking-tight text-slate-900">{label}</div>
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}>
            <Icon size={15} />
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  );
}
