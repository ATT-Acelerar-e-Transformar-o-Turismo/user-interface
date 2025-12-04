import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost';

class BlogService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Response interceptor for error handling
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error('Blog API Error:', error.response?.data || error.message);
                throw error;
            }
        );
    }

    // Public blog methods
    async getPublishedPosts(skip = 0, limit = 10) {
        try {
            const response = await this.api.get('/api/blog/posts', {
                params: { skip, limit }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch blog posts');
        }
    }

    async getPost(postId) {
        try {
            const response = await this.api.get(`/api/blog/posts/${postId}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error('Blog post not found');
            }
            throw new Error('Failed to fetch blog post');
        }
    }

    // Admin methods
    async getAllPosts(skip = 0, limit = 10) {
        try {
            const response = await this.api.get('/api/blog/admin/posts', {
                params: { skip, limit }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch all posts');
        }
    }

    async createPost(postData) {
        try {
            const response = await this.api.post('/api/blog/admin/posts', postData);
            return response.data;
        } catch (error) {
            throw new Error('Failed to create blog post');
        }
    }

    async updatePost(postId, updateData) {
        try {
            const response = await this.api.put(`/api/blog/admin/posts/${postId}`, updateData);
            return response.data;
        } catch (error) {
            throw new Error('Failed to update blog post');
        }
    }

    async deletePost(postId) {
        try {
            await this.api.delete(`/api/blog/admin/posts/${postId}`);
            return true;
        } catch (error) {
            throw new Error('Failed to delete blog post');
        }
    }

    async uploadThumbnail(postId, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await this.api.post(`/api/blog/admin/posts/${postId}/thumbnail`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to upload thumbnail');
        }
    }

    async uploadAttachment(postId, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await this.api.post(`/api/blog/admin/posts/${postId}/attachments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to upload attachment');
        }
    }

    async removeAttachment(postId, filename) {
        try {
            await this.api.delete(`/api/blog/admin/posts/${postId}/attachments/${filename}`);
            return true;
        } catch (error) {
            throw new Error('Failed to remove attachment');
        }
    }

    async uploadThumbnailStandalone(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await this.api.post('/api/blog/admin/upload/thumbnail', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to upload thumbnail');
        }
    }

    async uploadAttachmentStandalone(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await this.api.post('/api/blog/admin/upload/attachment', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to upload attachment');
        }
    }

    // Utility methods
    getFileUrl(path) {
        return `${API_BASE_URL}${path}`;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('pt-BR');
    }
}

export default new BlogService();