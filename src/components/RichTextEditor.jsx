import { useEditor, EditorContent, Extension, InputRule } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useCallback, useState } from 'react'
import IndicatorSelectorModal from './IndicatorSelectorModal'
import BlogIndicatorNode from './tiptap/BlogIndicatorNode'
import indicatorService from '../services/indicatorService'

// Setup lowlight for code highlighting
const lowlight = createLowlight(common)

// Extension to support Markdown-style links: [text](url)
const MarkdownLink = Extension.create({
  name: 'markdownLink',
  addInputRules() {
    return [
      new InputRule({
        find: /\[(?<text>[^\]]+)\]\((?<href>[^)]+)\)$/,
        handler: ({ state, range, match }) => {
          const { tr } = state
          const start = range.from
          const end = range.to
          const { text, href } = match.groups

          tr.replaceWith(start, end, state.schema.text(text))
          tr.addMark(start, start + text.length, state.schema.marks.link.create({ href }))
        },
      }),
    ]
  },
})

export default function RichTextEditor({ value = '', onChange, placeholder = 'Escreva aqui...' }) {
  const [showIndicatorModal, setShowIndicatorModal] = useState(false)
  const [editingIndicatorPos, setEditingIndicatorPos] = useState(null)

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
        codeBlock: false, // Disable default codeBlock to use Lowlight
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
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
      MarkdownLink,
      BlogIndicatorNode,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    onCreate: ({ editor }) => {
      // Add click handler for editing indicators
      const editorElement = editor.view.dom
      const handleIndicatorClick = (e) => {
        const indicatorElement = e.target.closest('.blog-indicator-preview')
        if (indicatorElement && indicatorElement.dataset.editable === 'true') {
          e.preventDefault()
          const pos = editor.view.posAtDOM(indicatorElement, 0)
          setEditingIndicatorPos(pos)
          setShowIndicatorModal(true)
        }
      }
      editorElement.addEventListener('click', handleIndicatorClick)
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

  const handleIndicatorSelected = async (indicator, vizType) => {
    try {
      // Fetch full indicator details to get domain name
      const fullIndicator = await indicatorService.getById(indicator.id)

      const domainName = typeof fullIndicator.domain === 'object' ? fullIndicator.domain.name : fullIndicator.domain

      const indicatorAttrs = {
        id: fullIndicator.id,
        type: vizType,
        name: fullIndicator.name,
        domain: domainName,
        subdomain: fullIndicator.subdomain
      }

      if (editingIndicatorPos !== null) {
        // Update existing indicator
        editor.chain().focus().setNodeSelection(editingIndicatorPos).updateAttributes('blogIndicator', indicatorAttrs).run()
        setEditingIndicatorPos(null)
      } else {
        // Insert new indicator
        editor.chain().focus().insertContent({
          type: 'blogIndicator',
          attrs: indicatorAttrs
        }).run()
      }
    } catch (error) {
      console.error('Error fetching indicator details:', error)
      // Fallback to using the indicator data as-is
      const indicatorAttrs = {
        id: indicator.id,
        type: vizType,
        name: indicator.name,
        domain: typeof indicator.domain === 'object' ? indicator.domain.name : indicator.domain,
        subdomain: indicator.subdomain
      }

      if (editingIndicatorPos !== null) {
        editor.chain().focus().setNodeSelection(editingIndicatorPos).updateAttributes('blogIndicator', indicatorAttrs).run()
        setEditingIndicatorPos(null)
      } else {
        editor.chain().focus().insertContent({
          type: 'blogIndicator',
          attrs: indicatorAttrs
        }).run()
      }
    }
  }

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

          {/* Quote, Code Block, Link and Indicator */}
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
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-2 rounded text-sm hover:bg-gray-200 ${
                editor.isActive('codeBlock') ? 'bg-gray-300' : ''
              }`}
              type="button"
              title="Code Block"
            >
              <i className="fas fa-code"></i>
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
            <button
              onClick={() => setShowIndicatorModal(true)}
              className="p-2 rounded text-sm hover:bg-gray-200 text-gray-600"
              type="button"
              title="Inserir Indicador"
            >
              <i className="fas fa-chart-bar"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        className="min-h-[300px] focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50 rounded-b-md rich-text-editor"
      >
        <EditorContent
          editor={editor}
          className="h-full"
        />
      </div>

      {/* Modal */}
      <IndicatorSelectorModal
        isOpen={showIndicatorModal}
        onClose={() => {
          setShowIndicatorModal(false)
          setEditingIndicatorPos(null)
        }}
        onSelect={handleIndicatorSelected}
      />

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
            color: var(--color-base-content);
            line-height: 1.2;
          }

          .rich-text-editor .ProseMirror h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 1.25rem 0 0.75rem 0;
            color: var(--color-base-content);
            line-height: 1.3;
          }

          .rich-text-editor .ProseMirror h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 1rem 0 0.5rem 0;
            color: var(--color-base-content);
            line-height: 1.4;
          }

          .rich-text-editor .ProseMirror p {
            margin: 0.75rem 0;
            color: var(--color-base-content);
          }

          .rich-text-editor .ProseMirror strong {
            font-weight: 700;
            color: var(--color-base-content);
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
            border-left: 4px solid var(--color-primary);
            padding-left: 1rem;
            margin: 1.5rem 0;
            font-style: italic;
            color: var(--color-base-content);
            opacity: 0.7;
          }

          .rich-text-editor .ProseMirror pre {
            background: #0d0d0d;
            color: #fff;
            font-family: 'JetBrainsMono', monospace;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            margin: 1.5rem 0;
          }
          
          .rich-text-editor .ProseMirror pre code {
            color: inherit;
            padding: 0;
            background: none;
            font-size: 0.8rem;
          }
          
          /* Highlight.js styles (Atom One Dark) */
          .hljs-comment, .hljs-quote { color: #5c6370; font-style: italic; }
          .hljs-doctag, .hljs-keyword, .hljs-formula { color: #c678dd; }
          .hljs-section, .hljs-name, .hljs-selector-tag, .hljs-deletion, .hljs-subst { color: #e06c75; }
          .hljs-literal { color: #56b6c2; }
          .hljs-string, .hljs-regexp, .hljs-addition, .hljs-attribute, .hljs-meta-string { color: #98c379; }
          .hljs-built_in, .hljs-class .hljs-title { color: #e6c07b; }
          .hljs-attr, .hljs-variable, .hljs-template-variable, .hljs-type, .hljs-selector-class, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-number { color: #d19a66; }
          .hljs-symbol, .hljs-bullet, .hljs-link, .hljs-meta, .hljs-selector-id, .hljs-title { color: #61aeee; }
          .hljs-emphasis { font-style: italic; }
          .hljs-strong { font-weight: bold; }
          .hljs-link { text-decoration: underline; }

          .rich-text-editor .ProseMirror a {
            color: var(--color-primary);
            text-decoration: underline;
          }

          .rich-text-editor .ProseMirror a:hover {
            color: var(--color-primary);
            opacity: 0.8;
          }

          .rich-text-editor .ProseMirror.ProseMirror-focused {
            outline: none;
          }

          .rich-text-editor .ProseMirror:empty:before {
            content: attr(data-placeholder);
            color: var(--color-base-content);
            opacity: 0.4;
            pointer-events: none;
            position: absolute;
          }

          .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            color: var(--color-base-content);
            opacity: 0.4;
            pointer-events: none;
            height: 0;
            float: left;
          }
        `
      }} />
    </div>
  )
}