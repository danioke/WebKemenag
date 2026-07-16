import React, { useMemo, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { toast } from "sonner";
import { useMediaPickerStore } from "../store/useMediaPickerStore";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = "350px",
}: RichTextEditorProps) {
  const quillRef = useRef<any>(null);
  const { openPicker } = useMediaPickerStore();

  const imageHandler = () => {
    openPicker((url) => {
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        quill.insertEmbed(range?.index || 0, "image", url);
        quill.setSelection((range?.index || 0) + 1);
      }
    });
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [
            { list: "ordered" },
            { list: "bullet" },
            { indent: "-1" },
            { indent: "+1" },
          ],
          ["link", "image", "video"],
          ["clean"],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    // Add openPicker as dependency
    [openPicker],
  );

  return (
    <div className="bg-white border border-gray-300 rounded-md overflow-hidden quill-editor-container">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        style={{ minHeight }}
      />
    </div>
  );
}
