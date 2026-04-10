import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

  const variants = {
    primary:
      'bg-slate-950 text-white shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5 hover:bg-slate-900 focus:ring-cyan-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300',
    secondary:
      'border border-slate-200 bg-white/80 text-slate-700 backdrop-blur hover:border-cyan-200 hover:bg-cyan-50 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-slate-800',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus:ring-cyan-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
  };

  const sizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}> = ({ children, className = '', title, action }) => (
  <div
    className={`rounded-[28px] border border-white/60 bg-white/85 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75 ${className}`}
  >
    {(title || action) && (
      <div className="flex items-center justify-between border-b border-slate-100/80 px-5 py-4 dark:border-slate-800">
        {title ? <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3> : <div />}
        {action}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label ? <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label> : null}
    <input
      className={`w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-950 ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-950' : ''} ${className}`}
      {...props}
    />
    {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
  </div>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea
    className={`w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-950 ${className}`}
    {...props}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <select
    className={`w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-950 ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const Badge: React.FC<{
  children: React.ReactNode;
  color?: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'cyan';
}> = ({ children, color = 'gray' }) => {
  const colors = {
    gray: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    red: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
    yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200',
  };

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colors[color]}`}>{children}</span>;
};

export const SectionHeading: React.FC<{
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ eyebrow, title, description, action }) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="space-y-2">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">{eyebrow}</p> : null}
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h1>
      {description ? <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">{description}</p> : null}
    </div>
    {action}
  </div>
);
