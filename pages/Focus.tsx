import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bell, Clock3, Maximize2, Music4, Pause, Play, RotateCcw } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Badge, Button, Card, Input, SectionHeading, Select } from '../components/UI';
import { Task } from '../types';
import { getLocalDateKey } from '../utils/date';

const AMBIENT = {
  none: 'Off',
  rain: 'Rain',
  cafe: 'Cafe',
  noise: 'Noise',
  brown: 'Brown noise',
  ocean: 'Ocean',
  forest: 'Forest',
  fireplace: 'Fireplace',
  vinyl: 'Vinyl crackle',
};

const SPOTIFY_STORAGE_KEY = 'studysphere_spotify_embed_v1';
const SPOTIFY_PRESETS = [
  {
    label: 'Deep Focus',
    value: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI2TtZa6',
  },
  {
    label: 'Lo-Fi Beats',
    value: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn',
  },
  {
    label: 'Peaceful Piano',
    value: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO',
  },
  {
    label: 'Jazz Vibes',
    value: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX0SM0LYsmbMT',
  },
];

type TimerMode = 'focus' | 'short' | 'long';
type AmbientKey = keyof typeof AMBIENT;

const Focus: React.FC = () => {
  const { data, addFocusSession, updateSettings, setTaskComplete } = useData();
  const { focusDuration, shortBreakDuration, longBreakDuration } = data.settings;

  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [running, setRunning] = useState(false);
  const [autoCycle, setAutoCycle] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(4);
  const [selectedTask, setSelectedTask] = useState('');
  const [ambient, setAmbient] = useState<AmbientKey>('none');
  const [completeLinkedTask, setCompleteLinkedTask] = useState(false);
  const [spotifyOpen, setSpotifyOpen] = useState(false);
  const [spotifyInput, setSpotifyInput] = useState('');
  const [spotifyEmbed, setSpotifyEmbed] = useState(SPOTIFY_PRESETS[0].value);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientCleanupRef = useRef<(() => void) | null>(null);
  const [ambientStatus, setAmbientStatus] = useState('Ambient off');
  const taskOptions = useMemo(() => buildTaskOptions(data.tasks), [data.tasks]);

  const totalSeconds = mode === 'focus' ? focusDuration * 60 : mode === 'short' ? shortBreakDuration * 60 : longBreakDuration * 60;
  const progress = 1 - timeLeft / totalSeconds;

  useEffect(() => {
    setRunning(false);
    setTimeLeft(totalSeconds);
  }, [mode, totalSeconds]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setTimeLeft((current) => current - 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (timeLeft <= 0 && running) {
      finishSession();
    }
  }, [timeLeft, running]);

  useEffect(() => {
    return () => {
      stopAmbient();
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(SPOTIFY_STORAGE_KEY);
    if (stored) {
      setSpotifyEmbed(stored);
      setSpotifyInput(stored);
    } else {
      setSpotifyInput(SPOTIFY_PRESETS[0].value);
    }
  }, []);

  const completedToday = data.focusHistory.filter(
    (session) => getLocalDateKey(new Date(session.completedAt)) === getLocalDateKey(new Date()) && session.mode === 'focus'
  ).length;

  const streak = useMemo(() => {
    const focusDays = Array.from(new Set(
      data.focusHistory.filter(s => s.mode === 'focus').map(s => getLocalDateKey(new Date(s.completedAt)))
    )).sort((a, b) => b.localeCompare(a));

    if (focusDays.length === 0) return 0;
    let currentStreak = 0;
    const today = getLocalDateKey(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = getLocalDateKey(yesterdayDate);

    if (focusDays[0] !== today && focusDays[0] !== yesterday) return 0;

    const checkDate = new Date();
    if (focusDays[0] === yesterday) checkDate.setDate(checkDate.getDate() - 1);

    for (const day of focusDays) {
      if (day === getLocalDateKey(checkDate)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    return currentStreak;
  }, [data.focusHistory]);

  const weeklyHeatmap = useMemo(() => {
    const result: { day: string; count: number }[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const key = getLocalDateKey(date);
      const count = data.focusHistory.filter((session) => getLocalDateKey(new Date(session.completedAt)) === key).length;
      result.push({
        day: date.toLocaleDateString(undefined, { weekday: 'short' }),
        count,
      });
    }
    return result;
  }, [data.focusHistory]);

  const badge = data.focusHistory.length >= 50 ? 'Legend' : data.focusHistory.length >= 20 ? 'Pro' : data.focusHistory.length >= 5 ? 'Builder' : 'Starter';

  const finishSession = () => {
    setRunning(false);

    if (mode === 'focus') {
      addFocusSession({
        id: uuidv4(),
        duration: focusDuration,
        completedAt: Date.now(),
        mode: 'focus',
        taskId: selectedTask || undefined,
      });
      if (selectedTask && completeLinkedTask) {
        setTaskComplete(selectedTask, true);
      }
    }

    if (soundOn) {
      playCompletionChime(audioContextRef).catch(() => undefined);
    }

    if (Notification.permission === 'granted') {
      new Notification('StudySphere session complete');
    }

    if (autoCycle) {
      setMode(mode === 'focus' ? 'short' : 'focus');
    } else {
      setTimeLeft(totalSeconds);
    }
  };

  const stopAmbient = () => {
    if (ambientCleanupRef.current) {
      ambientCleanupRef.current();
      ambientCleanupRef.current = null;
    }
    setAmbientStatus('Ambient off');
  };

  const handleAmbientChange = async (nextAmbient: AmbientKey) => {
    setAmbient(nextAmbient);
    stopAmbient();

    if (nextAmbient === 'none') {
      return;
    }

    try {
      const context = getAudioContext(audioContextRef);
      await context.resume();
      ambientCleanupRef.current = buildAmbientScene(context, nextAmbient);
      setAmbientStatus(`${AMBIENT[nextAmbient]} sound playing`);
    } catch (error) {
      console.error('Ambient audio failed to start', error);
      setAmbientStatus('Ambient audio unavailable');
    }
  };

  const applySpotifySource = (value: string) => {
    const embedUrl = getSpotifyEmbedUrl(value);
    if (!embedUrl) return;
    setSpotifyEmbed(embedUrl);
    setSpotifyInput(value);
    localStorage.setItem(SPOTIFY_STORAGE_KEY, embedUrl);
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Deep Work"
        title="A more premium focus ritual"
        description="The focus experience now reads like a real productivity product: stronger timer visuals, meaningful stats, and cleaner settings."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <div className="space-y-8">
            <div className="flex flex-wrap justify-center gap-2">
              {([
                ['focus', 'Focus'],
                ['short', 'Short break'],
                ['long', 'Long break'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                    mode === value
                      ? 'bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <div className="relative h-80 w-80">
                <svg className="h-full w-full -rotate-90">
                  <circle cx="160" cy="160" r="126" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="18" />
                  <circle
                    cx="160"
                    cy="160"
                    r="126"
                    fill="none"
                    stroke="url(#focusGradient)"
                    strokeWidth="18"
                    strokeDasharray={792}
                    strokeDashoffset={792 - 792 * progress}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <Badge color="cyan">{mode === 'focus' ? 'Study sprint' : 'Recovery mode'}</Badge>
                  <div className="mt-4 text-6xl font-semibold tracking-tight text-slate-950 dark:text-white">{formatTime(timeLeft)}</div>
                  <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{Math.max(0, Math.round(progress * 100))}% complete</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={() => setRunning((value) => !value)}>
                {running ? <Pause size={18} /> : <Play size={18} />}
                {running ? 'Pause session' : 'Start session'}
              </Button>
              <Button variant="secondary" size="lg" onClick={() => { setRunning(false); setTimeLeft(totalSeconds); }}>
                <RotateCcw size={18} />
                Reset
              </Button>
              <Button variant="secondary" size="lg" onClick={() => document.documentElement.requestFullscreen?.()}>
                <Maximize2 size={18} />
                Fullscreen
              </Button>
              <Button variant="secondary" size="lg" onClick={() => Notification.requestPermission()}>
                <Bell size={18} />
                Alerts
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Session setup" action={<Clock3 size={16} className="text-slate-400" />}>
            <div className="space-y-4">
              <Select value={selectedTask} onChange={(event) => setSelectedTask(event.target.value)}>
                <option value="">No task linked</option>
                {taskOptions.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.label}
                  </option>
                ))}
              </Select>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Ambient sound</div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(AMBIENT) as AmbientKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleAmbientChange(key)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        ambient === key
                          ? 'bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {AMBIENT[key]}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{ambientStatus}</div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Spotify mini player</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Open a compact player for focus playlists, albums, or tracks.</div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setSpotifyOpen(true)}>
                    <Music4 size={14} />
                    Open player
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Input type="number" min={1} value={focusDuration} onChange={(event) => updateSettings({ ...data.settings, focusDuration: Number(event.target.value) })} label="Focus (min)" />
                <Input type="number" min={1} value={shortBreakDuration} onChange={(event) => updateSettings({ ...data.settings, shortBreakDuration: Number(event.target.value) })} label="Short break" />
                <Input type="number" min={1} value={longBreakDuration} onChange={(event) => updateSettings({ ...data.settings, longBreakDuration: Number(event.target.value) })} label="Long break" />
              </div>

              <div className="flex flex-wrap gap-5 text-sm text-slate-600 dark:text-slate-400">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={autoCycle} onChange={(event) => setAutoCycle(event.target.checked)} />
                  Auto cycle
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={soundOn} onChange={(event) => setSoundOn(event.target.checked)} />
                  Sound alerts
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={completeLinkedTask} onChange={(event) => setCompleteLinkedTask(event.target.checked)} />
                  Complete linked task after focus
                </label>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <StatCard label="Completed today" value={String(completedToday)} />
            <StatCard label="Current streak" value={String(streak)} />
            <StatCard label="Focus badge" value={badge} />
            <StatCard label="Daily goal" value={`${dailyGoal}`} />
          </div>
        </div>
      </div>

      <Card title="Weekly consistency map">
        <div className="grid gap-3 sm:grid-cols-7">
          {weeklyHeatmap.map((item) => (
            <div key={item.day} className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-4 text-center dark:border-slate-800 dark:bg-slate-900/60">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.day}</div>
              <div
                className={`mx-auto mt-4 h-14 w-14 rounded-2xl ${
                  item.count === 0
                    ? 'bg-slate-200 dark:bg-slate-800'
                    : item.count < 2
                    ? 'bg-emerald-300'
                    : item.count < 4
                    ? 'bg-emerald-500'
                    : 'bg-emerald-700'
                }`}
              />
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">{item.count} sessions</div>
            </div>
          ))}
        </div>
      </Card>

      {spotifyOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
          <Card className="w-full max-w-md">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Spotify player</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Paste a Spotify playlist, album, track, or episode link.</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSpotifyOpen(false)}>
                  Close
                </Button>
              </div>

              <Select
                value={spotifyEmbed}
                onChange={(event) => {
                  applySpotifySource(event.target.value);
                }}
              >
                {SPOTIFY_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </Select>

              <Input
                value={spotifyInput}
                onChange={(event) => setSpotifyInput(event.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
              />

              <div className="flex justify-end">
                <Button size="sm" onClick={() => applySpotifySource(spotifyInput)}>
                  Load source
                </Button>
              </div>

              <iframe
                src={spotifyEmbed}
                width="100%"
                height="352"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-3xl border border-slate-200 dark:border-slate-800"
              />
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <Card>
    <div className="text-center">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{value}</div>
    </div>
  </Card>
);

const formatTime = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

const getAudioContext = (ref: React.MutableRefObject<AudioContext | null>) => {
  if (!ref.current) {
    const AmbientContext = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    ref.current = new AmbientContext();
  }
  return ref.current;
};

const playCompletionChime = async (ref: React.MutableRefObject<AudioContext | null>) => {
  const context = getAudioContext(ref);
  await context.resume();

  const now = context.currentTime;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
  master.connect(context.destination);

  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12 / (index + 1), now + 0.03 + index * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48 + index * 0.06);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now + index * 0.04);
    oscillator.stop(now + 0.7 + index * 0.08);
  });
};

const buildTaskOptions = (tasks: Task[], depth = 0): Array<{ id: string; label: string }> =>
  tasks.flatMap((task) => [
    {
      id: task.id,
      label: `${depth > 0 ? `${' '.repeat(depth * 2)}- ` : ''}${task.title}`,
    },
    ...buildTaskOptions(task.children || [], depth + 1),
  ]);

const getSpotifyEmbedUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.includes('/embed/')) {
    return trimmed;
  }

  if (trimmed.startsWith('spotify:')) {
    const parts = trimmed.split(':');
    const itemType = parts[1];
    const itemId = parts[2];
    if (itemType && itemId) {
      return `https://open.spotify.com/embed/${itemType}/${itemId}`;
    }
  }

  const match = trimmed.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/);
  if (!match) return null;

  return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
};

const buildAmbientScene = (context: AudioContext, mode: AmbientKey) => {
  const nodes: AudioNode[] = [];
  const stops: Array<() => void> = [];
  const master = context.createGain();
  master.gain.value = mode === 'noise' ? 0.16 : mode === 'brown' ? 0.22 : 0.12;
  master.connect(context.destination);
  nodes.push(master);

  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let lastOut = 0;
  let brownOut = 0;
  for (let i = 0; i < channel.length; i += 1) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    brownOut = (brownOut + 0.04 * white) / 1.04;
    channel[i] =
      mode === 'noise'
        ? white * 0.5
        : mode === 'brown'
        ? brownOut * 5.2
        : mode === 'vinyl'
        ? white * (Math.random() > 0.992 ? 1.6 : 0.14)
        : lastOut * 3.5;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = mode === 'cafe' || mode === 'fireplace' || mode === 'vinyl' ? 'lowpass' : 'highpass';
  filter.frequency.value =
    mode === 'rain'
      ? 900
      : mode === 'cafe'
      ? 700
      : mode === 'brown'
      ? 220
      : mode === 'ocean'
      ? 480
      : mode === 'forest'
      ? 760
      : mode === 'fireplace'
      ? 520
      : mode === 'vinyl'
      ? 1400
      : 1400;
  source.connect(filter);
  filter.connect(master);
  source.start();
  nodes.push(source, filter);
  stops.push(() => source.stop());

  if (mode === 'rain') {
    const rainGain = context.createGain();
    rainGain.gain.value = 0.08;
    const rainFilter = context.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 1800;
    filter.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(master);
    nodes.push(rainGain, rainFilter);
  }

  if (mode === 'cafe') {
    const hum = context.createOscillator();
    const humGain = context.createGain();
    hum.type = 'triangle';
    hum.frequency.value = 170;
    humGain.gain.value = 0.015;
    hum.connect(humGain);
    humGain.connect(master);
    hum.start();
    nodes.push(hum, humGain);
    stops.push(() => hum.stop());
  }

  if (mode === 'ocean') {
    const swell = context.createOscillator();
    const swellGain = context.createGain();
    swell.type = 'sine';
    swell.frequency.value = 0.12;
    swellGain.gain.value = 140;
    swell.connect(swellGain);
    swellGain.connect(filter.frequency);
    swell.start();
    nodes.push(swell, swellGain);
    stops.push(() => swell.stop());
  }

  if (mode === 'forest') {
    for (let i = 0; i < 3; i += 1) {
      const bird = context.createOscillator();
      const birdGain = context.createGain();
      bird.type = i % 2 === 0 ? 'sine' : 'triangle';
      bird.frequency.value = 1200 + i * 180;
      birdGain.gain.value = 0.006;
      bird.connect(birdGain);
      birdGain.connect(master);
      bird.start();
      nodes.push(bird, birdGain);
      stops.push(() => bird.stop());
    }
  }

  if (mode === 'fireplace') {
    const crackleFilter = context.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.value = 900;
    crackleFilter.Q.value = 0.8;
    filter.connect(crackleFilter);
    crackleFilter.connect(master);
    nodes.push(crackleFilter);
  }

  return () => {
    stops.forEach((stop) => {
      try {
        stop();
      } catch {}
    });
    nodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {}
    });
  };
};

export default Focus;
