"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import { useState, useTransition, useEffect, useRef } from "react";
import type { SopVersion, SopWithTags } from "@/types/sops";
import { saveAsNewVersion, updateVersion } from "../actions";

interface Props {
  sop: SopWithTags;
  versions: SopVersion[];
}

export default function SopEditor({ sop, versions: initialVersions }: Props) {
  const [versions, setVersions]               = useState(initialVersions);
  const [activeVersionId, setActiveVersionId] = useState(initialVersions[0]?.id ?? "");
  const [showVersionDrop, setShowVersionDrop] = useState(false);
  const [saving, startSave]                   = useTransition();
  const [savingNew, startSaveNew]             = useTransition();
  const [saveMsg, setSaveMsg]                 = useState("");

  const activeVersion = versions.find((v) => v.id === activeVersionId) ?? versions[0];

  // Track whether we should skip the content sync effect (on first mount)
  const skipSync = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CharacterCount,
      Link.configure({ openOnClick: false }),
    ],
    content: activeVersion?.content ?? "",
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
  });

  // When user picks a different version from the dropdown, update editor content
  useEffect(() => {
    if (skipSync.current) { skipSync.current = false; return; }
    if (editor && activeVersion) {
      editor.commands.setContent(activeVersion.content ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVersionId]);

  function flash(msg: string) {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 2500);
  }

  function handleUpdateVersion() {
    if (!editor || !activeVersionId) return;
    startSave(async () => {
      const result = await updateVersion(activeVersionId, editor.getHTML());
      if (result.error) flash("Error: " + result.error);
      else flash("Saved!");
    });
  }

  function handleSaveNewVersion() {
    if (!editor) return;
    startSaveNew(async () => {
      const result = await saveAsNewVersion(sop.id, editor.getHTML());
      if (result.error) { flash("Error: " + result.error); return; }
      if (result.version) {
        const newV: SopVersion = {
          id:           result.version.id,
          sop_id:       sop.id,
          version_name: result.version.version_name,
          content:      editor.getHTML(),
          created_at:   result.version.created_at,
        };
        setVersions((prev) => [newV, ...prev]);
        setActiveVersionId(newV.id);
        flash("New version saved!");
      }
    });
  }

  const wordCount = editor?.storage.characterCount.words() ?? 0;

  if (!editor) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border shrink-0 flex-wrap bg-surface">
        <h2 className="text-base font-semibold text-text-primary">{sop.name}</h2>

        <div className="flex items-center gap-3 flex-wrap">
          {saveMsg && (
            <span className={`text-xs ${saveMsg.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
              {saveMsg}
            </span>
          )}

          {/* Version picker */}
          <div className="relative">
            <button
              onClick={() => setShowVersionDrop((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary bg-muted border border-border rounded-md hover:border-accent transition-colors"
            >
              {activeVersion
                ? `${activeVersion.version_name} · ${formatDate(activeVersion.created_at)}`
                : "No versions"}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showVersionDrop && (
              <>
                {/* backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setShowVersionDrop(false)} />
                <div className="absolute top-full right-0 mt-1 bg-elevated border border-border rounded-lg shadow-xl z-20 min-w-[240px] max-h-64 overflow-y-auto">
                  {versions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setActiveVersionId(v.id); setShowVersionDrop(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                        v.id === activeVersionId
                          ? "bg-accent/20 text-accent"
                          : "text-text-secondary hover:bg-muted"
                      }`}
                    >
                      {v.version_name} · {formatDate(v.created_at)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleUpdateVersion}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-muted border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-60"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {saving ? "Saving…" : "Update current version"}
          </button>

          <button
            onClick={handleSaveNewVersion}
            disabled={savingNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-60"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {savingNew ? "Saving…" : "Save as new version"}
          </button>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <EditorToolbar editor={editor} />

      {/* ── Content (scrollable) ─────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto tiptap-content"
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-2 border-t border-border text-xs text-text-muted shrink-0 bg-surface">
        <span>
          {editor.isActive("heading")
            ? "Heading " + (editor.getAttributes("heading").level ?? "")
            : "Paragraph"}
        </span>
        <span>{wordCount} word{wordCount !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

// ── Toolbar ────────────────────────────────────────────────────────────────────

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-accent/20 text-accent"
          : "text-text-secondary hover:bg-muted hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );

  const sep = () => <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;

  return (
    <div className="flex items-center flex-wrap gap-0.5 px-3 py-1.5 border-b border-border bg-elevated shrink-0">
      {/* Undo / Redo */}
      {btn(false, () => editor.chain().focus().undo().run(), "Undo",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
      )}
      {btn(false, () => editor.chain().focus().redo().run(), "Redo",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/></svg>
      )}
      {sep()}

      {/* Block type */}
      <select
        value={editor.isActive("heading") ? String(editor.getAttributes("heading").level) : "p"}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(v) as 1|2|3|4|5|6 }).run();
        }}
        className="text-xs bg-muted border border-border rounded px-1.5 py-1 text-text-secondary focus:outline-none focus:border-accent"
      >
        <option value="p">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="4">Heading 4</option>
      </select>
      {sep()}

      {/* Text formatting */}
      {btn(editor.isActive("bold"),        () => editor.chain().focus().toggleBold().run(),        "Bold",        <strong className="font-bold">B</strong>)}
      {btn(editor.isActive("italic"),      () => editor.chain().focus().toggleItalic().run(),      "Italic",      <em>I</em>)}
      {btn(editor.isActive("underline"),   () => editor.chain().focus().toggleUnderline().run(),   "Underline",   <span className="underline">U</span>)}
      {btn(editor.isActive("strike"),      () => editor.chain().focus().toggleStrike().run(),      "Strikethrough", <span className="line-through">S</span>)}
      {btn(editor.isActive("subscript"),   () => editor.chain().focus().toggleSubscript().run(),   "Subscript",   <span>X<sub>2</sub></span>)}
      {btn(editor.isActive("superscript"), () => editor.chain().focus().toggleSuperscript().run(), "Superscript", <span>X<sup>2</sup></span>)}
      {sep()}

      {/* Alignment */}
      {btn(editor.isActive({ textAlign: "left" }),    () => editor.chain().focus().setTextAlign("left").run(),    "Align left",    <AlignLeft />)}
      {btn(editor.isActive({ textAlign: "center" }),  () => editor.chain().focus().setTextAlign("center").run(),  "Align center",  <AlignCenter />)}
      {btn(editor.isActive({ textAlign: "right" }),   () => editor.chain().focus().setTextAlign("right").run(),   "Align right",   <AlignRight />)}
      {btn(editor.isActive({ textAlign: "justify" }), () => editor.chain().focus().setTextAlign("justify").run(), "Justify",       <AlignJustify />)}
      {sep()}

      {/* Lists */}
      {btn(editor.isActive("bulletList"),  () => editor.chain().focus().toggleBulletList().run(),  "Bullet list",  <ListBullet />)}
      {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "Ordered list", <ListOrdered />)}
      {sep()}

      {/* Blocks */}
      {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "Blockquote",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
      )}
      {btn(editor.isActive("code"),      () => editor.chain().focus().toggleCode().run(),      "Inline code",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
      )}
      {btn(editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), "Code block",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      )}
      {sep()}

      {/* Color */}
      <label title="Text color" className="relative p-1.5 rounded cursor-pointer text-text-secondary hover:bg-muted hover:text-text-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <input
          type="color"
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
        />
      </label>

      {/* Highlight */}
      {btn(editor.isActive("highlight"), () => editor.chain().focus().toggleHighlight().run(), "Highlight",
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 2.1L11.37 6.22l-.01.01L6.35 11.25l-.01.01L4 17l3 3 5.74-2.34.01-.01 5.02-5.02.01-.01 4.12-4.12L15.5 2.1zm-3.49 14.05L8 18l-2-2 1.86-4.01L13.28 6.6l3.12 3.12-4.39 6.53z"/></svg>
      )}

      {/* HR */}
      {btn(false, () => editor.chain().focus().setHorizontalRule().run(), "Horizontal rule",
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14"/></svg>
      )}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const AlignLeft    = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h12M3 18h15"/></svg>;
const AlignCenter  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M4 18h16"/></svg>;
const AlignRight   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 12h12M6 18h15"/></svg>;
const AlignJustify = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18"/></svg>;
const ListBullet   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
const ListOrdered  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01"/></svg>;

// ── Date format ────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
}
