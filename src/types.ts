/**
 * FLURE Technical Specification & Data Dictionary
 * Domain Error Codes, Data Models, and API Interfaces
 */

// Domain Error Codes Standard: FLR-<DOMAIN>-<NNN>
export type FlureErrorCode =
  | 'FLR-AUTH-001' // Email sudah terdaftar (409)
  | 'FLR-AUTH-002' // Usia tidak memenuhi syarat (<18) (403)
  | 'FLR-AUTH-003' // Kredensial tidak valid (401)
  | 'FLR-CONT-001' // Rate limit posting terlampaui (429)
  | 'FLR-CONT-002' // Postingan tidak ditemukan (404)
  | 'FLR-CONN-001' // Ambang karakter belum tercapai (403)
  | 'FLR-CONN-002' // Pengguna telah diblokir (403)
  | 'FLR-CONN-003' // Voice note telah hangus (410)
  | 'FLR-CONN-004' // Foto tidak dapat diakses dari galeri (400)
  | 'FLR-SAFE-001' // Laporan gagal dikirim (500)
  | 'FLR-SYS-001'  // Kesalahan server internal (500)
  | 'FLR-SYS-002'; // Sesi kedaluwarsa (401)

export interface ApiErrorResponse {
  error: {
    code: FlureErrorCode;
    message: string;
    details?: string;
  };
}

export type AccountStatus = 'active' | 'restricted_24h' | 'suspended' | 'banned';
export type UserRole = 'user' | 'moderator' | 'admin';
export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export interface User {
  id: string;
  email: string;
  birth_date: string; // YYYY-MM-DD
  gender: Gender;
  avatar_url?: string;
  account_status: AccountStatus;
  role: UserRole;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  author_email: string;
  author_avatar?: string;
  author_gender?: Gender;
  content: string;
  like_count: number;
  likes: string[]; // array of user_ids who liked
  comment_count: number;
  is_edited: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  author_email: string;
  author_avatar?: string;
  content: string;
  is_edited: boolean;
  created_at: string;
}

export type FriendshipStatus = 'pending' | 'friended';

export interface Friendship {
  id: string;
  user_a_id: string;
  user_b_id: string;
  cumulative_char_count: number;
  status: FriendshipStatus;
  friended_at?: string;
  created_at: string;
}

export type MessageContentType = 'text' | 'photo' | 'voice_note';
export type MessageReadStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content_type: MessageContentType;
  content_ref?: string; // Text string or photo image URL / VoiceNote ID
  char_count: number;
  read_status: MessageReadStatus;
  voice_note?: VoiceNote;
  watermark_verified?: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_a_id: string;
  user_b_id: string;
  partner?: User; // Dynamically populated
  cumulative_char_count: number;
  status: FriendshipStatus;
  friended_at?: string;
  last_message?: Message;
  unread_count?: number;
  created_at: string;
}

export interface VoiceNote {
  id: string;
  message_id: string;
  duration_seconds: number;
  play_count: number;
  max_plays: number; // default 3
  is_expired: boolean;
  audio_url?: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export type ReportTargetType = 'post' | 'comment' | 'user' | 'message';
export type ReportReason = 'spam' | 'harassment' | 'inappropriate_content' | 'other';
export type ReportStatus = 'open' | 'reviewed' | 'action_taken' | 'dismissed';

export interface Report {
  id: string;
  reporter_id: string;
  reporter_email: string;
  target_type: ReportTargetType;
  target_id: string;
  target_preview?: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  action_taken?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  action: string;
  target_id?: string;
  reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type NotificationType =
  | 'comment'
  | 'like'
  | 'message'
  | 'friendship'
  | 'voicenote'
  | 'restriction'
  | 'report_update';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  reference_id?: string;
  created_at: string;
}

export interface AdminDashboardSummary {
  open_reports: number;
  restricted_accounts_24h: number;
  dau: number;
  mau: number;
  total_users: number;
  total_posts: number;
}
