import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import { useCallback } from 'react'

export default function RichTextEditor({ value = '', onChange, placeholder = 'Escreva aqui...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Enable markdown shortcuts for headings, lists, blockquotes
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Typography.configure({
        // Smart quotes, ellipsis, etc.
        openDoubleQuote: '"',
        closeDoubleQuote: '"',
        openSingleQuote: "'",
        closeSingleQuote: "'",
        ellipsis: '…',
        emDash: '—',
        enDash: '–',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'ProseMirror focus:outline-none',
        'data-placeholder': placeholder,
        spellcheck: 'true',
      },
      handleDOMEvents: {
        // Allow composition events for special characters
        compositionstart: () => false,
        compositionupdate: () => false,
        compositionend: () => false,
        // Allow input events for better character support
        input: () => false,
        // Prevent interference with special character input
        keydown: (view, event) => {
          // Allow all printable characters and common special keys
          if (event.key.length === 1 ||
              event.key === 'Backspace' ||
              event.key === 'Delete' ||
              event.key === 'Enter' ||
              event.key === 'Tab' ||
              event.key === 'ArrowLeft' ||
              event.key === 'ArrowRight' ||
              event.key === 'ArrowUp' ||
              event.key === 'ArrowDown' ||
              event.key === 'Home' ||
              event.key === 'End') {
            return false // Let the browser handle it
          }
          // For other keys, let Tiptap handle shortcuts
          return false
        },
      },
    },
  })

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-300 rounded-md">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-3 bg-gray-50 rounded-t-md">
        <div className="flex flex-wrap gap-2">
          {/* Formatting buttons */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded text-sm hover:bg-gray-200 ${
                editor.isActive('bold') ? 'bg-gray-300 font-bold' : ''
              }`}
              type="button"
            >
              <i className="fas fa-bold"></i>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded text-sm hover:bg-gray-200 ${
                editor.isActive('italic') ? 'bg-gray-300 italic' : ''
              }`}
              type="button"
            >
              <i className="fas fa-italic"></i>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 rounded text-sm hover:bg-gray-200 ${
                editor.isActive('strike') ? 'bg-gray-300 line-through' : ''
              }`}
              type="button"
            >
              <i className="fas fa-strikethrough"></i>
            </button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded text-sm hover:bg-gray-200 ${
                editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
              }`}
              type="button"
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded text-sm hover:bg-gray-200 ${
                editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
              }`}
              type="button"
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded text-sm hover:bg-gray-200 ${
                editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
              }`}
              type="button"
            >
              H3
            </button>
            <button
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={`p-2 rounded text-sm hover:bg-gray-200 ${
                editor.isActive('paragraph') ? 'bg-gray-300' : ''
              }`}
              type="button"
            >
              P
            </button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded text-sm hover:bg-gray-200 ${
                editor.isActive('bulletList') ? 'bg-gray-300' : ''
              }`}
              type="button"
            >
              <i className="fas fa-list-ul"></i>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded text-sm hover:bg-gray-200 ${
                editor.isActive('orderedList') ? 'bg-gray-300' : ''
              }`}
              type="button"
            >
              <i className="fas fa-list-ol"></i>
            </button>
          </div>

          {/* Quote and Link */}
          <div className="flex gap-1">
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded text-sm hover:bg-gray-200 ${
                editor.isActive('blockquote') ? 'bg-gray-300' : ''
              }`}
              type="button"
            >
              <i className="fas fa-quote-right"></i>
            </button>
            <button
              onClick={setLink}
              className={`p-2 rounded text-sm hover:bg-gray-200 ${
                editor.isActive('link') ? 'bg-gray-300' : ''
              }`}
              type="button"
            >
              <i className="fas fa-link"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        className="min-h-[300px] focus-within:ring-2 focus-within:ring-opacity-50 rounded-b-md rich-text-editor"
        style={{'--tw-ring-color': '#009367'}}
      >
        <EditorContent
          editor={editor}
          className="h-full"
        />
      </div>

      {/* Global Styles for the Editor */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor .ProseMirror {
            padding: 1rem;
            min-height: 300px;
            outline: none;
            border: none;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
            line-height: 1.6;
          }

          .rich-text-editor .ProseMirror h1 {
            font-size: 2rem;
            font-weight: 700;
            margin: 1.5rem 0 1rem 0;
            color: #1f2937;
            line-height: 1.2;
          }

          .rich-text-editor .ProseMirror h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 1.25rem 0 0.75rem 0;
            color: #374151;
            line-height: 1.3;
          }

          .rich-text-editor .ProseMirror h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 1rem 0 0.5rem 0;
            color: #4b5563;
            line-height: 1.4;
          }

          .rich-text-editor .ProseMirror p {
            margin: 0.75rem 0;
            color: #374151;
          }

          .rich-text-editor .ProseMirror strong {
            font-weight: 700;
            color: #1f2937;
          }

          .rich-text-editor .ProseMirror em {
            font-style: italic;
          }

          .rich-text-editor .ProseMirror s {
            text-decoration: line-through;
            opacity: 0.7;
          }

          .rich-text-editor .ProseMirror ul {
            list-style: disc;
            padding-left: 1.5rem;
            margin: 1rem 0;
          }

          .rich-text-editor .ProseMirror ol {
            list-style: decimal;
            padding-left: 1.5rem;
            margin: 1rem 0;
          }

          .rich-text-editor .ProseMirror li {
            margin: 0.25rem 0;
          }

          .rich-text-editor .ProseMirror blockquote {
            border-left: 4px solid #009367;
            padding-left: 1rem;
            margin: 1.5rem 0;
            font-style: italic;
            color: #6b7280;
          }

          .rich-text-editor .ProseMirror a {
            color: #009367;
            text-decoration: underline;
          }

          .rich-text-editor .ProseMirror a:hover {
            color: #007a5a;
          }

          .rich-text-editor .ProseMirror.ProseMirror-focused {
            outline: none;
          }

          .rich-text-editor .ProseMirror:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            position: absolute;
          }

          .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            height: 0;
            float: left;
          }
        `
      }} />
    </div>
  )
}