import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  User,
  Post,
  Comment,
  Conversation,
  Message,
  VoiceNote,
  Block,
  Report,
  AuditLog,
  NotificationItem,
  FlureErrorCode,
  AccountStatus,
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Helper function for age calculation from birth_date (YYYY-MM-DD)
function calculateAge(birthDateStr: string): number {
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Memory Database Store
const db = {
  users: new Map<string, User>(),
  posts: new Map<string, Post>(),
  comments: new Map<string, Comment>(),
  conversations: new Map<string, Conversation>(),
  messages: new Map<string, Message>(),
  voiceNotes: new Map<string, VoiceNote>(),
  blocks: new Map<string, Block>(),
  reports: new Map<string, Report>(),
  auditLogs: [] as AuditLog[],
  notifications: new Map<string, NotificationItem[]>(),
  // Anti-spam & Rate limiting tracking
  userPostTimestamps: new Map<string, number[]>(),
  userPostViolations: new Map<string, number>(),
  failedLoginAttempts: new Map<string, { count: number; cooldownUntil: number }>(),
};

// Seed initial production-ready data
function seedInitialData() {
  const now = new Date().toISOString();

  // Seed Users
  const user1: User = {
    id: 'user_rizky',
    email: 'rizky@flure.app',
    birth_date: '1998-05-14',
    gender: 'male',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    account_status: 'active',
    role: 'user',
    bio: 'Pencinta fotografi lanskap dan diskusi mendalam. Percakapan jujur > obrolan ringan.',
    created_at: now,
    updated_at: now,
  };

  const user2: User = {
    id: 'user_nadia',
    email: 'nadia@flure.app',
    birth_date: '2000-11-22',
    gender: 'female',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    account_status: 'active',
    role: 'user',
    bio: 'Menjelajahi ide-ide filsafat, musik ambient, dan ruang aman di FLURE.',
    created_at: now,
    updated_at: now,
  };

  const user3: User = {
    id: 'user_alex',
    email: 'alex@flure.app',
    birth_date: '1995-03-10',
    gender: 'non_binary',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    account_status: 'active',
    role: 'user',
    bio: 'Desainer UI/UX & pendengar setia. Menghargai komunikasi bertahap.',
    created_at: now,
    updated_at: now,
  };

  const adminUser: User = {
    id: 'user_admin',
    email: 'admin@flure.app',
    birth_date: '1992-08-01',
    gender: 'prefer_not_to_say',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    account_status: 'active',
    role: 'admin',
    bio: 'Moderator & Sistem Admin FLURE. Menjaga privasi dan integritas Progressive Trust.',
    created_at: now,
    updated_at: now,
  };

  [user1, user2, user3, adminUser].forEach((u) => db.users.set(u.id, u));

  // Seed Posts
  const post1: Post = {
    id: 'post_1',
    user_id: user1.id,
    author_email: user1.email,
    author_avatar: user1.avatar_url,
    author_gender: user1.gender,
    content:
      'Di era media sosial serba cepat, saya sangat menyukai filosofi Progressive Trust. Hubungan yang bermakna tumbuh secara bertahap dari interaksi yang jujur.',
    like_count: 5,
    likes: [user2.id, user3.id],
    comment_count: 2,
    is_edited: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  };

  const post2: Post = {
    id: 'post_2',
    user_id: user2.id,
    author_email: user2.email,
    author_avatar: user2.avatar_url,
    author_gender: user2.gender,
    content:
      'Memotret momen tanpa filter berlebihan dan langsung dari kamera adalah pengalaman yang membebaskan. Tidak ada galeri tersembunyi, hanya keaslian.',
    like_count: 3,
    likes: [user1.id],
    comment_count: 1,
    is_edited: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  };

  db.posts.set(post1.id, post1);
  db.posts.set(post2.id, post2);

  // Seed Comments
  const comment1: Comment = {
    id: 'comm_1',
    post_id: post1.id,
    user_id: user2.id,
    author_email: user2.email,
    author_avatar: user2.avatar_url,
    content: 'Sangat setuju! Batas 800 karakter membuat kita benar-benar mendengarkan sebelum berbagi terlalu banyak.',
    is_edited: false,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  };
  db.comments.set(comment1.id, comment1);

  // Seed Conversations
  // Conv 1: Rizky & Nadia -> Cumulative chars = 740 (Pending - close to 800 threshold!)
  const conv1: Conversation = {
    id: 'conv_rizky_nadia',
    user_a_id: user1.id,
    user_b_id: user2.id,
    cumulative_char_count: 740,
    status: 'pending',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  };

  // Conv 2: Rizky & Alex -> Cumulative chars = 940 (Friended - Camera & Voice unlocked!)
  const conv2: Conversation = {
    id: 'conv_rizky_alex',
    user_a_id: user1.id,
    user_b_id: user3.id,
    cumulative_char_count: 940,
    status: 'friended',
    friended_at: new Date(Date.now() - 43200000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
  };

  db.conversations.set(conv1.id, conv1);
  db.conversations.set(conv2.id, conv2);

  // Seed Messages for Conv 1
  const msg1: Message = {
    id: 'msg_1',
    conversation_id: conv1.id,
    sender_id: user1.id,
    content_type: 'text',
    content_ref: 'Halo Nadia! Salam kenal. Saya membaca postinganmu tentang arsitektur informasi dan desain minimalis.',
    char_count: 106,
    read_status: 'read',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  };

  const msg2: Message = {
    id: 'msg_2',
    conversation_id: conv1.id,
    sender_id: user2.id,
    content_type: 'text',
    content_ref: 'Halo Rizky! Terima kasih sudah menyapa. Saya sangat antusias membangun ruang obrolan yang tenang dan tanpa distraksi iklan.',
    char_count: 135,
    read_status: 'read',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  };

  const msg3: Message = {
    id: 'msg_3',
    conversation_id: conv1.id,
    sender_id: user1.id,
    content_type: 'text',
    content_ref: 'Konsep FLURE dengan ambang 800 karakter benar-benar menarik. Saat ini progres kita sudah di 740 karakter! Tinggal 60 karakter lagi untuk membuka status Friended.',
    char_count: 168,
    read_status: 'read',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  };

  [msg1, msg2, msg3].forEach((m) => db.messages.set(m.id, m));

  // Seed Voice Note for Conv 2 (Alex to Rizky)
  const vn1: VoiceNote = {
    id: 'vn_1',
    message_id: 'msg_alex_vn',
    duration_seconds: 14,
    play_count: 2, // 2 plays done out of 3 max! Next play is last!
    max_plays: 3,
    is_expired: false,
    audio_url: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
  };
  db.voiceNotes.set(vn1.id, vn1);

  const msgAlexVn: Message = {
    id: 'msg_alex_vn',
    conversation_id: conv2.id,
    sender_id: user3.id,
    content_type: 'voice_note',
    content_ref: vn1.id,
    char_count: 0,
    read_status: 'read',
    voice_note: vn1,
    created_at: new Date(Date.now() - 1800000).toISOString(),
  };
  db.messages.set(msgAlexVn.id, msgAlexVn);

  // Seed Reports
  const report1: Report = {
    id: 'rep_1',
    reporter_id: user2.id,
    reporter_email: user2.email,
    target_type: 'post',
    target_id: post1.id,
    target_preview: 'Laporan pengujian moderasi antrian.',
    reason: 'spam',
    description: 'Mohon periksa kiriman terulang untuk verifikasi anti-spam.',
    status: 'open',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  };
  db.reports.set(report1.id, report1);

  // Seed Audit Logs
  db.auditLogs.push({
    id: 'audit_1',
    actor_id: adminUser.id,
    actor_email: adminUser.email,
    action: 'system.initialized',
    reason: 'Inisialisasi sistem FLURE V1.0 Progressive Trust Platform',
    created_at: now,
  });
}

seedInitialData();

// Middleware: Standard Error Response
function sendError(res: express.Response, statusCode: number, code: FlureErrorCode, message: string) {
  return res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}

// ==================== AUTH & IDENTITY API ====================

// POST /api/v1/auth/register
app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, birth_date } = req.body;

  if (!email || !password || !birth_date) {
    return sendError(res, 400, 'FLR-SYS-001', 'Email, password, dan tanggal lahir wajib diisi.');
  }

  // Check email uniqueness
  const existingUser = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return sendError(res, 409, 'FLR-AUTH-001', 'Email ini sudah digunakan. Silakan login.');
  }

  // Calculate age
  const age = calculateAge(birth_date);
  if (age < 18) {
    return sendError(res, 403, 'FLR-AUTH-002', 'Maaf, FLURE hanya untuk pengguna berusia 18 tahun ke atas.');
  }

  const now = new Date().toISOString();
  const newUser: User = {
    id: `user_${Date.now()}`,
    email,
    birth_date,
    gender: 'prefer_not_to_say',
    account_status: 'active',
    role: 'user',
    created_at: now,
    updated_at: now,
  };

  db.users.set(newUser.id, newUser);

  return res.status(201).json({
    user_id: newUser.id,
    status: 'pending_verification',
    user: newUser,
    message: 'Registrasi berhasil. Silakan lengkapi profil Anda.',
  });
});

// POST /api/v1/auth/login
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Rate limiting failed attempts
  const failedTrack = db.failedLoginAttempts.get(email) || { count: 0, cooldownUntil: 0 };
  if (failedTrack.cooldownUntil > Date.now()) {
    const remainingSeconds = Math.ceil((failedTrack.cooldownUntil - Date.now()) / 1000);
    return sendError(
      res,
      401,
      'FLR-AUTH-003',
      `Terlalu banyak percobaan login salah. Coba lagi dalam ${remainingSeconds} detik.`,
    );
  }

  const user = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

  // Password check (simple check for demo)
  if (!user || password !== 'password123') {
    failedTrack.count += 1;
    if (failedTrack.count >= 5) {
      failedTrack.cooldownUntil = Date.now() + 60000; // 60s cooldown
    }
    db.failedLoginAttempts.set(email, failedTrack);
    return sendError(res, 401, 'FLR-AUTH-003', 'Email atau kata sandi salah.');
  }

  // Reset failed attempts
  db.failedLoginAttempts.delete(email);

  // Account status check
  if (user.account_status === 'banned') {
    return sendError(res, 403, 'FLR-SYS-002', 'Akun Anda telah ditangguhkan secara permanen.');
  }

  return res.json({
    access_token: `token_${user.id}_${Date.now()}`,
    refresh_token: `refresh_${user.id}_${Date.now()}`,
    user,
  });
});

// PATCH /api/v1/users/me/profile
app.patch('/api/v1/users/me/profile', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const user = db.users.get(userId);
  if (!user) {
    return sendError(res, 401, 'FLR-SYS-002', 'Sesi kedaluwarsa. Silakan login kembali.');
  }

  const { avatar_url, gender, bio } = req.body;
  if (avatar_url !== undefined) user.avatar_url = avatar_url;
  if (gender) user.gender = gender;
  if (bio !== undefined) user.bio = bio;
  user.updated_at = new Date().toISOString();

  db.users.set(user.id, user);
  return res.json({ user });
});

// GET /api/v1/users/:userId
app.get('/api/v1/users/:userId', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const targetUserId = req.params.userId;

  const targetUser = db.users.get(targetUserId);
  if (!targetUser) {
    return sendError(res, 404, 'FLR-SYS-001', 'Pengguna tidak ditemukan.');
  }

  // Check block status
  const isBlocked = Array.from(db.blocks.values()).some(
    (b) =>
      (b.blocker_id === currentUserId && b.blocked_id === targetUserId) ||
      (b.blocker_id === targetUserId && b.blocked_id === currentUserId),
  );

  if (isBlocked) {
    return sendError(res, 403, 'FLR-CONN-002', 'Tindakan tidak dapat dilakukan.');
  }

  // Check friendship for Progressive Trust gender reveal
  let isFriended = false;
  if (currentUserId === targetUserId) {
    isFriended = true;
  } else {
    const conv = Array.from(db.conversations.values()).find(
      (c) =>
        (c.user_a_id === currentUserId && c.user_b_id === targetUserId) ||
        (c.user_a_id === targetUserId && c.user_b_id === currentUserId),
    );
    if (conv && conv.status === 'friended') {
      isFriended = true;
    }
  }

  const safeProfile = {
    ...targetUser,
    gender: isFriended ? targetUser.gender : ('tersembunyi' as any),
    is_friended: isFriended,
  };

  return res.json({ user: safeProfile });
});

// GET /api/v1/users (Search / Discover)
app.get('/api/v1/users', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const q = ((req.query.q as string) || '').toLowerCase();

  // Exclude blocked users and current user
  const blockedIds = new Set(
    Array.from(db.blocks.values())
      .filter((b) => b.blocker_id === currentUserId || b.blocked_id === currentUserId)
      .flatMap((b) => [b.blocker_id, b.blocked_id]),
  );

  const users = Array.from(db.users.values())
    .filter((u) => u.id !== currentUserId && !blockedIds.has(u.id))
    .filter((u) => u.email.toLowerCase().includes(q) || (u.bio && u.bio.toLowerCase().includes(q)))
    .map((u) => {
      const conv = Array.from(db.conversations.values()).find(
        (c) => (c.user_a_id === currentUserId && c.user_b_id === u.id) || (c.user_a_id === u.id && c.user_b_id === currentUserId),
      );
      const isFriended = conv?.status === 'friended';
      return {
        ...u,
        gender: isFriended ? u.gender : 'tersembunyi',
        is_friended: isFriended,
        conversation_id: conv?.id,
      };
    });

  return res.json({ users });
});

// ==================== CONTENT DOMAIN (FEED & POSTS) ====================

// GET /api/v1/feed
app.get('/api/v1/feed', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;

  const blockedIds = new Set(
    Array.from(db.blocks.values())
      .filter((b) => b.blocker_id === currentUserId || b.blocked_id === currentUserId)
      .flatMap((b) => [b.blocker_id, b.blocked_id]),
  );

  const posts = Array.from(db.posts.values())
    .filter((p) => !blockedIds.has(p.user_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return res.json({ posts, next_cursor: null });
});

// POST /api/v1/posts
app.post('/api/v1/posts', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const user = db.users.get(currentUserId);
  if (!user) {
    return sendError(res, 401, 'FLR-SYS-002', 'Sesi kedaluwarsa.');
  }

  if (user.account_status === 'restricted_24h') {
    return sendError(res, 429, 'FLR-CONT-001', 'Akun Anda dibatasi sementara selama 24 jam karena terdeteksi spam.');
  }

  const { content } = req.body;
  if (!content || !content.trim() || content.length > 2000) {
    return sendError(res, 400, 'FLR-SYS-001', 'Konten postingan wajib diisi (1-2000 karakter).');
  }

  // Anti-spam Rate Limiting (Max 3 posts / 18 seconds)
  const nowMs = Date.now();
  const timestamps = (db.userPostTimestamps.get(currentUserId) || []).filter((t) => nowMs - t <= 18000);

  if (timestamps.length >= 3) {
    // Increment violation count
    const violations = (db.userPostViolations.get(currentUserId) || 0) + 1;
    db.userPostViolations.set(currentUserId, violations);

    if (violations >= 2) {
      user.account_status = 'restricted_24h';
      db.users.set(user.id, user);
      return sendError(
        res,
        429,
        'FLR-CONT-001',
        'Pelanggaran rate limit terulang. Akun Anda telah dibatasi sementara selama 24 jam.',
      );
    }

    return sendError(res, 429, 'FLR-CONT-001', 'Terdeteksi spam. Postingan dibatasi sementara (maksimal 3x per 18 detik).');
  }

  timestamps.push(nowMs);
  db.userPostTimestamps.set(currentUserId, timestamps);

  const newPost: Post = {
    id: `post_${Date.now()}`,
    user_id: user.id,
    author_email: user.email,
    author_avatar: user.avatar_url,
    author_gender: user.gender,
    content: content.trim(),
    like_count: 0,
    likes: [],
    comment_count: 0,
    is_edited: false,
    created_at: new Date().toISOString(),
  };

  db.posts.set(newPost.id, newPost);
  return res.status(201).json({ post: newPost });
});

// POST /api/v1/posts/:id/like
app.post('/api/v1/posts/:id/like', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const post = db.posts.get(req.params.id);
  if (!post) {
    return sendError(res, 404, 'FLR-CONT-002', 'Postingan tidak ditemukan.');
  }

  const index = post.likes.indexOf(currentUserId);
  if (index >= 0) {
    post.likes.splice(index, 1);
  } else {
    post.likes.push(currentUserId);
  }
  post.like_count = post.likes.length;
  db.posts.set(post.id, post);

  return res.json({ post });
});

// GET /api/v1/posts/:id/comments
app.get('/api/v1/posts/:id/comments', (req, res) => {
  const comments = Array.from(db.comments.values())
    .filter((c) => c.post_id === req.params.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return res.json({ comments });
});

// POST /api/v1/posts/:id/comments
app.post('/api/v1/posts/:id/comments', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const user = db.users.get(currentUserId);
  if (!user) return sendError(res, 401, 'FLR-SYS-002', 'Sesi kedaluwarsa.');

  const post = db.posts.get(req.params.id);
  if (!post) return sendError(res, 404, 'FLR-CONT-002', 'Postingan tidak ditemukan.');

  const { content } = req.body;
  if (!content || !content.trim() || content.length > 500) {
    return sendError(res, 400, 'FLR-SYS-001', 'Komentar wajib diisi (1-500 karakter).');
  }

  const comment: Comment = {
    id: `comm_${Date.now()}`,
    post_id: post.id,
    user_id: user.id,
    author_email: user.email,
    author_avatar: user.avatar_url,
    content: content.trim(),
    is_edited: false,
    created_at: new Date().toISOString(),
  };

  db.comments.set(comment.id, comment);
  post.comment_count += 1;
  db.posts.set(post.id, post);

  return res.status(201).json({ comment });
});

// DELETE /api/v1/comments/:id
app.delete('/api/v1/comments/:id', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const comment = db.comments.get(req.params.id);
  if (!comment) return sendError(res, 404, 'FLR-SYS-001', 'Komentar tidak ditemukan.');

  const post = db.posts.get(comment.post_id);
  const isPostOwner = post?.user_id === currentUserId;
  const isCommentOwner = comment.user_id === currentUserId;

  if (!isPostOwner && !isCommentOwner) {
    return sendError(res, 403, 'FLR-SYS-001', 'Anda tidak memiliki hak untuk menghapus komentar ini.');
  }

  db.comments.delete(comment.id);
  if (post && post.comment_count > 0) {
    post.comment_count -= 1;
    db.posts.set(post.id, post);
  }

  return res.json({ message: 'Komentar berhasil dihapus.' });
});

// ==================== CONNECTION DOMAIN (CHAT & PROGRESSIVE TRUST) ====================

// GET /api/v1/conversations
app.get('/api/v1/conversations', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;

  const blockedIds = new Set(
    Array.from(db.blocks.values())
      .filter((b) => b.blocker_id === currentUserId || b.blocked_id === currentUserId)
      .flatMap((b) => [b.blocker_id, b.blocked_id]),
  );

  const convs = Array.from(db.conversations.values())
    .filter((c) => (c.user_a_id === currentUserId || c.user_b_id === currentUserId) && !blockedIds.has(c.user_a_id === currentUserId ? c.user_b_id : c.user_a_id))
    .map((c) => {
      const partnerId = c.user_a_id === currentUserId ? c.user_b_id : c.user_a_id;
      const partner = db.users.get(partnerId);

      // Get last message
      const messages = Array.from(db.messages.values())
        .filter((m) => m.conversation_id === c.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return {
        ...c,
        partner: partner
          ? {
              ...partner,
              gender: c.status === 'friended' ? partner.gender : ('tersembunyi' as any),
            }
          : undefined,
        last_message: messages[0],
      };
    })
    .sort((a, b) => {
      const tA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.created_at).getTime();
      const tB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.created_at).getTime();
      return tB - tA;
    });

  return res.json({ conversations: convs });
});

// POST /api/v1/conversations/start
app.post('/api/v1/conversations/start', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const { target_user_id } = req.body;

  if (!target_user_id) return sendError(res, 400, 'FLR-SYS-001', 'Target user wajib diisi.');

  // Check blocks
  const isBlocked = Array.from(db.blocks.values()).some(
    (b) =>
      (b.blocker_id === currentUserId && b.blocked_id === target_user_id) ||
      (b.blocker_id === target_user_id && b.blocked_id === currentUserId),
  );

  if (isBlocked) {
    return sendError(res, 403, 'FLR-CONN-002', 'Tindakan tidak dapat dilakukan.');
  }

  let conv = Array.from(db.conversations.values()).find(
    (c) =>
      (c.user_a_id === currentUserId && c.user_b_id === target_user_id) ||
      (c.user_a_id === target_user_id && c.user_b_id === currentUserId),
  );

  if (!conv) {
    conv = {
      id: `conv_${currentUserId}_${target_user_id}`,
      user_a_id: currentUserId,
      user_b_id: target_user_id,
      cumulative_char_count: 0,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    db.conversations.set(conv.id, conv);
  }

  return res.json({ conversation: conv });
});

// GET /api/v1/conversations/:id/messages
app.get('/api/v1/conversations/:id/messages', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const conv = db.conversations.get(req.params.id);

  if (!conv) return sendError(res, 404, 'FLR-SYS-001', 'Percakapan tidak ditemukan.');

  // Check block
  const isBlocked = Array.from(db.blocks.values()).some(
    (b) =>
      (b.blocker_id === currentUserId && (b.blocked_id === conv.user_a_id || b.blocked_id === conv.user_b_id)) ||
      (b.blocked_id === currentUserId && (b.blocker_id === conv.user_a_id || b.blocker_id === conv.user_b_id)),
  );

  if (isBlocked) {
    return sendError(res, 403, 'FLR-CONN-002', 'Tindakan tidak dapat dilakukan.');
  }

  const messages = Array.from(db.messages.values())
    .filter((m) => m.conversation_id === conv.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return res.json({
    conversation: conv,
    messages,
  });
});

// POST /api/v1/conversations/:id/messages (SEND MESSAGE & ACCUMULATE CHARACTERS)
app.post('/api/v1/conversations/:id/messages', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const conv = db.conversations.get(req.params.id);

  if (!conv) return sendError(res, 404, 'FLR-SYS-001', 'Percakapan tidak ditemukan.');

  // Check blocks
  const isBlocked = Array.from(db.blocks.values()).some(
    (b) =>
      (b.blocker_id === currentUserId && (b.blocked_id === conv.user_a_id || b.blocked_id === conv.user_b_id)) ||
      (b.blocked_id === currentUserId && (b.blocker_id === conv.user_a_id || b.blocker_id === conv.user_b_id)),
  );

  if (isBlocked) {
    return sendError(res, 403, 'FLR-CONN-002', 'Tindakan tidak dapat dilakukan.');
  }

  const { content_type, content, duration } = req.body;

  // PROGRESSIVE TRUST UNLOCK CHECK:
  // Photo & Voice Note features require 'friended' status (cumulative_char_count >= 800)
  if ((content_type === 'photo' || content_type === 'voice_note') && conv.status !== 'friended') {
    return sendError(
      res,
      403,
      'FLR-CONN-001',
      'Ambang karakter belum tercapai. Fitur ini terbuka setelah percakapan lebih panjang (>800 karakter).',
    );
  }

  // Calculate char count
  let charCount = 0;
  if (content_type === 'text' && content) {
    charCount = content.trim().length;
  }

  const now = new Date().toISOString();
  let voiceNote: VoiceNote | undefined;

  if (content_type === 'voice_note') {
    const vnId = `vn_${Date.now()}`;
    voiceNote = {
      id: vnId,
      message_id: '',
      duration_seconds: duration || 10,
      play_count: 0,
      max_plays: 3,
      is_expired: false,
      audio_url: content, // audio data URL or sound ref
    };
    db.voiceNotes.set(vnId, voiceNote);
  }

  const msg: Message = {
    id: `msg_${Date.now()}`,
    conversation_id: conv.id,
    sender_id: currentUserId,
    content_type,
    content_ref: content_type === 'voice_note' ? voiceNote?.id : content,
    char_count: charCount,
    read_status: 'delivered',
    voice_note: voiceNote,
    watermark_verified: content_type === 'photo',
    created_at: now,
  };

  if (voiceNote) {
    voiceNote.message_id = msg.id;
  }

  db.messages.set(msg.id, msg);

  // Accumulate characters if text message
  if (content_type === 'text' && charCount > 0) {
    conv.cumulative_char_count += charCount;

    // CHECK PROGRESSIVE TRUST THRESHOLD (800 chars)
    if (conv.cumulative_char_count >= 800 && conv.status === 'pending') {
      conv.status = 'friended';
      conv.friended_at = now;

      // Add Notification to both users
      const partnerId = conv.user_a_id === currentUserId ? conv.user_b_id : conv.user_a_id;
      const notifBody = 'Status berteman berhasil dicapai! Fitur foto kamera langsung & voice note kini terbuka.';

      const addNotif = (uId: string) => {
        const list = db.notifications.get(uId) || [];
        list.push({
          id: `notif_${Date.now()}_${uId}`,
          user_id: uId,
          type: 'friendship',
          title: '🎉 Ambang Pertemanan Tercapai!',
          body: notifBody,
          is_read: false,
          reference_id: conv.id,
          created_at: now,
        });
        db.notifications.set(uId, list);
      };

      addNotif(currentUserId);
      addNotif(partnerId);
    }
  }

  db.conversations.set(conv.id, conv);

  return res.status(201).json({
    message: msg,
    conversation: conv,
  });
});

// POST /api/v1/voice-notes/:id/play (PLAY & INCREMENT COUNTER)
app.post('/api/v1/voice-notes/:id/play', (req, res) => {
  const vn = db.voiceNotes.get(req.params.id);
  if (!vn) {
    return sendError(res, 410, 'FLR-CONN-003', 'Pesan suara ini sudah tidak tersedia.');
  }

  if (vn.is_expired || vn.play_count >= vn.max_plays) {
    vn.is_expired = true;
    vn.audio_url = undefined;
    db.voiceNotes.set(vn.id, vn);
    return sendError(res, 410, 'FLR-CONN-003', 'Pesan suara telah hangus (telah diputar 3 kali).');
  }

  vn.play_count += 1;
  if (vn.play_count >= vn.max_plays) {
    vn.is_expired = true;
    vn.audio_url = undefined;
  }
  db.voiceNotes.set(vn.id, vn);

  return res.json({
    play_count: vn.play_count,
    max_plays: vn.max_plays,
    is_expired: vn.is_expired,
    audio_url: vn.audio_url,
  });
});

// POST /api/v1/blocks (ONE-WAY PERMANENT BLOCK)
app.post('/api/v1/blocks', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const { blocked_user_id } = req.body;

  if (!blocked_user_id) return sendError(res, 400, 'FLR-SYS-001', 'Pengguna yang diblokir wajib diisi.');

  const blockId = `block_${currentUserId}_${blocked_user_id}`;
  const block: Block = {
    id: blockId,
    blocker_id: currentUserId,
    blocked_id: blocked_user_id,
    created_at: new Date().toISOString(),
  };

  db.blocks.set(blockId, block);

  // Log audit
  db.auditLogs.push({
    id: `audit_${Date.now()}`,
    actor_id: currentUserId,
    actor_email: db.users.get(currentUserId)?.email || 'user',
    action: 'connection.block.executed',
    target_id: blocked_user_id,
    reason: 'Pengguna melakukan pemblokiran permanen searah.',
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({ block, message: 'Pengguna telah diblokir secara permanen.' });
});

// GET /api/v1/blocks/me
app.get('/api/v1/blocks/me', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const list = Array.from(db.blocks.values())
    .filter((b) => b.blocker_id === currentUserId)
    .map((b) => {
      const user = db.users.get(b.blocked_id);
      return {
        ...b,
        blocked_user: user ? { id: user.id, email: user.email, avatar_url: user.avatar_url } : undefined,
      };
    });

  return res.json({ blocked_users: list });
});

// ==================== TRUST & SAFETY (REPORTS & MODERATION) ====================

// POST /api/v1/reports
app.post('/api/v1/reports', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const user = db.users.get(currentUserId);
  if (!user) return sendError(res, 401, 'FLR-SYS-002', 'Sesi kedaluwarsa.');

  const { target_type, target_id, reason, description, target_preview } = req.body;

  if (!target_type || !target_id || !reason) {
    return sendError(res, 400, 'FLR-SAFE-001', 'Laporan gagal dikirim. Tipe target, ID, dan alasan wajib diisi.');
  }

  const report: Report = {
    id: `rep_${Date.now()}`,
    reporter_id: user.id,
    reporter_email: user.email,
    target_type,
    target_id,
    target_preview,
    reason,
    description,
    status: 'open',
    created_at: new Date().toISOString(),
  };

  db.reports.set(report.id, report);

  return res.status(201).json({ report, message: 'Laporan berhasil dikirim ke antrian moderasi.' });
});

// GET /api/v1/admin/reports
app.get('/api/v1/admin/reports', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const user = db.users.get(currentUserId);

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return sendError(res, 403, 'FLR-SYS-001', 'Akses ditolak. Diperlukan hak akses moderator/admin.');
  }

  const statusFilter = req.query.status as string;
  let reports = Array.from(db.reports.values());

  if (statusFilter) {
    reports = reports.filter((r) => r.status === statusFilter);
  }

  // Sort by urgency: harassment > spam > inappropriate_content > other, then FIFO
  const urgencyMap: Record<string, number> = {
    harassment: 1,
    inappropriate_content: 2,
    spam: 3,
    other: 4,
  };

  reports.sort((a, b) => {
    const urgA = urgencyMap[a.reason] || 5;
    const urgB = urgencyMap[b.reason] || 5;
    if (urgA !== urgB) return urgA - urgB;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return res.json({ reports });
});

// POST /api/v1/admin/reports/:id/action
app.post('/api/v1/admin/reports/:id/action', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const admin = db.users.get(currentUserId);

  if (!admin || (admin.role !== 'admin' && admin.role !== 'moderator')) {
    return sendError(res, 403, 'FLR-SYS-001', 'Akses ditolak.');
  }

  const report = db.reports.get(req.params.id);
  if (!report) return sendError(res, 404, 'FLR-SYS-001', 'Laporan tidak ditemukan.');

  if (report.status !== 'open') {
    return sendError(res, 400, 'FLR-SYS-001', 'Laporan ini telah ditangani oleh moderator lain.');
  }

  const { action, reason } = req.body; // action: 'dismiss' | 'warn' | 'suspend' | 'ban'
  if (!reason || !reason.trim()) {
    return sendError(res, 400, 'FLR-SYS-001', 'Alasan penindakan wajib diisi untuk audit.');
  }

  report.status = action === 'dismiss' ? 'dismissed' : 'action_taken';
  report.action_taken = action;
  db.reports.set(report.id, report);

  // APPEND TO AUDIT LOG (Mandatory & Append-Only)
  db.auditLogs.push({
    id: `audit_${Date.now()}`,
    actor_id: admin.id,
    actor_email: admin.email,
    action: `report.action.${action}`,
    target_id: report.target_id,
    reason,
    metadata: {
      report_id: report.id,
      target_type: report.target_type,
    },
    created_at: new Date().toISOString(),
  });

  return res.json({ report, message: 'Tindakan laporan berhasil dieksekusi dan dicatat di audit log.' });
});

// PATCH /api/v1/admin/users/:id/status
app.patch('/api/v1/admin/users/:id/status', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const admin = db.users.get(currentUserId);

  if (!admin || admin.role !== 'admin') {
    return sendError(res, 403, 'FLR-SYS-001', 'Akses ditolak. Hanya Admin yang dapat mengubah status pengguna.');
  }

  const targetUser = db.users.get(req.params.id);
  if (!targetUser) return sendError(res, 404, 'FLR-SYS-001', 'Pengguna tidak ditemukan.');

  const { status, reason } = req.body as { status: AccountStatus; reason: string };
  if (!reason || !reason.trim()) {
    return sendError(res, 400, 'FLR-SYS-001', 'Alasan penanganan status pengguna wajib diisi.');
  }

  targetUser.account_status = status;
  targetUser.updated_at = new Date().toISOString();
  db.users.set(targetUser.id, targetUser);

  // Record Audit Log
  db.auditLogs.push({
    id: `audit_${Date.now()}`,
    actor_id: admin.id,
    actor_email: admin.email,
    action: `user.status.${status}`,
    target_id: targetUser.id,
    reason,
    created_at: new Date().toISOString(),
  });

  return res.json({ user: targetUser });
});

// GET /api/v1/admin/audit-log (READ-ONLY)
app.get('/api/v1/admin/audit-log', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const admin = db.users.get(currentUserId);

  if (!admin || admin.role !== 'admin') {
    return sendError(res, 403, 'FLR-SYS-001', 'Akses ditolak. Hanya Admin yang dapat membaca Audit Log.');
  }

  const logs = [...db.auditLogs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return res.json({ logs });
});

// GET /api/v1/admin/dashboard/summary
app.get('/api/v1/admin/dashboard/summary', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const admin = db.users.get(currentUserId);

  if (!admin || (admin.role !== 'admin' && admin.role !== 'moderator')) {
    return sendError(res, 403, 'FLR-SYS-001', 'Akses ditolak.');
  }

  const openReports = Array.from(db.reports.values()).filter((r) => r.status === 'open').length;
  const restrictedAccounts = Array.from(db.users.values()).filter((u) => u.account_status === 'restricted_24h').length;

  return res.json({
    open_reports: openReports,
    restricted_accounts_24h: restrictedAccounts,
    dau: db.users.size,
    mau: db.users.size + 12,
    total_users: db.users.size,
    total_posts: db.posts.size,
  });
});

// GET /api/v1/notifications
app.get('/api/v1/notifications', (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const list = db.notifications.get(currentUserId) || [];

  return res.json({
    notifications: list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  });
});

// Vite Integration Middleware for Development & Static for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FLURE Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
