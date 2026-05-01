import React from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, StopCircle, Lightbulb, Loader2, CheckCircle,
  AlertTriangle, Eye, Mic, MicOff,
} from 'lucide-react';
import ConfidenceDots from './ConfidenceDots';

const InputPanel = ({
  mode,
  signMode,
  isRecording,
  webcamRef,
  canvasRef,
  initSocket,
  onCameraError,
  toggleRecording,
  setShowTips,
  isCollecting,
  collectingFrames,
  wordFlash,
  wordAlternatives,
  showNoHandWarning,
  showLowConfWarning,
  handDetected,
  currentSign,
  signConfidence,
  holdProgress,
  inputText,
  setInputText,
  setIsFavorited,
  isListening,
  voiceSupported,
  toggleVoiceTyping,
}) => {
  return (
    <div className="relative flex items-center justify-center overflow-hidden border shadow-2xl bg-gray-100/50 border-gray-200/50 dark:bg-gray-800/30 dark:border-gray-700/50 rounded-3xl aspect-video backdrop-blur-sm group">
      <div className="absolute inset-0 z-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-black/5 dark:ring-white/5" />

      {/* ── CAMERA MODE ── */}
      {mode === 'camera' && (
        <>
          {isRecording ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-0 w-full h-full">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                onUserMedia={initSocket}
                onUserMediaError={onCameraError}
                videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
                className="absolute inset-0 z-0 object-cover w-full h-full transform scale-x-[-1]"
              />
              <canvas ref={canvasRef} className="absolute inset-0 z-10 object-cover w-full h-full pointer-events-none" />

              {/* Tips button (top-left) */}
              <div className="absolute z-30 top-3 left-3">
                <button
                  onClick={() => setShowTips(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-black/70 transition-all shadow-sm"
                >
                  <Lightbulb size={13} className="text-yellow-400" />
                  <span className="text-xs font-semibold">Tips</span>
                </button>
              </div>

              {/* LIVE badge (top-right) */}
              <div className="absolute top-3 right-3 z-30 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium tracking-wide text-white uppercase">Live</span>
              </div>

              {/* Word mode — collecting indicator */}
              <AnimatePresence>
                {signMode === 'word' && isCollecting && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-x-0 z-30 flex justify-center -translate-y-1/2 pointer-events-none top-1/2"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-full shadow-xl bg-black/70 backdrop-blur-md border-white/10">
                      <Loader2 size={14} className="text-primary animate-spin" />
                      <span className="text-xs font-semibold text-white">
                        Recording... {collectingFrames} frames
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Word mode — word flash (bottom-center) */}
              <AnimatePresence>
                {signMode === 'word' && wordFlash && !isCollecting && (
                  <motion.div
                    key={wordFlash.word + wordFlash.confidence}
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-x-0 z-30 flex justify-center pointer-events-none bottom-20 sm:bottom-24"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-full shadow-xl bg-green-500/90 backdrop-blur-md border-green-400/30">
                      <CheckCircle size={15} className="text-white shrink-0" />
                      <span className="text-sm font-bold text-white capitalize">{wordFlash.word}</span>
                      <ConfidenceDots confidence={wordFlash.confidence} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Word mode — alternative words (bottom-right) */}
              <AnimatePresence>
                {signMode === 'word' && wordAlternatives.length > 0 && !isCollecting && (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 0.8, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="absolute z-30 flex flex-col items-end gap-1 pointer-events-none bottom-20 sm:bottom-24 right-3"
                  >
                    <span className="text-[9px] text-white/40 uppercase tracking-widest mb-0.5">Alt.</span>
                    {wordAlternatives.map((alt, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-black/55 backdrop-blur-sm rounded-full border border-white/10">
                        <span className="text-xs capitalize text-white/70">{alt.word}</span>
                        <span className="text-[10px] text-white/35">{Math.round(alt.confidence * 100)}%</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Warning: no hand detected */}
              <AnimatePresence>
                {showNoHandWarning && !isCollecting && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-30 flex justify-center pointer-events-none inset-x-3 bottom-16 sm:bottom-20"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-full shadow-xl bg-red-500/90 border-red-400/30 backdrop-blur-md">
                      <AlertTriangle size={14} className="text-white shrink-0" />
                      <span className="text-xs font-semibold text-white">No hand detected — move your hand into frame</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Warning: low confidence (alphabet/number only) */}
              <AnimatePresence>
                {showLowConfWarning && signMode !== 'word' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25 }}
                    className="absolute z-30 flex justify-center pointer-events-none inset-x-3 bottom-16 sm:bottom-20"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-full shadow-xl bg-yellow-500/90 border-yellow-400/30 backdrop-blur-md">
                      <Eye size={14} className="text-white shrink-0" />
                      <span className="text-xs font-semibold text-white">
                        {signConfidence > 0
                          ? `Low confidence (${Math.round(signConfidence * 100)}%) — adjust hand position`
                          : 'Position unclear — face your palm toward the camera'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sign recognized + hold progress (alphabet/number only) */}
              <AnimatePresence>
                {handDetected && currentSign !== '' && signMode !== 'word' && (
                  <motion.div
                    key={currentSign}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-30 flex justify-center pointer-events-none inset-x-3 bottom-16 sm:bottom-20"
                  >
                    <div className="flex items-center gap-3 px-4 py-2 border rounded-full shadow-xl bg-black/70 border-white/10 backdrop-blur-md">
                      <span className="text-lg font-extrabold leading-none text-white uppercase">{currentSign}</span>
                      <ConfidenceDots confidence={signConfidence} />
                      <div className="flex items-center gap-1.5">
                        <div className="relative w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className={`absolute inset-y-0 left-0 rounded-full ${holdProgress >= 1 ? 'bg-green-400' : 'bg-primary'}`}
                            animate={{ width: `${holdProgress * 100}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                        <span className="text-[10px] text-white/50 tabular-nums w-7">
                          {holdProgress >= 1 ? '✓' : `${Math.round(holdProgress * 100)}%`}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hold progress bar strip (bottom edge, alphabet/number only) */}
              <AnimatePresence>
                {holdProgress > 0 && signMode !== 'word' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 bottom-0 z-30 h-1 overflow-hidden pointer-events-none bg-white/10 rounded-b-3xl"
                  >
                    <motion.div
                      className={`h-full ${holdProgress >= 1 ? 'bg-green-400' : 'bg-primary'}`}
                      animate={{ width: `${holdProgress * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Not recording — placeholder */
            <div className="z-10 flex flex-col items-center text-gray-400 transition-transform duration-500 dark:text-gray-500 group-hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 mb-4 bg-white border border-gray-100 rounded-full shadow-sm sm:w-20 sm:h-20 dark:bg-gray-800 dark:border-gray-700">
                <Camera className="w-8 h-8 text-gray-300 sm:w-10 sm:h-10 dark:text-gray-600" />
              </div>
              <p className="text-base font-medium text-gray-800 sm:text-lg dark:text-gray-300">Ready to translate</p>
              <p className="px-4 mt-1 text-xs text-center sm:text-sm opacity-70">Turn on camera to begin signing</p>
            </div>
          )}
        </>
      )}

      {/* ── TEXT MODE ── */}
      {mode === 'text' && (
        <>
          <textarea
            value={inputText}
            onChange={(e) => { setInputText(e.target.value); setIsFavorited(false); }}
            placeholder={isListening ? 'Listening… speak now' : 'Start typing or use the mic…'}
            className={`relative z-10 w-full h-full p-6 pb-16 text-lg text-gray-900 bg-transparent resize-none sm:p-8 sm:pb-16 sm:text-xl dark:text-white placeholder-gray-400/80 dark:placeholder-gray-600 focus:outline-none transition-all ${
              isListening ? 'placeholder-red-400 dark:placeholder-red-500' : ''
            }`}
          />

          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full shadow-lg pointer-events-none"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-white">Listening…</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute z-20 bottom-3 right-3">
            {voiceSupported ? (
              <button
                onClick={toggleVoiceTyping}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm shadow-lg transition-all duration-200 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/25'
                    : 'bg-primary hover:bg-primary/90 text-white ring-4 ring-primary/20'
                }`}
              >
                {isListening ? <><MicOff size={15} /> Stop</> : <><Mic size={15} /> Voice Type</>}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-400 border border-gray-200 dark:border-gray-700">
                <MicOff size={13} /> Not supported
              </div>
            )}
          </div>
        </>
      )}

      {/* Tips button when camera is off */}
      {mode === 'camera' && !isRecording && (
        <div className="absolute z-30 top-3 left-3">
          <button
            onClick={() => setShowTips(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-full border border-white/40 dark:border-white/10 text-gray-800 dark:text-gray-200 hover:bg-white/60 transition-all shadow-sm"
          >
            <Lightbulb size={13} className="text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs font-semibold">Tips</span>
          </button>
        </div>
      )}

      {/* Start / Stop camera button */}
      {mode === 'camera' && (
        <div className="absolute inset-x-0 z-30 flex justify-center px-4 bottom-3 sm:bottom-4">
          <button
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full font-bold shadow-2xl transition-all duration-300 text-sm text-white ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/40 ring-4 ring-red-500/20'
                : 'bg-gradient-to-r from-primary via-purple-500 to-primary shadow-primary/40 ring-4 ring-primary/20 hover:shadow-primary/60'
            }`}
          >
            {isRecording
              ? <><StopCircle size={18} /> Stop Translation</>
              : <><Camera size={18} /> Start Signing</>
            }
          </button>
        </div>
      )}
    </div>
  );
};

export default InputPanel;
