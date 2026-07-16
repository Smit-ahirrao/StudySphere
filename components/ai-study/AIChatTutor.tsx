import React, { useRef, useState, useEffect } from 'react';
import { Brain, Loader2, Send, Sparkles, User, Lightbulb, Eraser, BookOpen } from 'lucide-react';
import RichText from './RichText';
import { askDocumentQuestion, simplifyExplanation } from '../../utils/aiStudy';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

interface Props {
  documentText: string;
  fileName: string;
}

const SUGGESTIONS = [
  '📝 Summarize the key concepts',
  '🔍 What are the main differences?',
  '💡 Give me an example of...',
  '🧪 Create a practice question',
  '📊 Compare the main ideas',
  '🎯 What would be on the exam?',
];




const PERSONAS = [
  { id: 'socratic', name: 'Socratic Tutor', icon: '🧠', desc: 'Friendly & guiding' },
  { id: 'genz', name: 'Gen Z Explainer', icon: '🎮', desc: 'Slang & analogies' },
  { id: 'examiner', name: 'Strict Examiner', icon: '🎯', desc: 'Rubrics & marks' },
  { id: 'flashcard', name: 'Flashcard Maker', icon: '🧪', desc: 'Q&A cards only' },
];

const AIChatTutor: React.FC<Props> = ({ documentText, fileName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [simplifying, setSimplifying] = useState<number | null>(null);
  const [activePersona, setActivePersona] = useState(PERSONAS[0].id);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (question?: string) => {
    const q = question || input.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: q, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, text: m.text }));
      const response = await askDocumentQuestion(documentText, q, history, activePersona);
      setMessages(prev => [...prev, { role: 'ai', text: response, timestamp: Date.now() }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `😔 Oops! Something went wrong.\n\n• ${err instanceof Error ? err.message : 'Please try again!'}\n\n💡 Quick tip: Try rephrasing your question!`,
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSimplify = async (index: number) => {
    const msg = messages[index];
    if (!msg || msg.role !== 'ai' || simplifying !== null) return;
    setSimplifying(index);

    try {
      const simplified = await simplifyExplanation(msg.text);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `🧒 **Super Simple Version:**\n\n${simplified}\n\n💡 Quick tip: If it still doesn't click, try asking "give me an analogy for this"!`,
        timestamp: Date.now()
      }]);
    } catch {
      // Silently fail
    } finally {
      setSimplifying(null);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-sm">
          <Brain size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Study Tutor</h3>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Online</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">📄 {fileName}</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition">
            <Eraser size={10} /> Clear
          </button>
        )}
      </div>

      {/* Persona Selector */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50/50 px-5 py-2.5 dark:border-slate-800 dark:bg-slate-900/20 shrink-0 no-scrollbar">
        {PERSONAS.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePersona(p.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 hover-lift ${
              activePersona === p.id
                ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-400/50 dark:bg-purple-900/50 dark:text-purple-300 dark:ring-purple-500/50'
                : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/80'
            }`}
          >
            <span>{p.icon}</span> {p.name}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-scale-in">
            <div className="mb-3 text-4xl">{PERSONAS.find(p => p.id === activePersona)?.icon}</div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {activePersona === 'genz' ? "What's good? I'm your Gen Z Tutor 👋" :
               activePersona === 'examiner' ? "Strict Examiner Mode Active 📝" :
               activePersona === 'flashcard' ? "Ready to make Flashcards 📇" :
               "Hey! I'm your AI Study Buddy 👋"}
            </h4>
            <p className="text-[13px] text-slate-500 mt-1 max-w-md">
              {PERSONAS.find(p => p.id === activePersona)?.desc}. Ask me anything about your document!
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => handleSend(s)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-[11px] font-medium text-slate-700 transition hover:border-purple-300 hover:bg-purple-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-purple-800 dark:hover:bg-purple-950/20"
                >{s}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white mt-0.5 shadow-sm">
                  <Sparkles size={12} />
                </div>
              )}
              <div className={`max-w-[85%] ${
                msg.role === 'user'
                  ? 'rounded-2xl rounded-br-md bg-slate-900 px-4 py-3 text-[13px] text-white dark:bg-sky-500 dark:text-slate-950'
                  : 'rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[13px] text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-100 dark:border-slate-800 shadow-sm'
              }`}>
                {msg.role === 'ai' ? (
                  <>
                    <RichText text={msg.text} />
                    <div className="mt-2.5 flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                      <button
                        onClick={() => handleSimplify(i)}
                        disabled={simplifying !== null}
                        className="flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1 text-[9px] font-bold text-purple-600 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-400 transition"
                      >
                        {simplifying === i ? <Loader2 size={9} className="animate-spin" /> : <Lightbulb size={9} />}
                        Simplify
                      </button>
                      <button
                        onClick={() => handleSend(`Can you give me an analogy for: ${msg.text.slice(0, 100)}`)}
                        className="flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1 text-[9px] font-bold text-sky-600 hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-400 transition"
                      >
                        <BookOpen size={9} /> Analogy
                      </button>
                    </div>
                  </>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 mt-0.5">
                  <User size={12} />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-sm">
              <Sparkles size={12} />
            </div>
            <div className="rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-[13px] text-slate-500">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything about the document..."
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] text-slate-900 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-purple-600 dark:focus:ring-purple-950"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm transition hover:shadow-md disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatTutor;
