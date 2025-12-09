import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'

export default Node.create({
  name: 'blogIndicator',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      type: {
        default: 'line',
      },
      name: {
        default: 'Indicador',
      },
      domain: {
        default: null,
      },
      subdomain: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[class="blog-indicator-preview"]',
        getAttrs: element => {
          return {
            id: element.getAttribute('data-indicator-id') || element.getAttribute('id'),
            type: element.getAttribute('type') || 'line',
            name: element.getAttribute('name') || 'Indicador',
            domain: element.getAttribute('domain') || null,
            subdomain: element.getAttribute('subdomain') || null,
          }
        },
      },
      {
        tag: 'blog-indicator',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { id, type, name, domain, subdomain } = HTMLAttributes


    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'blog-indicator-preview',
        style: 'display: block !important; margin: 16px 0 !important; padding: 16px !important; max-width: 400px !important; background: linear-gradient(135deg, #f8fffe 0%, #f0fdf9 100%) !important; border: 2px dashed #009367 !important; border-radius: 8px !important; text-align: center !important; color: #009367 !important; font-family: inherit !important; cursor: pointer !important; box-sizing: border-box !important;',
        'data-indicator-id': id,
        'data-editable': 'true',
        'id': id,
        'type': type,
        'name': name,
        'domain': domain,
        'subdomain': subdomain
      }),
      [
        'div',
        { style: 'font-size: 24px; margin-bottom: 8px;' },
        '📊'
      ],
      [
        'div',
        { style: 'font-weight: 600; font-size: 16px; margin-bottom: 8px;' },
        name || 'Indicador'
      ],
      [
        'div',
        { style: 'font-size: 12px; margin-bottom: 4px; opacity: 0.8;' },
        domain && subdomain ? `${domain} > ${subdomain}` : (domain || 'Domínio não definido')
      ],
      [
        'div',
        { style: 'font-size: 11px; opacity: 0.6; display: flex; justify-content: center; gap: 8px;' },
        [
          'span',
          {},
          `Tipo: ${type || 'line'}`
        ],
        [
          'span',
          {},
          '•'
        ],
        [
          'span',
          {},
          id ? `ID: ${id.slice(0, 8)}...` : 'Sem ID'
        ]
      ]
    ]
  },
})
