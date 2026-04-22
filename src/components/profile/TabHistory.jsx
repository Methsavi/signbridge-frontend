import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, Trash2 } from 'lucide-react';
import { featureService } from '../../services/api';
import { LANGUAGES } from '../LanguageSelector';
import { useToast } from '../../context/ToastContext';

const getLangName = (code) => {
  if (!code) return 'Unknown';
  if (code.toLowerCase() === 'sign') return 'Sign Language';
  if (code.toLowerCase() === 'auto') return 'Auto Detect';
  return LANGUAGES.find(l => l.code.toLowerCase() === code.toLowerCase())?.name || code.toUpperCase();
};

const TabHistory = ({ user, history, setHistory, loadingHistory }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [historyFilter, setHistoryFilter] = useState('all');
  const [signSubFilter, setSignSubFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => { setVisibleCount(6); }, [historyFilter, signSubFilter, history]);

  const filteredHistory = history.filter(item => {
    const isTextMode = item.mode === 'text';
    const actualMode = item.mode && !isTextMode ? item.mode : (isTextMode ? 'text' : 'word');
    if (historyFilter === 'all') return true;
    if (historyFilter === 'text') return actualMode === 'text';
    if (historyFilter === 'sign') {
      if (actualMode === 'text') return false;
      if (signSubFilter === 'all') return true;
      return actualMode === signSubFilter;
    }
    return false;
  });

  const handleDeleteAll = async () => {
    if (filteredHistory.length === 0) return;
    if (!window.confirm(`Delete all ${historyFilter === 'all' ? '' : historyFilter + ' '}history items?`)) return;
    try {
      await Promise.all(filteredHistory.map(item => featureService.deleteHistory(item._id, user.user_id)));
      const ids = new Set(filteredHistory.map(i => i._id));
      setHistory(prev => prev.filter(i => !ids.has(i._id)));
      addToast(`Deleted ${filteredHistory.length} items`, 'success');
    } catch { addToast('Failed to delete some items', 'error'); }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this translation?')) return;
    try {
      await featureService.deleteHistory(itemId, user.user_id);
      setHistory(prev => prev.filter(i => i._id !== itemId));
      addToast('Item deleted', 'success');
    } catch { addToast('Failed to delete item', 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Translation History</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{history.length} total translation{history.length !== 1 ? 's' : ''}</p>
        </div>
        {filteredHistory.length > 0 && (
          <button onClick={handleDeleteAll} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 bg-red-100 dark:bg-red-500/10 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/20 transition font-semibold">
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl gap-1 w-fit">
          {[{ id: 'all', label: 'All' }, { id: 'sign', label: 'Sign Mode' }, { id: 'text', label: 'Text Mode' }].map(f => (
            <button key={f.id} onClick={() => { setHistoryFilter(f.id); setSignSubFilter('all'); }}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition ${historyFilter === f.id ? 'bg-white dark:bg-gray-700 text-primary shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {historyFilter === 'sign' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap bg-indigo-50 dark:bg-[#1e293b]/60 p-1 rounded-xl gap-1 w-fit border border-indigo-100 dark:border-gray-700">
              {[{ id: 'all', label: 'All' }, { id: 'word', label: 'Word' }, { id: 'alphabet', label: 'Alphabet' }, { id: 'number', label: 'Number' }].map(sf => (
                <button key={sf.id} onClick={() => setSignSubFilter(sf.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${signSubFilter === sf.id ? 'bg-primary text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                  {sf.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        {loadingHistory ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No translations yet for this filter.</p>
            <button onClick={() => navigate('/translator')} className="mt-2 text-primary hover:underline text-sm">Start translating →</button>
          </div>
        ) : (
          <AnimatePresence>
            {filteredHistory.slice(0, visibleCount).map(item => (
              <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}
                className="relative p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary/40 group transition shadow-sm">
                <button onClick={() => handleDeleteItem(item._id)}
                  className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex flex-wrap items-center gap-2 mb-3 pr-8">
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{new Date(item.timestamp).toLocaleDateString()}</span>
                  <span className="text-xs font-semibold text-white bg-primary/80 px-2 py-0.5 rounded capitalize">{item.mode && item.mode !== 'text' ? item.mode : 'word'} Mode</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {getLangName(item.source_language || 'sign')} → {getLangName(item.target_language)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1"><p className="text-xs text-gray-500 mb-1">Original</p><p className="font-semibold text-gray-900 dark:text-white">{item.original_text}</p></div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition shrink-0" />
                  <div className="flex-1 text-right"><p className="text-xs text-gray-500 mb-1">Translated</p><p className="font-semibold text-primary">{item.translated_text}</p></div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {filteredHistory.length > visibleCount && (
          <div className="flex justify-center pt-2">
            <button onClick={() => setVisibleCount(c => c + 6)}
              className="px-6 py-2 text-sm font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-primary hover:bg-primary/5 dark:hover:bg-gray-700 shadow transition active:scale-95">
              See More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabHistory;
