// src/services/api.js
const API_BASE_URL = 'http://localhost:5181/api';

// ─── Yardımcı: Token'lı istek ───
const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('token');
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });
};

// ─── Auth ───
export const authService = {
    login: async (email, password) => {
        const response = await authFetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) throw new Error('Giriş başarısız.');
        return await response.json();
    },

    register: async (email, password, role = 'Student') => {
        const response = await authFetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify({ email, password, role }),
        });
        if (!response.ok) throw new Error('Kayıt başarısız.');
        return await response.json();
    },

    googleLogin: async (googleToken) => {
        console.log('Mock Google login:', googleToken);
        return { success: true, token: googleToken, isNewUser: true };
    },

    completeOnboarding: async (role, data) => {
        await new Promise(r => setTimeout(r, 800));
        return { success: true };
    },
};

// ─── Posts ───
export const postService = {
    // Feed'deki tüm gönderileri getir
    getPosts: async () => {
        const response = await authFetch(`${API_BASE_URL}/posts`);
        if (!response.ok) throw new Error('Gönderiler yüklenemedi.');
        return await response.json();
    },

    // Yeni gönderi oluştur
    createPost: async (userId, content) => {
        const response = await authFetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            body: JSON.stringify({ userId, content }),
        });
        if (!response.ok) throw new Error('Gönderi paylaşılamadı.');
        return await response.json();
    },

    // Gönderi sil
    deletePost: async (postId) => {
        const response = await authFetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Gönderi silinemedi.');
        return await response.json();
    },
};

// ─── Follow ───
export const followService = {
    // Kullanıcıyı takip et
    follow: async (followerId, targetId) => {
        const response = await authFetch(`${API_BASE_URL}/users/${targetId}/follow`, {
            method: 'POST',
            body: JSON.stringify({ followerId }),
        });
        if (response.status === 409) return { following: true, alreadyFollowing: true };
        if (!response.ok) throw new Error('Takip işlemi başarısız.');
        return await response.json();
    },

    // Takibi bırak
    unfollow: async (followerId, targetId) => {
        const response = await authFetch(`${API_BASE_URL}/users/${targetId}/follow`, {
            method: 'DELETE',
            body: JSON.stringify({ followerId }),
        });
        if (!response.ok) throw new Error('Takip bırakma başarısız.');
        return await response.json();
    },

    // Kullanıcı istatistikleri
    getUserStats: async (userId) => {
        const response = await authFetch(`${API_BASE_URL}/users/${userId}/stats`);
        if (!response.ok) throw new Error('İstatistikler yüklenemedi.');
        return await response.json();
    },
};

// ─── Story ───
export const storyService = {
    // Aktif hikayeleri getir
    getStories: async () => {
        const response = await authFetch(`${API_BASE_URL}/story/active`);
        if (!response.ok) throw new Error('Hikayeler yüklenemedi.');
        return await response.json();
    },

    // Yeni hikaye yükle (FormData kullanarak)
    uploadStory: async (userId, file) => {
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('file', file);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/story/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                // Content-Type tarayıcı tarafından otomatik eklenecek (boundary ile)
            }
        });
        if (!response.ok) throw new Error('Hikaye yüklenemedi.');
        return await response.json();
    }
};

// ─── Admin ───
export const adminService = {
    getStats: async () => {
        const response = await authFetch(`${API_BASE_URL}/admin/stats`);
        if (!response.ok) throw new Error('İstatistikler yüklenemedi.');
        return await response.json();
    },

    getUsers: async () => {
        const response = await authFetch(`${API_BASE_URL}/admin/users`);
        if (!response.ok) throw new Error('Kullanıcılar yüklenemedi.');
        return await response.json();
    },

    toggleUserStatus: async (userId, action) => {
        const response = await authFetch(`${API_BASE_URL}/admin/users/${userId}/toggle-status`, {
            method: 'POST',
            body: JSON.stringify({ action }),
        });
        if (!response.ok) throw new Error('Kullanıcı durumu güncellenemedi.');
        return await response.json();
    },

    getAuditLogs: async () => {
        const response = await authFetch(`${API_BASE_URL}/admin/audit-logs`);
        if (!response.ok) throw new Error('Loglar yüklenemedi.');
        return await response.json();
    }
};
