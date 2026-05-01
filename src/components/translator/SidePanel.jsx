import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Star, Heart } from 'lucide-react';

const SidePanel = ({
  activePanel,
  setActivePanel,
  panelLoading,
  historyItems,
  favorites,
  applyHistoryItem,
  applyFavorite,
  removeFavorite,
}) => {
  return (
    <AnimatePresence>
      {activePanel && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePanel(null)}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 z-[210] h-full w-full max-w-sm bg-white dark:bg-[#0f172a] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                {activePanel === 'history'
                  ? <Clock size={20} className="text-primary" />
                  : <Star size={20} className="text-rose-500" fill="currentColor" />}
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {activePanel === 'history' ? 'Translation History' : 'Saved Favorites'}
                </h2>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="p-2 text-gray-400 transition-colors rounded-full hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">

              {/* History */}
              {activePanel === 'history' && (
                panelLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 border-4 rounded-full border-primary border-t-transparent animate-spin" />
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <Clock size={32} className="mb-3 opacity-30" />
                    <p className="text-sm">No history yet</p>
                  </div>
                ) : historyItems.map((item, i) => (
                  <motion.button
                    key={item._id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => applyHistoryItem(item)}
                    className="w-full text-left p-4 rounded-2xl bg-gray-50 dark:bg-[#1e293b] border border-gray-100 dark:border-gray-700/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                  >
                    <p className="text-sm font-medium text-gray-800 truncate dark:text-gray-200">{item.original_text}</p>
                    <p className="mt-1 text-xs truncate text-primary dark:text-indigo-400">{item.translated_text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 capitalize">{item.mode}</span>
                      <span className="text-[10px] text-gray-400">{new Date(item.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </motion.button>
                ))
              )}

              {/* Favorites */}
              {activePanel === 'favorites' && (
                favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <Heart size={32} className="mb-3 opacity-30" />
                    <p className="text-sm">No favorites yet</p>
                    <p className="mt-1 text-xs opacity-60">Tap ♥ on a translation to save it</p>
                  </div>
                ) : favorites.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="relative p-4 rounded-2xl bg-rose-50/60 dark:bg-[#1e293b] border border-rose-100 dark:border-rose-900/30"
                  >
                    <button onClick={() => applyFavorite(item)} className="w-full text-left">
                      <p className="pr-8 text-sm font-medium text-gray-800 truncate dark:text-gray-200">{item.original}</p>
                      <p className="mt-1 text-xs truncate text-rose-500 dark:text-rose-400">{item.translated}</p>
                      <p className="text-[10px] text-gray-400 mt-2">{new Date(item.date).toLocaleDateString()}</p>
                    </button>
                    <button
                      onClick={() => removeFavorite(item.id)}
                      className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SidePanel;
