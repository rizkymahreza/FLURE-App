import {
  User,
  Post,
  Comment,
  Conversation,
  Message,
  Report,
  AuditLog,
  NotificationItem,
  AdminDashboardSummary,
  FlureErrorCode,
  AccountStatus,
} from '../types';

export class ApiError extends Error {
  code: FlureErrorCode;

  constructor(code: FlureErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, currentUserId?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (currentUserId) {
    headers['x-user-id'] = currentUserId;
  }

  const response = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorObj = data.error || {};
    throw new ApiError(errorObj.code || 'FLR-SYS-001', errorObj.message || 'Terjadi kesalahan pada server.');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; birth_date: string }) =>
    request<{ user_id: string; user: User; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProfile: (currentUserId: string, data: { avatar_url?: string; gender?: string; bio?: string }) =>
    request<{ user: User }>('/users/me/profile', { method: 'PATCH', body: JSON.stringify(data) }, currentUserId),

  getUserProfile: (currentUserId: string, userId: string) =>
    request<{ user: User & { is_friended: boolean } }>(`/users/${userId}`, {}, currentUserId),

  searchUsers: (currentUserId: string, query: string) =>
    request<{ users: (User & { is_friended: boolean; conversation_id?: string })[] }>(
      `/users?q=${encodeURIComponent(query)}`,
      {},
      currentUserId,
    ),

  // Feed & Posts
  getFeed: (currentUserId: string) => request<{ posts: Post[] }>('/feed', {}, currentUserId),

  createPost: (currentUserId: string, content: string) =>
    request<{ post: Post }>('/posts', { method: 'POST', body: JSON.stringify({ content }) }, currentUserId),

  likePost: (currentUserId: string, postId: string) =>
    request<{ post: Post }>(`/posts/${postId}/like`, { method: 'POST' }, currentUserId),

  getComments: (currentUserId: string, postId: string) =>
    request<{ comments: Comment[] }>(`/posts/${postId}/comments`, {}, currentUserId),

  createComment: (currentUserId: string, postId: string, content: string) =>
    request<{ comment: Comment }>(
      `/posts/${postId}/comments`,
      { method: 'POST', body: JSON.stringify({ content }) },
      currentUserId,
    ),

  deleteComment: (currentUserId: string, commentId: string) =>
    request<{ message: string }>(`/comments/${commentId}`, { method: 'DELETE' }, currentUserId),

  // Connection Domain
  getConversations: (currentUserId: string) =>
    request<{ conversations: Conversation[] }>('/conversations', {}, currentUserId),

  startConversation: (currentUserId: string, targetUserId: string) =>
    request<{ conversation: Conversation }>(
      '/conversations/start',
      { method: 'POST', body: JSON.stringify({ target_user_id: targetUserId }) },
      currentUserId,
    ),

  getMessages: (currentUserId: string, conversationId: string) =>
    request<{ conversation: Conversation; messages: Message[] }>(
      `/conversations/${conversationId}/messages`,
      {},
      currentUserId,
    ),

  sendMessage: (
    currentUserId: string,
    conversationId: string,
    payload: { content_type: 'text' | 'photo' | 'voice_note'; content: string; duration?: number },
  ) =>
    request<{ message: Message; conversation: Conversation }>(
      `/conversations/${conversationId}/messages`,
      { method: 'POST', body: JSON.stringify(payload) },
      currentUserId,
    ),

  playVoiceNote: (currentUserId: string, voiceNoteId: string) =>
    request<{ play_count: number; max_plays: number; is_expired: boolean; audio_url?: string }>(
      `/voice-notes/${voiceNoteId}/play`,
      { method: 'POST' },
      currentUserId,
    ),

  blockUser: (currentUserId: string, blockedUserId: string) =>
    request<{ block: any; message: string }>(
      '/blocks',
      { method: 'POST', body: JSON.stringify({ blocked_user_id: blockedUserId }) },
      currentUserId,
    ),

  getBlockedUsers: (currentUserId: string) =>
    request<{ blocked_users: any[] }>('/blocks/me', {}, currentUserId),

  // Trust & Safety
  createReport: (
    currentUserId: string,
    data: {
      target_type: 'post' | 'comment' | 'user' | 'message';
      target_id: string;
      reason: 'spam' | 'harassment' | 'inappropriate_content' | 'other';
      description?: string;
      target_preview?: string;
    },
  ) =>
    request<{ report: Report; message: string }>(
      '/reports',
      { method: 'POST', body: JSON.stringify(data) },
      currentUserId,
    ),

  getAdminReports: (currentUserId: string, status?: string) =>
    request<{ reports: Report[] }>(`/admin/reports${status ? `?status=${status}` : ''}`, {}, currentUserId),

  takeAdminReportAction: (currentUserId: string, reportId: string, action: string, reason: string) =>
    request<{ report: Report; message: string }>(
      `/admin/reports/${reportId}/action`,
      { method: 'POST', body: JSON.stringify({ action, reason }) },
      currentUserId,
    ),

  updateAdminUserStatus: (currentUserId: string, userId: string, status: AccountStatus, reason: string) =>
    request<{ user: User }>(
      `/admin/users/${userId}/status`,
      { method: 'PATCH', body: JSON.stringify({ status, reason }) },
      currentUserId,
    ),

  getAdminAuditLogs: (currentUserId: string) =>
    request<{ logs: AuditLog[] }>('/admin/audit-log', {}, currentUserId),

  getAdminSummary: (currentUserId: string) =>
    request<AdminDashboardSummary>('/admin/dashboard/summary', {}, currentUserId),

  // Notifications
  getNotifications: (currentUserId: string) =>
    request<{ notifications: NotificationItem[] }>('/notifications', {}, currentUserId),
};
