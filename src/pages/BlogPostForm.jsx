import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import AdminPageTemplate from './AdminPageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import RichTextEditor from '../components/RichTextEditor'
import ConfirmModal from '../components/ConfirmModal'
import blogService from '../services/blogService'
import authorService from '../services/authorService'
import { useTranslation } from 'react-i18next'

function AuthorPhotoDropzone({ photoPreview, onDrop }) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
    })

    return (
        <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-[#d4d4d4] hover:border-primary/50'
            }`}
        >
            <input {...getInputProps()} />
            {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover mb-3" />
            ) : (
                <div className="w-24 h-24 rounded-full bg-[#f3f4f6] flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
            )}
            <p className="font-['Onest'] text-sm text-[#737373] text-center">
                {isDragActive ? 'Largar aqui...' : 'Arrastar foto ou clicar para escolher'}
            </p>
        </div>
    )
}

function ThumbnailDropzone({ preview, onDrop, onRemove }) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
    })

    return (
        <div className="flex flex-col gap-3">
            <div
                {...getRootProps()}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-[#d4d4d4] hover:border-primary/50'
                } ${preview ? 'h-48' : 'h-40'}`}
            >
                <input {...getInputProps()} />
                {preview ? (
                    <img src={preview} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <>
                        <svg className="w-10 h-10 text-[#737373] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="font-['Onest'] text-sm text-[#737373] text-center">
                            {isDragActive ? 'Largar aqui...' : 'Arrastar imagem de capa ou clicar para escolher'}
                        </p>
                    </>
                )}
            </div>
            {preview && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="font-['Onest'] text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer self-start"
                >
                    Remover imagem
                </button>
            )}
        </div>
    )
}

function AuthorForm({ mode, data, setData, photoPreview, onPhotoDrop, onSave, onCancel, t }) {
    return (
        <div className="bg-[#f3f4f6] border border-[#e5e5e5] rounded-2xl p-6 space-y-5">
            <h3 className="font-['Onest'] font-semibold text-lg text-[#0a0a0a]">
                {mode === 'edit' ? t('admin.blog.edit_author', 'Editar autor') : t('admin.blog.create_author', 'Criar novo autor')}
            </h3>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Photo dropzone */}
                <div className="w-full md:w-48 shrink-0">
                    <AuthorPhotoDropzone photoPreview={photoPreview} onDrop={onPhotoDrop} />
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-4">
                    <div>
                        <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-1">{t('admin.blog.author_name', 'Nome')}</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Nome completo"
                        />
                    </div>
                    <div>
                        <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-1">{t('admin.blog.author_email', 'Email')}</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="email@exemplo.pt"
                        />
                    </div>
                    <div>
                        <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-1">{t('admin.blog.author_role', 'Cargo')}</label>
                        <input
                            type="text"
                            value={data.role}
                            onChange={(e) => setData(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Ex: Doutoramento em Turismo"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onSave}
                    className="font-['Onest'] font-medium text-sm text-white bg-primary px-5 py-2 rounded-full hover:opacity-90 transition-opacity cursor-pointer"
                >
                    {t('admin.blog.save_author', 'Guardar autor')}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="font-['Onest'] font-medium text-sm text-[#0a0a0a] border border-[#d4d4d4] px-5 py-2 rounded-full hover:bg-black/[0.02] transition-colors cursor-pointer"
                >
                    {t('common.cancel', 'Cancelar')}
                </button>
            </div>
        </div>
    )
}

export default function BlogPostForm() {
    const { postId } = useParams()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const isEditing = Boolean(postId)

    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(isEditing)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [showPublishConfirm, setShowPublishConfirm] = useState(false)

    // Author profiles
    const [authors, setAuthors] = useState([])
    const [selectedAuthorId, setSelectedAuthorId] = useState(null)
    const [authorDropdownOpen, setAuthorDropdownOpen] = useState(false)
    const authorDropdownRef = useRef(null)
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
    const statusDropdownRef = useRef(null)
    // Author form (create or edit)
    const [authorFormMode, setAuthorFormMode] = useState(null) // null | 'create' | 'edit'
    const [authorFormData, setAuthorFormData] = useState({ name: '', email: '', role: '' })
    const [authorFormPhoto, setAuthorFormPhoto] = useState(null)
    const [authorFormPhotoPreview, setAuthorFormPhotoPreview] = useState(null)
    const [editingAuthorId, setEditingAuthorId] = useState(null)
    // Author delete confirmation
    const [deleteAuthorConfirm, setDeleteAuthorConfirm] = useState(null) // author object or null
    const [deleteAuthorPosts, setDeleteAuthorPosts] = useState([])
    const [deleteAuthorLoading, setDeleteAuthorLoading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        author: '',
        author_photo: '',
        author_role: '',
        publication_link: '',
        publication_link_label: '',
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
        authorService.getAll().then(setAuthors).catch(() => {})
        if (isEditing) {
            loadPost()
        } else {
            setLoading(false)
            setInitialFormData({
                title: '',
                content: '',
                excerpt: '',
                author: '',
                author_photo: '',
                author_role: '',
                publication_link: '',
                publication_link_label: '',
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
                const message = t('admin.blog.unsaved_changes_warning')
                e.preventDefault()
                e.returnValue = message
                return message
            }
        }

        const handlePopState = (e) => {
            if (hasUnsavedChanges) {
                const confirmLeave = window.confirm(t('admin.blog.unsaved_changes_warning'))
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
                author_photo: postData.author_photo || '',
                author_role: postData.author_role || '',
                publication_link: postData.publication_link || '',
                publication_link_label: postData.publication_link_label || '',
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

    // Close author dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (authorDropdownRef.current && !authorDropdownRef.current.contains(e.target)) setAuthorDropdownOpen(false)
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) setStatusDropdownOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSelectAuthor = (author) => {
        setSelectedAuthorId(author.id)
        setFormData(prev => ({
            ...prev,
            author: author.name,
            author_photo: author.photo_url || '',
            author_role: author.role || '',
        }))
        setAuthorDropdownOpen(false)
    }

    const openAuthorForm = (mode, author = null) => {
        setAuthorFormMode(mode)
        if (mode === 'edit' && author) {
            setEditingAuthorId(author.id)
            setAuthorFormData({ name: author.name || '', email: author.email || '', role: author.role || '' })
            setAuthorFormPhotoPreview(author.photo_url ? blogService.getFileUrl(author.photo_url) : null)
        } else {
            setEditingAuthorId(null)
            setAuthorFormData({ name: '', email: '', role: '' })
            setAuthorFormPhotoPreview(null)
        }
        setAuthorFormPhoto(null)
        setAuthorDropdownOpen(false)
    }

    const closeAuthorForm = () => {
        setAuthorFormMode(null)
        setEditingAuthorId(null)
        setAuthorFormData({ name: '', email: '', role: '' })
        setAuthorFormPhoto(null)
        setAuthorFormPhotoPreview(null)
    }

    const onAuthorPhotoDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0]
        if (file) {
            setAuthorFormPhoto(file)
            setAuthorFormPhotoPreview(URL.createObjectURL(file))
        }
    }, [])

    const handleSaveAuthor = async () => {
        if (!authorFormData.name.trim()) return
        try {
            let author
            if (authorFormMode === 'edit' && editingAuthorId) {
                author = await authorService.update(editingAuthorId, {
                    name: authorFormData.name.trim(),
                    email: authorFormData.email.trim() || undefined,
                    role: authorFormData.role.trim() || undefined,
                })
                if (authorFormPhoto) {
                    const photoResult = await authorService.uploadPhoto(editingAuthorId, authorFormPhoto)
                    author.photo_url = photoResult.photo_url
                }
                setAuthors(prev => prev.map(a => a.id === author.id ? author : a))
            } else {
                author = await authorService.create({
                    name: authorFormData.name.trim(),
                    email: authorFormData.email.trim() || undefined,
                    role: authorFormData.role.trim() || undefined,
                })
                if (authorFormPhoto) {
                    const photoResult = await authorService.uploadPhoto(author.id, authorFormPhoto)
                    author.photo_url = photoResult.photo_url
                }
                setAuthors(prev => [...prev, author])
            }
            handleSelectAuthor(author)
            closeAuthorForm()
        } catch (err) {
            setError(err.message)
        }
    }

    const handleRequestDeleteAuthor = async (author) => {
        setDeleteAuthorLoading(true)
        setDeleteAuthorConfirm(author)
        try {
            const allPosts = await blogService.getPublishedPosts(0, 200)
            const posts = (Array.isArray(allPosts) ? allPosts : allPosts?.posts || [])
                .filter(p => p.author === author.name)
            setDeleteAuthorPosts(posts)
        } catch {
            setDeleteAuthorPosts([])
        } finally {
            setDeleteAuthorLoading(false)
        }
    }

    const handleConfirmDeleteAuthor = async () => {
        if (!deleteAuthorConfirm) return
        try {
            await authorService.delete(deleteAuthorConfirm.id)
            setAuthors(prev => prev.filter(a => a.id !== deleteAuthorConfirm.id))
            if (selectedAuthorId === deleteAuthorConfirm.id) {
                setSelectedAuthorId(null)
                setFormData(prev => ({ ...prev, author: '', author_photo: '', author_role: '' }))
            }
            setDeleteAuthorConfirm(null)
            setDeleteAuthorPosts([])
        } catch (err) {
            setError(err.message)
        }
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
        if (isEditing && window.confirm(t('admin.blog.confirm_remove_attachment'))) {
            try {
                await blogService.removeAttachment(postId, filename)
                setExistingAttachments(prev => prev.filter(att => att.filename !== filename))
            } catch (err) {
                setError(t('admin.blog.error_remove_attachment') + err.message)
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.status === 'published') {
            setShowPublishConfirm(true)
            return
        }

        await executeSubmit()
    }

    const executeSubmit = async () => {
        try {
            setSaving(true)
            setError(null)

            // Validate required fields
            if (!formData.title.trim() || !formData.content.trim() || !formData.author.trim()) {
                throw new Error(t('admin.blog.validation_required_fields'))
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
            navigate('/admin/news-events')
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <AdminPageTemplate>
                <div className="py-8">
                    <LoadingSkeleton />
                </div>
            </AdminPageTemplate>
        )
    }

    if (error && !formData.title) {
        return (
            <AdminPageTemplate>
                <div className="py-8">
                    <ErrorDisplay error={error} />
                </div>
            </AdminPageTemplate>
        )
    }

    return (
        <AdminPageTemplate>
            <div className="min-h-screen pb-8 px-4 bg-base-100">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isEditing ? t('admin.blog.title_edit') : t('admin.blog.title_create')}
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {isEditing ? t('admin.blog.subtitle_edit') : t('admin.blog.subtitle_create')}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Title */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {t('admin.blog.field_title')}
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                placeholder={t('admin.blog.placeholder_title')}
                            />
                        </div>

                        {/* Author and Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                    {t('admin.blog.field_author')}
                                </label>
                                <div ref={authorDropdownRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setAuthorDropdownOpen(!authorDropdownOpen)}
                                        className="w-full font-['Onest'] text-sm text-[#0a0a0a] bg-[#fffefc] border border-[#d4d4d4] rounded-full h-10 px-4 shadow-sm hover:bg-black/[0.02] transition-colors flex items-center justify-between gap-2 cursor-pointer"
                                    >
                                        <span className="truncate">
                                            {formData.author || t('admin.blog.placeholder_author')}
                                        </span>
                                        <svg className={`w-4 h-4 text-[#0a0a0a] shrink-0 transition-transform ${authorDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {authorDropdownOpen && (
                                        <div className="absolute z-50 mt-2 w-full bg-[#fffefc] rounded-2xl shadow-lg border border-[#e5e5e5] max-h-60 overflow-y-auto">
                                            {authors.map(a => (
                                                <div key={a.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-black/[0.03] transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectAuthor(a)}
                                                        className={`flex items-center gap-3 flex-1 min-w-0 cursor-pointer ${selectedAuthorId === a.id ? 'text-primary font-medium' : 'text-[#0a0a0a]'}`}
                                                    >
                                                        {a.photo_url ? (
                                                            <img src={blogService.getFileUrl(a.photo_url)} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[color:var(--color-primary-hover)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                                {(a.name || 'A')[0].toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className="font-['Onest'] text-sm truncate">{a.name}{a.role ? ` — ${a.role}` : ''}</span>
                                                    </button>
                                                    <div className="flex items-center shrink-0 ml-2 gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openAuthorForm('edit', a)}
                                                            className="p-1 hover:bg-black/[0.06] rounded transition-colors cursor-pointer"
                                                            title={t('common.edit', 'Editar')}
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setAuthorDropdownOpen(false); handleRequestDeleteAuthor(a) }}
                                                            className="p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                            title={t('common.delete', 'Eliminar')}
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => openAuthorForm('create')}
                                                className="w-full font-['Onest'] text-sm text-primary font-medium text-left px-4 py-2.5 hover:bg-black/[0.03] transition-colors rounded-b-2xl cursor-pointer"
                                            >
                                                + {t('admin.blog.create_author', 'Criar novo autor')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                    {t('admin.blog.col_status')}
                                </label>
                                <div ref={statusDropdownRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                        className="w-full font-['Onest'] text-sm text-[#0a0a0a] bg-[#fffefc] border border-[#d4d4d4] rounded-full h-10 px-4 shadow-sm hover:bg-black/[0.02] transition-colors flex items-center justify-between gap-2 cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${formData.status === 'published' ? 'bg-green-500' : 'bg-amber-400'}`} />
                                            {formData.status === 'published' ? t('admin.blog.status_published') : t('admin.blog.status_draft')}
                                        </span>
                                        <svg className={`w-4 h-4 text-[#0a0a0a] shrink-0 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {statusDropdownOpen && (
                                        <div className="absolute z-50 mt-2 w-full bg-[#fffefc] rounded-2xl shadow-lg border border-[#e5e5e5] overflow-hidden">
                                            {[
                                                { value: 'draft', label: t('admin.blog.status_draft'), color: 'bg-amber-400' },
                                                { value: 'published', label: t('admin.blog.status_published'), color: 'bg-green-500' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => { setFormData(prev => ({ ...prev, status: opt.value })); setStatusDropdownOpen(false) }}
                                                    className={`w-full font-['Onest'] text-sm text-left px-4 py-2.5 flex items-center gap-2 hover:bg-black/[0.03] transition-colors first:rounded-t-2xl last:rounded-b-2xl cursor-pointer ${formData.status === opt.value ? 'text-primary font-medium' : 'text-[#0a0a0a]'}`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Author create/edit form */}
                        {authorFormMode && <AuthorForm
                            mode={authorFormMode}
                            data={authorFormData}
                            setData={setAuthorFormData}
                            photo={authorFormPhoto}
                            photoPreview={authorFormPhotoPreview}
                            onPhotoDrop={onAuthorPhotoDrop}
                            onSave={handleSaveAuthor}
                            onCancel={closeAuthorForm}
                            t={t}
                        />}

                        {/* Publication Link */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                    {t('admin.blog.field_publication_link', 'Link da publicação (URL)')}
                                </label>
                                <input
                                    type="url"
                                    name="publication_link"
                                    value={formData.publication_link}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                    {t('admin.blog.field_publication_link_label', 'Nome do link (ex: Livro Best Practices)')}
                                </label>
                                <input
                                    type="text"
                                    name="publication_link_label"
                                    value={formData.publication_link_label}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder={t('admin.blog.placeholder_link_label', 'Nome do documento')}
                                />
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {t('admin.blog.field_excerpt')}
                            </label>
                            <textarea
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                placeholder={t('admin.blog.placeholder_excerpt')}
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {t('admin.blog.field_content')}
                            </label>
                            <RichTextEditor
                                value={formData.content}
                                onChange={handleContentChange}
                                placeholder={t('admin.blog.placeholder_content')}
                            />
                            <div className="text-sm text-gray-500 mt-2">
                                <p className="mb-1">{t('admin.blog.markdown_help_intro')}</p>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <strong>{t('admin.blog.markdown_formatting')}:</strong> **negrito**, *itálico*, ~~riscado~~
                                    </div>
                                    <div>
                                        <strong>{t('admin.blog.markdown_headings')}:</strong> # H1, ## H2, ### H3
                                    </div>
                                    <div>
                                        <strong>{t('admin.blog.markdown_lists')}:</strong> - item, 1. numerada
                                    </div>
                                    <div>
                                        <strong>{t('admin.blog.markdown_quote')}:</strong> &gt; texto da citação
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {t('admin.blog.field_tags')}
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
                                className="w-full px-3 py-2 font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                placeholder={t('admin.blog.placeholder_tags')}
                            />
                        </div>

                        {/* Thumbnail */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {t('admin.blog.field_thumbnail')}
                            </label>
                            <ThumbnailDropzone
                                preview={thumbnailPreview}
                                onDrop={(files) => {
                                    const file = files[0]
                                    if (file) {
                                        setThumbnailFile(file)
                                        setThumbnailPreview(URL.createObjectURL(file))
                                    }
                                }}
                                onRemove={() => { setThumbnailFile(null); setThumbnailPreview(null) }}
                            />
                        </div>

                        {/* Attachments */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {t('admin.blog.field_attachments')}
                            </label>

                            {/* Existing attachments */}
                            {existingAttachments.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">{t('admin.blog.existing_attachments')}</p>
                                    <div className="space-y-2">
                                        {existingAttachments.map((attachment, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm">{attachment.original_filename || attachment.filename}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingAttachment(attachment.filename)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    {t('common.remove')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New attachments */}
                            {attachmentFiles.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">{t('admin.blog.new_attachments')}</p>
                                    <div className="space-y-2">
                                        {attachmentFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-[#f3f4f6] rounded-lg">
                                                <span className="text-sm">{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    {t('common.remove')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xlsx,.txt,.csv"
                                onChange={handleAttachmentChange}
                                className="w-full px-3 py-2 font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {t('admin.blog.accepted_formats')}
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
                                        const confirmLeave = window.confirm(t('admin.blog.unsaved_changes_cancel'))
                                        if (!confirmLeave) return
                                    }
                                    navigate('/admin/news-events')
                                }}
                                className="font-['Onest'] font-medium text-sm text-[#0a0a0a] border border-[#d4d4d4] px-6 py-2 rounded-full hover:bg-black/[0.02] transition-colors cursor-pointer"
                                disabled={saving}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="font-['Onest'] font-medium text-sm text-white bg-primary px-6 py-2 rounded-full transition-opacity disabled:opacity-50 hover:opacity-90 cursor-pointer"
                            >
                                {saving ? t('admin.blog.saving') : (isEditing ? t('admin.blog.update') : t('admin.blog.create'))}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <ConfirmModal
                isOpen={showPublishConfirm}
                onConfirm={() => { setShowPublishConfirm(false); executeSubmit(); }}
                onCancel={() => setShowPublishConfirm(false)}
                title={t('admin.blog.confirm_publish_title')}
                message={t('admin.blog.confirm_publish')}
            />

            {/* Delete author confirmation */}
            {deleteAuthorConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-[#fffefc] rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
                        <h3 className="font-['Onest'] font-semibold text-xl text-[#0a0a0a]">
                            {t('admin.blog.delete_author_title', 'Eliminar autor')}
                        </h3>
                        <p className="font-['Onest'] text-sm text-[#0a0a0a]">
                            {t('admin.blog.delete_author_warning', 'Tem a certeza que quer eliminar')} <strong>{deleteAuthorConfirm.name}</strong>?
                        </p>

                        {deleteAuthorLoading ? (
                            <div className="flex items-center gap-2 text-sm text-[#737373]">
                                <div className="loading loading-spinner loading-sm"></div>
                                {t('admin.blog.loading_posts', 'A carregar publicações...')}
                            </div>
                        ) : deleteAuthorPosts.length > 0 ? (
                            <div className="space-y-2">
                                <p className="font-['Onest'] text-xs font-medium text-[#737373]">
                                    {t('admin.blog.author_has_posts', 'Este autor tem as seguintes publicações:')}
                                </p>
                                <div className="max-h-40 overflow-y-auto space-y-1 bg-[#f3f4f6] rounded-lg p-3">
                                    {deleteAuthorPosts.map(p => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <span className="font-['Onest'] text-xs text-primary bg-[#fffefc] rounded px-1.5 py-0.5">
                                                {p.tags?.[0] || 'Post'}
                                            </span>
                                            <span className="font-['Onest'] text-sm text-[#0a0a0a] truncate">{p.title}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="font-['Onest'] text-xs text-red-500">
                                    {t('admin.blog.delete_author_posts_warning', 'O autor será removido mas as publicações vão manter o nome do autor.')}
                                </p>
                            </div>
                        ) : (
                            <p className="font-['Onest'] text-sm text-[#737373]">
                                {t('admin.blog.author_no_posts', 'Este autor não tem publicações associadas.')}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => { setDeleteAuthorConfirm(null); setDeleteAuthorPosts([]) }}
                                className="font-['Onest'] font-medium text-sm text-[#0a0a0a] border border-[#d4d4d4] px-5 py-2 rounded-full hover:bg-black/[0.02] transition-colors cursor-pointer"
                            >
                                {t('common.cancel', 'Cancelar')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeleteAuthor}
                                className="font-['Onest'] font-medium text-sm text-white bg-red-500 px-5 py-2 rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                            >
                                {t('common.delete', 'Eliminar')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageTemplate>
    )
}