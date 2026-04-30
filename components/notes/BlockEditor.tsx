import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  CheckSquare, 
  Square,
  Quote,
  Code,
  Divide,
  Info,
  Type
} from 'lucide-react';
import { Block, BlockType } from '../../types';
import SlashMenu from './SlashMenu';

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  onFocus?: (blockId: string) => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange, onFocus }) => {
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [slashMenuPosition, setSlashMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const editorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const updateBlock = (id: string, updates: Partial<Block>) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
    onChange(newBlocks);
  };

  const addBlock = (afterId: string, type: BlockType = 'paragraph', content: string = '') => {
    const newBlock: Block = { id: uuidv4(), type, content };
    const index = blocks.findIndex(b => b.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChange(newBlocks);
    setTimeout(() => {
      editorRefs.current[newBlock.id]?.focus();
    }, 0);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      updateBlock(id, { type: 'paragraph', content: '' });
      return;
    }
    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = blocks.filter(b => b.id !== id);
    onChange(newBlocks);
    if (index > 0) {
      setTimeout(() => {
        const prevBlockId = blocks[index - 1].id;
        editorRefs.current[prevBlockId]?.focus();
        // Place cursor at end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(editorRefs.current[prevBlockId]!);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: Block) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock(block.id);
    } else if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(block.id);
    } else if (e.key === '/') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSlashMenuPosition({ x: rect.left, y: rect.bottom + window.scrollY });
      }
    } else if (e.key === 'Escape') {
      setSlashMenuPosition(null);
    }
  };

  const handleSlashSelect = (type: BlockType) => {
    if (focusedBlockId) {
      const block = blocks.find(b => b.id === focusedBlockId);
      if (block) {
        // Remove the '/' from content
        const newContent = block.content.replace(/\/$/, '');
        updateBlock(focusedBlockId, { type, content: newContent });
      }
    }
    setSlashMenuPosition(null);
  };

  return (
    <div className="relative space-y-1">
      {blocks.map((block, index) => (
        <div 
          key={block.id} 
          className="group relative flex items-start gap-2"
          onMouseEnter={() => setFocusedBlockId(block.id)}
        >
          <div className="mt-1.5 flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button className="cursor-grab text-slate-300 hover:text-slate-500">
              <GripVertical size={16} />
            </button>
            <button 
              onClick={() => addBlock(block.id)}
              className="text-slate-300 hover:text-slate-500"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1">
            <BlockRenderer 
              block={block} 
              onFocus={() => {
                setFocusedBlockId(block.id);
                onFocus?.(block.id);
              }}
              onBlur={() => {
                if (!slashMenuPosition) setFocusedBlockId(null);
              }}
              onChange={(content) => updateBlock(block.id, { content })}
              onKeyDown={(e) => handleKeyDown(e, block)}
              innerRef={(el) => editorRefs.current[block.id] = el}
            />
          </div>
        </div>
      ))}

      {slashMenuPosition && (
        <SlashMenu 
          position={slashMenuPosition} 
          onSelect={handleSlashSelect} 
          onClose={() => setSlashMenuPosition(null)} 
        />
      )}
    </div>
  );
};

interface BlockRendererProps {
  block: Block;
  onChange: (content: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  innerRef: (el: HTMLDivElement | null) => void;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ 
  block, onChange, onFocus, onBlur, onKeyDown, innerRef 
}) => {
  const baseClasses = "w-full outline-none transition-colors min-h-[1.5em] break-words";
  
  const renderContent = () => {
    return (
      <div
        ref={innerRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onInput={(e) => onChange(e.currentTarget.innerText)}
        className={`${baseClasses} ${getBlockStyles(block.type)}`}
      >
        {block.content}
      </div>
    );
  };

  switch (block.type) {
    case 'h1': return <h1 className="mt-6 mb-2 text-3xl font-bold text-slate-900 dark:text-white">{renderContent()}</h1>;
    case 'h2': return <h2 className="mt-5 mb-2 text-2xl font-semibold text-slate-900 dark:text-white">{renderContent()}</h2>;
    case 'h3': return <h3 className="mt-4 mb-2 text-xl font-semibold text-slate-900 dark:text-white">{renderContent()}</h3>;
    case 'bullet': return (
      <div className="flex items-start gap-2 py-1">
        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
        {renderContent()}
      </div>
    );
    case 'numbered': return (
      <div className="flex items-start gap-2 py-1">
        <span className="mt-0.5 text-slate-400 font-medium min-w-[1.25rem]">1.</span>
        {renderContent()}
      </div>
    );
    case 'todo': return (
      <div className="flex items-start gap-2 py-1">
        <button className="mt-1 text-slate-400 hover:text-sky-500">
          <Square size={18} />
        </button>
        {renderContent()}
      </div>
    );
    case 'quote': return (
      <div className="my-4 border-l-4 border-slate-200 pl-4 italic text-slate-600 dark:border-slate-700 dark:text-slate-400">
        {renderContent()}
      </div>
    );
    case 'callout': return (
      <div className="my-4 flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 dark:border-sky-900/30 dark:bg-sky-950/20">
        <div className="mt-0.5 text-sky-500"><Info size={20} /></div>
        <div className="flex-1">{renderContent()}</div>
      </div>
    );
    case 'code': return (
      <div className="my-4 rounded-xl bg-slate-900 p-4 font-mono text-sm text-slate-200">
        {renderContent()}
      </div>
    );
    case 'divider': return <div className="my-6 border-t border-slate-100 dark:border-slate-800" />;
    default: return <div className="py-1 text-slate-700 dark:text-slate-300">{renderContent()}</div>;
  }
};

const getBlockStyles = (type: BlockType): string => {
  switch (type) {
    case 'h1': return 'text-3xl font-bold';
    case 'h2': return 'text-2xl font-semibold';
    case 'h3': return 'text-xl font-semibold';
    case 'code': return 'font-mono';
    case 'quote': return 'italic';
    default: return 'text-base leading-relaxed';
  }
};

export default BlockEditor;
