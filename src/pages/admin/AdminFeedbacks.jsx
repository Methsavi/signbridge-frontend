import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Trash2, Search, RefreshCw, X, MessageSquare,
  TrendingUp, ChevronDown, BarChart2,
} from 'lucide-react';
import { feedbackService } from '../../services/api';

/* ── helpers ───────────────────────────────────────────────────── */
const StarDisplay = ({ value, size = 'sm' }) => {
  const sz = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} ${s <= value ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300 dark:text-slate-600'}`}
        />
      ))}
    </div>
  );
};

const ratingLabel = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const StatCard = ({ title, value, icon: Icon, sub, colorClass }) => (
  <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:-translate-y-1 transition-transform">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</h3>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`p-4 rounded-full ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

/* ── main component ─────────────────────────────────────────────── */
const AdminFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* load feedbacks & stats */
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterRating) params.rating = Number(filterRating);

      const [listRes, statsRes] = await Promise.all([
        feedbackService.adminList(params),
        feedbackService.adminStats(),
      ]);
      setFeedbacks(listRes.items || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load feedbacks', err);
    } finally {
      setLoading(false);
    }
  }, [search, filterRating]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* delete */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await feedbackService.adminDelete(deleteTarget);
      setFeedbacks((prev) => prev.filter((f) => f.id !== deleteTarget));
      setDeleteTarget(null);
      // refresh stats
      feedbackService.adminStats().then(setStats).catch(() => {});
    } catch { /* silent */ }
    finally { setDeleting(false); }
  };

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Feedback Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review and manage all user-submitted feedback.</p>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 text-slate-600 dark:text-slate-300 hover:border-blue-400 transition-all text-sm font-medium shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── STATS ─────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            title="Total Feedbacks"
            value={stats.total_feedbacks}
            icon={MessageSquare}
            colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Average Rating"
            value={`${stats.average_rating} / 5`}
            icon={Star}
            sub={ratingLabel[Math.round(stats.average_rating)] || ''}
            colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            title="5-Star Reviews"
            value={stats.distribution?.['5'] || 0}
            icon={TrendingUp}
            sub={`${stats.total_feedbacks ? Math.round(((stats.distribution?.['5'] || 0) / stats.total_feedbacks) * 100) : 0}% of total`}
            colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
        </div>
      )}

      {/* ── RATING DISTRIBUTION BAR ──────────────────────────── */}
      {stats && (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            Rating Distribution
          </h3>
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution?.[String(star)] || 0;
              const pct = stats.total_feedbacks ? Math.round((count / stats.total_feedbacks) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-6 text-right">{star}</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: (5 - star) * 0.1 }}
                    />
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400 w-14 text-right">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FILTERS ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, email or message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/50 transition"
          />
        </div>
        <div className="relative">
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition cursor-pointer"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── TABLE ────────────────────────────────────────────── */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/30">
                <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">User</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Rating</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Message</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                <th className="text-right px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-500 dark:text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading feedbacks…
                  </td>
                </tr>
              )}
              {!loading && feedbacks.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-500 dark:text-slate-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    No feedbacks found.
                  </td>
                </tr>
              )}
              <AnimatePresence>
                {!loading && feedbacks.map((fb, idx) => (
                  <motion.tr
                    key={fb.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* user */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                          {(fb.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{fb.username}</p>
                          <p className="text-xs text-slate-400">{fb.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* rating */}
                    <td className="px-6 py-4">
                      <StarDisplay value={fb.rating} />
                      <span className="text-xs text-amber-500 font-medium">{ratingLabel[fb.rating]}</span>
                    </td>

                    {/* message */}
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-2">
                        {fb.message || <span className="italic text-slate-400">No message</span>}
                      </p>
                    </td>

                    {/* date */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {fb.created_at ? new Date(fb.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      }) : '—'}
                    </td>

                    {/* actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(fb.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-xs font-medium"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* footer count */}
        {!loading && feedbacks.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
            Showing {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── DELETE CONFIRM MODAL ────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 text-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Delete Feedback?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                This feedback will be permanently removed and cannot be recovered.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-medium"
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
    </div>
  );
};

export default AdminFeedbacks;
