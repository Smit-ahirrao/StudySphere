export type NoteFormatAction =
  | 'heading'
  | 'subheading'
  | 'bold'
  | 'italic'
  | 'highlight'
  | 'bullet'
  | 'numbered'
  | 'checklist'
  | 'quote'
  | 'callout'
  | 'code'
  | 'divider';

export const applyNoteFormat = ({
  value,
  selectionStart,
  selectionEnd,
  action,
}: {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  action: NoteFormatAction;
}) => {
  const selected = value.slice(selectionStart, selectionEnd);
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);

  const lineTransform = (prefix: string) => {
    const target = selected || 'Item';
    const replaced = target
      .split('\n')
      .map((line) => `${prefix}${line || ''}`)
      .join('\n');
    return {
      nextValue: `${before}${replaced}${after}`,
      nextSelectionStart: selectionStart,
      nextSelectionEnd: selectionStart + replaced.length,
    };
  };

  switch (action) {
    case 'heading': {
      const text = `# ${selected || 'Heading'}`;
      return buildReplacement(before, after, selectionStart, text);
    }
    case 'subheading': {
      const text = `## ${selected || 'Subheading'}`;
      return buildReplacement(before, after, selectionStart, text);
    }
    case 'bold': {
      const text = `**${selected || 'bold text'}**`;
      return buildReplacement(before, after, selectionStart, text, selected ? 2 : 2, selected ? text.length - 2 : text.length - 2);
    }
    case 'italic': {
      const text = `*${selected || 'italic text'}*`;
      return buildReplacement(before, after, selectionStart, text, 1, text.length - 1);
    }
    case 'highlight': {
      const text = `==${selected || 'important'}==`;
      return buildReplacement(before, after, selectionStart, text, 2, text.length - 2);
    }
    case 'bullet':
      return lineTransform('- ');
    case 'numbered': {
      const target = selected || 'Point';
      const replaced = target
        .split('\n')
        .map((line, index) => `${index + 1}. ${line || ''}`)
        .join('\n');
      return {
        nextValue: `${before}${replaced}${after}`,
        nextSelectionStart: selectionStart,
        nextSelectionEnd: selectionStart + replaced.length,
      };
    }
    case 'checklist':
      return lineTransform('- [ ] ');
    case 'quote':
      return lineTransform('> ');
    case 'callout':
      return lineTransform('! ');
    case 'code': {
      const text = selected.includes('\n') ? `\`\`\`\n${selected}\n\`\`\`` : `\`${selected || 'code'}\``;
      return buildReplacement(before, after, selectionStart, text);
    }
    case 'divider': {
      const text = '\n---\n';
      return buildReplacement(before, after, selectionStart, text);
    }
    default:
      return {
        nextValue: value,
        nextSelectionStart: selectionStart,
        nextSelectionEnd: selectionEnd,
      };
  }
};

const buildReplacement = (
  before: string,
  after: string,
  selectionStart: number,
  text: string,
  innerStartOffset = 0,
  innerEndOffset = text.length
) => ({
  nextValue: `${before}${text}${after}`,
  nextSelectionStart: selectionStart + innerStartOffset,
  nextSelectionEnd: selectionStart + innerEndOffset,
});
