import React, { useEffect, useRef, useState } from 'react';
import $ from 'jquery';

interface SummernoteProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

export default function SummernoteEditor({ value, onChange, height = 300 }: SummernoteProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const internalChangeRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSummernote = async () => {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        window.$ = window.jQuery = $;
      }
      // Dynamically import CSS and JS so jQuery is ready
      // @ts-ignore
      await import('summernote/dist/summernote-lite.css');
      // @ts-ignore
      await import('summernote/dist/summernote-lite.js');
      
      if (isMounted) {
        setIsLoaded(true);
      }
    };

    loadSummernote();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !editorRef.current) return;

    // @ts-ignore
    $(editorRef.current).summernote({
      height: height,
      dialogsInBody: true,
      toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'underline', 'clear', 'strikethrough', 'superscript', 'subscript']],
        ['fontname', ['fontname']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['table', ['table']],
        ['insert', ['link', 'picture', 'video']],
        ['view', ['fullscreen', 'codeview', 'help']],
      ],
      callbacks: {
        onChange: function(contents: string) {
          internalChangeRef.current = true;
          onChange(contents);
          setTimeout(() => {
            internalChangeRef.current = false;
          }, 100);
        }
      }
    });
    
    // @ts-ignore
    $(editorRef.current).summernote('code', value || '');

    return () => {
      if (editorRef.current) {
        // @ts-ignore
        $(editorRef.current).summernote('destroy');
      }
    };
  }, [isLoaded]); // Run once after loaded

  useEffect(() => {
    if (isLoaded && editorRef.current && !internalChangeRef.current) {
      // @ts-ignore
      const currentContent = $(editorRef.current).summernote('code');
      if (currentContent !== value) {
        // @ts-ignore
        $(editorRef.current).summernote('code', value || '');
      }
    }
  }, [value, isLoaded]);

  return <textarea ref={editorRef} />;
}
