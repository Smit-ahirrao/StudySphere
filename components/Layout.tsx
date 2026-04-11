import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Calendar,
  CheckSquare,
  Clock3,
  FolderOpen,
  GraduationCap,
  Home,
  Menu,
  Moon,
  Sparkles,
  StickyNote,
  SunMedium,
  X,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button, Badge } from './UI';

const Layout: React.FC = () => {
  const { data, updateSettings } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (data.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings.theme]);

  const navItems = useMemo(
    () => [
      { path: '/', label: 'Home', icon: Home },
      { path: '/dashboard', label: 'Dashboard', icon: Sparkles },
      { path: '/tasks', label: 'Tasks', icon: CheckSquare },
      { path: '/notes', label: 'Notes', icon: StickyNote },
      { path: '/planner', label: 'Planner', icon: Calendar },
      { path: '/focus', label: 'Focus', icon: Clock3 },
      { path: '/files', label: 'Files', icon: FolderOpen },
    ],
    []
  );

  const completedTasks = countCompleted(data.tasks);
  const totalTasks = countAll(data.tasks);
  const focusMinutesToday = data.focusHistory
    .filter((session) => new Date(session.completedAt).toDateString() === new Date().toDateString() && session.mode === 'focus')
    .reduce((sum, session) => sum + session.duration, 0);

  const isLanding = location.pathname === '/';

  const toggleTheme = () => {
    updateSettings({
      ...data.settings,
      theme: data.settings.theme === 'dark' ? 'light' : 'dark',
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_22%),linear-gradient(180deg,_#f7fafc_0%,_#edf3f8_48%,_#f5f7fb_100%)] text-slate-900 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.10),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.08),_transparent_18%),linear-gradient(180deg,_#020617_0%,_#0b1120_45%,_#111827_100%)] dark:text-slate-100">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.62),transparent)] dark:bg-[linear-gradient(180deg,rgba(8,15,35,0.72),transparent)]" />

      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/72 backdrop-blur-2xl dark:border-slate-800/90 dark:bg-slate-950/72">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <NavLink to="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-sky-500 to-teal-500 text-white shadow-lg shadow-sky-500/20">
                <GraduationCap size={22} />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight">StudySphere</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Your personal academic command center</div>
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

      <main className={`relative z-10 mx-auto w-full px-4 pb-12 pt-8 sm:px-6 lg:px-8 ${isLanding ? 'max-w-7xl' : 'max-w-7xl'}`}>
        <Outlet />
      </main>
    </div>
  );
};

const countAll = (tasks: any[]): number => tasks.reduce((sum, task) => sum + 1 + countAll(task.children || []), 0);
const countCompleted = (tasks: any[]): number =>
  tasks.reduce((sum, task) => sum + (task.completed ? 1 : 0) + countCompleted(task.children || []), 0);

export default Layout;
