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
      'bg-slate-950 text-white shadow-lg shadow-sky-500/15 hover:-translate-y-0.5 hover:bg-slate-900 focus:ring-sky-500 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300',
    secondary:
      'border border-slate-200/90 bg-white/88 text-slate-700 backdrop-blur hover:border-sky-200 hover:bg-sky-50/70 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:border-sky-800 dark:hover:bg-slate-800',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus:ring-sky-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
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

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action, ...props }) => (
  <div
    className={`rounded-[28px] border border-white/70 bg-white/88 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.42)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-950/78 overflow-hidden ${className}`}
    {...props}
  >
    {(title || action) && (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100/80 px-5 py-4 dark:border-slate-800">
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

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => (
  <div className="w-full">
    {label ? <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label> : null}
    <input
      ref={ref}
      className={`w-full rounded-2xl border border-slate-200/90 bg-white/92 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-sky-500 dark:focus:ring-sky-950 ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-950' : ''} ${className}`}
      {...props}
    />
    {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
  </div>
));

Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className = '', ...props }, ref) => (
  <textarea
    ref={ref}
    className={`w-full rounded-2xl border border-slate-200/90 bg-white/92 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-sky-500 dark:focus:ring-sky-950 ${className}`}
    {...props}
  />
));

Textarea.displayName = 'Textarea';

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <select
    className={`w-full rounded-2xl border border-slate-200/90 bg-white/92 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-sky-500 dark:focus:ring-sky-950 ${className}`}
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
    blue: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200',
    cyan: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200',
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
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:text-sky-300">{eyebrow}</p> : null}
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h1>
      {description ? <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">{description}</p> : null}
    </div>
    {action}
  </div>
);
