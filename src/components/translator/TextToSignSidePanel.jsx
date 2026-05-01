import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Trash2 } from 'lucide-react';

const TextToSignSidePanel = ({
  ttsTokens,
  ttsCurrentIdx,
  setTtsCurrentIdx,
  ttsInput,
  setTtsInput,
  ttsError,
  setTtsError,
  setTtsAutoPlaying,
}) => {
  return (
    <div className="flex flex-col gap-4">

      {/* Stats row */}
      {ttsTokens.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-2xl text-center">
            <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">{ttsTokens.filter(t => t.entry).length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Found</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/40 rounded-2xl text-center">
            <p className="text-2xl font-extrabold text-gray-400">{ttsTokens.filter(t => !t.entry).length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Not found</p>
          </div>
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl text-center">
            <p className="text-2xl font-extrabold text-primary">{ttsTokens.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total</p>
          </div>
        </div>
      )}

      {/* Current sign info */}
      <div className="p-4 sm:p-5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700/30 rounded-2xl shadow-sm">
        <h3 className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400/80 uppercase mb-3">Current Sign</h3>
        {ttsTokens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-gray-300 dark:text-gray-600">
            <BookOpen size={28} className="opacity-40" />
            <p className="text-xs text-center text-gray-400 dark:text-gray-500">Results will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wide">
                {ttsTokens[ttsCurrentIdx]?.label}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-1 shrink-0 ${
                ttsTokens[ttsCurrentIdx]?.entry
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              }`}>
                {ttsTokens[ttsCurrentIdx]?.entry ? '✓ Found' : '✗ Not found'}
              </span>
            </div>
            {ttsTokens[ttsCurrentIdx]?.entry && (
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full capitalize">
                  {ttsTokens[ttsCurrentIdx].entry.category}
                </span>
                <span className="px-2.5 py-1 text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full capitalize">
                  {ttsTokens[ttsCurrentIdx].entry.media_type}
                </span>
              </div>
            )}
            <p className="text-xs text-gray-400">{ttsCurrentIdx + 1} of {ttsTokens.length} signs</p>
          </div>
        )}
      </div>

      {/* All signs list */}
      {ttsTokens.length > 0 && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700/30 rounded-2xl shadow-sm">
          <h3 className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400/80 uppercase mb-3">All Signs</h3>
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {ttsTokens.map((token, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setTtsCurrentIdx(i)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-150 ${
                  i === ttsCurrentIdx
                    ? 'bg-primary/10 dark:bg-primary/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${token.entry ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <span className={`text-sm font-semibold uppercase flex-1 ${i === ttsCurrentIdx ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                  {token.label}
                </span>
                {token.entry && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize shrink-0">{token.entry.media_type}</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Clear button */}
      {(ttsTokens.length > 0 || ttsInput) && (
        <button
          onClick={() => { setTtsTokens([]); setTtsInput(''); setTtsCurrentIdx(0); setTtsError(''); setTtsAutoPlaying(false); }}
          className="flex items-center justify-center gap-2 p-3 text-red-500 bg-red-50 border border-red-100 dark:bg-[#341b25] dark:border-[#52212d] dark:text-[#f87171] rounded-xl hover:brightness-110 transition-all text-sm font-semibold"
        >
          <Trash2 size={16} /> Clear All
        </button>
      )}
    </div>
  );
};

export default TextToSignSidePanel;
