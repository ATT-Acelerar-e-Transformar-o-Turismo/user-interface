import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminPageTemplate from './AdminPageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import RichTextEditor from '../components/RichTextEditor'
import ConfirmModal from '../components/ConfirmModal'
import blogService from '../services/blogService'
import { useTranslation } from 'react-i18next'

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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('admin.blog.field_title')}
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary"
                                placeholder={t('admin.blog.placeholder_title')}
                            />
                        </div>

                        {/* Author and Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('admin.blog.field_author')}
                                </label>
                                <input
                                    type="text"
                                    name="author"
                                    value={formData.author}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                                    placeholder={t('admin.blog.placeholder_author')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('admin.blog.col_status')}
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                                >
                                    <option value="draft">{t('admin.blog.status_draft')}</option>
                                    <option value="published">{t('admin.blog.status_published')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('admin.blog.field_excerpt')}
                            </label>
                            <textarea
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                                placeholder={t('admin.blog.placeholder_excerpt')}
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                                placeholder={t('admin.blog.placeholder_tags')}
                            />
                        </div>

                        {/* Thumbnail */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('admin.blog.field_thumbnail')}
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
                                            <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
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
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                disabled={saving}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-gray-900 text-white font-medium rounded-md transition-colors disabled:opacity-50 hover:bg-gray-800"
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
        </AdminPageTemplate>
    )
}