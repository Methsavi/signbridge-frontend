import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, CheckCircle } from 'lucide-react';

const TIPS = [
  'Ensure better lighting for accurate hand tracking.',
  'Use a plain, non-noisy background.',
  'Keep your hand close to the camera and fully visible.',
  'Word Mode — sign one word, lower your hand, result appears automatically.',
  'Green pill = word recognized. Dots show model confidence.',
  'Tap Undo if the wrong word was captured.',
  'Translation is spoken aloud automatically.',
];

const TipsModal = ({ showTips, setShowTips }) => {
  return (
    <AnimatePresence>
      {showTips && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full sm:max-w-sm p-6 bg-white dark:bg-[#0f172a] sm:border sm:border-gray-200 dark:border-gray-700/50 shadow-2xl rounded-t-3xl sm:rounded-3xl"
          >
            <button
              onClick={() => setShowTips(false)}
              className="absolute p-2 text-gray-400 transition-colors bg-gray-100 rounded-full top-4 right-4 hover:text-gray-700 dark:hover:text-white dark:bg-white/10"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-yellow-100 rounded-full dark:bg-yellow-500/20">
                <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pro Tips</h3>
            </div>

            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              {TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setShowTips(false)}
              className="w-full mt-6 py-2.5 bg-gray-900/10 dark:bg-white/10 hover:bg-gray-900/20 dark:hover:bg-white/20 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors"
            >
              Got it!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TipsModal;
