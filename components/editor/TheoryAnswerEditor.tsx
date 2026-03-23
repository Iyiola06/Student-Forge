'use client';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  List,
  Heading,
  Undo,
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

interface TheoryAnswerEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TheoryAnswerEditor({ value, onChange, disabled = false }: TheoryAnswerEditorProps) {
  return (
    <div className="rounded-[2rem] border-2 border-slate-200 dark:border-[#2d2d3f] overflow-hidden bg-white dark:bg-[#13131a]">
      <CKEditor
        disabled={disabled}
        editor={ClassicEditor}
        config={{
          licenseKey: 'GPL',
          plugins: [Essentials, Paragraph, Bold, Italic, Underline, List, Heading, Undo],
          toolbar: [
            'undo',
            'redo',
            '|',
            'heading',
            '|',
            'bold',
            'italic',
            'underline',
            '|',
            'bulletedList',
            'numberedList',
          ],
          placeholder: 'Write your answer here...',
          initialData: value || '',
        }}
        data={value}
        onChange={(_, editor) => {
          onChange(editor.getData());
        }}
      />
    </div>
  );
}
