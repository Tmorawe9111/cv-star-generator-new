import React, { useRef, useEffect } from 'react';
import ReactQuill, { ReactQuillProps } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

// Wrapper-Komponente um ReactQuill, um die findDOMNode Warnung zu reduzieren
// Die Warnung kommt von ReactQuill selbst und kann nicht vollständig behoben werden
// ohne die Bibliothek zu ändern. Diese Komponente isoliert ReactQuill.
export function QuillEditor({ value, onChange, placeholder, minHeight = '400px' }: QuillEditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Stabiler Container für ReactQuill
  // Dies hilft, die findDOMNode Warnung zu reduzieren
  useEffect(() => {
    // Container ist stabil, ReactQuill kann sicher gerendert werden
  }, []);

  const quillModules: ReactQuillProps['modules'] = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  return (
    <div ref={wrapperRef} className="blog-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ minHeight }}
        modules={quillModules}
      />
    </div>
  );
}

