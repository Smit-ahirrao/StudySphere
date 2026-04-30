import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckSquare,
  Command,
  Clock3,
  Download,
  FolderOpen,
  Home,
  Menu,
  Moon,
  Search,
  Sparkles,
  StickyNote,
  SunMedium,
  X,
} from 'lucide-react';
import DeckPlayer from './music/DeckPlayer';
import { useData } from '../context/DataContext';
import { Button, Badge } from './UI';

const SPOTIFY_STORAGE_KEY = 'studysphere_spotify_embed_v1';

interface DeferredPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const Layout: React.FC = () => {
  const { data, updateSettings, removeDemoData, injectDemoData } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [spotifyEmbed, setSpotifyEmbed] = useState('');
  const [spotifyCollapsed, setSpotifyCollapsed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<DeferredPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const hasDemoData = useMemo(() => {
    const checkDemo = (items: any[] | undefined) => (items || []).some(item => item.isDemo);
    const checkTasks = (tasks: any[] | undefined): boolean => (tasks || []).some(t => t.isDemo || (Array.isArray(t.children) && checkTasks(t.children)));
    return checkTasks(data.tasks) || checkDemo(data.notes) || checkDemo(data.planner) || checkDemo(data.files);
  }, [data]);

  useEffect(() => {
    if (data.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings.theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      } else if (event.key === 'Escape') {
        setPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!paletteOpen) {
      setPaletteQuery('');
    }
  }, [paletteOpen]);

  useEffect(() => {
    const syncSpotify = () => {
      setSpotifyEmbed(localStorage.getItem(SPOTIFY_STORAGE_KEY) || '');
    };

    syncSpotify();
    window.addEventListener('storage', syncSpotify);
    window.addEventListener('studysphere-spotify-updated', syncSpotify as EventListener);
    return () => {
      window.removeEventListener('storage', syncSpotify);
      window.removeEventListener('studysphere-spotify-updated', syncSpotify as EventListener);
    };
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as DeferredPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const navItems = useMemo(
    () => [
      { path: '/dashboard', label: 'Dashboard', icon: Sparkles },
      { path: '/tasks', label: 'Tasks', icon: CheckSquare },
      { path: '/notes', label: 'Notes', icon: StickyNote },
      { path: '/planner', label: 'Planner', icon: Calendar },
      { path: '/focus', label: 'Focus', icon: Clock3 },
      { path: '/files', label: 'Files', icon: FolderOpen },
    ],
    []
  );

  const paletteLinks = useMemo(
    () =>
      navItems
        .filter((item) => ['/dashboard', '/tasks', '/planner', '/notes', '/focus', '/files'].includes(item.path))
        .filter((item) => item.label.toLowerCase().includes(paletteQuery.toLowerCase())),
    [navItems, paletteQuery]
  );

  const completedTasks = countCompleted(data.tasks);
  const totalTasks = countAll(data.tasks);
  const focusMinutesToday = data.focusHistory
    .filter((session) => new Date(session.completedAt).toDateString() === new Date().toDateString() && session.mode === 'focus')
    .reduce((sum, session) => sum + session.duration, 0);

  const toggleTheme = () => {
    updateSettings({
      ...data.settings,
      theme: data.settings.theme === 'dark' ? 'light' : 'dark',
    });
  };

  const handleInstall = async () => {
    if (!installPrompt) {
      window.alert('Use your browser menu and choose "Install app" to add StudySphere to your device.');
      return;
    }
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_22%),linear-gradient(180deg,_#f7fafc_0%,_#edf3f8_48%,_#f5f7fb_100%)] text-slate-900 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.10),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.08),_transparent_18%),linear-gradient(180deg,_#020617_0%,_#0b1120_45%,_#111827_100%)] dark:text-slate-100">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.62),transparent)] dark:bg-[linear-gradient(180deg,rgba(8,15,35,0.72),transparent)]" />

      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/72 backdrop-blur-2xl dark:border-slate-800/90 dark:bg-slate-950/72">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <NavLink to="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex h-11 w-11 items-center justify-center">
                <img src="/brand-mark.svg" alt="StudySphere logo" className="h-11 w-11 object-contain drop-shadow-[0_8px_16px_rgba(14,165,233,0.35)]" />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight">StudySphere</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Plan smart. Focus deep. Achieve more.</div>
              </div>
            </NavLink>

            <div className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 lg:flex">
                <Badge color="blue">{totalTasks === 0 ? 'Fresh Start' : `${completedTasks}/${totalTasks} Tasks`}</Badge>
              <span className="text-sm text-slate-600 dark:text-slate-300">{focusMinutesToday} min focused today</span>
            </div>
          </div>

          <nav className="hidden items-center gap-2 xl:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-lg shadow-sky-500/10 dark:bg-sky-400 dark:text-slate-950'
                      : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!isInstalled ? (
              <Button variant="secondary" size="sm" onClick={handleInstall} className="hidden sm:inline-flex">
                <Download size={16} />
                Install app
              </Button>
            ) : null}
            <Button variant="secondary" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
              {data.settings.theme === 'dark' ? <SunMedium size={16} /> : <Moon size={16} />}
              <span className="hidden sm:inline">{data.settings.theme === 'dark' ? 'Light' : 'Dark'}</span>
            </Button>
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm xl:hidden dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="border-t border-white/60 bg-white/90 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/90 xl:hidden">
            <div className="grid gap-2">
              {!isInstalled ? (
                <Button variant="secondary" onClick={handleInstall} className="justify-start rounded-2xl px-4 py-3 text-sm">
                  <Download size={18} />
                  Install app
                </Button>
              ) : null}
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-slate-950 text-white dark:bg-sky-400 dark:text-slate-950'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main className={`relative z-10 mx-auto w-full px-4 pb-12 pt-8 sm:px-6 lg:px-8 max-w-7xl`}>
        {hasDemoData ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sky-200 bg-sky-50 px-6 py-4 dark:border-sky-500/20 dark:bg-sky-500/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-300">
                <Sparkles size={18} />
              </div>
              <p className="text-sm font-medium text-sky-800 dark:text-sky-200">
                You are exploring with demo data. You can remove only these samples at any time.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={removeDemoData} className="bg-white/80 dark:bg-slate-900/50 shrink-0">
              Clear Demo Data
            </Button>
          </div>
        ) : (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/60 px-6 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Sparkles size={18} />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Want to test the app? Add demo data to see how everything works.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={injectDemoData} className="bg-white/80 dark:bg-slate-900/50 shrink-0">
              Add Demo Data
            </Button>
          </div>
        )}
        <Outlet />
      </main>

      {spotifyEmbed ? (
        <div className={`fixed bottom-5 right-5 z-40 overflow-hidden rounded-[40px] border border-white/70 bg-white/40 shadow-[0_32px_100px_-20px_rgba(15,23,42,0.4)] backdrop-blur-3xl transition-all duration-500 ease-out dark:border-slate-800/90 dark:bg-slate-950/40 ${spotifyCollapsed ? 'h-[80px] w-[240px]' : 'h-[500px] w-[440px]'}`}>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-950 dark:text-white">Premium Player</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 opacity-60 dark:text-slate-400">Gen Z Edition</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSpotifyCollapsed((value) => !value)}
                className="rounded-full bg-slate-950/5 px-4 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-950/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                {spotifyCollapsed ? 'Expand' : 'Minimize'}
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(SPOTIFY_STORAGE_KEY);
                  window.dispatchEvent(new Event('studysphere-spotify-updated'));
                }}
                className="rounded-full bg-red-500/10 px-4 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-500/20 dark:text-red-400"
              >
                Close
              </button>
            </div>
          </div>
          {!spotifyCollapsed ? (
            <div className="px-4 pb-4">
              <DeckPlayer />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-6 pb-4">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Music streaming active</div>
            </div>
          )}
        </div>
      ) : null}

      {paletteOpen ? (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/30 px-4 pt-24 backdrop-blur-sm" onClick={() => setPaletteOpen(false)}>
          <div
            className="w-full max-w-2xl rounded-[28px] border border-white/70 bg-white/88 p-4 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950/88"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/92 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/85">
              <Search size={16} className="text-slate-400" />
              <input
                autoFocus
                value={paletteQuery}
                onChange={(event) => setPaletteQuery(event.target.value)}
                placeholder="Go to Dashboard, Tasks, Planner, Notes, Focus, or Files"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
              />
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <Command size={12} />
                K
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {paletteLinks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No matching section found.
                </div>
              ) : (
                paletteLinks.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      setPaletteOpen(false);
                      navigate(item.path);
                    }}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/92 px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-sky-700 dark:hover:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className="text-slate-500 dark:text-slate-300" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</span>
                    </div>
                    <span className="text-xs text-slate-400">Enter</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const countAll = (tasks: any[]): number => tasks.reduce((sum, task) => sum + 1 + countAll(task.children || []), 0);
const countCompleted = (tasks: any[]): number =>
  tasks.reduce((sum, task) => sum + (task.completed ? 1 : 0) + countCompleted(task.children || []), 0);

export default Layout;
