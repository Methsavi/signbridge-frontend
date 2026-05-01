import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, BookOpen, Keyboard, MessageSquare, Type, Hash } from 'lucide-react';

const ModeSwitcher = ({ mode, signMode, onModeChange, onSignModeChange }) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Top-level mode tabs */}
      <div className="inline-flex flex-wrap justify-center p-1 sm:p-1.5 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl sm:rounded-full shadow-inner border border-gray-200/50 dark:border-gray-700/50 w-full sm:w-fit">
        <button
          onClick={() => onModeChange('camera')}
          className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
            mode === 'camera'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Video size={14} /> <span>Sign to Text</span>
        </button>
        <button
          onClick={() => onModeChange('text-to-sign')}
          className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
            mode === 'text-to-sign'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <BookOpen size={14} /> <span>Text to Sign</span>
        </button>
        <button
          onClick={() => onModeChange('text')}
          className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
            mode === 'text'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Keyboard size={14} /> <span>Text Mode</span>
        </button>
      </div>

      {/* Sign sub-mode tabs — only visible in camera mode */}
      <AnimatePresence>
        {mode === 'camera' && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="inline-flex flex-wrap justify-center p-1 bg-indigo-50/50 dark:bg-[#1e293b]/50 backdrop-blur-md rounded-2xl sm:rounded-full shadow-sm border border-indigo-100/50 dark:border-gray-700/50 w-full sm:w-fit overflow-hidden"
          >
            {[
              { id: 'word', label: 'Word Mode', icon: MessageSquare },
              { id: 'alphabet', label: 'Alphabet Mode', icon: Type },
              { id: 'number', label: 'Number Mode', icon: Hash },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onSignModeChange(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                  signMode === id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModeSwitcher;
