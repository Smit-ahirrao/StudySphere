import React from 'react';

interface Props {
  content: string;
}

type ListItem =
  | { type: 'bullet'; value: string }
  | { type: 'check'; value: string; checked: boolean }
  | { type: 'number'; value: string; order: number };

const NotePreview: React.FC<Props> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: ListItem[] = [];
  let codeBuffer: string[] = [];
  let inCode = false;

  const flushList = () => {
    if (listBuffer.length === 0) return;

    const ordered = listBuffer.every((item) => item.type === 'number');
    const Wrapper = ordered ? 'ol' : 'ul';

    elements.push(
      <Wrapper key={`list-${elements.length}`} className="space-y-2">
        {listBuffer.map((item, index) => (
          <li key={`${item.value}-${index}`} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
            {item.type === 'check' ? (
              <span
                className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                  item.checked
                    ? 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                }`}
              >
                {item.checked ? '✓' : ''}
              </span>
            ) : item.type === 'number' ? (
              <span className="mt-0.5 inline-flex min-w-[1.5rem] justify-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-950/50 dark:text-sky-200">
                {item.order}
              </span>
            ) : (
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
            )}
            <span>{renderInline(item.value)}</span>
          </li>
        ))}
      </Wrapper>
    );

    listBuffer = [];
  };

  const flushCode = () => {
    if (codeBuffer.length === 0) return;

    elements.push(
      <pre key={`code-${elements.length}`} className="overflow-x-auto rounded-[22px] bg-slate-950 px-4 py-4 text-sm text-slate-100">
        <code>{codeBuffer.join('\n')}</code>
      </pre>
    );

    codeBuffer = [];
  };

  lines.forEach((line, index) => {
    if (line.trim() === '```') {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeBuffer.push(line);
      return;
    }

    if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
      listBuffer.push({
        type: 'check',
        value: line.replace(/^- \[(?: |x)\] /, ''),
        checked: line.startsWith('- [x] '),
      });
      return;
    }

    if (line.startsWith('- ')) {
      listBuffer.push({
        type: 'bullet',
        value: line.slice(2),
      });
      return;
    }

    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      listBuffer.push({
        type: 'number',
        order: Number(numberedMatch[1]),
        value: numberedMatch[2],
      });
      return;
    }

    flushList();

    if (!line.trim()) {
      elements.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-xl font-semibold text-slate-900 dark:text-white">
          {line.slice(3)}
        </h3>
      );
      return;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h2-${index}`} className="text-2xl font-semibold text-slate-950 dark:text-white">
          {line.slice(2)}
        </h2>
      );
      return;
    }

    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${index}`} className="rounded-r-[18px] border-l-4 border-sky-400 bg-sky-50/80 px-4 py-3 text-sm text-slate-700 dark:bg-sky-950/20 dark:text-slate-300">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    if (line.startsWith('! ')) {
      elements.push(
        <div key={`callout-${index}`} className="rounded-[20px] border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-slate-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-slate-300">
          {renderInline(line.slice(2))}
        </div>
      );
      return;
    }

    if (line.trim() === '---') {
      elements.push(<hr key={`hr-${index}`} className="border-slate-200 dark:border-slate-800" />);
      return;
    }

    elements.push(
      <p key={`p-${index}`} className="text-sm leading-7 text-slate-700 dark:text-slate-300">
        {renderInline(line)}
      </p>
    );
  });

  flushList();
  flushCode();

  if (!content.trim()) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Start writing to preview formatted notes here.</p>;
  }

  return <div className="space-y-3">{elements}</div>;
};

const renderInline = (line: string) => {
  const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|==.*?==)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith('==') && part.endsWith('==')) {
      return (
        <mark key={`${part}-${index}`} className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100">
          {part.slice(2, -2)}
        </mark>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={`${part}-${index}`} className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] dark:bg-slate-800">
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

export default NotePreview;
