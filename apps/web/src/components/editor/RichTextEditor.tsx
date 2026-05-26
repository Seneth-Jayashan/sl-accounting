import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface Props {
  content: string;
  onChange: (value: string) => void;
  minHeight?: string;
}

const RichTextEditor = ({
  content,
  onChange,
  minHeight = "150px",
}: Props) => {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-5",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-5",
          },
        },
      }),
    ],

    content: content || "",

    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none border border-gray-300 rounded-lg p-4 bg-white whitespace-pre-wrap",
        style: `min-height:${minHeight}`,
      },
    },

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external updates
  useEffect(() => {
    if (!editor) return;

    if (editor.getHTML() !== content) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  const buttonClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition ${
      active
        ? "bg-blue-600 text-white"
        : "bg-white border border-gray-200 hover:bg-gray-100"
    }`;

  return (
    <div className="space-y-2">

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50">

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={buttonClass(editor.isActive("bold"))}
        >
          Bold
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={buttonClass(editor.isActive("italic"))}
        >
          Italic
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={buttonClass(editor.isActive("bulletList"))}
        >
          Bullet List
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={buttonClass(editor.isActive("orderedList"))}
        >
          Number List
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={buttonClass(
            editor.isActive("heading", { level: 2 })
          )}
        >
          Heading
        </button>

      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

    </div>
  );
};

export default RichTextEditor;