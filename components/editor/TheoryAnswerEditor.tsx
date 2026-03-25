'use client';

import { useEffect, useState } from 'react';

interface TheoryAnswerEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface EditorParts {
  CKEditor: any;
  ClassicEditor: any;
  Essentials: any;
  Paragraph: any;
  Bold: any;
  Italic: any;
  Underline: any;
  List: any;
  Heading: any;
  Undo: any;
}

// Start loading CKEditor immediately when this module is imported (not lazily on mount).
// This means the download begins as soon as the generator page loads, so by the time
// the user reaches a theory question on mobile the editor is already ready.
let editorPartsPromise: Promise<EditorParts> | null = null;

function getEditorParts(): Promise<EditorParts> {
  if (!editorPartsPromise) {
    editorPartsPromise = Promise.all([
      import('@ckeditor/ckeditor5-react'),
      import('ckeditor5'),
    ]).then(([reactModule, editorModule]) => ({
      CKEditor: reactModule.CKEditor,
      ClassicEditor: editorModule.ClassicEditor,
      Essentials: editorModule.Essentials,
      Paragraph: editorModule.Paragraph,
      Bold: editorModule.Bold,
      Italic: editorModule.Italic,
      Underline: editorModule.Underline,
      List: editorModule.List,
      Heading: editorModule.Heading,
      Undo: editorModule.Undo,
    }));
  }
  return editorPartsPromise;
}

// Kick off the load immediately when this module is first imported.
getEditorParts().catch(() => {
  // Reset so it can be retried on next render if it failed transiently.
  editorPartsPromise = null;
});

export default function TheoryAnswerEditor({ value, onChange, disabled = false }: TheoryAnswerEditorProps) {
  const [editorParts, setEditorParts] = useState<EditorParts | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getEditorParts()
      .then((parts) => {
        if (isMounted) setEditorParts(parts);
      })
      .catch((error) => {
        console.error('CKEditor failed to load:', error);
        if (isMounted) setLoadFailed(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loadFailed) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300">
          Rich text editor failed to load here, so a plain answer box is being used instead.
        </div>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="Write your answer here..."
          className="w-full min-h-[180px] md:min-h-[224px] p-4 md:p-6 rounded-[2rem] bg-[#f5f5f8] dark:bg-[#13131a] border-2 border-slate-200 dark:border-[#2d2d3f] outline-none text-sm md:text-base font-medium text-slate-900 dark:text-white resize-none"
        />
      </div>
    );
  }

  if (!editorParts) {
    return (
      <div className="rounded-[2rem] border-2 border-slate-200 dark:border-[#2d2d3f] bg-white dark:bg-[#13131a] px-4 py-8 md:px-6 md:py-10 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
        Loading rich text editor...
      </div>
    );
  }

  const {
    CKEditor,
    ClassicEditor,
    Essentials,
    Paragraph,
    Bold,
    Italic,
    Underline,
    List,
    Heading,
    Undo,
  } = editorParts;

  return (
    <div className="rounded-[2rem] border-2 border-slate-200 dark:border-[#2d2d3f] overflow-hidden bg-white dark:bg-[#13131a] ckeditor-mobile-wrapper">
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
        onChange={(_event: any, editor: any) => {
          onChange(editor.getData());
        }}
      />
    </div>
  );
}
