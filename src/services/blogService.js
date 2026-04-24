import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import { APP_CONFIG, HTTP_STATUS } from '../constants/app';

function isEnglish() {
    const lang = localStorage.getItem('i18nextLng') || 'pt';
    return lang.startsWith('en');
}

class BlogService {
    constructor() {
        this.api = apiClient;
    }

    /** Return the localized value of a post field, falling back to the default (PT) value. */
    localize(post, field) {
        if (!post) return '';
        if (isEnglish()) {
            const enValue = post[field + '_en'];
            if (enValue) return enValue;
        }
        return post[field] || '';
    }

    async getPublishedPosts(skip = 0, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE) {
        try {
            const response = await this.api.get(API_ENDPOINTS.BLOG.POSTS, {
                params: { skip, limit }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch blog posts');
        }
    }

    async getPost(postId) {
        try {
            const response = await this.api.get(API_ENDPOINTS.BLOG.POST_BY_ID(postId));
            return response.data;
        } catch (error) {
            if (error.response?.status === HTTP_STATUS.NOT_FOUND) {
                throw new Error('Blog post not found');
            }
            throw new Error('Failed to fetch blog post');
        }
    }

    async getAllPosts(skip = 0, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE) {
        try {
            const response = await this.api.get(API_ENDPOINTS.BLOG.ADMIN_POSTS, {
                params: { skip, limit }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch all posts');
        }
    }

    async createPost(postData) {
        try {
            const response = await this.api.post(API_ENDPOINTS.BLOG.ADMIN_POSTS, postData);
            return response.data;
        } catch (error) {
            throw new Error('Failed to create blog post');
        }
    }

    async updatePost(postId, updateData) {
        try {
            const response = await this.api.put(API_ENDPOINTS.BLOG.ADMIN_POST_BY_ID(postId), updateData);
            return response.data;
        } catch (error) {
            throw new Error('Failed to update blog post');
        }
    }

    async deletePost(postId) {
        try {
            await this.api.delete(API_ENDPOINTS.BLOG.ADMIN_POST_BY_ID(postId));
            return true;
        } catch (error) {
            throw new Error('Failed to delete blog post');
        }
    }

    async uploadThumbnail(postId, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await this.api.post(API_ENDPOINTS.BLOG.THUMBNAIL(postId), formData);
            return response.data;
        } catch (error) {
            throw new Error('Failed to upload thumbnail');
        }
    }

    async uploadAttachment(postId, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await this.api.post(API_ENDPOINTS.BLOG.ATTACHMENTS(postId), formData);
            return response.data;
        } catch (error) {
            throw new Error('Failed to upload attachment');
        }
    }

    async updateAttachmentsOrder(postId, attachments) {
        const response = await this.api.put(API_ENDPOINTS.BLOG.ADMIN_POST_BY_ID(postId), { attachments });
        return response.data;
    }

    async removeAttachment(postId, filename) {
        try {
            await this.api.delete(API_ENDPOINTS.BLOG.ATTACHMENT_BY_NAME(postId, filename));
            return true;
        } catch (error) {
            throw new Error('Failed to remove attachment');
        }
    }

    async uploadThumbnailStandalone(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await this.api.post(API_ENDPOINTS.BLOG.UPLOAD_THUMBNAIL, formData);
            return response.data;
        } catch (error) {
            throw new Error('Failed to upload thumbnail');
        }
    }

    async uploadAttachmentStandalone(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await this.api.post(API_ENDPOINTS.BLOG.UPLOAD_ATTACHMENT, formData);
            return response.data;
        } catch (error) {
            throw new Error('Failed to upload attachment');
        }
    }

    getFileUrl(path) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const base = this.api.defaults.baseURL;
        return base ? `${base}${path}` : path;
    }

    formatDate(dateString, locale) {
        const lang = locale || localStorage.getItem('i18nextLng') || 'pt';
        const loc = lang.startsWith('en') ? 'en-GB' : 'pt-PT';
        return new Date(dateString).toLocaleDateString(loc, APP_CONFIG.DATE_OPTIONS);
    }

    formatDateTime(dateString, locale) {
        const lang = locale || localStorage.getItem('i18nextLng') || 'pt';
        const loc = lang.startsWith('en') ? 'en-GB' : 'pt-PT';
        return new Date(dateString).toLocaleString(loc);
    }
}

export default new BlogService();