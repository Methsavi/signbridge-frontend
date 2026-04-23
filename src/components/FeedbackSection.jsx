import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, Edit2, Trash2, X, CheckCircle, MessageSquare } from 'lucide-react';
import { feedbackService } from '../services/api';
import Lottie from 'lottie-react';

/* ─── helpers ─────────────────────────────────────────────────── */
const StarRating = ({ value, onChange, size = 'md', readonly = false }) => {
  const [hovered, setHovered] = useState(0);
  const sz = size === 'lg' ? 'w-9 h-9' : size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform ${readonly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'}`}
          aria-label={`${star} star`}
        >
          <Star
            className={`${sz} transition-colors duration-150 ${
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-slate-300 dark:text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const labelForRating = (r) =>
  ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][r] || '';

/* ─── main component ───────────────────────────────────────────── */
const FeedbackSection = () => {
  // Current logged-in user from localStorage
  const [currentUser, setCurrentUser] = useState(null);

  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/Customer positive review.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Failed to load animation', err));
  }, []);

  // Form state
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // User's own feedbacks
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loadingMy, setLoadingMy] = useState(false);

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editMessage, setEditMessage] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* load current user */
  useEffect(() => {
    const tryLoad = () => {
      const raw = localStorage.getItem('user');
      if (raw) {
        try { setCurrentUser(JSON.parse(raw)); } catch { /* ignore */ }
      }
    };
    tryLoad();
    window.addEventListener('user-update', tryLoad);
    return () => window.removeEventListener('user-update', tryLoad);
  }, []);

  /* load user's own feedbacks when user is known */
  useEffect(() => {
    if (!currentUser?.user_id) return;
    setLoadingMy(true);
    feedbackService
      .getMyFeedbacks(currentUser.user_id)
      .then(setMyFeedbacks)
      .catch(() => setMyFeedbacks([]))
      .finally(() => setLoadingMy(false));
  }, [currentUser]);

  /* submit new feedback */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (rating === 0) { setSubmitError('Please select a star rating.'); return; }

    setSubmitting(true);
    setSubmitError('');
    try {
      const created = await feedbackService.submit({
        user_id: currentUser.user_id,
        username: currentUser.username || currentUser.name || 'User',
        email: currentUser.email || '',
        rating,
        message: message.trim() || null,
      });
      setMyFeedbacks((prev) => [created, ...prev]);
      setRating(0);
      setMessage('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3500);
    } catch (err) {
      setSubmitError(err?.response?.data?.detail || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  /* open edit modal */
  const openEdit = (fb) => {
    setEditId(fb.id);
    setEditRating(fb.rating);
    setEditMessage(fb.message || '');
  };

  /* save edit */
  const handleEditSave = async () => {
    if (editRating === 0) return;
    setEditSaving(true);
    try {
      const updated = await feedbackService.update(editId, {
        rating: editRating,
        message: editMessage.trim() || null,
      });
      setMyFeedbacks((prev) => prev.map((f) => (f.id === editId ? updated : f)));
      setEditId(null);
    } catch { /* silent */ }
    finally { setEditSaving(false); }
  };

  /* delete feedback */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await feedbackService.delete(deleteId);
      setMyFeedbacks((prev) => prev.filter((f) => f.id !== deleteId));
      setDeleteId(null);
    } catch { /* silent */ }
    finally { setDeleting(false); }
  };

  /* ── render ────────────────────────────────────────────────────── */
  return (
    <section id="feedback-section" className="px-4 py-24 mx-auto max-w-7xl sm:px-6 lg:px-8">
      {/* heading */}
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full text-sm font-semibold bg-primary/10 text-primary border border-primary/20">
          <MessageSquare className="w-4 h-4" />
          User Feedback
        </span>
        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
          Share Your Experience
        </h2>
        <p className="max-w-xl mx-auto text-gray-500 dark:text-gray-400 text-lg">
          Your feedback helps us improve SignBridge for everyone. Tell us what you think!
        </p>
      </motion.div>

      <div className="grid gap-10 lg:grid-cols-2 items-start">

        {/* ── LEFT: submit form ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md shadow-xl p-8"
        >
          {/* decorative blob */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {!currentUser ? (
            /* not logged in */
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Login to Leave a Review
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Sign in to share your experience with SignBridge.
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-indigo-600 transition-colors"
              >
                Sign In
              </a>
            </div>
          ) : (
            /* logged in */
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Rate Your Experience
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Submitting as <span className="font-medium text-primary">{currentUser.username || currentUser.name}</span>
                </p>
              </div>

              {/* star picker */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rating <span className="text-red-500">*</span>
                </label>
                <StarRating value={rating} onChange={setRating} size="lg" />
                {rating > 0 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium text-amber-500"
                  >
                    {labelForRating(rating)}
                  </motion.span>
                )}
              </div>

              {/* message */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us more about your experience…"
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition"
                />
                <p className="text-xs text-right text-gray-400">{message.length}/500</p>
              </div>

              {/* error */}
              {submitError && (
                <p className="text-sm text-red-500 font-medium">{submitError}</p>
              )}

              {/* success */}
              <AnimatePresence>
                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Thank you! Your feedback has been submitted.
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-indigo-600 disabled:opacity-60 transition-all shadow-lg shadow-primary/30"
              >
                {submitting ? (
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>

        {/* ── RIGHT: my feedbacks ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {currentUser ? 'My Feedbacks' : 'Recent Highlights'}
          </h3>

          {!currentUser && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/30 dark:bg-gray-800/30">
              {animationData ? (
                <div className="w-48 h-48 mx-auto mb-3 opacity-80">
                  <Lottie animationData={animationData} loop={true} />
                </div>
              ) : (
                <Star className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              )}
              <p className="text-gray-500 dark:text-gray-400">
                Login to see and manage your submitted feedbacks.
              </p>
            </div>
          )}

          {currentUser && loadingMy && (
            <div className="flex justify-center py-8">
              <span className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {currentUser && !loadingMy && myFeedbacks.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/30 dark:bg-gray-800/30">
              {animationData ? (
                <div className="w-48 h-48 mx-auto mb-3 opacity-80">
                  <Lottie animationData={animationData} loop={true} />
                </div>
              ) : (
                <Star className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              )}
              <p className="text-gray-500 dark:text-gray-400">You haven't submitted any feedback yet.</p>
            </div>
          )}

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            <AnimatePresence>
              {myFeedbacks.map((fb) => (
                <motion.div
                  key={fb.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {(fb.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{fb.username}</p>
                        <p className="text-xs text-gray-400">{new Date(fb.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(fb)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(fb.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <StarRating value={fb.rating} size="sm" readonly />
                    <span className="ml-1 text-xs font-medium text-amber-500">{labelForRating(fb.rating)}</span>
                  </div>

                  {fb.message && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{fb.message}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── EDIT MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {editId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Feedback</h3>
                <button onClick={() => setEditId(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                  <StarRating value={editRating} onChange={setEditRating} size="lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                  <textarea
                    rows={4}
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditId(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving || editRating === 0}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-indigo-600 disabled:opacity-60 transition shadow-lg shadow-primary/30"
                >
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-700 text-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Feedback?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-60 transition"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default FeedbackSection;
