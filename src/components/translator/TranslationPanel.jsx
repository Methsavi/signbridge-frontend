import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2, Trash2, Keyboard, CheckCircle, Delete,
  Heart, Loader2, RotateCcw,
} from 'lucide-react';
import LanguageSelector from '../LanguageSelector';

const TranslationPanel = ({
  mode,
  signMode,
  sourceLang,
  setSourceLang,
  targetLang,
  setTargetLang,
  saveStatus,
  isFavorited,
  toggleFavorite,
  inputText,
  setInputText,
  setIsFavorited,
  translatedText,
  isRecording,
  isCollecting,
  lastWord,
  undoLastWord,
  isSpeaking,
  speakText,
  clearAll,
}) => {
  const speakTarget = mode === 'camera' && signMode === 'number' ? inputText : translatedText;

  return (
    <>
      {/* Language selectors */}
      <div className="flex flex-col gap-4 p-4 sm:p-5 bg-white border border-gray-200 shadow-sm rounded-2xl dark:bg-[#1e293b] dark:border-gray-700/30">
        {/* "From" row — hidden in number mode */}
        {!(mode === 'camera' && signMode === 'number') && (
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">From:</span>
            <div className="w-full sm:w-64">
              {mode === 'camera' ? (
                <div className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-xl dark:bg-[#334155] dark:text-gray-300 dark:border-gray-600/50">
                  American Sign Language (ASL)
                </div>
              ) : (
                <LanguageSelector selectedLang={sourceLang} onChange={setSourceLang} includeAuto={true} />
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">
            {mode === 'camera' && signMode === 'number' ? 'Speak Language:' : 'To:'}
          </span>
          <div className="w-full sm:w-64">
            <LanguageSelector selectedLang={targetLang} onChange={setTargetLang} includeAuto={false} />
          </div>
        </div>
      </div>

      {/* Translation output */}
      <div className="relative flex flex-col flex-grow p-5 sm:p-6 bg-white border border-gray-200 shadow-sm dark:bg-[#1e293b]/60 dark:border-gray-700/30 rounded-[2rem] min-h-[200px]">

        {/* Save status (top-left) */}
        <div className="absolute top-4 left-5 flex items-center gap-2 min-h-[28px]">
          <AnimatePresence>
            {saveStatus === 'saving' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full dark:bg-[#334155] dark:text-gray-400">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" /> Saving...
              </motion.div>
            )}
            {saveStatus === 'saved' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle size={11} /> Saved
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Favorite button (top-right) */}
        <div className="absolute top-3 right-4">
          <motion.button
            onClick={toggleFavorite}
            whileTap={{ scale: 0.85 }}
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-2 rounded-full transition-all duration-200 ${
              isFavorited
                ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/30'
                : 'text-gray-400 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
            }`}
          >
            <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
          </motion.button>
        </div>

        {/* Input sentence (camera mode, not number) */}
        {mode === 'camera' && signMode !== 'number' && (
          <div className="pb-4 mt-8 mb-4 border-b border-gray-100 dark:border-gray-600/30">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-400/80">
                {signMode === 'alphabet' ? 'Input Letter' : 'Input Sentence'}
              </h2>
              <AnimatePresence>
                {lastWord && signMode === 'word' && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    onClick={undoLastWord}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/60 dark:hover:bg-gray-700 dark:text-gray-400 rounded-full transition-colors"
                  >
                    <RotateCcw size={11} />
                    Undo
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {signMode === 'word' && isCollecting ? (
              <div className="flex items-center gap-2 min-h-[48px]">
                <Loader2 size={16} className="text-primary animate-spin shrink-0" />
                <p className="text-sm italic text-gray-400 dark:text-gray-500">Signing in progress...</p>
              </div>
            ) : (
              <p className="min-h-[48px] text-lg sm:text-xl font-mono text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                {inputText || <span className="font-sans text-base font-normal text-gray-300 dark:text-gray-600">Waiting for signs...</span>}
                {isRecording && <span className="inline-block w-2 h-5 ml-1 align-middle rounded-sm bg-primary animate-pulse" />}
              </p>
            )}
          </div>
        )}

        {/* Translation result */}
        <div className={mode === 'camera' && signMode !== 'number' ? '' : 'mt-8'}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-400/80">
              Translation Result
            </h2>
            {((mode === 'camera' && signMode === 'number') ? inputText : (translatedText && translatedText !== '...')) && (
              <button
                onClick={() => speakText(speakTarget)}
                disabled={isSpeaking}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSpeaking
                  ? <><Loader2 size={12} className="animate-spin" /> Speaking…</>
                  : <><Volume2 size={12} /> Speak again</>
                }
              </button>
            )}
          </div>
          <p className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 break-words sm:text-4xl md:text-5xl dark:text-white">
            {(mode === 'camera' && signMode === 'number')
              ? (inputText || <span className="text-2xl font-normal text-gray-300 dark:text-gray-600">Waiting for signs...</span>)
              : translatedText}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: isSpeaking ? 'Speaking…' : 'Speak', icon: isSpeaking ? Loader2 : Volume2, onClick: () => speakText(speakTarget), style: '', loading: isSpeaking },
          { label: 'Backspace', icon: Delete, onClick: () => { setInputText(p => p.slice(0, -1)); setIsFavorited(false); }, style: '' },
          { label: 'Space', icon: Keyboard, onClick: () => { setInputText(p => p + ' '); setIsFavorited(false); }, style: '' },
          { label: 'Clear', icon: Trash2, onClick: clearAll, style: 'text-red-500 bg-red-50 border-red-100 dark:bg-[#341b25] dark:border-[#52212d] dark:text-[#f87171]' },
        ].map(({ label, icon: Icon, onClick, style, loading }) => (
          <button
            key={label}
            onClick={onClick}
            disabled={loading}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 rounded-xl border transition-colors hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed ${
              style || 'text-gray-700 bg-white border-gray-200 dark:text-white dark:bg-[#334155] dark:border-transparent'
            }`}
          >
            <Icon size={16} className={`sm:w-[18px] sm:h-[18px] shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-[10px] sm:text-xs font-medium leading-tight text-center">{label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default TranslationPanel;
