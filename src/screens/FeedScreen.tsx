import React, { useState, useEffect } from 'react';
import { Send, Heart, MessageCircle, Flag, AlertTriangle, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { Post, Comment } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ReportModal } from '../components/ReportModal';

export const FeedScreen: React.FC = () => {
  const { currentUser, showToast, setActiveScreen } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  // Active post detail modal (S-07)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  // Active report modal (S-18)
  const [reportTarget, setReportTarget] = useState<{
    targetType: 'post' | 'comment';
    targetId: string;
    preview?: string;
  } | null>(null);

  const fetchFeed = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await api.getFeed(currentUser.id);
      setPosts(res.posts || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [currentUser]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPostText.trim()) return;

    setIsPosting(true);
    try {
      const res = await api.createPost(currentUser.id, newPostText.trim());
      setPosts([res.post, ...posts]);
      setNewPostText('');
      showToast('Postingan berhasil dipublikasikan!', 'success');
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      } else {
        showToast('Gagal memposting.', 'error');
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.likePost(currentUser.id, postId);
      setPosts(posts.map((p) => (p.id === postId ? res.post : p)));
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(res.post);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    }
  };

  const openPostDetail = async (post: Post) => {
    if (!currentUser) return;
    setSelectedPost(post);
    try {
      const res = await api.getComments(currentUser.id, post.id);
      setComments(res.comments || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedPost || !newCommentText.trim()) return;

    setIsCommenting(true);
    try {
      const res = await api.createComment(currentUser.id, selectedPost.id, newCommentText.trim());
      setComments([...comments, res.comment]);
      setNewCommentText('');
      setPosts(
        posts.map((p) => (p.id === selectedPost.id ? { ...p, comment_count: p.comment_count + 1 } : p)),
      );
      showToast('Komentar ditambahkan.', 'success');
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      } else {
        showToast('Gagal menambahkan komentar.', 'error');
      }
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;
    try {
      await api.deleteComment(currentUser.id, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      if (selectedPost) {
        setPosts(
          posts.map((p) =>
            p.id === selectedPost.id ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p,
          ),
        );
      }
      showToast('Komentar dihapus.', 'info');
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Banner / Header */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 text-slate-900 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
            Timeline Publik FLURE
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              S-06
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ruang berbagi konten publik terlindungi dengan Anti-Spam Rate Limit (Maks 3x/18 detik).
          </p>
        </div>
        <button
          onClick={fetchFeed}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
          title="Muat ulang feed"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {/* Account Restricted Banner */}
      {currentUser?.account_status === 'restricted_24h' && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <strong>Akun Dibatasi 24 Jam (Pelanggaran Anti-Spam Terdeteksi)</strong>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Anda tidak dapat memposting atau mengomentari selama periode pembatasan sementara ini.
            </p>
          </div>
        </div>
      )}

      {/* Post Composer Form */}
      {currentUser && currentUser.account_status !== 'restricted_24h' && (
        <form onSubmit={handleCreatePost} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-200" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                {currentUser.email[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 text-xs text-slate-500">
              Tulis postingan baru sebagai <span className="text-slate-900 font-semibold">{currentUser.email}</span>
            </div>
          </div>

          <textarea
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="Apa pemikiran atau narasi jujur yang ingin Anda bagikan hari ini?"
            rows={3}
            maxLength={2000}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-400 font-mono">
              {newPostText.length} / 2000 Karakter (Rate limit: 3x / 18s)
            </span>
            <button
              type="submit"
              disabled={isPosting || !newPostText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isPosting ? 'Memposting...' : 'Publikasikan Post'}
            </button>
          </div>
        </form>
      )}

      {/* Feed List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span>Memuat postingan timeline...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8">
          <Sparkles className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Belum ada apa pun di sini</h3>
          <p className="text-xs text-slate-500 mt-1">Jadilah yang pertama menulis sesuatu di FLURE.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
            return (
              <div
                key={post.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs transition space-y-3 hover:border-slate-300"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {post.author_avatar ? (
                      <img src={post.author_avatar} alt="" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                        {post.author_email[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        {post.author_email.split('@')[0]}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({post.author_email})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(post.created_at).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() =>
                      setReportTarget({
                        targetType: 'post',
                        targetId: post.id,
                        preview: post.content,
                      })
                    }
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                    title="Laporkan Postingan Ini"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Footer Controls */}
                <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
                      isLiked
                        ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                    <span>{post.like_count} Like</span>
                  </button>

                  <button
                    onClick={() => openPostDetail(post)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                  >
                    <MessageCircle className="w-4 h-4 text-indigo-600" />
                    <span>{post.comment_count} Komentar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Detail & Comments Modal (S-07) */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 text-slate-900 shadow-xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              ✕
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              Detail Postingan & Komentar
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                S-07
              </span>
            </h3>

            {/* Original Post */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4 space-y-2">
              <div className="text-xs font-bold text-slate-900">{selectedPost.author_email}</div>
              <p className="text-xs text-slate-700">{selectedPost.content}</p>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Komentar ({comments.length})
              </h4>

              {comments.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">
                  Belum ada komentar. Tulis komentar pertama di bawah ini.
                </div>
              ) : (
                comments.map((comment) => {
                  const isCommentOwner = currentUser?.id === comment.user_id;
                  const isPostOwner = currentUser?.id === selectedPost.user_id;
                  const canDelete = isCommentOwner || isPostOwner;

                  return (
                    <div
                      key={comment.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="font-bold text-slate-900 text-[11px] flex items-center gap-2">
                          {comment.author_email}
                          {isPostOwner && comment.user_id !== selectedPost.user_id && (
                            <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-semibold">
                              Penulis Post Memantau
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700">{comment.content}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setReportTarget({
                              targetType: 'comment',
                              targetId: comment.id,
                              preview: comment.content,
                            })
                          }
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                          title="Laporkan Komentar"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600"
                            title={isPostOwner && !isCommentOwner ? 'Hapus Komentar (Silent Removal)' : 'Hapus Komentar'}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            {currentUser && currentUser.account_status !== 'restricted_24h' && (
              <form onSubmit={handleCreateComment} className="flex gap-2 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Tulis komentar..."
                  maxLength={500}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  disabled={isCommenting || !newCommentText.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50 shadow-xs"
                >
                  Kirim
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          targetPreview={reportTarget.preview}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
};
