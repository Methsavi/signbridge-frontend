import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, StopCircle, Volume2, Trash2, Keyboard, Video,
  CheckCircle, Delete, Type, Hash, MessageSquare, Heart,
  Clock, X, Star, Lightbulb, Loader2, RotateCcw
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { featureService } from '../services/api';
import LanguageSelector from '../components/LanguageSelector';

// ─────────────────────────────────────────────────────────────────────
// CONFIDENCE DOTS — visual, readable without text literacy
// ─────────────────────────────────────────────────────────────────────
const ConfidenceDots = ({ confidence }) => {
  const filled = Math.round(confidence * 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${i < filled
              ? filled >= 4 ? 'bg-green-300' : filled >= 3 ? 'bg-yellow-300' : 'bg-orange-300'
              : 'bg-white/30'
            }`}
        />
      ))}
    </div>
  );
};

const Translator = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [mode, setMode] = useState('camera');
  const [signMode, setSignMode] = useState('word');
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('...');

  const [targetLang, setTargetLang] = useState('si');
  const [sourceLang, setSourceLang] = useState('auto');

  const [saveStatus, setSaveStatus] = useState(null);

  const [activePanel, setActivePanel] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb_favorites') || '[]'); } catch { return []; }
  });
  const [isFavorited, setIsFavorited] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // ── Word mode state ───────────────────────────────────────────────
  const [wordFlash, setWordFlash] = useState(null);   // {word, confidence} shown on camera
  const [wordAlternatives, setWordAlternatives] = useState([]); // [{word, confidence}] shown in corner
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectingFrames, setCollectingFrames] = useState(0);
  const [lastWord, setLastWord] = useState(null);   // for undo
  const wordFlashTimer = useRef(null);

  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSavedRef = useRef('');
  const signModeRef = useRef('word');
  const modeRef = useRef('camera');
  const pendingSaveRef = useRef(null); // { original, translated, lang, mode, source }
  const autoSaveTimerRef = useRef(null);
  // Track last committed word to prevent duplicates within a short window
  const lastCommittedRef = useRef(null);
  const lastCommittedTimeRef = useRef(0);
  const WORD_DEDUP_MS = 2000; // ignore same word within 2 seconds

  // ─────────────────────────────────────────────────────────────────
  // SPEAK
  // ─────────────────────────────────────────────────────────────────
  const speakText = useCallback((text) => {
    if (!text || text === '...') return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // DRAW HAND LANDMARKS
  // ─────────────────────────────────────────────────────────────────
  const drawHand = (landmarks) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video || video.readyState < 2) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [9, 10], [10, 11], [11, 12],
      [9, 13], [13, 14], [14, 15], [15, 16],
      [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
    ];
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 4;
    ctx.fillStyle = '#FF0000';
    connections.forEach(([s, e]) => {
      const sp = landmarks[s], ep = landmarks[e];
      ctx.beginPath();
      ctx.moveTo((1 - sp.x) * canvas.width, sp.y * canvas.height);
      ctx.lineTo((1 - ep.x) * canvas.width, ep.y * canvas.height);
      ctx.stroke();
    });
    landmarks.forEach((pt) => {
      ctx.beginPath();
      ctx.arc((1 - pt.x) * canvas.width, pt.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // ─────────────────────────────────────────────────────────────────
  // APPEND WORD — single source of truth, deduplication built in
  // ─────────────────────────────────────────────────────────────────
  const appendWord = useCallback((word) => {
    const now = Date.now();
    // Deduplicate: ignore if same word committed within WORD_DEDUP_MS
    if (
      word === lastCommittedRef.current &&
      now - lastCommittedTimeRef.current < WORD_DEDUP_MS
    ) return;

    lastCommittedRef.current = word;
    lastCommittedTimeRef.current = now;
    setLastWord(word);

    setInputText(prev => {
      if (word.toLowerCase() === 'space') return prev + ' ';
      if (word.toLowerCase() === 'del' || word.toLowerCase() === 'delete') return prev.slice(0, -1);
      if (signModeRef.current === 'word' && prev.length > 0 && !prev.endsWith(' ')) {
        return prev + ' ' + word;
      }
      return prev + word;
    });
    setIsFavorited(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // UNDO LAST WORD
  // ─────────────────────────────────────────────────────────────────
  const undoLastWord = () => {
    if (!lastWord) return;
    setInputText(prev => {
      const trimmed = prev.trimEnd();
      if (trimmed.endsWith(lastWord)) {
        return trimmed.slice(0, trimmed.length - lastWord.length).trimEnd();
      }
      return prev.slice(0, -1);
    });
    setLastWord(null);
    setWordFlash(null);
    setWordAlternatives([]);
    lastCommittedRef.current = null;
    lastCommittedTimeRef.current = 0;
  };

  useEffect(() => { modeRef.current = mode; }, [mode]);

  // ─────────────────────────────────────────────────────────────────
  // SAVE — must be defined before handleTranslate (used in its body/deps)
  // ─────────────────────────────────────────────────────────────────
  const saveCurrentSession = useCallback(async () => {
    const p = pendingSaveRef.current;
    if (!p || !p.original || p.translated === '...' || p.original === lastSavedRef.current) return;
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    lastSavedRef.current = p.original;
    if (autoSaveTimerRef.current) { clearTimeout(autoSaveTimerRef.current); autoSaveTimerRef.current = null; }
    try {
      setSaveStatus('saving');
      await featureService.saveHistory(user.user_id, p.original, p.translated, p.lang, p.mode, p.source);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch { setSaveStatus('error'); }
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // TRANSLATION
  // ─────────────────────────────────────────────────────────────────
  const handleTranslate = useCallback(async (text) => {
    if (!text) return;
    try {
      const result = await featureService.translate(text, targetLang, sourceLang);
      setTranslatedText(result.translated);
      setIsFavorited(false);
      speakText(result.translated);
      pendingSaveRef.current = {
        original: text,
        translated: result.translated,
        lang: targetLang,
        mode: modeRef.current === 'camera' ? signModeRef.current : 'text',
        source: modeRef.current === 'camera' ? 'sign' : sourceLang,
      };
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(saveCurrentSession, 5 * 60 * 1000);
    } catch (err) { console.error('Translation error', err); }
  }, [targetLang, sourceLang, speakText, saveCurrentSession]);

  // Debounce translation in text mode
  useEffect(() => {
    if (mode === 'text' && inputText) {
      const id = setTimeout(() => handleTranslate(inputText), 800);
      return () => clearTimeout(id);
    }
  }, [inputText, targetLang, sourceLang]);

  const openPanel = async (panel) => {
    if (activePanel === panel) { setActivePanel(null); return; }
    setActivePanel(panel);
    if (panel === 'history') {
      setPanelLoading(true);
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const items = await featureService.getHistory(user.user_id);
          setHistoryItems(items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
        }
      } catch (e) { console.error(e); }
      setPanelLoading(false);
    }
  };

  const toggleFavorite = () => {
    if (!inputText || translatedText === '...') return;
    const item = { id: Date.now(), original: inputText, translated: translatedText, lang: targetLang, date: new Date().toISOString() };
    if (isFavorited) {
      const updated = favorites.filter(f => f.original !== inputText || f.translated !== translatedText);
      setFavorites(updated); localStorage.setItem('sb_favorites', JSON.stringify(updated)); setIsFavorited(false);
    } else {
      const updated = [item, ...favorites];
      setFavorites(updated); localStorage.setItem('sb_favorites', JSON.stringify(updated)); setIsFavorited(true);
    }
  };

  const removeFavorite = (id) => { const u = favorites.filter(f => f.id !== id); setFavorites(u); localStorage.setItem('sb_favorites', JSON.stringify(u)); };
  const applyHistoryItem = (item) => { setInputText(item.original_text); setTranslatedText(item.translated_text); setActivePanel(null); };
  const applyFavorite = (item) => { setInputText(item.original); setTranslatedText(item.translated); setActivePanel(null); };

  // ─────────────────────────────────────────────────────────────────
  // WEBSOCKET
  // ─────────────────────────────────────────────────────────────────
  const initSocket = () => {
    if (socketRef.current) socketRef.current.close();
    if (intervalRef.current) clearInterval(intervalRef.current);

    const currentMode = signModeRef.current;
    socketRef.current = new WebSocket(`${import.meta.env.VITE_WS_URL}/ws/predict/${currentMode}`);

    socketRef.current.onopen = () => {
      intervalRef.current = setInterval(() => {
        if (webcamRef.current?.video?.readyState === 4 && socketRef.current?.readyState === WebSocket.OPEN) {
          const imgSrc = webcamRef.current.getScreenshot();
          if (imgSrc) socketRef.current.send(imgSrc);
        }
      }, 200);
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // ── WORD MODE ─────────────────────────────────────────────────
      if (currentMode === 'word') {
        if (data.collecting) {
          setIsCollecting(true);
          setCollectingFrames(data.frames || 0);
          // Clear flash while collecting next sign
          setWordFlash(null);
          setWordAlternatives([]);
        }

        if (data.ready && data.top3 && data.top3.length > 0) {
          setIsCollecting(false);
          setCollectingFrames(0);

          const best = data.top3[0];
          const rest = data.top3.slice(1);

          // ── Append word ONCE via appendWord (dedup protected) ─────
          appendWord(best.word);

          // Show flash on camera
          setWordFlash({ word: best.word, confidence: best.confidence });
          setWordAlternatives(rest);

          // Clear flash after 2.5s
          if (wordFlashTimer.current) clearTimeout(wordFlashTimer.current);
          wordFlashTimer.current = setTimeout(() => {
            setWordFlash(null);
            setWordAlternatives([]);
          }, 2500);

          // Translate — use functional form to get latest inputText
          setInputText(prev => {
            const next = prev.length > 0 && !prev.endsWith(' ')
              ? prev + ' ' + best.word
              : prev + best.word;
            // Only translate once — compare with what appendWord already set
            // We don't re-append here, just compute next for translate
            setTimeout(() => handleTranslate(next), 300);
            return prev; // DON'T change state here — appendWord already did it
          });
        }

        if (!data.collecting && !data.ready) {
          setIsCollecting(false);
          setCollectingFrames(0);
        }

        // ── ALPHABET / NUMBER MODE ────────────────────────────────────
      } else {
        if (data.committed && data.sign && data.sign !== '...' && data.sign !== 'Nothing') {
          appendWord(data.sign);
        }
      }

      if (data.landmarks) {
        drawHand(data.landmarks);
      } else {
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  };

  const handleSignModeChange = (newMode) => {
    if (signMode === newMode) return;
    saveCurrentSession();
    if (autoSaveTimerRef.current) { clearTimeout(autoSaveTimerRef.current); autoSaveTimerRef.current = null; }
    pendingSaveRef.current = null;
    lastSavedRef.current = '';
    setSignMode(newMode);
    signModeRef.current = newMode;
    setInputText(''); setTranslatedText('...'); setIsFavorited(false);
    setWordFlash(null); setWordAlternatives([]); setIsCollecting(false);
    setCollectingFrames(0); setLastWord(null);
    lastCommittedRef.current = null; lastCommittedTimeRef.current = 0;
    if (isRecording && webcamRef.current?.video?.readyState === 4) initSocket();
  };

  const stopTranslation = (shouldSave = false) => {
    setIsRecording(false);
    if (socketRef.current) socketRef.current.close();
    if (intervalRef.current) clearInterval(intervalRef.current);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setWordFlash(null); setWordAlternatives([]); setIsCollecting(false); setCollectingFrames(0);
    if (shouldSave) saveCurrentSession();
  };

  const toggleRecording = () => isRecording ? stopTranslation(true) : setIsRecording(true);

  const clearAll = () => {
    saveCurrentSession();
    if (autoSaveTimerRef.current) { clearTimeout(autoSaveTimerRef.current); autoSaveTimerRef.current = null; }
    pendingSaveRef.current = null;
    lastSavedRef.current = '';
    setTranslatedText('...'); setInputText(''); setIsFavorited(false);
    setWordFlash(null); setWordAlternatives([]); setLastWord(null);
    lastCommittedRef.current = null; lastCommittedTimeRef.current = 0;
  };

  // Translate when inputText changes in word/alphabet/number mode (debounced)
  const translateDebounceRef = useRef(null);
  useEffect(() => {
    if (mode === 'camera' && inputText) {
      if (translateDebounceRef.current) clearTimeout(translateDebounceRef.current);
      translateDebounceRef.current = setTimeout(() => handleTranslate(inputText), 600);
    }
  }, [inputText]);

  // Save on page leave (browser close/refresh) and component unmount (SPA navigation)
  useEffect(() => {
    window.addEventListener('beforeunload', saveCurrentSession);
    return () => {
      saveCurrentSession();
      window.removeEventListener('beforeunload', saveCurrentSession);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [saveCurrentSession]);

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen text-gray-900 transition-colors duration-300 bg-gray-50 dark:text-white dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow p-4 md:p-8">
        <div className="grid grid-cols-1 gap-8 mx-auto max-w-7xl lg:grid-cols-2">

          {/* ══════════════════════════════════════════════════════════
              LEFT COLUMN
          ══════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-4 sm:gap-6">

            {/* Mode Switcher */}
            <div className="flex flex-col gap-3">
              <div className="inline-flex flex-wrap justify-center p-1 sm:p-1.5 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl sm:rounded-full shadow-inner border border-gray-200/50 dark:border-gray-700/50 w-full sm:w-fit">
                <button
                  onClick={() => { if (mode !== 'camera') { saveCurrentSession(); pendingSaveRef.current = null; lastSavedRef.current = ''; setMode('camera'); setIsRecording(false); setInputText(''); setTranslatedText('...'); setIsFavorited(false); } }}
                  className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${mode === 'camera' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  <Video size={16} /> Sign Mode
                </button>
                <button
                  onClick={() => { if (mode !== 'text') { saveCurrentSession(); pendingSaveRef.current = null; lastSavedRef.current = ''; setMode('text'); stopTranslation(); setInputText(''); setTranslatedText('...'); setIsFavorited(false); } }}
                  className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${mode === 'text' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  <Keyboard size={16} /> Text Mode
                </button>
              </div>

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
                        onClick={() => handleSignModeChange(id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${signMode === id ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                      >
                        <Icon size={14} /> {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── CAMERA BOX ── */}
            <div className="relative flex items-center justify-center overflow-hidden border shadow-2xl bg-gray-100/50 border-gray-200/50 dark:bg-gray-800/30 dark:border-gray-700/50 rounded-3xl aspect-video backdrop-blur-sm group">
              <div className="absolute inset-0 z-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-black/5 dark:ring-white/5" />

              {mode === 'camera' && (
                <>
                  {isRecording ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-0 w-full h-full">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        onUserMedia={initSocket}
                        onUserMediaError={() => { alert('Camera Blocked or Not Found'); setIsRecording(false); }}
                        videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
                        className="absolute inset-0 z-0 object-cover w-full h-full transform scale-x-[-1]"
                      />
                      <canvas ref={canvasRef} className="absolute inset-0 z-10 object-cover w-full h-full pointer-events-none" />

                      {/* TOP ROW: Tips (left) + LIVE badge (right) — no overlap */}
                      <div className="absolute z-30 top-3 left-3">
                        <button
                          onClick={() => setShowTips(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-black/70 transition-all shadow-sm"
                        >
                          <Lightbulb size={13} className="text-yellow-400" />
                          <span className="text-xs font-semibold">Tips</span>
                        </button>
                      </div>
                      <div className="absolute top-3 right-3 z-30 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium tracking-wide text-white uppercase">Live</span>
                      </div>

                      {/* CENTER: Collecting indicator */}
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

                      {/* BOTTOM-CENTER: Word flash — sits ABOVE the stop button with margin */}
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

                      {/* BOTTOM-RIGHT: Alternative words — above stop button, right edge */}
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
                              <div
                                key={i}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-black/55 backdrop-blur-sm rounded-full border border-white/10"
                              >
                                <span className="text-xs capitalize text-white/70">{alt.word}</span>
                                <span className="text-[10px] text-white/35">{Math.round(alt.confidence * 100)}%</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
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

              {mode === 'text' && (
                <textarea
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); setIsFavorited(false); }}
                  placeholder="Start typing your phrase here..."
                  className="relative z-10 w-full h-full p-6 text-lg text-gray-900 bg-transparent resize-none sm:p-8 sm:text-xl dark:text-white placeholder-gray-400/80 dark:placeholder-gray-600 focus:outline-none"
                />
              )}

              {/* Tips button when not recording */}
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

              {/* STOP / START button — always at bottom, full width on mobile */}
              {mode === 'camera' && (
                <div className="absolute inset-x-0 z-30 flex justify-center px-4 bottom-3 sm:bottom-4">
                  <button
                    onClick={toggleRecording}
                    className={`flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full font-bold shadow-2xl transition-all duration-300 text-sm text-white
                      ${isRecording
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
          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT COLUMN
          ══════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-4">

            {/* Language selectors */}
            <div
              className={`flex flex-col gap-4 p-4 sm:p-5 bg-white border shadow-sm rounded-2xl transition-all duration-300
                ${(mode === 'camera' && signMode === 'number')
                  ? 'hidden'
                  : 'border-gray-200 dark:bg-[#1e293b] dark:border-gray-700/30'}`}
            >
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
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">To:</span>
                <div className="w-full sm:w-64">
                  <LanguageSelector selectedLang={targetLang} onChange={setTargetLang} includeAuto={false} />
                </div>
              </div>
            </div>

            {/* ── Translation output panel ── */}
            <div className="relative flex flex-col flex-grow p-5 sm:p-6 bg-white border border-gray-200 shadow-sm dark:bg-[#1e293b]/60 dark:border-gray-700/30 rounded-[2rem] min-h-[200px]">

              {/* Save status — top-left */}
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

              {/* Favorite button — top-right, alone, no overlap */}
              <div className="absolute top-3 right-4">
                <motion.button
                  onClick={toggleFavorite}
                  whileTap={{ scale: 0.85 }}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  className={`p-2 rounded-full transition-all duration-200 ${isFavorited ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/30' : 'text-gray-400 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'}`}
                >
                  <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                </motion.button>
              </div>

              {/* Input sentence section */}
              {mode === 'camera' && signMode !== 'number' && (
                <div className="pb-4 mt-8 mb-4 border-b border-gray-100 dark:border-gray-600/30">
                  {/* Label row: title left, undo right — clearly separated */}
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

              {/* Translation result section */}
              <div className={mode === 'camera' && signMode !== 'number' ? '' : 'mt-8'}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-400/80">
                    Translation Result
                  </h2>
                  {translatedText && translatedText !== '...' && (
                    <button
                      onClick={() => speakText(translatedText)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
                    >
                      <Volume2 size={12} /> Speak again
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
                { label: 'Speak', icon: Volume2, onClick: () => speakText(translatedText), style: '' },
                { label: 'Backspace', icon: Delete, onClick: () => { setInputText(p => p.slice(0, -1)); setIsFavorited(false); }, style: '' },
                { label: 'Space', icon: Keyboard, onClick: () => { setInputText(p => p + ' '); setIsFavorited(false); }, style: '' },
                { label: 'Clear', icon: Trash2, onClick: clearAll, style: 'text-red-500 bg-red-50 border-red-100 dark:bg-[#341b25] dark:border-[#52212d] dark:text-[#f87171]' },
              ].map(({ label, icon: Icon, onClick, style }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 rounded-xl border transition-colors hover:brightness-110 ${style || 'text-gray-700 bg-white border-gray-200 dark:text-white dark:bg-[#334155] dark:border-transparent'}`}
                >
                  <Icon size={16} className="sm:w-[18px] sm:h-[18px] shrink-0" />
                  <span className="text-[10px] sm:text-xs font-medium leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History & Favorites bar */}
        <div className="flex justify-center gap-12 py-6 mt-2 sm:gap-16 sm:py-8">
          {[
            { id: 'history', icon: Clock, label: 'History', activeColor: 'text-primary border-primary bg-primary/10', defaultColor: 'border-gray-200 dark:border-gray-700' },
            { id: 'favorites', icon: Star, label: 'Saved', activeColor: 'text-rose-500 border-rose-400 bg-rose-50 dark:bg-rose-900/20', defaultColor: 'border-gray-200 dark:border-gray-700' },
          ].map(({ id, icon: Icon, label, activeColor, defaultColor }) => (
            <button key={id} onClick={() => openPanel(id)} className={`flex flex-col items-center gap-1.5 group transition-all duration-200 ${activePanel === id ? activeColor.split(' ')[0] : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${activePanel === id ? activeColor : defaultColor}`}>
                <Icon size={20} fill={id === 'favorites' && activePanel === id ? 'currentColor' : 'none'} />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </main>

      {/* ── Tips Modal ── */}
      <AnimatePresence>
        {showTips && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full sm:max-w-sm p-6 bg-white dark:bg-[#0f172a] sm:border sm:border-gray-200 dark:border-gray-700/50 shadow-2xl rounded-t-3xl sm:rounded-3xl"
            >
              <button onClick={() => setShowTips(false)} className="absolute p-2 text-gray-400 transition-colors bg-gray-100 rounded-full top-4 right-4 hover:text-gray-700 dark:hover:text-white dark:bg-white/10">
                <X size={18} />
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-yellow-100 rounded-full dark:bg-yellow-500/20">
                  <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pro Tips</h3>
              </div>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                {[
                  'Ensure better lighting for accurate hand tracking.',
                  'Use a plain, non-noisy background.',
                  'Keep your hand close to the camera and fully visible.',
                  'Word Mode — sign one word, lower your hand, result appears automatically.',
                  'Green pill = word recognized. Dots show model confidence.',
                  'Tap Undo if the wrong word was captured.',
                  'Translation is spoken aloud automatically.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowTips(false)} className="w-full mt-6 py-2.5 bg-gray-900/10 dark:bg-white/10 hover:bg-gray-900/20 dark:hover:bg-white/20 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors">Got it!</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Side Panel (History / Favorites) ── */}
      <AnimatePresence>
        {activePanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActivePanel(null)} className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 z-[210] h-full w-full max-w-sm bg-white dark:bg-[#0f172a] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  {activePanel === 'history'
                    ? <Clock size={20} className="text-primary" />
                    : <Star size={20} className="text-rose-500" fill="currentColor" />}
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    {activePanel === 'history' ? 'Translation History' : 'Saved Favorites'}
                  </h2>
                </div>
                <button onClick={() => setActivePanel(null)} className="p-2 text-gray-400 transition-colors rounded-full hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
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

      <Footer />
    </div>
  );
};

export default Translator;