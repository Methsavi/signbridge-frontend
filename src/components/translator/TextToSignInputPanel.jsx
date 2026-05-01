import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Loader2, Mic, MicOff, AlertTriangle,
  ArrowLeft, ArrowRight, Play, Pause,
} from 'lucide-react';

const TextToSignInputPanel = ({
  ttsInput,
  setTtsInput,
  ttsTokens,
  setTtsTokens,
  ttsCurrentIdx,
  setTtsCurrentIdx,
  ttsLoading,
  ttsIsListening,
  ttsError,
  ttsAutoPlaying,
  setTtsAutoPlaying,
  ttsAutoPlayTimerRef,
  ttsVideoRef,
  voiceSupported,
  toggleTtsVoice,
  handleTextToSignSubmit,
}) => {
  return (
    <div className="flex flex-col gap-3">

      {/* Text input area */}
      <div className="relative bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700/30 rounded-2xl overflow-hidden shadow-sm">
        <textarea
          value={ttsInput}
          onChange={(e) => { setTtsInput(e.target.value); if (ttsTokens.length > 0) setTtsTokens([]); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextToSignSubmit(); } }}
          placeholder={ttsIsListening ? 'Listening… speak now' : 'Type text to convert to signs…'}
          rows={3}
          className={`w-full p-4 sm:p-5 pb-14 text-base sm:text-lg text-gray-900 bg-transparent resize-none dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none ${
            ttsIsListening ? 'placeholder-red-400 dark:placeholder-red-500' : ''
          }`}
        />

        <AnimatePresence>
          {ttsIsListening && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full pointer-events-none shadow-lg"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-white">Listening…</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-3 inset-x-3 flex items-center gap-2">
          {voiceSupported && (
            <button
              onClick={toggleTtsVoice}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                ttsIsListening
                  ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/25'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {ttsIsListening ? <><MicOff size={13} /> Stop</> : <><Mic size={13} /> Voice</>}
            </button>
          )}
          <button
            onClick={handleTextToSignSubmit}
            disabled={!ttsInput.trim() || ttsLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-500 text-white rounded-full text-xs font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200"
          >
            {ttsLoading
              ? <><Loader2 size={13} className="animate-spin" /> Looking up…</>
              : <><BookOpen size={13} /> Show Signs</>
            }
          </button>
        </div>
      </div>

      {/* Token strip */}
      <AnimatePresence>
        {ttsTokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex gap-2 overflow-x-auto pb-1 snap-x"
          >
            {ttsTokens.map((token, i) => (
              <button
                key={i}
                onClick={() => setTtsCurrentIdx(i)}
                className={`flex-shrink-0 snap-start flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all duration-200 ${
                  i === ttsCurrentIdx
                    ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                    : token.entry
                    ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:border-green-400 dark:hover:border-green-500'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="font-extrabold uppercase tracking-wide">{token.label}</span>
                <span className="text-[9px] opacity-60 font-normal leading-none">
                  {token.entry ? (token.entry.media_type === 'video' ? '▶ vid' : '◉ img') : '—'}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media display */}
      <AnimatePresence>
        {ttsTokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="relative flex items-center justify-center overflow-hidden border shadow-2xl bg-gray-900 border-gray-700/50 rounded-3xl aspect-video"
          >
            <AnimatePresence mode="wait">
              {ttsTokens[ttsCurrentIdx]?.entry ? (
                <motion.div
                  key={`media-${ttsCurrentIdx}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center bg-gray-900"
                >
                  {ttsTokens[ttsCurrentIdx].entry.media_type === 'video' ? (
                    <video
                      ref={ttsVideoRef}
                      key={`v-${ttsCurrentIdx}`}
                      src={ttsTokens[ttsCurrentIdx].entry.media_url}
                      autoPlay
                      loop={!ttsAutoPlaying}
                      muted
                      playsInline
                      onEnded={() => {
                        if (!ttsAutoPlaying) return;
                        if (ttsCurrentIdx < ttsTokens.length - 1) {
                          setTtsCurrentIdx(i => i + 1);
                        } else {
                          setTtsAutoPlaying(false);
                        }
                      }}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={ttsTokens[ttsCurrentIdx].entry.media_url}
                      alt={`Sign for ${ttsTokens[ttsCurrentIdx].label}`}
                      className="w-full h-full object-contain"
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={`empty-${ttsCurrentIdx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500 px-6 text-center"
                >
                  <BookOpen size={40} className="opacity-30 mb-1" />
                  <p className="text-sm font-semibold">
                    No sign for "<span className="uppercase">{ttsTokens[ttsCurrentIdx]?.label}</span>"
                  </p>
                  <p className="text-xs opacity-60">Not in the dictionary yet</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Label overlay */}
            <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
              <span className="text-white text-sm font-bold uppercase tracking-wide">
                {ttsTokens[ttsCurrentIdx]?.label}
              </span>
            </div>

            {/* Counter */}
            <div className="absolute top-3 right-3 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
              <span className="text-white text-xs font-medium tabular-nums">
                {ttsCurrentIdx + 1} / {ttsTokens.length}
              </span>
            </div>

            {/* Navigation */}
            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center items-center gap-2">
              <button
                onClick={() => { clearTimeout(ttsAutoPlayTimerRef.current); setTtsAutoPlaying(false); setTtsCurrentIdx(i => Math.max(0, i - 1)); }}
                disabled={ttsCurrentIdx === 0}
                className="p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-white disabled:opacity-30 transition-all duration-200 shadow-lg"
              >
                <ArrowLeft size={16} />
              </button>
              {ttsTokens.length > 1 && (
                <button
                  onClick={() => {
                    if (ttsAutoPlaying) {
                      clearTimeout(ttsAutoPlayTimerRef.current);
                      setTtsAutoPlaying(false);
                    } else {
                      if (ttsCurrentIdx >= ttsTokens.length - 1) setTtsCurrentIdx(0);
                      setTtsAutoPlaying(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-white transition-all duration-200 shadow-lg text-xs font-semibold"
                >
                  {ttsAutoPlaying ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play All</>}
                </button>
              )}
              <button
                onClick={() => { clearTimeout(ttsAutoPlayTimerRef.current); setTtsAutoPlaying(false); setTtsCurrentIdx(i => Math.min(ttsTokens.length - 1, i + 1)); }}
                disabled={ttsCurrentIdx === ttsTokens.length - 1}
                className="p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-white disabled:opacity-30 transition-all duration-200 shadow-lg"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {ttsError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl"
          >
            <AlertTriangle size={15} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{ttsError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {ttsTokens.length === 0 && !ttsLoading && !ttsError && (
        <div className="flex flex-col items-center gap-3 py-10 sm:py-12 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700/50 rounded-3xl">
          <BookOpen size={44} className="opacity-20" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Enter text above and tap Show Signs</p>
          <p className="text-xs opacity-70 text-center px-6 leading-relaxed">
            Words are matched from the sign dictionary.<br />Unknown words fall back to letter-by-letter.
          </p>
        </div>
      )}
    </div>
  );
};

export default TextToSignInputPanel;
