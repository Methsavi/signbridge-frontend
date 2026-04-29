import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen, Search, X, Hash, AlignLeft, Loader2, AlertCircle, Video, RotateCcw, PlayCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dictionaryService } from '../services/api';

const MODES = [
  { id: 'alpha', label: 'Letters & Numbers', icon: Hash },
  { id: 'words', label: 'Words & Sentences', icon: AlignLeft },
];

/* ─── MediaPopup ─────────────────────────────────────────────────────────── */
const MediaPopup = ({ entries, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPlayAgain, setShowPlayAgain] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const timerRef = useRef(null);

  const isSequential = entries.length > 1;
  const current = entries[currentIndex];
  const isSingleImage = !isSequential && current.media_type !== 'video';

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Auto-advance images in sequential mode
  useEffect(() => {
    setShowPlayAgain(false);
    clearTimeout(timerRef.current);
    if (current.media_type !== 'video' && isSequential) {
      timerRef.current = setTimeout(() => {
        if (currentIndex < entries.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setShowPlayAgain(true);
        }
      }, 2000);
    }
    return () => clearTimeout(timerRef.current);
  }, [currentIndex, playKey, current.media_type, isSequential, entries.length]);

  const handleVideoEnded = () => {
    if (currentIndex < entries.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowPlayAgain(true);
    }
  };

  const handlePlayAgain = () => {
    clearTimeout(timerRef.current);
    setCurrentIndex(0);
    setShowPlayAgain(false);
    setPlayKey(k => k + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-2">
          <div className="flex-1 min-w-0">
            {isSequential ? (
              <div className="flex flex-wrap gap-1.5 items-center">
                {entries.map((e, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${
                      i === currentIndex
                        ? 'bg-blue-500 text-white'
                        : i < currentIndex
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {e.label}
                  </span>
                ))}
              </div>
            ) : (
              <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate pr-2">{current.label}</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar (sequential) */}
        {isSequential && (
          <div className="flex gap-1 px-6 pb-3">
            {entries.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i < currentIndex
                    ? 'bg-blue-400 dark:bg-blue-600'
                    : i === currentIndex
                    ? 'bg-blue-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        )}

        {/* Media area */}
        <div
          className="mx-6 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          style={{ minHeight: 260 }}
        >
          {current.media_type === 'video' ? (
            <video
              key={`${currentIndex}-${playKey}`}
              src={current.media_url}
              className="max-h-[55vh] max-w-full object-contain"
              autoPlay
              playsInline
              onEnded={handleVideoEnded}
            />
          ) : (
            <img
              key={`${currentIndex}-${playKey}`}
              src={current.media_url}
              alt={current.label}
              className="max-h-[55vh] max-w-full object-contain p-4"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 px-6 py-5">
          {isSequential && (
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
              {showPlayAgain ? 'Sequence complete' : current.label}
            </p>
          )}
          <AnimatePresence>
            {(showPlayAgain || isSingleImage) && (
              <motion.button
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                onClick={handlePlayAgain}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/25 text-sm"
              >
                <RotateCcw size={15} />
                Play Again
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── MediaCard ──────────────────────────────────────────────────────────── */
const MediaCard = ({ entry, onClick }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.85, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.85 }}
    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    className="flex flex-col items-center group/card cursor-pointer"
    onClick={onClick}
  >
    <div className="relative flex items-center justify-center overflow-hidden transition-all duration-300 bg-white border border-slate-200 shadow-sm dark:bg-slate-900/80 dark:border-slate-700/80 rounded-2xl w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 group-hover/card:-translate-y-2 group-hover/card:shadow-xl group-hover/card:border-blue-400/60 group-hover/card:ring-4 group-hover/card:ring-blue-500/20">
      {entry.media_type === 'video' ? (
        <video
          src={entry.media_url}
          className="object-cover w-full h-full"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={entry.media_url}
          alt={`Sign for ${entry.label}`}
          className="object-contain w-full h-full drop-shadow-sm transition-transform duration-500 group-hover/card:scale-110 p-1"
          onError={e => {
            e.target.onerror = null;
            e.target.parentElement.innerHTML = '<span class="text-xs font-bold text-red-400">N/A</span>';
          }}
        />
      )}
      {entry.media_type === 'video' && (
        <span className="absolute top-1 right-1 bg-black/40 text-white rounded-md px-1 py-0.5 text-[9px] leading-tight font-bold flex items-center gap-0.5 backdrop-blur-sm">
          <Video size={8} /> GIF
        </span>
      )}
    </div>
    <span className="mt-3 flex items-center justify-center min-w-[2rem] px-3 h-8 font-mono text-sm font-bold text-slate-700 bg-slate-100 border border-slate-200 shadow-sm rounded-xl dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 max-w-[120px] truncate">
      {entry.label}
    </span>
  </motion.div>
);

/* ─── Sign-by-sign interpreter (alpha mode) ─────────────────────────────── */
const AlphaInterpreter = ({ entries }) => {
  const [text, setText] = useState('');
  const [popupEntries, setPopupEntries] = useState(null);

  const lookup = React.useMemo(() => {
    const map = {};
    entries.forEach(e => {
      if (e.category === 'letter' || e.category === 'number') {
        map[e.label.toUpperCase()] = e;
      }
    });
    return map;
  }, [entries]);

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {popupEntries && (
          <MediaPopup entries={popupEntries} onClose={() => setPopupEntries(null)} />
        )}
      </AnimatePresence>

      {/* Search input */}
      <div className="relative max-w-3xl mx-auto group">
        <div className="absolute inset-0 transition-opacity duration-300 opacity-20 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 blur-xl group-hover:opacity-35" />
        <div className="relative flex items-center overflow-hidden transition-all border border-slate-200 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl dark:border-slate-700/50 rounded-2xl focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20">
          <div className="pl-5 text-blue-500 animate-pulse"><Search size={24} /></div>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type letters or numbers (e.g. Hello 123)"
            className="w-full py-4 pl-4 pr-5 text-xl font-medium text-slate-900 bg-transparent dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          <AnimatePresence>
            {text && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                onClick={() => setText('')}
                className="p-2 mr-4 text-slate-400 transition-colors rounded-full hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="relative w-full p-8 md:p-12 min-h-[360px] overflow-hidden bg-white/80 border border-slate-200/80 shadow-2xl dark:bg-slate-800/60 dark:border-slate-700/50 backdrop-blur-2xl rounded-[3rem] group">
        <div className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />
        {text.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full mt-8 text-center opacity-60">
            <BookOpen className="w-16 h-16 mb-5 text-slate-300 dark:text-slate-600" />
            <p className="text-xl font-medium text-slate-500 dark:text-slate-400">Type above to see signs</p>
            <p className="mt-1.5 text-sm text-slate-400 dark:text-slate-500">Supports A–Z and 0–9</p>
          </motion.div>
        ) : (
          <motion.div layout className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8 min-h-[200px] items-center">
            <AnimatePresence>
              {text.split('').map((char, idx) => {
                const upper = char.toUpperCase();
                const entry = lookup[upper];
                if (char === ' ') return (
                  <motion.div
                    layout key={`space-${idx}`}
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center px-2 opacity-50"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center">
                      <div className="w-6 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    </div>
                    <span className="mt-3 h-8 px-3 flex items-center font-mono text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">Space</span>
                  </motion.div>
                );
                if (!entry) return (
                  <motion.div
                    layout key={`unknown-${idx}`}
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center group/card"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                      <span className="text-2xl font-bold text-slate-400">{char}</span>
                    </div>
                    <span className="mt-3 h-8 px-3 flex items-center font-mono text-sm font-bold text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">N/A</span>
                  </motion.div>
                );
                return (
                  <MediaCard
                    key={`${idx}-${char}`}
                    entry={entry}
                    onClick={() => setPopupEntries([entry])}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/* ─── Word / Sentence browser ────────────────────────────────────────────── */
const WordBrowser = ({ entries }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [popupEntries, setPopupEntries] = useState(null);

  const words = React.useMemo(
    () => entries.filter(e => e.category === 'word' || e.category === 'sentence'),
    [entries]
  );

  const filtered = React.useMemo(() => words.filter(e => {
    const matchCat = activeCategory === 'all' || e.category === activeCategory;
    const matchSearch = !search || e.label.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [words, search, activeCategory]);

  // For multi-word searches with no exact match, build a sequential playlist
  const combinedEntries = React.useMemo(() => {
    const terms = search.trim().split(/\s+/).filter(Boolean);
    if (terms.length < 2) return [];
    return terms
      .map(term => words.find(e => e.label.toLowerCase() === term.toLowerCase()))
      .filter(Boolean);
  }, [search, words]);

  const showCombined = combinedEntries.length > 0 && filtered.length === 0;

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {popupEntries && (
          <MediaPopup entries={popupEntries} onClose={() => setPopupEntries(null)} />
        )}
      </AnimatePresence>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search word or sentence…"
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {[{ id: 'all', label: 'All' }, { id: 'word', label: 'Words' }, { id: 'sentence', label: 'Sentences' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeCategory === tab.id
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Combined play card for multi-word search with no sentence match */}
      <AnimatePresence>
        {showCombined && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-3"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No sentence found for{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">"{search}"</span>.
              Playing word by word:
            </p>
            <motion.div
              className="cursor-pointer group p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all"
              onClick={() => setPopupEntries(combinedEntries)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-wrap gap-2">
                  {combinedEntries.map((e, i) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-semibold">
                      {e.label}
                    </span>
                  ))}
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5 ml-3 px-3 py-1.5 bg-blue-500 group-hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors">
                  <PlayCircle size={14} />
                  Play All
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {combinedEntries.map((e, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                    <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {e.media_type === 'video' ? (
                        <video src={e.media_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      ) : (
                        <img src={e.media_url} alt={e.label} className="w-full h-full object-contain p-1" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{e.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regular grid */}
      {filtered.length === 0 && !showCombined ? (
        <div className="flex flex-col items-center py-20 text-slate-400">
          <BookOpen className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium">No signs found</p>
          <p className="text-sm mt-1">Try a different search or check back later.</p>
        </div>
      ) : filtered.length > 0 ? (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence>
            {filtered.map((entry, i) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ delay: i * 0.03 }}
                className="flex flex-col items-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer"
                onClick={() => setPopupEntries([entry])}
              >
                {entry.media_type === 'video' ? (
                  <video src={entry.media_url} className="w-full h-28 object-cover rounded-xl mb-3" autoPlay muted loop playsInline />
                ) : (
                  <img src={entry.media_url} alt={entry.label} className="w-full h-28 object-contain rounded-xl mb-3 group-hover:scale-105 transition-transform duration-300" />
                )}
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 text-center leading-tight line-clamp-2">{entry.label}</span>
                <span className={`mt-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  entry.category === 'sentence'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>{entry.category}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </div>
  );
};

/* ─── Main Dictionary Page ───────────────────────────────────────────────── */
const Dictionary = () => {
  const [mode, setMode] = useState('alpha');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dictionaryService.getEntries();
      setEntries(data.items || []);
    } catch {
      setError('Could not load dictionary. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  return (
    <div className="flex flex-col min-h-screen text-slate-900 transition-colors duration-300 bg-slate-50 dark:text-white dark:bg-slate-900">
      <Navbar />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex flex-col items-center justify-center mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 border rounded-full bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold tracking-widest uppercase text-blue-500">ASL Dictionary</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl dark:text-white">
              Learn to Sign
            </h1>
            <p className="max-w-2xl mt-3 text-lg text-slate-600 dark:text-slate-400">
              Browse our ASL dictionary — letters, numbers, words and sentences visualised with real sign images &amp; videos.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex justify-center mb-10">
            <div className="flex p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm gap-1">
              {MODES.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      mode === m.id
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={16} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading / Error / Content */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-24 text-slate-500 gap-3">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-base font-medium text-red-500">{error}</p>
              <button onClick={fetchEntries} className="px-5 py-2 text-sm font-semibold text-white bg-blue-500 rounded-xl">Retry</button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
              >
                {mode === 'alpha'
                  ? <AlphaInterpreter entries={entries} />
                  : <WordBrowser entries={entries} />
                }
              </motion.div>
            </AnimatePresence>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dictionary;
