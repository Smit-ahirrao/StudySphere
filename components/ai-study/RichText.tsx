import React from 'react';

/** Render markdown-like text with bold, bullets, emojis, and tables safely */
const RichText: React.FC<{ text: string }> = ({ text }) => {
  const lines = (text || '').split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const renderInline = (line: string, key: number) => {
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={key}>
        {parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>
            : part
        )}
      </span>
    );
  };

  const flushTable = () => {
    if (tableRows.length < 2) return;
    const header = tableRows[0];
    const body = tableRows.slice(1).filter(r => !r.every(c => /^[-:]+$/.test(c.trim())));
    elements.push(
      <div key={`tbl-${elements.length}`} className="my-2 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800">
              {header.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className="border-t border-slate-100 dark:border-slate-800">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-slate-600 dark:text-slate-400">{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      const cells = trimmed.split('|').filter(c => c.trim() !== '');
      tableRows.push(cells);
      return;
    } else if (inTable) {
      flushTable();
      inTable = false;
    }

    // Empty line
    if (!trimmed) {
      elements.push(<div key={i} className="h-2" />);
      return;
    }

    // Bullet points
    if (/^[•\-\*]\s/.test(trimmed)) {
      elements.push(
        <div key={i} className="flex gap-2 py-0.5">
          <span className="text-purple-500 mt-0.5 shrink-0">•</span>
          <span>{renderInline(trimmed.replace(/^[•\-\*]\s/, ''), i)}</span>
        </div>
      );
      return;
    }

    // Numbered list
    if (/^\d+[\.\)]\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)/)?.[1] || '1';
      elements.push(
        <div key={i} className="flex gap-2.5 py-0.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-purple-100 text-[10px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 mt-0.5">{num}</span>
          <span>{renderInline(trimmed.replace(/^\d+[\.\)]\s/, ''), i)}</span>
        </div>
      );
      return;
    }

    // Tip / Key takeaway lines
    if (trimmed.includes('💡') || trimmed.includes('🎯') || trimmed.includes('Quick tip') || trimmed.includes('Key takeaway')) {
      elements.push(
        <div key={i} className="mt-2 rounded-xl bg-purple-50 px-3 py-2.5 text-purple-800 dark:bg-purple-950/20 dark:text-purple-300 border border-purple-100 dark:border-purple-900/30">
          {renderInline(trimmed, i)}
        </div>
      );
      return;
    }

    // Regular line
    elements.push(<p key={i} className="py-0.5">{renderInline(trimmed, i)}</p>);
  });

  if (inTable) flushTable();

  return <div className="space-y-0.5">{elements}</div>;
};

export default RichText;
