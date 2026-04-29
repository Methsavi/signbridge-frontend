import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Plus, Pencil, Trash2, Search, X, Upload, CheckCircle,
  AlertCircle, Loader2, Image, Video, Filter, ChevronDown, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dictionaryService } from '../../services/api';

/* ─── constants ──────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'letter', label: 'Letter' },
  { value: 'number', label: 'Number' },
  { value: 'word', label: 'Word' },
  { value: 'sentence', label: 'Sentence' },
];

const CATEGORY_BADGE = {
  letter:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  number:   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  word:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  sentence: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

/* ─── Toast ──────────────────────────────────────────────────────────────── */
const Toast = ({ msg, type, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 30 }}
    className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium backdrop-blur-xl border
      ${type === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
        : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'}`}
  >
    {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
    {msg}
    <button onClick={onDismiss} className="ml-2 hover:opacity-70"><X size={14} /></button>
  </motion.div>
);

/* ─── Media Preview ──────────────────────────────────────────────────────── */
const MediaPreview = ({ url, mediaType, label, size = 'sm' }) => {
  const dim = size === 'sm' ? 'w-16 h-16' : 'w-full h-48';
  if (!url) return (
    <div className={`${dim} flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400`}>
      {mediaType === 'video' ? <Video size={20} /> : <Image size={20} />}
    </div>
  );
  return mediaType === 'video'
    ? <video src={url} className={`${dim} object-cover rounded-xl`} muted />
    : <img src={url} alt={label} className={`${dim} object-contain rounded-xl bg-slate-50 dark:bg-slate-900`} />;
};

/* ─── Entry Modal ────────────────────────────────────────────────────────── */
const EntryModal = ({ entry, onClose, onSaved }) => {
  const isEdit = !!entry?.id;
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    label: entry?.label || '',
    category: entry?.category || 'letter',
    media_type: entry?.media_type || 'image',
    media_url: entry?.media_url || '',
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(entry?.media_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const isVideo = f.type.startsWith('video/');
    setForm(prev => ({ ...prev, media_type: isVideo ? 'video' : 'image' }));
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    const isVideo = f.type.startsWith('video/');
    setForm(prev => ({ ...prev, media_type: isVideo ? 'video' : 'image' }));
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!form.label.trim()) { setError('Label is required'); return; }
    if (!form.media_url && !file) { setError('Please upload an image or video'); return; }
    setError('');

    try {
      let mediaUrl = form.media_url;
      let mediaType = form.media_type;

      if (file) {
        setUploading(true);
        const result = await dictionaryService.uploadMedia(file);
        mediaUrl = result.url;
        mediaType = result.media_type;
        setUploading(false);
      }

      setSaving(true);
      const payload = { label: form.label.trim(), category: form.category, media_type: mediaType, media_url: mediaUrl };

      if (isEdit) {
        await dictionaryService.updateEntry(entry.id, payload);
      } else {
        await dictionaryService.createEntry(payload);
      }
      onSaved(isEdit ? 'Entry updated!' : 'Entry created!');
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Something went wrong');
      setUploading(false);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-xl"><BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{isEdit ? 'Edit Entry' : 'Add New Sign'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Label */}
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Label *</label>
            <input
              value={form.label}
              onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
              placeholder='e.g. "A", "Hello", "1"'
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Category *</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.slice(1).map(c => (
                <button
                  key={c.value}
                  onClick={() => setForm(p => ({ ...p, category: c.value }))}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    form.category === c.value
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Media (Image / Video) *</label>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="relative cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-4 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
              {preview ? (
                <div className="flex flex-col items-center gap-2">
                  <MediaPreview url={preview} mediaType={form.media_type} label={form.label} size="lg" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Click or drag to replace</p>
                </div>
              ) : (
                <div className="py-4 flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Upload className="w-8 h-8 group-hover:text-blue-500 transition-colors" />
                  <p className="text-sm font-medium">Drop image / video here, or click to browse</p>
                  <p className="text-xs">Supported: JPG, PNG, GIF, MP4, WebM — Max 50 MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
              >
                <AlertCircle size={16} />{error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploading || saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-60 rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            {(uploading || saving) && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? 'Uploading…' : saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Entry'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── Confirm Delete Modal ───────────────────────────────────────────────── */
const ConfirmDelete = ({ entry, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-700/60 p-6 space-y-4"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
          <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Delete Entry</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">"{entry?.label}" will be permanently removed.</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 rounded-xl transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Delete
        </button>
      </div>
    </motion.div>
  </div>
);

/* ─── Main Page ──────────────────────────────────────────────────────────── */
const ManageDictionary = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [modalEntry, setModalEntry] = useState(null); // null = closed, {} = create, entry = edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();
      const data = await dictionaryService.getEntries(params);
      setEntries(data.items || []);
    } catch {
      showToast('Failed to load dictionary entries', 'error');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  // Fetch on filter / search changes (debounced for search)
  useEffect(() => {
    const timer = setTimeout(fetchEntries, 300);
    return () => clearTimeout(timer);
  }, [fetchEntries]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dictionaryService.deleteEntry(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Entry deleted');
      fetchEntries();
    } catch {
      showToast('Failed to delete entry', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaved = (msg) => {
    setModalEntry(null);
    showToast(msg);
    fetchEntries();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manage ASL Dictionary</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Add, edit and remove signs — images or videos with labels &amp; categories.
          </p>
        </div>
        <button
          onClick={() => setModalEntry({})}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/25 transition-all active:scale-95"
        >
          <Plus size={18} /> Add New Sign
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORIES.slice(1).map(c => {
          const count = entries.filter(e => e.category === c.value).length;
          return (
            <div key={c.value} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{count}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{c.label}s</p>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by label…"
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(p => !p)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Filter size={15} />
            {CATEGORIES.find(c => c.value === categoryFilter)?.label || 'All Categories'}
            <ChevronDown size={14} className={`transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                className="absolute right-0 mt-1 z-20 w-44 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden"
              >
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => { setCategoryFilter(c.value); setShowFilterMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      categoryFilter === c.value
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Refresh */}
        <button
          onClick={fetchEntries}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Table / Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <BookOpen className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium">No entries found</p>
          <p className="text-sm mt-1">Try adjusting the search or add a new sign.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-500 dark:text-slate-400">Media</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-500 dark:text-slate-400">Label</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-500 dark:text-slate-400">Category</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-500 dark:text-slate-400">Type</th>
                  <th className="text-right px-4 py-3.5 font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {entries.map((entry, i) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <MediaPreview url={entry.media_url} mediaType={entry.media_type} label={entry.label} size="sm" />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                        {entry.label}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${CATEGORY_BADGE[entry.category]}`}>
                          {entry.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          {entry.media_type === 'video' ? <Video size={13} /> : <Image size={13} />}
                          {entry.media_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setModalEntry(entry)}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(entry)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modalEntry !== null && (
          <EntryModal entry={modalEntry.id ? modalEntry : null} onClose={() => setModalEntry(null)} onSaved={handleSaved} />
        )}
        {deleteTarget && (
          <ConfirmDelete entry={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default ManageDictionary;
