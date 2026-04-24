import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, StopCircle, Volume2, Trash2, Globe, Keyboard, Video, CheckCircle, Save, Delete, Type, Hash, MessageSquare, Heart, Clock, X, Star, Lightbulb } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { featureService } from '../services/api';
import LanguageSelector from '../components/LanguageSelector';

const Translator = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // State
  const [mode, setMode] = useState('camera');
  const [signMode, setSignMode] = useState('word');
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("...");

  const [targetLang, setTargetLang] = useState('si');
  const [sourceLang, setSourceLang] = useState('auto');

  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Panel state
  const [activePanel, setActivePanel] = useState(null); // 'history' | 'favorites' | null
  const [historyItems, setHistoryItems] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb_favorites') || '[]'); } catch { return []; }
  });
  const [isFavorited, setIsFavorited] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Sentence Building Refs
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSavedRef = useRef("");
  const signModeRef = useRef("word");

  // --- DRAWING FUNCTION FOR HAND LANDMARKS ---
  const drawHand = (landmarks) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video || video.readyState < 2) return;

    // Ensure the canvas internal resolution matches the actual video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [5, 9], [9, 10], [10, 11], [11, 12], // Middle
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring
      [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky & Palm base
    ];

    ctx.strokeStyle = "#00FF00"; // Neon Green Lines
    ctx.lineWidth = 4;
    ctx.fillStyle = "#FF0000"; // Red Joints

    connections.forEach(([startIdx, endIdx]) => {
      const startPoint = landmarks[startIdx];
      const endPoint = landmarks[endIdx];
      ctx.beginPath();
      // Mirroring adjustment
      ctx.moveTo((1 - startPoint.x) * canvas.width, startPoint.y * canvas.height);
      ctx.lineTo((1 - endPoint.x) * canvas.width, endPoint.y * canvas.height);
      ctx.stroke();
    });

    landmarks.forEach((point) => {
      ctx.beginPath();
      ctx.arc((1 - point.x) * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // --- SENTENCE BUILDER LOGIC ---
  const processStableSign = (sign) => {
    setInputText(prev => {
      if (sign.toLowerCase() === "space") return prev + " ";
      if (sign.toLowerCase() === "del" || sign.toLowerCase() === "delete") return prev.slice(0, -1);
      
      // Auto-append spaces in word mode
      if (signModeRef.current === 'word' && prev.length > 0 && !prev.endsWith(' ')) {
        return prev + ' ' + sign;
      }
      return prev + sign;
    });
    setIsFavorited(false);
  };

  const handleTranslate = async (text) => {
    if (!text) return;
    try {
      const result = await featureService.translate(text, targetLang, sourceLang);
      setTranslatedText(result.translated);
      setIsFavorited(false);
      if (isAutoSpeak) speakText(result.translated);
      autoSaveHistory(text, result.translated, targetLang);
    } catch (err) {
      console.error("Translation error", err);
    }
  };

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
          const sortedItems = items.sort((a, b) => {
            const dateA = new Date(a.created_at || a.created || 0).getTime();
            const dateB = new Date(b.created_at || b.created || 0).getTime();
            return dateB - dateA; // Descending (newest first)
          });
          setHistoryItems(sortedItems);
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
      setFavorites(updated);
      localStorage.setItem('sb_favorites', JSON.stringify(updated));
      setIsFavorited(false);
    } else {
      const updated = [item, ...favorites];
      setFavorites(updated);
      localStorage.setItem('sb_favorites', JSON.stringify(updated));
      setIsFavorited(true);
    }
  };

  const removeFavorite = (id) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem('sb_favorites', JSON.stringify(updated));
  };

  const applyHistoryItem = (item) => {
    setInputText(item.original_text);
    setTranslatedText(item.translated_text);
    setActivePanel(null);
  };

  const applyFavorite = (item) => {
    setInputText(item.original);
    setTranslatedText(item.translated);
    setActivePanel(null);
  };

  const autoSaveHistory = async (original, translated, lang) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (original === lastSavedRef.current) return;
    lastSavedRef.current = original;

    try {
      setSaveStatus('saving');
      const currentMode = mode === 'camera' ? signModeRef.current : 'text';
      const currentSource = mode === 'camera' ? 'sign' : sourceLang;
      await featureService.saveHistory(user.user_id, original, translated, lang, currentMode, currentSource);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    if (mode === 'text' && inputText) {
      const timeoutId = setTimeout(() => handleTranslate(inputText), 800);
      return () => clearTimeout(timeoutId);
    }
  }, [inputText, targetLang, sourceLang]);

  // --- WEBSOCKET CONTROL ---
  const startTranslation = () => {
    setIsRecording(true);
    // Note: We don't start the socket here anymore. 
    // We wait for the Webcam "onUserMedia" event to ensure the camera is ON first.
  };

  // NEW: This function starts the socket ONLY when the camera is actually ready
  const initSocket = () => {
    if (socketRef.current) socketRef.current.close();
    if (intervalRef.current) clearInterval(intervalRef.current);

    const currentMode = signModeRef.current;
    console.log(`🎥 Camera is ready. Opening WebSocket for ${currentMode} mode...`);
    
    // Choose endpoint based on signMode
    const endpoint = `/ws/predict/${currentMode}`;
    socketRef.current = new WebSocket(`${import.meta.env.VITE_WS_URL}${endpoint}`);

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
      
      // Only append letter when model says it's committed
      if (data.committed && data.sign && data.sign !== "..." && data.sign !== "Nothing") {
        processStableSign(data.sign);
      }

      if (data.landmarks) {
        drawHand(data.landmarks);
      } else {
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  };

  const handleSignModeChange = (newMode) => {
    if (signMode === newMode) return;
    setSignMode(newMode);
    signModeRef.current = newMode;
    setInputText("");
    setTranslatedText("...");
    setIsFavorited(false);
    if (isRecording && webcamRef.current?.video?.readyState === 4) {
      initSocket();
    }
  };

  const stopTranslation = () => {
    setIsRecording(false);
    if (socketRef.current) socketRef.current.close();
    if (intervalRef.current) clearInterval(intervalRef.current);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    handleTranslate(inputText);
  };

  const toggleRecording = () => isRecording ? stopTranslation() : startTranslation();

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-gray-900 bg-gray-50 dark:text-white dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      <main className="flex-grow p-4 md:p-8">
        <div className="grid grid-cols-1 gap-8 mx-auto max-w-7xl lg:grid-cols-2">

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="inline-flex flex-wrap justify-center p-1 sm:p-1.5 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl sm:rounded-full shadow-inner border border-gray-200/50 dark:border-gray-700/50 w-full sm:w-fit">
                <button
                  onClick={() => { if (mode !== 'camera') { setMode('camera'); setIsRecording(false); setInputText(""); setTranslatedText("..."); setIsFavorited(false); } }}
                  className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${mode === 'camera' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  <Video size={16} className="sm:w-[18px] sm:h-[18px]" /> Sign Mode
                </button>
                <button
                  onClick={() => { if (mode !== 'text') { setMode('text'); stopTranslation(); setInputText(""); setTranslatedText("..."); setIsFavorited(false); } }}
                  className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${mode === 'text' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  <Keyboard size={16} className="sm:w-[18px] sm:h-[18px]" /> Text Mode
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
                      { id: 'number', label: 'Number Mode', icon: Hash }
                    ].map((sm) => {
                      const Icon = sm.icon;
                      const isActive = signMode === sm.id;
                      return (
                        <button
                          key={sm.id}
                          onClick={() => handleSignModeChange(sm.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                        >
                          <Icon size={14} /> {sm.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative flex items-center justify-center overflow-hidden bg-gray-100/50 border border-gray-200/50 shadow-2xl dark:bg-gray-800/30 dark:border-gray-700/50 rounded-3xl min-h-[320px] sm:min-h-0 aspect-[4/3] sm:aspect-video backdrop-blur-sm group">
              <div className="absolute inset-0 z-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-black/5 dark:ring-white/5" />
              
              {mode === 'camera' && (
                <button
                  onClick={() => setShowTips(true)}
                  className="absolute z-40 top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-full border border-white/40 dark:border-white/10 text-gray-800 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-black/60 transition-all shadow-sm"
                >
                  <Lightbulb size={16} className="text-yellow-600 dark:text-yellow-400" />
                  <span className="text-xs font-semibold">Tips</span>
                </button>
              )}

              {mode === 'camera' ? (
                <>
                  {isRecording ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-0 w-full h-full">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        onUserMedia={initSocket} // <--- FIX: Start socket only when camera starts
                        onUserMediaError={() => { alert("Camera Blocked or Not Found"); setIsRecording(false); }}
                        videoConstraints={{ width: 640, height: 480, facingMode: "user" }} // Simpler constraints for better compatibility
                        className="absolute inset-0 z-0 object-cover w-full h-full transform scale-x-[-1]"
                      />
                      <canvas ref={canvasRef} className="absolute inset-0 z-10 object-cover w-full h-full pointer-events-none" />
                      <div className="absolute z-20 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full top-4 right-4 shadow-lg border border-white/10">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium tracking-wide text-white uppercase">Live</span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="z-10 flex flex-col items-center pb-12 sm:pb-0 text-gray-400 dark:text-gray-500 transition-transform duration-500 group-hover:scale-105">
                      <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 bg-white shadow-sm dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700">
                        <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-base sm:text-lg font-medium tracking-wide text-gray-800 dark:text-gray-300">Ready to translate</p>
                      <p className="mt-1 text-xs sm:text-sm opacity-70 text-center px-4">Turn on camera to begin signing</p>
                    </div>
                  )}
                  <div className="absolute left-0 right-0 z-20 flex justify-center bottom-4 sm:bottom-6">
                    <button
                      onClick={toggleRecording}
                      className={`flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold shadow-2xl transition-all duration-300 text-sm sm:text-base text-white ${isRecording
                        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/40 ring-4 ring-red-500/20'
                        : 'animate-gradient bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:300%_100%] shadow-primary/40 ring-4 ring-primary/20 hover:shadow-primary/60'
                        }`}
                    >
                      {isRecording ? <><StopCircle size={20} className="sm:w-[22px] sm:h-[22px]" /> Stop Translation</> : <><Camera size={20} className="sm:w-[22px] sm:h-[22px]" /> Start Signing</>}
                    </button>
                  </div>
                </>
              ) : (
                <textarea
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); setIsFavorited(false); }}
                  placeholder="Start typing your phrase here..."
                  className="relative z-10 w-full h-full p-8 text-xl text-gray-900 bg-transparent resize-none md:text-2xl dark:text-white placeholder-gray-400/80 dark:placeholder-gray-600 focus:outline-none"
                />
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <div 
              className={`relative z-30 flex flex-col gap-4 p-5 bg-white border shadow-sm rounded-2xl transition-all duration-300 
                ${(mode === 'camera' && signMode === 'number') 
                  ? 'hidden lg:flex lg:opacity-0 lg:pointer-events-none border-transparent dark:border-transparent select-none' 
                  : 'border-gray-200 dark:bg-[#1e293b] dark:border-gray-700/30 opacity-100'}`}
              aria-hidden={mode === 'camera' && signMode === 'number'}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">From:</span>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">To:</span>
                  <div className="w-full sm:w-64">
                    <LanguageSelector selectedLang={targetLang} onChange={setTargetLang} includeAuto={false} />
                  </div>
                </div>
            </div>

            <div className="relative flex flex-col w-full min-h-[220px] flex-grow p-6 bg-white border border-gray-200 shadow-sm dark:bg-[#1e293b]/60 dark:border-gray-700/30 rounded-[2rem]">
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <AnimatePresence>
                  {saveStatus === 'saving' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full dark:bg-[#334155] dark:text-gray-400">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></span> Saving...
                    </motion.div>
                  )}
                  {saveStatus === 'saved' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle size={12} /> Saved
                    </motion.div>
                  )}
                </AnimatePresence>
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
              {mode === 'camera' && signMode !== 'number' && (
                <div className="flex-1 pb-6 mb-6 border-b border-gray-100 dark:border-gray-600/30">
                  <h2 className="mb-6 text-xs tracking-widest text-gray-500 uppercase dark:text-gray-400/80 font-bold">
                    {signMode === 'alphabet' ? 'Input Letter' : 'Input Sentence'}
                  </h2>
                  <p className="w-full min-h-[60px] text-xl font-mono text-gray-700 break-words dark:text-gray-500/80">
                    {inputText || "Waiting for signs..."}
                    {isRecording && <span className="inline-block w-2.5 h-5 ml-1 align-middle bg-primary animate-pulse"></span>}
                  </p>
                </div>
              )}
              <div className="flex-1">
                <h2 className="mb-6 text-xs tracking-widest text-gray-500 uppercase dark:text-gray-400/80 font-bold">Translation Result</h2>
                <p className="w-full text-4xl font-extrabold tracking-tight text-gray-900 break-words md:text-5xl dark:text-white leading-tight">
                  {(mode === 'camera' && signMode === 'number') ? (inputText || "Waiting for signs...") : translatedText}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
              <button onClick={() => speakText(translatedText)} className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 text-gray-700 transition-colors bg-white border border-gray-200 rounded-xl dark:text-white dark:bg-[#334155] dark:border-transparent hover:brightness-110">
                <Volume2 size={18} className="sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Speak</span>
              </button>
              <button onClick={() => { setInputText(prev => prev.slice(0, -1)); setIsFavorited(false); }} className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 text-gray-700 transition-colors bg-white border border-gray-200 rounded-xl dark:text-white dark:bg-[#334155] dark:border-transparent hover:brightness-110">
                <Delete size={18} className="sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Backspace</span>
              </button>
              <button onClick={() => { setInputText(prev => prev + " "); setIsFavorited(false); }} className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 text-gray-700 transition-colors bg-white border border-gray-200 rounded-xl dark:text-white dark:bg-[#334155] dark:border-transparent hover:brightness-110">
                <Keyboard size={18} className="sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Space</span>
              </button>
              <button onClick={() => { setTranslatedText("..."); setInputText(""); setIsFavorited(false); }} className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 text-red-500 transition-colors bg-red-50 border border-red-100 rounded-xl dark:bg-[#341b25] dark:border-[#52212d] dark:text-[#f87171] hover:brightness-110">
                <Trash2 size={18} className="sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Clear</span>
              </button>
            </div>
          </div>
        </div>

        {/* History & Favorites Bottom Bar */}
        <div className="flex justify-center gap-16 py-8 mt-4">
          <button
            onClick={() => openPanel('history')}
            className={`flex flex-col items-center gap-1.5 group transition-all duration-200 ${
              activePanel === 'history' ? 'text-primary' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
              activePanel === 'history'
                ? 'border-primary bg-primary/10'
                : 'border-gray-200 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500'
            }`}>
              <Clock size={22} />
            </div>
            <span className="text-xs font-medium">History</span>
          </button>
          <button
            onClick={() => openPanel('favorites')}
            className={`flex flex-col items-center gap-1.5 group transition-all duration-200 ${
              activePanel === 'favorites' ? 'text-rose-500' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
              activePanel === 'favorites'
                ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'
                : 'border-gray-200 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500'
            }`}>
              <Star size={22} fill={activePanel === 'favorites' ? 'currentColor' : 'none'} />
            </div>
            <span className="text-xs font-medium">Saved</span>
          </button>
        </div>
      </main>

      {/* Tips Popup Modal */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] flex items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm"
          >
            <div className="relative w-full h-full sm:h-auto sm:max-w-sm sm:max-h-[90vh] overflow-y-auto p-8 sm:p-6 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl sm:border sm:border-white/50 dark:border-gray-700/50 shadow-2xl rounded-none sm:rounded-3xl flex flex-col justify-center">
              <button onClick={() => setShowTips(false)} className="absolute top-6 right-6 sm:top-4 sm:right-4 p-2 sm:p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                <X size={20} className="sm:w-4 sm:h-4" />
              </button>
              <div className="flex items-center gap-3 mb-8 sm:mb-4">
                <div className="p-3 sm:p-2 bg-yellow-100 dark:bg-yellow-500/20 rounded-full shadow-inner">
                  <Lightbulb className="w-6 h-6 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-2xl sm:text-lg font-bold text-gray-900 dark:text-white">Pro Tips</h3>
              </div>
              <ul className="space-y-6 sm:space-y-3 text-base sm:text-sm text-gray-700 dark:text-gray-300">
                <li className="flex gap-4 sm:gap-3 items-start">
                  <CheckCircle className="w-6 h-6 sm:w-4 sm:h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Ensure <b>better lighting</b> for accurate hand tracking.</span>
                </li>
                <li className="flex gap-4 sm:gap-3 items-start">
                  <CheckCircle className="w-6 h-6 sm:w-4 sm:h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Use a <b>clear, non-noisy background</b> without distractions.</span>
                </li>
                <li className="flex gap-4 sm:gap-3 items-start">
                  <CheckCircle className="w-6 h-6 sm:w-4 sm:h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Keep your <b>hands closer to the camera</b> and fully visible.</span>
                </li>
                <li className="flex gap-4 sm:gap-3 items-start">
                  <CheckCircle className="w-6 h-6 sm:w-4 sm:h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Make signs <b>deliberately</b> and hold briefly to register.</span>
                </li>
              </ul>
              <button onClick={() => setShowTips(false)} className="w-full mt-10 sm:mt-6 py-4 sm:py-2.5 text-lg sm:text-base bg-gray-900/10 dark:bg-white/10 hover:bg-gray-900/20 dark:hover:bg-white/20 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors backdrop-blur-md border border-gray-900/10 dark:border-white/10">Got it!</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Side Panel */}
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
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 z-[210] h-full w-full max-w-sm bg-white dark:bg-[#0f172a] shadow-2xl flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  {activePanel === 'history'
                    ? <Clock size={20} className="text-primary" />
                    : <Star size={20} className="text-rose-500" fill="currentColor" />
                  }
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {activePanel === 'history' ? 'Translation History' : 'Saved Favorites'}
                  </h2>
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activePanel === 'history' && (
                  panelLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : historyItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <Clock size={36} className="mb-3 opacity-30" />
                      <p className="text-sm">No history yet</p>
                    </div>
                  ) : historyItems.map((item, i) => (
                    <motion.button
                      key={item._id || i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => applyHistoryItem(item)}
                      className="w-full text-left p-4 rounded-2xl bg-gray-50 dark:bg-[#1e293b] border border-gray-100 dark:border-gray-700/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.original_text}</p>
                      <p className="text-xs text-primary dark:text-indigo-400 mt-1 truncate">{item.translated_text}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 capitalize">{item.mode}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{new Date(item.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </motion.button>
                  ))
                )}

                {activePanel === 'favorites' && (
                  favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <Heart size={36} className="mb-3 opacity-30" />
                      <p className="text-sm">No favorites yet</p>
                      <p className="text-xs mt-1 opacity-60">Tap ♥ on a translation to save it</p>
                    </div>
                  ) : favorites.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="relative p-4 rounded-2xl bg-rose-50/60 dark:bg-[#1e293b] border border-rose-100 dark:border-rose-900/30 group"
                    >
                      <button
                        onClick={() => applyFavorite(item)}
                        className="w-full text-left"
                      >
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate pr-8">{item.original}</p>
                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 truncate">{item.translated}</p>
                        <p className="text-[10px] text-gray-400 mt-2">{new Date(item.date).toLocaleDateString()}</p>
                      </button>
                      <button
                        onClick={() => removeFavorite(item.id)}
                        className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <X size={14} />
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