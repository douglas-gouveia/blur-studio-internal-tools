/**
 * Rich Text Editor.
 * TipTap wrapper with a formatting toolbar (Bold, Italic, Underline,
 * Heading, Lists, Code). Used for Product Summary and Features editing.
 */
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  /** Initial HTML content. */
  content: string;
  /** Called with updated HTML on every change. */
  onChange: (html: string) => void;
  /** Whether the editor is interactive. Defaults to true. */
  editable?: boolean;
}

/** TipTap-based rich text editor with a formatting toolbar. */
export default function RichTextEditor({
  content,
  onChange,
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content,
    editable,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-invert max-w-none min-h-48 px-3 py-2.5 text-sm text-text-primary focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-border bg-base overflow-hidden">
      {/* Toolbar */}
      {editable && (
        <div
          className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-surface"
          role="toolbar"
          aria-label="Text formatting"
        >
          <ToolbarButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="underline">U</span>
          </ToolbarButton>

          <Separator />

          <ToolbarButton
            label="Heading 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            H3
          </ToolbarButton>

          <Separator />

          <ToolbarButton
            label="Bullet List"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Ordered List"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </ToolbarButton>

          <Separator />

          <ToolbarButton
            label="Code Block"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            {"</>"}
          </ToolbarButton>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

// ── Toolbar sub-components ───────────────────────────────────────────────────

interface ToolbarButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

/** Individual toolbar button with active state and accessibility label. */
function ToolbarButton({ label, active, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "bg-accent text-white"
          : "text-text-secondary hover:text-text-primary hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

/** Visual separator between toolbar button groups. */
function Separator() {
  return <div className="w-px h-5 bg-border mx-1" />;
}
