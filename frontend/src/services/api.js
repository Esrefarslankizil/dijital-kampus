// src/services/api.js
const API_BASE_URL = 'http://localhost:5181/api';

// Yardimci: Tokenli istek
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

// Auth
export const authService = {
    login: async (email, password) => {
        const response = await authFetch(API_BASE_URL + '/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) throw new Error('Giris basarisiz.');
        return await response.json();
    },

    register: async (email, password, role = 'Student') => {
        const response = await authFetch(API_BASE_URL + '/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, role }),
        });
        if (!response.ok) throw new Error('Kayit basarisiz.');
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

    logout: async (email) => {
        try {
            await fetch(API_BASE_URL + '/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
        } catch (e) {
            console.error('Logout log error:', e);
        }
    }
};

// Posts
export const postService = {
    getPosts: async (userId = 0) => {
        const url = userId > 0 ? `${API_BASE_URL}/posts?userId=${userId}` : `${API_BASE_URL}/posts`;
        const response = await authFetch(url);
        if (!response.ok) throw new Error('Gonderiler yuklenemedi.');
        return await response.json();
    },

    // Hata 4 düzeltmesi: Kullanıcıya ait gönderileri çek
    getPostsByUser: async (userId) => {
        const response = await authFetch(API_BASE_URL + '/posts/user/' + userId);
        if (!response.ok) throw new Error('Kullanici gonderileri yuklenemedi.');
        return await response.json();
    },

    // Hata 5 düzeltmesi: FormData ile fotoğraf + hashtag gönder
    createPost: async (userId, content, imageFile = null, hashtags = []) => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('content', content);
        if (imageFile) formData.append('image', imageFile);
        if (hashtags && hashtags.length > 0) formData.append('hashtags', hashtags.join(','));

        const response = await fetch(API_BASE_URL + '/posts', {
            method: 'POST',
            body: formData,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Gonderi paylasilamadi.');
        }
        return await response.json();
    },

    uploadPostImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE_URL + '/posts/upload-image', {
            method: 'POST',
            headers: token ? { 'Authorization': 'Bearer ' + token } : {},
            body: formData,
        });
        if (!response.ok) throw new Error('Resim yuklenemedi.');
        return await response.json(); // { url: '/uploads/posts/...' }
    },

    likePost: async (postId, userId) => {
        const response = await authFetch(API_BASE_URL + '/posts/' + postId + '/like', {
            method: 'POST',
            body: JSON.stringify({ userId: userId }),
        });
        if (!response.ok) throw new Error('Begeni islemi basarisiz.');
        return await response.json(); // { liked: true/false, likeCount: N }
    },

    getComments: async (postId) => {
        const response = await authFetch(API_BASE_URL + '/posts/' + postId + '/comments');
        if (!response.ok) return [];
        return await response.json();
    },

    addComment: async (postId, userId, content) => {
        const response = await authFetch(API_BASE_URL + '/posts/' + postId + '/comments', {
            method: 'POST',
            body: JSON.stringify({ userId: userId, content: content }),
        });
        if (!response.ok) throw new Error('Yorum eklenemedi.');
        return await response.json();
    },

    deletePost: async (postId) => {
        const response = await authFetch(API_BASE_URL + '/posts/' + postId, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Gonderi silinemedi.');
        return await response.json();
    },
};

// Follow
export const followService = {
    follow: async (followerId, targetId) => {
        const response = await authFetch(API_BASE_URL + `/Follow/${followerId}/follow/${targetId}`, {
            method: 'POST',
        });
        if (response.status === 409) return { following: true, alreadyFollowing: true };
        if (!response.ok) throw new Error('Takip islemi basarisiz.');
        return await response.json();
    },

    unfollow: async (followerId, targetId) => {
        const response = await authFetch(API_BASE_URL + `/Follow/${followerId}/unfollow/${targetId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Takip birakma basarisiz.');
        return await response.json();
    },

    getUserStats: async (userId) => {
        const response = await authFetch(API_BASE_URL + '/users/' + userId + '/stats');
        if (!response.ok) throw new Error('Istatistikler yuklenemedi.');
        return await response.json();
    },
};

// Story
export const storyService = {
    getStories: async () => {
        const response = await authFetch(API_BASE_URL + '/story/active');
        if (!response.ok) throw new Error('Hikayeler yuklenemedi.');
        return await response.json();
    },

    uploadStory: async (userId, file, textContent = '', backgroundColor = '#000000', textColor = '#ffffff') => {
        const formData = new FormData();
        formData.append('userId', userId);
        if (file) formData.append('file', file);
        if (textContent) formData.append('textContent', textContent);
        if (backgroundColor) formData.append('backgroundColor', backgroundColor);
        if (textColor) formData.append('textColor', textColor);
        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE_URL + '/story/upload', {
            method: 'POST',
            body: formData,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            }
        });
        if (!response.ok) throw new Error('Hikaye yuklenemedi.');
        return await response.json();
    },

    deleteStory: async (storyId, userId) => {
        const response = await authFetch(`${API_BASE_URL}/story/${storyId}?userId=${userId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Hikaye silinemedi.');
        return await response.json();
    }
};

// Admin
export const adminService = {
    getStats: async () => {
        const response = await authFetch(API_BASE_URL + '/admin/stats');
        if (!response.ok) throw new Error('Istatistikler yuklenemedi.');
        return await response.json();
    },

    getUsers: async () => {
        const response = await authFetch(API_BASE_URL + '/admin/users');
        if (!response.ok) throw new Error('Kullanicilar yuklenemedi.');
        return await response.json();
    },

    toggleUserStatus: async (userId, action) => {
        const response = await authFetch(API_BASE_URL + '/admin/users/' + userId + '/toggle-status', {
            method: 'POST',
            body: JSON.stringify({ action }),
        });
        if (!response.ok) throw new Error('Kullanici durumu guncellenemedi.');
        return await response.json();
    },

    getAuditLogs: async () => {
        const response = await authFetch(API_BASE_URL + '/admin/audit-logs');
        if (!response.ok) throw new Error('Loglar yuklenemedi.');
        return await response.json();
    },

    getPendingEvents: async () => {
        const response = await authFetch(API_BASE_URL + '/admin/pending-events');
        if (!response.ok) return [];
        return await response.json();
    },
    
    getApprovedEvents: async () => {
        const response = await authFetch(API_BASE_URL + '/admin/approved-events');
        if (!response.ok) return [];
        return await response.json();
    },

    getPendingGroups: async () => {
        const response = await authFetch(API_BASE_URL + '/admin/pending-groups');
        if (!response.ok) return [];
        return await response.json();
    },
    
    getApprovedGroups: async () => {
        const response = await authFetch(API_BASE_URL + '/admin/approved-groups');
        if (!response.ok) return [];
        return await response.json();
    },

    approveEvent: async (id) => {
        const response = await authFetch(API_BASE_URL + '/admin/events/' + id + '/approve', { method: 'POST' });
        if (!response.ok) throw new Error('Etkinlik onaylanamadi.');
    },

    deleteEvent: async (id) => {
        const response = await authFetch(API_BASE_URL + '/admin/events/' + id, { method: 'DELETE' });
        if (!response.ok) throw new Error('Etkinlik silinemedi.');
    },

    approveGroup: async (id) => {
        const response = await authFetch(API_BASE_URL + '/admin/groups/' + id + '/approve', { method: 'POST' });
        if (!response.ok) throw new Error('Grup onaylanamadi.');
    },

    deleteGroup: async (id) => {
        const response = await authFetch(API_BASE_URL + '/admin/groups/' + id, { method: 'DELETE' });
        if (!response.ok) throw new Error('Grup silinemedi.');
    },

    getPosts: async () => {
        const response = await authFetch(API_BASE_URL + '/admin/posts');
        if (!response.ok) throw new Error('Gonderiler yuklenemedi.');
        return await response.json();
    },

    deletePost: async (id) => {
        const response = await authFetch(API_BASE_URL + '/admin/posts/' + id, { method: 'DELETE' });
        if (!response.ok) throw new Error('Gönderi silinemedi.');
    },
    deleteLog: async (id) => {
        const response = await authFetch(API_BASE_URL + '/admin/logs/' + id, { method: 'DELETE' });
        if (!response.ok) throw new Error('Log silinemedi.');
    }
};

// Trends
export const trendService = {
    getTrends: async () => {
        const response = await authFetch(API_BASE_URL + '/trends');
        if (!response.ok) throw new Error('Gundem yuklenemedi.');
        return await response.json();
    }
};
// Events
export const eventService = {
    getEvents: async (category, search, userId) => {
        let url = API_BASE_URL + '/events';
        const params = [];
        if (category && category !== 'all') params.push('category=' + encodeURIComponent(category));
        if (search) params.push('search=' + encodeURIComponent(search));
        if (userId) params.push('userId=' + userId);
        if (params.length > 0) url += '?' + params.join('&');
        const response = await authFetch(url);
        if (!response.ok) throw new Error('Etkinlikler yuklenemedi.');
        return await response.json();
    },

    createEvent: async (data, imageFile) => {
        const formData = new FormData();
        formData.append('organizerId', data.organizerId);
        formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        formData.append('eventDate', data.eventDate);
        if (data.endDate) formData.append('endDate', data.endDate);
        formData.append('location', data.location);
        if (data.eventType) formData.append('eventType', data.eventType);
        if (data.maxParticipants) formData.append('maxParticipants', data.maxParticipants);
        if (imageFile) formData.append('image', imageFile);

        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE_URL + '/events', {
            method: 'POST',
            body: formData,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error('Etkinlik olusturulamadi.');
        return await response.json();
    },

    attend: async (eventId, userId) => {
        const response = await authFetch(API_BASE_URL + '/events/' + eventId + '/attend', {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
        if (response.status === 409) return { alreadyAttending: true };
        if (!response.ok) throw new Error('Katilim saglanamadi.');
        return await response.json();
    },

    leave: async (eventId, userId) => {
        const response = await authFetch(API_BASE_URL + '/events/' + eventId + '/attend', {
            method: 'DELETE',
            body: JSON.stringify({ userId }),
        });
        if (!response.ok) throw new Error('Etkinlikten ayrilamadi.');
        return await response.json();
    },

    deleteEvent: async (eventId) => {
        const response = await authFetch(API_BASE_URL + '/events/' + eventId, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Etkinlik silinemedi.');
        return await response.json();
    }
};
// Groups
export const groupService = {
    getGroups: async (category, search) => {
        let url = API_BASE_URL + '/groups';
        const params = [];
        if (category && category !== 'all') params.push('category=' + encodeURIComponent(category));
        if (search) params.push('search=' + encodeURIComponent(search));
        if (params.length > 0) url += '?' + params.join('&');
        const response = await authFetch(url);
        if (!response.ok) throw new Error('Gruplar yuklenemedi.');
        return await response.json();
    },

    getMyGroups: async (userId) => {
        const response = await authFetch(API_BASE_URL + '/groups/my?userId=' + userId);
        if (!response.ok) throw new Error('Gruplarim yuklenemedi.');
        return await response.json();
    },

    createGroup: async (data) => {
        const response = await authFetch(API_BASE_URL + '/groups', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Grup olusturulamadi.');
        return await response.json();
    },

    joinGroup: async (groupId, userId) => {
        const response = await authFetch(API_BASE_URL + '/groups/' + groupId + '/join', {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
        if (!response.ok) throw new Error('Gruba katilamadi.');
        return await response.json();
    },

    leaveGroup: async (groupId, userId) => {
        const response = await authFetch(API_BASE_URL + '/groups/' + groupId + '/leave', {
            method: 'DELETE',
            body: JSON.stringify({ userId }),
        });
        if (!response.ok) throw new Error('Gruptan ayrilamadi.');
        return await response.json();
    },

    deleteGroup: async (groupId) => {
        const response = await authFetch(API_BASE_URL + '/groups/' + groupId, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Grup silinemedi.');
        return await response.json();
    }
};

export const chatService = {
    getConversations: async () => {
        const response = await authFetch(API_BASE_URL + '/messages/conversations');
        if (!response.ok) throw new Error('Sohbetler yuklenemedi.');
        return await response.json();
    },
    getHistory: async (conversationId, page = 1) => {
        const response = await authFetch(API_BASE_URL + '/messages/' + conversationId + '/history?page=' + page);
        if (!response.ok) throw new Error('Mesaj gecmisi yuklenemedi.');
        return await response.json();
    },
    startConversation: async (targetUserId) => {
        const response = await authFetch(API_BASE_URL + '/messages/start/' + targetUserId, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Sohbet baslatilamadi.');
        return await response.json();
    }
};

export const profileService = {
    getProfile: async (id) => {
        const response = await authFetch(API_BASE_URL + '/profile/' + id);
        if (!response.ok) throw new Error('Profil bilgileri alinamadi.');
        return await response.json();
    },
    uploadAvatar: async (userId, file) => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(API_BASE_URL + '/profile/' + userId + '/avatar', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        if (!response.ok) throw new Error('Profil resmi yüklenemedi.');
        return await response.json();
    },
    removeAvatar: async (userId) => {
        const response = await authFetch(API_BASE_URL + '/profile/' + userId + '/avatar', {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Profil resmi kaldırılamadı.');
        return await response.json();
    },
    updateProfile: async (userId, data) => {
        const response = await authFetch(API_BASE_URL + '/profile/' + userId, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Profil güncellenemedi.');
        }
        return await response.json();
    },
    uploadCover: async (userId, file) => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(API_BASE_URL + '/profile/' + userId + '/cover', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        if (!response.ok) throw new Error('Kapak fotoğrafı yüklenemedi.');
        return await response.json();
    },
    removeCover: async (userId) => {
        const response = await authFetch(API_BASE_URL + '/profile/' + userId + '/cover', {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Kapak fotoğrafı kaldırılamadı.');
        return await response.json();
    }
};