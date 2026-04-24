import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import AdminPageTemplate from './AdminPageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import RichTextEditor from '../components/RichTextEditor'
import ConfirmModal from '../components/ConfirmModal'
import blogService from '../services/blogService'
import authorService from '../services/authorService'
import categoryService from '../services/categoryService'
import { useTranslation } from 'react-i18next'

function AuthorPhotoDropzone({ photoPreview, onDrop, label, aspectClass }) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
    })
    const isCover = Boolean(aspectClass)

    return (
        <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-[#d4d4d4] hover:border-primary/50'
            }`}
        >
            <input {...getInputProps()} />
            {photoPreview ? (
                isCover ? (
                    <img src={photoPreview} alt="Preview" className={`w-full ${aspectClass} rounded-lg object-cover mb-3`} />
                ) : (
                    <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover mb-3" />
                )
            ) : (
                isCover ? (
                    <div className={`w-full ${aspectClass} rounded-lg bg-[#f3f4f6] flex items-center justify-center mb-3`}>
                        <svg className="w-10 h-10 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                ) : (
                    <div className="w-24 h-24 rounded-full bg-[#f3f4f6] flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                )
            )}
            <p className="font-['Onest'] text-sm text-[#737373] text-center">
                {isDragActive ? 'Largar aqui...' : (label || 'Arrastar foto ou clicar para escolher')}
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

function AuthorForm({ mode, data, setData, photoPreview, onPhotoDrop, coverPreview, onCoverDrop, onSave, onCancel, t }) {
    const inputCls = "w-full font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    const labelCls = "block font-['Onest'] text-xs font-medium text-[#737373] mb-1"
    return (
        <div className="bg-[#f3f4f6] border border-[#e5e5e5] rounded-2xl p-6 space-y-5">
            <h3 className="font-['Onest'] font-semibold text-lg text-[#0a0a0a]">
                {mode === 'edit' ? t('admin.blog.edit_author', 'Editar autor') : t('admin.blog.create_author', 'Criar novo autor')}
            </h3>

            {/* Cover image dropzone */}
            <div>
                <label className={labelCls}>{t('admin.blog.author_cover', 'Imagem de capa')}</label>
                <AuthorPhotoDropzone photoPreview={coverPreview} onDrop={onCoverDrop} label={t('admin.blog.drop_cover', 'Arraste a imagem de capa')} aspectClass="aspect-[3/1]" />
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Photo dropzone */}
                <div className="w-full md:w-48 shrink-0">
                    <AuthorPhotoDropzone photoPreview={photoPreview} onDrop={onPhotoDrop} />
                </div>

                {/* Basic fields */}
                <div className="flex-1 space-y-4">
                    <div>
                        <label className={labelCls}>{t('admin.blog.author_name', 'Nome')}</label>
                        <input type="text" value={data.name} onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))} className={inputCls} placeholder="Nome completo" />
                    </div>
                    <div>
                        <label className={labelCls}>{t('admin.blog.author_email', 'Email')}</label>
                        <input type="email" value={data.email} onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))} className={inputCls} placeholder="email@exemplo.pt" />
                    </div>
                    <div>
                        <label className={labelCls}>{t('admin.blog.author_role', 'Cargo')}</label>
                        <input type="text" value={data.role} onChange={(e) => setData(prev => ({ ...prev, role: e.target.value }))} className={inputCls} placeholder="Ex: Doutoramento em Turismo" />
                    </div>
                </div>
            </div>

            {/* Social media fields */}
            <div>
                <h4 className="font-['Onest'] font-medium text-sm text-[#0a0a0a] mb-3">{t('admin.blog.social_media', 'Redes sociais')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>LinkedIn</label>
                        <input type="url" value={data.linkedin} onChange={(e) => setData(prev => ({ ...prev, linkedin: e.target.value }))} className={inputCls} placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div>
                        <label className={labelCls}>Instagram</label>
                        <input type="url" value={data.instagram} onChange={(e) => setData(prev => ({ ...prev, instagram: e.target.value }))} className={inputCls} placeholder="https://instagram.com/..." />
                    </div>
                    <div>
                        <label className={labelCls}>Facebook</label>
                        <input type="url" value={data.facebook} onChange={(e) => setData(prev => ({ ...prev, facebook: e.target.value }))} className={inputCls} placeholder="https://facebook.com/..." />
                    </div>
                    <div>
                        <label className={labelCls}>GitHub</label>
                        <input type="url" value={data.github} onChange={(e) => setData(prev => ({ ...prev, github: e.target.value }))} className={inputCls} placeholder="https://github.com/..." />
                    </div>
                    <div>
                        <label className={labelCls}>ORCID</label>
                        <input type="url" value={data.orcid} onChange={(e) => setData(prev => ({ ...prev, orcid: e.target.value }))} className={inputCls} placeholder="https://orcid.org/..." />
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
    const location = useLocation()
    const { t } = useTranslation()
    const isEditing = Boolean(postId)
    // Infer the post_type / base URL from the current path. The form is
    // mounted at /admin/news-events/* and /admin/publications/*, one per
    // post type — no manual type selector is needed on create.
    const isPublicationsRoute = location.pathname.startsWith('/admin/publications')
    const routePostType = isPublicationsRoute ? 'publication' : 'news-event'
    const routeBasePath = isPublicationsRoute ? '/admin/publications' : '/admin/news-events'

    // Redirect base path: on create, use the route-derived one. On edit,
    // prefer the actual post_type of the loaded/edited post so editing a
    // publication via a legacy /admin/news-events URL still lands back on
    // /admin/publications (where the post actually lives in the list).
    const effectiveBasePath = () => {
        const effectiveType = formData?.post_type || routePostType
        return effectiveType === 'publication' ? '/admin/publications' : '/admin/news-events'
    }

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
    const [authorFormData, setAuthorFormData] = useState({ name: '', email: '', role: '', linkedin: '', instagram: '', facebook: '', github: '', orcid: '' })
    const [authorFormPhoto, setAuthorFormPhoto] = useState(null)
    const [authorFormPhotoPreview, setAuthorFormPhotoPreview] = useState(null)
    const [authorFormCover, setAuthorFormCover] = useState(null)
    const [authorFormCoverPreview, setAuthorFormCoverPreview] = useState(null)
    const [editingAuthorId, setEditingAuthorId] = useState(null)
    // Author delete confirmation
    const [deleteAuthorConfirm, setDeleteAuthorConfirm] = useState(null) // author object or null
    const [deleteAuthorPosts, setDeleteAuthorPosts] = useState([])
    const [deleteAuthorLoading, setDeleteAuthorLoading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        title_en: '',
        content: '',
        content_en: '',
        excerpt: '',
        excerpt_en: '',
        author: '',
        author_id: '',
        author_photo: '',
        author_role: '',
        post_type: routePostType,
        publication_link: '',
        publication_link_label: '',
        publication_link_label_en: '',
        status: 'draft',
        categories: [],
        keywords: [],
        tags: []
    })
    const [tagInput, setTagInput] = useState('')
    const [allCategories, setAllCategories] = useState([])
    const [activeLang, setActiveLang] = useState('pt')
    const [catEdit, setCatEdit] = useState(null) // null = closed, {} = new, {id,...} = editing
    const [catForm, setCatForm] = useState({ name_pt: '', name_en: '' })
    const [thumbnailFile, setThumbnailFile] = useState(null)
    const [thumbnailPreview, setThumbnailPreview] = useState(null)
    const [attachmentFiles, setAttachmentFiles] = useState([])
    const [existingAttachments, setExistingAttachments] = useState([])
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [initialFormData, setInitialFormData] = useState(null)

    useEffect(() => {
        authorService.getAll().then(resp => setAuthors(Array.isArray(resp) ? resp : resp?.authors || [])).catch(() => {})
        categoryService.getAll().then(cats => setAllCategories(Array.isArray(cats) ? cats : [])).catch(() => {})
        if (isEditing) {
            loadPost()
        } else {
            setLoading(false)
            const empty = {
                title: '', title_en: '', content: '', content_en: '', excerpt: '', excerpt_en: '',
                author: '', author_id: '', author_photo: '', author_role: '', post_type: routePostType,
                publication_link: '', publication_link_label: '', publication_link_label_en: '',
                status: 'draft', categories: [], keywords: [], tags: []
            }
            setInitialFormData(empty)
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
                title_en: postData.title_en || '',
                content: postData.content,
                content_en: postData.content_en || '',
                excerpt: postData.excerpt || '',
                excerpt_en: postData.excerpt_en || '',
                author: postData.author,
                author_id: postData.author_id || '',
                author_photo: postData.author_photo || '',
                author_role: postData.author_role || '',
                post_type: postData.post_type || routePostType,
                publication_link: postData.publication_link || '',
                publication_link_label: postData.publication_link_label || '',
                publication_link_label_en: postData.publication_link_label_en || '',
                status: postData.status,
                categories: postData.categories || [],
                keywords: postData.keywords || [],
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

    const handleAddKeyword = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            if (!formData.keywords.includes(tagInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    keywords: [...prev.keywords, tagInput.trim()]
                }))
            }
            setTagInput('')
        }
    }

    const handleRemoveKeyword = (kw) => {
        setFormData(prev => ({
            ...prev,
            keywords: prev.keywords.filter(k => k !== kw)
        }))
    }

    const toggleCategory = (slug) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(slug)
                ? prev.categories.filter(c => c !== slug)
                : [...prev.categories, slug]
        }))
    }

    const handleSaveCategory = async () => {
        if (!catForm.name_pt.trim() || !catForm.name_en.trim()) return
        try {
            if (catEdit?.id) {
                const updated = await categoryService.update(catEdit.id, { ...catForm, type: formData.post_type })
                setAllCategories(prev => prev.map(c => c.id === updated.id ? updated : c))
            } else {
                const created = await categoryService.create({ ...catForm, type: formData.post_type })
                setAllCategories(prev => [...prev, created])
            }
            setCatEdit(null)
            setCatForm({ name_pt: '', name_en: '' })
        } catch (err) {
            setError(err.userMessage || err.message)
        }
    }

    const handleDeleteCategory = async () => {
        if (!catEdit?.id || !window.confirm(t('blogPostForm.delete_category_confirm', 'Eliminar esta categoria?'))) return
        try {
            await categoryService.delete(catEdit.id)
            setAllCategories(prev => prev.filter(c => c.id !== catEdit.id))
            setFormData(prev => ({ ...prev, categories: prev.categories.filter(s => s !== catEdit.slug) }))
            setCatEdit(null)
            setCatForm({ name_pt: '', name_en: '' })
        } catch (err) {
            setError(err.userMessage || err.message)
        }
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
            author_id: author.id || '',
            author_photo: author.photo_url || '',
            author_role: author.role || '',
        }))
        setAuthorDropdownOpen(false)
    }

    const openAuthorForm = (mode, author = null) => {
        setAuthorFormMode(mode)
        if (mode === 'edit' && author) {
            setEditingAuthorId(author.id)
            setAuthorFormData({
                name: author.name || '', email: author.email || '', role: author.role || '',
                linkedin: author.linkedin || '', instagram: author.instagram || '',
                facebook: author.facebook || '', github: author.github || '', orcid: author.orcid || '',
            })
            setAuthorFormPhotoPreview(author.photo_url ? blogService.getFileUrl(author.photo_url) : null)
            setAuthorFormCoverPreview(author.cover_url ? blogService.getFileUrl(author.cover_url) : null)
        } else {
            setEditingAuthorId(null)
            setAuthorFormData({ name: '', email: '', role: '', linkedin: '', instagram: '', facebook: '', github: '', orcid: '' })
            setAuthorFormPhotoPreview(null)
            setAuthorFormCoverPreview(null)
        }
        setAuthorFormPhoto(null)
        setAuthorFormCover(null)
        setAuthorDropdownOpen(false)
    }

    const closeAuthorForm = () => {
        setAuthorFormMode(null)
        setEditingAuthorId(null)
        setAuthorFormData({ name: '', email: '', role: '', linkedin: '', instagram: '', facebook: '', github: '', orcid: '' })
        setAuthorFormPhoto(null)
        setAuthorFormPhotoPreview(null)
        setAuthorFormCover(null)
        setAuthorFormCoverPreview(null)
    }

    const onAuthorPhotoDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0]
        if (file) {
            setAuthorFormPhoto(file)
            setAuthorFormPhotoPreview(URL.createObjectURL(file))
        }
    }, [])

    const onAuthorCoverDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0]
        if (file) {
            setAuthorFormCover(file)
            setAuthorFormCoverPreview(URL.createObjectURL(file))
        }
    }, [])

    const handleSaveAuthor = async () => {
        if (!authorFormData.name.trim()) return
        const payload = {
            name: authorFormData.name.trim(),
            email: authorFormData.email.trim() || undefined,
            role: authorFormData.role.trim() || undefined,
            linkedin: authorFormData.linkedin.trim() || undefined,
            instagram: authorFormData.instagram.trim() || undefined,
            facebook: authorFormData.facebook.trim() || undefined,
            github: authorFormData.github.trim() || undefined,
            orcid: authorFormData.orcid.trim() || undefined,
        }
        try {
            let author
            if (authorFormMode === 'edit' && editingAuthorId) {
                author = await authorService.update(editingAuthorId, payload)
                if (authorFormPhoto) {
                    const photoResult = await authorService.uploadPhoto(editingAuthorId, authorFormPhoto)
                    author.photo_url = photoResult.photo_url
                }
                if (authorFormCover) {
                    const coverResult = await authorService.uploadCover(editingAuthorId, authorFormCover)
                    author.cover_url = coverResult.cover_url
                }
                setAuthors(prev => prev.map(a => a.id === author.id ? author : a))
            } else {
                author = await authorService.create(payload)
                if (authorFormPhoto) {
                    const photoResult = await authorService.uploadPhoto(author.id, authorFormPhoto)
                    author.photo_url = photoResult.photo_url
                }
                if (authorFormCover) {
                    const coverResult = await authorService.uploadCover(author.id, authorFormCover)
                    author.cover_url = coverResult.cover_url
                }
                setAuthors(prev => [...prev, author])
            }
            handleSelectAuthor(author)
            closeAuthorForm()
        } catch (err) {
            setError(err.userMessage || err.message)
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
                setFormData(prev => ({ ...prev, author_id: '', author: '', author_photo: '', author_role: '' }))
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

            // Publications must have at least one document
            if (formData.post_type === 'publication') {
                const hasExistingDoc = existingAttachments.some(a => /\.(pdf|doc|docx|xlsx|txt|csv)$/i.test(a.filename || a.original_filename || ''))
                const hasNewDoc = attachmentFiles.some(f => /\.(pdf|doc|docx|xlsx|txt|csv)$/i.test(f.name))
                if (!hasExistingDoc && !hasNewDoc) {
                    throw new Error(t('admin.blog.validation_publication_document', 'Publicações necessitam de pelo menos um documento anexado.'))
                }
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
            navigate(effectiveBasePath())
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

    // Save as draft: flip the in-memory status to 'draft' then run the
    // normal submit path (which skips the publish-confirm modal when not
    // publishing). Figma "Guardar nos rascunhos" button.
    const handleSaveDraft = async () => {
        setFormData(prev => ({ ...prev, status: 'draft' }))
        // Give React a tick so executeSubmit reads the updated status.
        await Promise.resolve()
        await executeSubmit()
    }

    // Publish: Figma green "Publicar" button. Behaves like status=published
    // + submit, i.e. triggers the confirm modal.
    const handlePublishClick = () => {
        setFormData(prev => ({ ...prev, status: 'published' }))
        setShowPublishConfirm(true)
    }

    return (
        <AdminPageTemplate>
            <div className="min-h-screen pb-12 pt-8 px-4 md:px-12 bg-[#f3f4f6]">
                <div className="max-w-[1416px] mx-auto">
                    {/* Header — Figma node 2562:12663 */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                        <h1 className="font-['Onest'] font-semibold text-[32px] leading-none tracking-[-0.32px] text-[#0a0a0a]">
                            {isEditing
                                ? t('admin.blog.title_edit')
                                : (routePostType === 'publication'
                                    ? t('admin.publications.new_post', { defaultValue: t('admin.blog.title_create') })
                                    : t('admin.news_events.new_post', { defaultValue: t('admin.blog.title_create') }))}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={saving}
                                className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white border border-[#d4d4d4] hover:bg-gray-50 font-['Onest'] font-medium text-[17px] text-[#0a0a0a] whitespace-nowrap shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {t('admin.blog.save_draft', 'Guardar nos rascunhos')}
                            </button>
                            <button
                                type="button"
                                onClick={handlePublishClick}
                                disabled={saving}
                                className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#009368] hover:bg-[#007d57] font-['Onest'] font-medium text-[17px] text-white whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {t('admin.blog.publish', 'Publicar')}
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Post type is implied by the route: /admin/news-events
                            vs /admin/publications — no selector needed. */}

                        {/* Language tabs */}
                        <div className="flex gap-1 bg-[#f3f4f6] rounded-lg p-1 w-fit">
                            {['pt', 'en'].map(lang => (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => setActiveLang(lang)}
                                    className={`font-['Onest'] text-sm font-medium px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
                                        activeLang === lang
                                            ? 'bg-white text-[#0a0a0a] shadow-sm'
                                            : 'text-[#737373] hover:text-[#0a0a0a]'
                                    }`}
                                >
                                    {lang === 'pt' ? 'Português' : 'English'}
                                </button>
                            ))}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {t('admin.blog.field_title')} {activeLang === 'en' ? '(EN)' : '(PT)'}
                            </label>
                            <input
                                type="text"
                                name={activeLang === 'pt' ? 'title' : 'title_en'}
                                value={activeLang === 'pt' ? formData.title : formData.title_en}
                                onChange={handleInputChange}
                                required={activeLang === 'pt'}
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
                            coverPreview={authorFormCoverPreview}
                            onCoverDrop={onAuthorCoverDrop}
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

                        {/* Publication Link Label EN (next to PT) */}
                        {formData.publication_link && activeLang === 'en' && (
                            <div>
                                <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                    {t('admin.blog.field_publication_link_label', 'Nome do link')} (EN)
                                </label>
                                <input
                                    type="text"
                                    name="publication_link_label_en"
                                    value={formData.publication_link_label_en}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder="Document name (EN)"
                                />
                            </div>
                        )}

                        {/* Excerpt */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {t('admin.blog.field_excerpt')} {activeLang === 'en' ? '(EN)' : '(PT)'}
                            </label>
                            <textarea
                                name={activeLang === 'pt' ? 'excerpt' : 'excerpt_en'}
                                value={activeLang === 'pt' ? formData.excerpt : formData.excerpt_en}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                placeholder={t('admin.blog.placeholder_excerpt')}
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {t('admin.blog.field_content')} {activeLang === 'en' ? '(EN)' : '(PT)'}
                            </label>
                            {activeLang === 'pt' ? (
                                <RichTextEditor
                                    key="content-pt"
                                    value={formData.content}
                                    onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
                                    placeholder={t('admin.blog.placeholder_content')}
                                />
                            ) : (
                                <RichTextEditor
                                    key="content-en"
                                    value={formData.content_en}
                                    onChange={(val) => setFormData(prev => ({ ...prev, content_en: val }))}
                                    placeholder="Write the content in English..."
                                />
                            )}
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

                        {/* Categories (dynamic, filtered by post_type) — inline management */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {t('admin.blog.field_category', 'Categorias')}
                            </label>
                            {(() => {
                                const filtered = allCategories.filter(c => c.type === formData.post_type)
                                return (
                                    <div className="flex flex-col gap-3">
                                        {filtered.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {filtered.map(cat => {
                                                    const isSelected = formData.categories.includes(cat.slug)
                                                    return (
                                                        <div key={cat.id} className="group relative inline-flex">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleCategory(cat.slug)}
                                                                className={`font-['Onest'] text-sm font-medium pl-4 pr-8 py-1.5 rounded-full border transition-colors cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-primary text-white border-primary'
                                                                        : 'bg-[#fffefc] text-[#0a0a0a] border-[#e5e5e5] hover:border-primary/50'
                                                                }`}
                                                                title={`${cat.name_pt} / ${cat.name_en}`}
                                                            >
                                                                {cat.name_pt}
                                                            </button>
                                                            {/* Edit / Delete on hover */}
                                                            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); setCatEdit(cat); setCatForm({ name_pt: cat.name_pt, name_en: cat.name_en }) }}
                                                                    className="w-5 h-5 rounded-full bg-white/80 border border-[#e5e5e5] flex items-center justify-center hover:bg-white cursor-pointer"
                                                                    title={t('common.edit', 'Editar')}
                                                                >
                                                                    <svg className="w-2.5 h-2.5 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {/* Inline category add/edit form */}
                                        {catEdit !== null ? (
                                            <div className="flex flex-wrap items-end gap-2 bg-[#f3f4f6] rounded-xl p-3">
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="block font-['Onest'] text-xs text-[#737373] mb-1">PT</label>
                                                    <input type="text" value={catForm.name_pt} onChange={e => setCatForm(p => ({ ...p, name_pt: e.target.value }))}
                                                        className="w-full font-['Onest'] text-sm bg-white border border-[#e5e5e5] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome PT" />
                                                </div>
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="block font-['Onest'] text-xs text-[#737373] mb-1">EN</label>
                                                    <input type="text" value={catForm.name_en} onChange={e => setCatForm(p => ({ ...p, name_en: e.target.value }))}
                                                        className="w-full font-['Onest'] text-sm bg-white border border-[#e5e5e5] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Name EN" />
                                                </div>
                                                <button type="button" onClick={handleSaveCategory}
                                                    className="font-['Onest'] text-xs font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-[color:var(--color-primary-hover)] cursor-pointer">
                                                    {catEdit?.id ? t('common.save', 'Guardar') : t('admin.categories.add', 'Adicionar')}
                                                </button>
                                                {catEdit?.id && (
                                                    <button type="button" onClick={handleDeleteCategory}
                                                        className="font-['Onest'] text-xs font-medium text-red-500 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 cursor-pointer">
                                                        {t('common.delete', 'Eliminar')}
                                                    </button>
                                                )}
                                                <button type="button" onClick={() => { setCatEdit(null); setCatForm({ name_pt: '', name_en: '' }) }}
                                                    className="font-['Onest'] text-xs text-[#737373] px-3 py-1.5 cursor-pointer">
                                                    {t('common.cancel', 'Cancelar')}
                                                </button>
                                            </div>
                                        ) : (
                                            <button type="button" onClick={() => setCatEdit({})}
                                                className="font-['Onest'] text-sm text-primary font-medium cursor-pointer w-fit hover:underline">
                                                + {t('admin.blog.add_category', 'Adicionar categoria')}
                                            </button>
                                        )}
                                    </div>
                                )
                            })()}
                        </div>

                        {/* Keywords (free-form) */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {t('admin.blog.field_keywords', 'Keywords')}
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.keywords.map((kw, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-base-200 text-primary"
                                    >
                                        {kw}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveKeyword(kw)}
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
                                onKeyDown={handleAddKeyword}
                                className="w-full px-3 py-2 font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                placeholder={t('admin.blog.placeholder_keywords', 'Adicionar keyword e pressionar Enter')}
                            />
                        </div>

                        {/* Document (mandatory for publications) */}
                        {formData.post_type === 'publication' && (
                            <div>
                                <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                    {t('admin.blog.field_document', 'Documento')} <span className="text-red-500">*</span>
                                </label>

                                {/* Existing document attachments */}
                                {existingAttachments.filter(a => /\.(pdf|doc|docx|xlsx|txt|csv)$/i.test(a.filename || a.original_filename || '')).length > 0 && (
                                    <div className="mb-3 space-y-2">
                                        {existingAttachments.filter(a => /\.(pdf|doc|docx|xlsx|txt|csv)$/i.test(a.filename || a.original_filename || '')).map((att, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-[#f3f4f6] rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span className="font-['Onest'] text-sm font-medium">{att.original_filename || att.filename}</span>
                                                </div>
                                                <button type="button" onClick={() => removeExistingAttachment(att.filename)}
                                                    className="font-['Onest'] text-xs text-red-500 hover:text-red-700 cursor-pointer">{t('common.remove')}</button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* New document files */}
                                {attachmentFiles.filter(f => /\.(pdf|doc|docx|xlsx|txt|csv)$/i.test(f.name)).length > 0 && (
                                    <div className="mb-3 space-y-2">
                                        {attachmentFiles.map((file, index) => (
                                            /\.(pdf|doc|docx|xlsx|txt|csv)$/i.test(file.name) && (
                                                <div key={index} className="flex items-center justify-between p-3 bg-[#f3f4f6] rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <span className="font-['Onest'] text-sm font-medium">{file.name}</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeAttachment(index)}
                                                        className="font-['Onest'] text-xs text-red-500 hover:text-red-700 cursor-pointer">{t('common.remove')}</button>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}

                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xlsx,.txt,.csv"
                                    onChange={handleAttachmentChange}
                                    className="w-full px-3 py-2 font-['Onest'] text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <p className="font-['Onest'] text-xs text-[#737373] mt-1">
                                    {t('admin.blog.publication_doc_hint', 'A primeira página do documento será usada como capa. Formatos: PDF, DOC, DOCX, XLSX.')}
                                </p>
                            </div>
                        )}

                        {/* Thumbnail (optional for publications, shown for news-events) */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {formData.post_type === 'publication'
                                    ? t('admin.blog.field_thumbnail_optional', 'Imagem de capa (opcional — substitui a pré-visualização do documento)')
                                    : t('admin.blog.field_thumbnail')}
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

                        {/* Additional Attachments (for news-events, or extra files for publications) */}
                        <div>
                            <label className="block font-['Onest'] text-xs font-medium text-[#737373] mb-2">
                                {formData.post_type === 'publication'
                                    ? t('admin.blog.field_extra_attachments', 'Anexos adicionais')
                                    : t('admin.blog.field_attachments')}
                            </label>

                            {/* Existing attachments (for news: all, for publications: non-doc) */}
                            {(() => {
                                const shown = formData.post_type === 'publication'
                                    ? existingAttachments.filter(a => !/\.(pdf|doc|docx|xlsx|txt|csv)$/i.test(a.filename || a.original_filename || ''))
                                    : existingAttachments
                                return shown.length > 0 && (
                                    <div className="mb-3 space-y-2">
                                        {shown.map((att, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm">{att.original_filename || att.filename}</span>
                                                <button type="button" onClick={() => removeExistingAttachment(att.filename)}
                                                    className="text-red-600 hover:text-red-800 text-sm">{t('common.remove')}</button>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })()}

                            {/* New attachment files */}
                            {(() => {
                                const shown = formData.post_type === 'publication'
                                    ? attachmentFiles.filter((f, i) => !/\.(pdf|doc|docx|xlsx|txt|csv)$/i.test(f.name))
                                    : attachmentFiles
                                return shown.length > 0 && (
                                    <div className="mb-3 space-y-2">
                                        {attachmentFiles.map((file, index) => {
                                            const isDoc = /\.(pdf|doc|docx|xlsx|txt|csv)$/i.test(file.name)
                                            if (formData.post_type === 'publication' && isDoc) return null
                                            return (
                                                <div key={index} className="flex items-center justify-between p-2 bg-[#f3f4f6] rounded-lg">
                                                    <span className="text-sm">{file.name}</span>
                                                    <button type="button" onClick={() => removeAttachment(index)}
                                                        className="text-red-600 hover:text-red-800 text-sm">{t('common.remove')}</button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })()}

                            <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xlsx,.txt,.csv,image/*"
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
                                    navigate(effectiveBasePath())
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