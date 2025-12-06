import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageTemplate from './PageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import RichTextEditor from '../components/RichTextEditor'
import blogService from '../services/blogService'

export default function BlogPostForm() {
    const { postId } = useParams()
    const navigate = useNavigate()
    const isEditing = Boolean(postId)

    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(isEditing)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        author: '',
        status: 'draft',
        tags: []
    })
    const [tagInput, setTagInput] = useState('')
    const [thumbnailFile, setThumbnailFile] = useState(null)
    const [thumbnailPreview, setThumbnailPreview] = useState(null)
    const [attachmentFiles, setAttachmentFiles] = useState([])
    const [existingAttachments, setExistingAttachments] = useState([])
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [initialFormData, setInitialFormData] = useState(null)

    useEffect(() => {
        if (isEditing) {
            loadPost()
        } else {
            setLoading(false)
            // Set initial empty form data for new posts
            setInitialFormData({
                title: '',
                content: '',
                excerpt: '',
                author: '',
                status: 'draft',
                tags: []
            })
        }
    }, [postId])

    // Track form changes to detect unsaved changes
    useEffect(() => {
        if (initialFormData) {
            const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData) ||
                              thumbnailFile !== null ||
                              attachmentFiles.length > 0
            setHasUnsavedChanges(hasChanges)
        }
    }, [formData, thumbnailFile, attachmentFiles, initialFormData])

    // Add beforeunload warning for unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                const message = 'Você tem alterações não salvas. Tem certeza que deseja sair?'
                e.preventDefault()
                e.returnValue = message
                return message
            }
        }

        const handlePopState = (e) => {
            if (hasUnsavedChanges) {
                const confirmLeave = window.confirm('Você tem alterações não salvas. Tem certeza que deseja sair?')
                if (!confirmLeave) {
                    e.preventDefault()
                    window.history.pushState(null, '', window.location.href)
                }
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        window.addEventListener('popstate', handlePopState)

        // Push a state to handle back button
        window.history.pushState(null, '', window.location.href)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            window.removeEventListener('popstate', handlePopState)
        }
    }, [hasUnsavedChanges])

    const loadPost = async () => {
        try {
            setLoading(true)
            setError(null)

            const postData = await blogService.getPost(postId)
            setPost(postData)
            const loadedFormData = {
                title: postData.title,
                content: postData.content,
                excerpt: postData.excerpt || '',
                author: postData.author,
                status: postData.status,
                tags: postData.tags || []
            }
            setFormData(loadedFormData)
            setInitialFormData(loadedFormData) // Set initial data for change tracking
            setThumbnailPreview(postData.thumbnail_url ? blogService.getFileUrl(postData.thumbnail_url) : null)
            setExistingAttachments(postData.attachments || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleContentChange = (content) => {
        setFormData(prev => ({
            ...prev,
            content: content
        }))
    }

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            if (!formData.tags.includes(tagInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, tagInput.trim()]
                }))
            }
            setTagInput('')
        }
    }

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setThumbnailFile(file)
            const reader = new FileReader()
            reader.onload = (e) => setThumbnailPreview(e.target.result)
            reader.readAsDataURL(file)
        }
    }

    const handleAttachmentChange = (e) => {
        const files = Array.from(e.target.files)
        setAttachmentFiles(prev => [...prev, ...files])
    }

    const removeAttachment = (index) => {
        setAttachmentFiles(prev => prev.filter((_, i) => i !== index))
    }

    const removeExistingAttachment = async (filename) => {
        if (isEditing && window.confirm('Tem certeza que deseja remover este anexo?')) {
            try {
                await blogService.removeAttachment(postId, filename)
                setExistingAttachments(prev => prev.filter(att => att.filename !== filename))
            } catch (err) {
                alert('Erro ao remover anexo: ' + err.message)
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Confirmation dialog for publishing
        if (formData.status === 'published') {
            const confirmPublish = window.confirm(
                'Tem certeza que deseja publicar este post? Uma vez publicado, ele estará visível publicamente.'
            )
            if (!confirmPublish) {
                return // Prevent form submission
            }
        }

        try {
            setSaving(true)
            setError(null)

            // Validate required fields
            if (!formData.title.trim() || !formData.content.trim() || !formData.author.trim()) {
                throw new Error('Título, conteúdo e autor são obrigatórios')
            }

            let savedPost

            if (isEditing) {
                // Update existing post
                savedPost = await blogService.updatePost(postId, formData)
            } else {
                // Create new post
                savedPost = await blogService.createPost(formData)
            }

            // Upload thumbnail if provided
            if (thumbnailFile) {
                await blogService.uploadThumbnail(savedPost.id, thumbnailFile)
            }

            // Upload attachments
            for (const file of attachmentFiles) {
                await blogService.uploadAttachment(savedPost.id, file)
            }

            // Clear unsaved changes warning since the post was saved successfully
            setHasUnsavedChanges(false)
            setInitialFormData(formData)
            setAttachmentFiles([])
            setThumbnailFile(null)

            // Redirect to blog management
            navigate('/admin/blog')
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <PageTemplate>
                <div className="py-8">
                    <LoadingSkeleton />
                </div>
            </PageTemplate>
        )
    }

    if (error && !formData.title) {
        return (
            <PageTemplate>
                <div className="py-8">
                    <ErrorDisplay error={error} />
                </div>
            </PageTemplate>
        )
    }

    return (
        <PageTemplate>
            <div className="min-h-screen py-8 px-4 bg-base-100">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isEditing ? 'Editar Post' : 'Criar Novo Post'}
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {isEditing ? 'Faça as alterações necessárias no post' : 'Preencha as informações do novo post do blog'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Título *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary"
                                placeholder="Digite o título do post"
                            />
                        </div>

                        {/* Author and Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Autor *
                                </label>
                                <input
                                    type="text"
                                    name="author"
                                    value={formData.author}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                                    placeholder="Nome do autor"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                                >
                                    <option value="draft">Rascunho</option>
                                    <option value="published">Publicado</option>
                                </select>
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Resumo
                            </label>
                            <textarea
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                                placeholder="Breve descrição do post (opcional)"
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Conteúdo *
                            </label>
                            <RichTextEditor
                                value={formData.content}
                                onChange={handleContentChange}
                                placeholder="Escreva o conteúdo do post aqui... (suporta Markdown: **negrito**, *itálico*, ## títulos, - listas, > citações, [texto](url))"
                            />
                            <div className="text-sm text-gray-500 mt-2">
                                <p className="mb-1">Use a barra de ferramentas acima ou digite comandos Markdown:</p>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <strong>Formatação:</strong> **negrito**, *itálico*, ~~riscado~~
                                    </div>
                                    <div>
                                        <strong>Títulos:</strong> # H1, ## H2, ### H3
                                    </div>
                                    <div>
                                        <strong>Listas:</strong> - item, 1. numerada
                                    </div>
                                    <div>
                                        <strong>Citação:</strong> &gt; texto da citação
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tags
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-base-200 text-primary"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="ml-2 text-xs"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                                placeholder="Digite uma tag e pressione Enter"
                            />
                        </div>

                        {/* Thumbnail */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Imagem de Capa
                            </label>
                            {thumbnailPreview && (
                                <div className="mb-4">
                                    <img
                                        src={thumbnailPreview}
                                        alt="Preview"
                                        className="w-32 h-24 object-cover rounded-md"
                                    />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>

                        {/* Attachments */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Anexos
                            </label>

                            {/* Existing attachments */}
                            {existingAttachments.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">Anexos existentes:</p>
                                    <div className="space-y-2">
                                        {existingAttachments.map((attachment, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm">{attachment.original_filename || attachment.filename}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingAttachment(attachment.filename)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New attachments */}
                            {attachmentFiles.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">Novos anexos:</p>
                                    <div className="space-y-2">
                                        {attachmentFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                                <span className="text-sm">{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                onChange={handleAttachmentChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Formatos aceitos: PDF, Word, Excel, TXT, CSV
                            </p>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <div className="text-sm text-red-600">{error}</div>
                            </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => {
                                    if (hasUnsavedChanges) {
                                        const confirmLeave = window.confirm('Você tem alterações não salvas. Tem certeza que deseja cancelar?')
                                        if (!confirmLeave) return
                                    }
                                    navigate('/admin/blog')
                                }}
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-primary text-primary-content font-medium rounded-md transition-colors disabled:opacity-50 hover:bg-primary/90"
                            >
                                {saving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Post')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PageTemplate>
    )
}