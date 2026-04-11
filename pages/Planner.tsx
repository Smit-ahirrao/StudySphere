import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bell, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PlannerEvent, PlannerLabel, PlannerRepeat } from '../types';
import { Badge, Button, Card, Input, SectionHeading, Select, Textarea } from '../components/UI';

const HOURS = Array.from({ length: 14 }, (_, index) => index + 7);
const EVENT_COLORS: Record<string, string> = {
  cyan: 'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-100',
  amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100',
  violet: 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-100',
};
const CALENDAR_TONES: Record<ColorTone, string> = {
  cyan: 'border-sky-200 bg-sky-50/85 text-sky-900 hover:border-sky-300 dark:border-sky-900/70 dark:bg-sky-950/22 dark:text-sky-100',
  amber: 'border-amber-200 bg-amber-50/85 text-amber-900 hover:border-amber-300 dark:border-amber-900/70 dark:bg-amber-950/22 dark:text-amber-100',
  emerald: 'border-emerald-200 bg-emerald-50/85 text-emerald-900 hover:border-emerald-300 dark:border-emerald-900/70 dark:bg-emerald-950/22 dark:text-emerald-100',
  violet: 'border-violet-200 bg-violet-50/85 text-violet-900 hover:border-violet-300 dark:border-violet-900/70 dark:bg-violet-950/22 dark:text-violet-100',
};

type ColorTone = 'cyan' | 'amber' | 'emerald' | 'violet';

const emptyComposer = {
  title: '',
  notes: '',
  startTime: 9,
  duration: 60,
  label: 'study' as PlannerLabel,
  repeat: 'none' as PlannerRepeat,
  color: 'cyan' as ColorTone,
  reminder: false,
};

const Planner: React.FC = () => {
  const { data, addPlannerEvent, updatePlannerEvent, deletePlannerEvent } = useData();
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showComposer, setShowComposer] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [composer, setComposer] = useState(emptyComposer);
  const scheduledRef = useRef<number[]>([]);

  const monthDays = useMemo(() => getMonthDays(month), [month]);
  const selectedKey = dateKey(selectedDate);
  const selectedEvents = useMemo(
    () => data.planner.filter((event) => isEventOnDate(event, selectedDate)).sort((a, b) => a.startTime - b.startTime),
    [data.planner, selectedDate]
  );

  const upcoming = useMemo(() => {
    const list: PlannerEvent[] = [];
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i += 1) {
      const check = new Date(baseDate);
      check.setDate(check.getDate() + i);
      const key = dateKey(check);

      data.planner.forEach((event) => {
        if (isEventOnDate(event, check)) {
          list.push({ ...event, day: key, id: event.day === key ? event.id : `${event.id}-recurring-${key}` });
        }
      });
    }

    const nowHour = new Date().getHours();
    const todayKey = dateKey(baseDate);

    return list
      .filter((event) => event.day > todayKey || (event.day === todayKey && event.startTime >= nowHour))
      .sort((a, b) => `${a.day}-${String(a.startTime).padStart(2, '0')}`.localeCompare(`${b.day}-${String(b.startTime).padStart(2, '0')}`))
      .slice(0, 4);
  }, [data.planner]);

  useEffect(() => {
    scheduledRef.current.forEach((id) => window.clearTimeout(id));
    scheduledRef.current = [];

    data.planner.forEach((event) => {
      if (!event.reminder) return;
      const reminderTime = getReminderTimestamp(event) - 10 * 60 * 1000;
      const delay = reminderTime - Date.now();
      if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return;

      const key = `planner-reminder-${event.id}-${event.day}-${event.startTime}`;
      if (sessionStorage.getItem(key)) return;

      const timeoutId = window.setTimeout(() => {
        sessionStorage.setItem(key, 'sent');
        if (Notification.permission === 'granted') {
          new Notification(`Upcoming: ${event.title}`, {
            body: `Starts at ${event.startTime}:00 on ${event.day}`,
          });
        }
      }, delay);

      scheduledRef.current.push(timeoutId);
    });

    return () => {
      scheduledRef.current.forEach((id) => window.clearTimeout(id));
      scheduledRef.current = [];
    };
  }, [data.planner]);

  const openCreate = () => {
    setEditingId(null);
    setComposer(emptyComposer);
    setShowComposer(true);
  };

  const openEdit = (event: PlannerEvent) => {
    setEditingId(event.id);
    setComposer({
      title: event.title,
      notes: event.notes || '',
      startTime: event.startTime,
      duration: event.duration,
      label: event.label || 'study',
      repeat: event.repeat || 'none',
      color: (event.color as ColorTone) || 'cyan',
      reminder: Boolean(event.reminder),
    });
    setShowComposer(true);
  };

  const submitComposer = () => {
    const trimmed = composer.title.trim();
    if (!trimmed) return;

    const payload: PlannerEvent = {
      id: editingId || uuidv4(),
      title: trimmed,
      startTime: composer.startTime,
      duration: composer.duration,
      day: selectedKey,
      notes: composer.notes,
      label: composer.label,
      repeat: composer.repeat,
      reminder: composer.reminder,
      color: composer.color,
    };

    if (editingId) {
      updatePlannerEvent(payload);
    } else {
      addPlannerEvent(payload);
    }

    setComposer(emptyComposer);
    setEditingId(null);
    setShowComposer(false);
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Strategic Planning"
        title="Shape your week with visible study blocks"
        description="The planner now supports editing, reminder toggles, and recurring sessions without losing the current visual direction."
      />

      <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Monthly overview" action={<Badge color="cyan">{month.toLocaleString('default', { month: 'long', year: 'numeric' })}</Badge>}>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setMonth(today);
                    setSelectedDate(today);
                  }}
                >
                  Today
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                  <ChevronRight size={14} />
                </Button>
              </div>
              <Button size="sm" onClick={openCreate}>
                <Plus size={14} />
                Add session
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:hidden">
              {monthDays.map((day) => {
                const key = dateKey(day);
                const dayEvents = data.planner.filter((event) => isEventOnDate(event, day));
                const count = dayEvents.length;
                const active = key === selectedKey;
                const hasSessions = count > 0;
                const tone = getCalendarTone(dayEvents);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[78px] rounded-[18px] border px-3 py-3 text-left transition ${
                      active
                        ? 'border-sky-400 bg-slate-950 text-white shadow-lg dark:bg-sky-400 dark:text-slate-950'
                        : hasSessions
                        ? CALENDAR_TONES[tone]
                        : 'border-slate-200 bg-white/70 hover:border-sky-200 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-sky-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold">{day.getDate()}</div>
                      {hasSessions ? (
                        <span
                          className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                            active
                              ? 'bg-white/15 text-white dark:bg-slate-950/15 dark:text-slate-950'
                              : 'bg-white/75 text-slate-700 dark:bg-slate-950/40 dark:text-white'
                          }`}
                        >
                          {count}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {hasSessions ? (
                        dayEvents.slice(0, 3).map((event, index) => (
                          <span
                            key={`${event.id}-${index}`}
                            className={`h-2 w-2 rounded-full ${event.color === 'amber' ? 'bg-amber-400' : event.color === 'emerald' ? 'bg-emerald-400' : event.color === 'violet' ? 'bg-violet-400' : 'bg-sky-400'}`}
                          />
                        ))
                      ) : (
                        <span className={`h-2 w-6 rounded-full ${active ? 'bg-white/20 dark:bg-slate-950/20' : 'bg-slate-100 dark:bg-slate-800'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="hidden md:block">
              <div className="grid md:grid-cols-7 gap-3">
                {monthDays.map((day) => {
                  const key = dateKey(day);
                  const dayEvents = data.planner.filter((event) => isEventOnDate(event, day));
                  const count = dayEvents.length;
                  const active = key === selectedKey;
                  const hasSessions = count > 0;
                  const tone = getCalendarTone(dayEvents);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={`rounded-[24px] border p-4 text-left transition ${
                        active
                          ? 'border-sky-400 bg-slate-950 text-white shadow-lg dark:bg-sky-400 dark:text-slate-950'
                          : hasSessions
                          ? CALENDAR_TONES[tone]
                          : 'border-slate-200 bg-white/70 hover:border-sky-200 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-sky-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium">{day.getDate()}</div>
                        {hasSessions ? (
                          <span
                            className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-[11px] font-semibold ${
                              active
                                ? 'bg-white/15 text-white dark:bg-slate-950/15 dark:text-slate-950'
                                : 'bg-white/75 text-slate-700 dark:bg-slate-950/40 dark:text-white'
                            }`}
                          >
                            {count}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {hasSessions ? (
                          dayEvents.slice(0, 3).map((event, index) => (
                            <span
                              key={`${event.id}-${index}`}
                              className={`h-2.5 w-2.5 rounded-full ${event.color === 'amber' ? 'bg-amber-400' : event.color === 'emerald' ? 'bg-emerald-400' : event.color === 'violet' ? 'bg-violet-400' : 'bg-sky-400'}`}
                            />
                          ))
                        ) : (
                          <span className={`h-2.5 w-10 rounded-full ${active ? 'bg-white/20 dark:bg-slate-950/20' : 'bg-slate-100 dark:bg-slate-800'}`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title={selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} action={<Badge color="gray">{selectedEvents.length} planned</Badge>}>
            <div className="space-y-3">
              {selectedEvents.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  No sessions for this date yet. Add one to start time-blocking.
                </div>
              ) : (
                selectedEvents.map((event) => (
                  <div key={`${event.id}-${event.day}-${event.startTime}`} className={`rounded-[24px] border p-4 ${EVENT_COLORS[event.color || 'cyan']}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{event.title}</div>
                          {event.reminder ? <Bell size={14} /> : null}
                        </div>
                        <div className="mt-1 text-sm opacity-75">
                          {formatStartTime(event.startTime)} for {formatDuration(event.duration)}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge color={event.label === 'study' ? 'blue' : event.label === 'personal' ? 'yellow' : 'green'}>{event.label || 'study'}</Badge>
                          {event.repeat && event.repeat !== 'none' ? <Badge color="gray">{event.repeat}</Badge> : null}
                        </div>
                        {event.notes ? <p className="mt-3 text-sm opacity-80">{event.notes}</p> : null}
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => openEdit(event)} className="rounded-full p-2 transition hover:bg-white/60 dark:hover:bg-slate-900/40">
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => deletePlannerEvent(event.id)} className="rounded-full p-2 transition hover:bg-white/60 dark:hover:bg-slate-900/40">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Upcoming sessions" action={<CalendarDays size={16} className="text-slate-400" />}>
            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Nothing scheduled yet.</p>
              ) : (
                upcoming.map((event) => (
                  <div key={event.id} className={`rounded-3xl border px-4 py-4 ${EVENT_COLORS[event.color || 'cyan']}`}>
                    <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                      {event.title}
                      {event.reminder ? <Bell size={14} className="text-sky-500" /> : null}
                    </div>
                    <div className="mt-1 text-sm opacity-75">
                      {event.day} at {formatStartTime(event.startTime)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge color={event.label === 'study' ? 'blue' : event.label === 'personal' ? 'yellow' : 'green'}>{event.label || 'study'}</Badge>
                      {event.repeat && event.repeat !== 'none' ? <Badge color="gray">{event.repeat}</Badge> : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {showComposer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <Card className="w-full max-w-xl">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">{editingId ? 'Edit planning block' : 'Add planning block'}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Schedule a focused study session, personal slot, or recovery break.</p>
              </div>

              <Input value={composer.title} onChange={(event) => setComposer((current) => ({ ...current, title: event.target.value }))} placeholder="Session title" />
              <Textarea value={composer.notes} onChange={(event) => setComposer((current) => ({ ...current, notes: event.target.value }))} rows={4} placeholder="Optional notes, agenda, or learning goal" />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Start time</label>
                  <Select value={String(composer.startTime)} onChange={(event) => setComposer((current) => ({ ...current, startTime: Number(event.target.value) }))}>
                    {HOURS.map((hour) => (
                      <option key={hour} value={hour}>
                        {formatStartTime(hour)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Duration</label>
                  <Select value={String(composer.duration)} onChange={(event) => setComposer((current) => ({ ...current, duration: Number(event.target.value) }))}>
                    {[30, 45, 60, 90, 120, 180].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {formatDuration(minutes)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Session type</label>
                  <Select value={composer.label} onChange={(event) => setComposer((current) => ({ ...current, label: event.target.value as PlannerLabel }))}>
                    <option value="study">Study</option>
                    <option value="break">Break</option>
                    <option value="personal">Personal</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Repeat</label>
                  <Select value={composer.repeat} onChange={(event) => setComposer((current) => ({ ...current, repeat: event.target.value as PlannerRepeat }))}>
                    <option value="none">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={composer.reminder} onChange={(event) => setComposer((current) => ({ ...current, reminder: event.target.checked }))} />
                Enable local reminder notification 10 minutes before the session
              </label>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowColorPalette((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300"
                >
                  Session color
                  <ChevronDown size={14} className={`transition ${showColorPalette ? 'rotate-180' : ''}`} />
                </button>

                {showColorPalette ? (
                  <div className="flex gap-3">
                    {(['cyan', 'amber', 'emerald', 'violet'] as const).map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setComposer((current) => ({ ...current, color: tone }))}
                        className={`h-10 w-10 rounded-full border-2 ${tone === 'cyan' ? 'bg-sky-400' : tone === 'amber' ? 'bg-amber-400' : tone === 'emerald' ? 'bg-emerald-400' : 'bg-violet-400'} ${
                          composer.color === tone ? 'border-slate-950 dark:border-white' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowComposer(false);
                    setEditingId(null);
                    setComposer(emptyComposer);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={submitComposer}>{editingId ? 'Save changes' : 'Add event'}</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getMonthDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, index) => new Date(year, month, index + 1));
};

const isEventOnDate = (event: PlannerEvent, targetDate: Date) => {
  const targetKey = dateKey(targetDate);
  if (event.day === targetKey) return true;
  if (event.repeat === 'none' || !event.repeat) return false;

  const [y, m, d] = event.day.split('-');
  const eventDate = new Date(Number(y), Number(m) - 1, Number(d));
  const targetCopy = new Date(targetDate);
  targetCopy.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  if (targetCopy.getTime() < eventDate.getTime()) return false;
  if (event.repeat === 'daily') return true;
  if (event.repeat === 'weekly') return targetCopy.getDay() === eventDate.getDay();
  if (event.repeat === 'monthly') return targetCopy.getDate() === eventDate.getDate();
  return false;
};

const getReminderTimestamp = (event: PlannerEvent) => {
  const [year, month, day] = event.day.split('-').map(Number);
  const date = new Date(year, month - 1, day, event.startTime, 0, 0, 0);
  return date.getTime();
};

const getCalendarTone = (events: PlannerEvent[]): ColorTone => {
  if (events.some((event) => event.color === 'amber')) return 'amber';
  if (events.some((event) => event.color === 'emerald')) return 'emerald';
  if (events.some((event) => event.color === 'violet')) return 'violet';
  return 'cyan';
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}m`;
};

const formatStartTime = (hour: number) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized}:00 ${period}`;
};

export default Planner;
