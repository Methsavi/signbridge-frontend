import React, { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { featureService, dictionaryService } from '../services/api';

import ModeSwitcher from '../components/translator/ModeSwitcher';
import InputPanel from '../components/translator/InputPanel';
import TextToSignInputPanel from '../components/translator/TextToSignInputPanel';
import TranslationPanel from '../components/translator/TranslationPanel';
import TextToSignSidePanel from '../components/translator/TextToSignSidePanel';
import TipsModal from '../components/translator/TipsModal';
import SidePanel from '../components/translator/SidePanel';
import HistoryFavoritesBar from '../components/translator/HistoryFavoritesBar';

const WORD_DEDUP_MS = 2000;

const Translator = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // ── Mode ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState('camera');
  const [signMode, setSignMode] = useState('word');
  const modeRef = useRef('camera');
  const signModeRef = useRef('word');

  // ── Recording / Translation ───────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('...');
  const [targetLang, setTargetLang] = useState('si');
  const [sourceLang, setSourceLang] = useState('auto');
  const [saveStatus, setSaveStatus] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);

  // ── Hand / sign feedback ──────────────────────────────────────────
  const [handDetected, setHandDetected] = useState(true);
  const [holdProgress, setHoldProgress] = useState(0);
  const [currentSign, setCurrentSign] = useState('');
  const [signConfidence, setSignConfidence] = useState(0);
  const [showNoHandWarning, setShowNoHandWarning] = useState(false);
  const [showLowConfWarning, setShowLowConfWarning] = useState(false);
  const noHandSinceRef = useRef(null);
  const lowConfSinceRef = useRef(null);
  const noHandWarnShownRef = useRef(false);
  const lowConfWarnShownRef = useRef(false);
  const noHandDismissRef = useRef(null);
  const lowConfDismissRef = useRef(null);

  // ── Voice typing (text mode) ──────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recognitionRef = useRef(null);

  // ── Panels / history / favorites ─────────────────────────────────
  const [activePanel, setActivePanel] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb_favorites') || '[]'); } catch { return []; }
  });
  const [isFavorited, setIsFavorited] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // ── Word mode ─────────────────────────────────────────────────────
  const [wordFlash, setWordFlash] = useState(null);
  const [wordAlternatives, setWordAlternatives] = useState([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectingFrames, setCollectingFrames] = useState(0);
  const [lastWord, setLastWord] = useState(null);
  const wordFlashTimer = useRef(null);

  // ── Refs ──────────────────────────────────────────────────────────
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSavedRef = useRef('');
  const pendingSaveRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const lastCommittedRef = useRef(null);
  const lastCommittedTimeRef = useRef(0);
  const translateDebounceRef = useRef(null);

  // ── Text-to-Sign ──────────────────────────────────────────────────
  const [ttsInput, setTtsInput] = useState('');
  const [ttsTokens, setTtsTokens] = useState([]);
  const [ttsCurrentIdx, setTtsCurrentIdx] = useState(0);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsIsListening, setTtsIsListening] = useState(false);
  const [ttsError, setTtsError] = useState('');
  const [ttsAutoPlaying, setTtsAutoPlaying] = useState(false);
  const ttsRecognitionRef = useRef(null);
  const dictEntriesCacheRef = useRef(null);
  const ttsAutoPlayTimerRef = useRef(null);
  const ttsVideoRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────
  // SPEAK
  // ─────────────────────────────────────────────────────────────────
  const browserFallback = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.onend = () => { isSpeakingRef.current = false; setIsSpeaking(false); };
    utt.onerror = () => { isSpeakingRef.current = false; setIsSpeaking(false); };
    window.speechSynthesis.speak(utt);
  }, []);

  const speakText = useCallback(async (text) => {
    if (!text || text === '...' || isSpeakingRef.current) return;
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    try {
      const blob = await featureService.tts(text, targetLang);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); isSpeakingRef.current = false; setIsSpeaking(false); };
      audio.onerror = () => { URL.revokeObjectURL(url); isSpeakingRef.current = false; setIsSpeaking(false); };
      audio.play();
    } catch (err) {
      if (err?.fallback) {
        browserFallback(text);
      } else {
        console.error('TTS error:', err);
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      }
    }
  }, [targetLang, browserFallback]);

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
      [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],
      [13,17],[0,17],[17,18],[18,19],[19,20],
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
  // APPEND WORD
  // ─────────────────────────────────────────────────────────────────
  const appendWord = useCallback((word) => {
    const now = Date.now();
    if (word === lastCommittedRef.current && now - lastCommittedTimeRef.current < WORD_DEDUP_MS) return;
    lastCommittedRef.current = word;
    lastCommittedTimeRef.current = now;
    setLastWord(word);
    setInputText(prev => {
      if (word.toLowerCase() === 'space') return prev + ' ';
      if (word.toLowerCase() === 'del' || word.toLowerCase() === 'delete') return prev.slice(0, -1);
      if (signModeRef.current === 'word' && prev.length > 0 && !prev.endsWith(' ')) return prev + ' ' + word;
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
      if (trimmed.endsWith(lastWord)) return trimmed.slice(0, trimmed.length - lastWord.length).trimEnd();
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
  // SAVE
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

  // Debounced translation for text mode
  useEffect(() => {
    if (mode === 'text' && inputText) {
      const id = setTimeout(() => handleTranslate(inputText), 800);
      return () => clearTimeout(id);
    }
  }, [inputText, targetLang, sourceLang]);

  // Debounced translation for camera mode
  useEffect(() => {
    if (mode === 'camera' && inputText) {
      if (translateDebounceRef.current) clearTimeout(translateDebounceRef.current);
      translateDebounceRef.current = setTimeout(() => handleTranslate(inputText), 600);
    }
  }, [inputText]);

  // ─────────────────────────────────────────────────────────────────
  // PANELS
  // ─────────────────────────────────────────────────────────────────
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

  const removeFavorite = (id) => {
    const u = favorites.filter(f => f.id !== id);
    setFavorites(u);
    localStorage.setItem('sb_favorites', JSON.stringify(u));
  };
  const applyHistoryItem = (item) => { setInputText(item.original_text); setTranslatedText(item.translated_text); setActivePanel(null); };
  const applyFavorite = (item) => { setInputText(item.original); setTranslatedText(item.translated); setActivePanel(null); };

  // ─────────────────────────────────────────────────────────────────
  // WEBSOCKET
  // ─────────────────────────────────────────────────────────────────
  const initSocket = () => {
    if (socketRef.current) socketRef.current.close();
    if (intervalRef.current) clearInterval(intervalRef.current);

    setHandDetected(true); setHoldProgress(0); setCurrentSign(''); setSignConfidence(0);
    setShowNoHandWarning(false); setShowLowConfWarning(false);
    noHandSinceRef.current = null; lowConfSinceRef.current = null;
    noHandWarnShownRef.current = false; lowConfWarnShownRef.current = false;
    if (noHandDismissRef.current) { clearTimeout(noHandDismissRef.current); noHandDismissRef.current = null; }
    if (lowConfDismissRef.current) { clearTimeout(lowConfDismissRef.current); lowConfDismissRef.current = null; }

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
      const now = Date.now();

      if (currentMode === 'word') {
        if (data.collecting) {
          setIsCollecting(true);
          setCollectingFrames(data.frames || 0);
          setWordFlash(null);
          setWordAlternatives([]);
        }
        if (data.ready && data.top3 && data.top3.length > 0) {
          setIsCollecting(false);
          setCollectingFrames(0);
          const best = data.top3[0];
          const rest = data.top3.slice(1);
          appendWord(best.word);
          setWordFlash({ word: best.word, confidence: best.confidence });
          setWordAlternatives(rest);
          if (wordFlashTimer.current) clearTimeout(wordFlashTimer.current);
          wordFlashTimer.current = setTimeout(() => { setWordFlash(null); setWordAlternatives([]); }, 2500);
          setInputText(prev => {
            const next = prev.length > 0 && !prev.endsWith(' ') ? prev + ' ' + best.word : prev + best.word;
            setTimeout(() => handleTranslate(next), 300);
            return prev;
          });
        }
        if (!data.collecting && !data.ready) { setIsCollecting(false); setCollectingFrames(0); }
      } else {
        if (data.committed && data.sign && data.sign !== '...' && data.sign !== 'Nothing') {
          appendWord(data.sign);
        }
      }

      if (data.landmarks) {
        drawHand(data.landmarks);
        setHandDetected(true);
        noHandSinceRef.current = null;
        noHandWarnShownRef.current = false;
        if (noHandDismissRef.current) { clearTimeout(noHandDismissRef.current); noHandDismissRef.current = null; }
        setShowNoHandWarning(false);
      } else {
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        setHandDetected(false);
        if (noHandSinceRef.current === null) noHandSinceRef.current = now;
        if (now - noHandSinceRef.current >= 6000 && !noHandWarnShownRef.current) {
          noHandWarnShownRef.current = true;
          setShowNoHandWarning(true);
          if (noHandDismissRef.current) clearTimeout(noHandDismissRef.current);
          noHandDismissRef.current = setTimeout(() => setShowNoHandWarning(false), 2000);
        }
        lowConfSinceRef.current = null;
        lowConfWarnShownRef.current = false;
        if (lowConfDismissRef.current) { clearTimeout(lowConfDismissRef.current); lowConfDismissRef.current = null; }
        setShowLowConfWarning(false);
      }

      if (currentMode !== 'word') {
        const recognized = data.sign && data.sign !== '...' && data.sign !== 'Nothing';
        setCurrentSign(recognized ? data.sign : '');
        setSignConfidence(data.confidence || 0);
        setHoldProgress(data.hold_progress || 0);
        if (data.landmarks) {
          if (!recognized) {
            if (lowConfSinceRef.current === null) lowConfSinceRef.current = now;
            if (now - lowConfSinceRef.current >= 3000 && !lowConfWarnShownRef.current) {
              lowConfWarnShownRef.current = true;
              setShowLowConfWarning(true);
              if (lowConfDismissRef.current) clearTimeout(lowConfDismissRef.current);
              lowConfDismissRef.current = setTimeout(() => setShowLowConfWarning(false), 2000);
            }
          } else {
            lowConfSinceRef.current = null;
            lowConfWarnShownRef.current = false;
            if (lowConfDismissRef.current) { clearTimeout(lowConfDismissRef.current); lowConfDismissRef.current = null; }
            setShowLowConfWarning(false);
          }
        }
      }
    };
  };

  // ─────────────────────────────────────────────────────────────────
  // SIGN MODE CHANGE
  // ─────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────
  // TOP-LEVEL MODE CHANGE
  // ─────────────────────────────────────────────────────────────────
  const handleModeChange = (newMode) => {
    if (mode === newMode) return;
    saveCurrentSession();
    pendingSaveRef.current = null;
    lastSavedRef.current = '';
    if (newMode !== 'camera') stopTranslation();
    setMode(newMode);
    modeRef.current = newMode;
    setIsRecording(false);
    setInputText('');
    setTranslatedText('...');
    setIsFavorited(false);
  };

  // ─────────────────────────────────────────────────────────────────
  // VOICE TYPING (text mode)
  // ─────────────────────────────────────────────────────────────────
  const stopVoiceTyping = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startVoiceTyping = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const localeMap = {
      en:'en-US', si:'si-LK', ta:'ta-IN', hi:'hi-IN', fr:'fr-FR', de:'de-DE',
      es:'es-ES', it:'it-IT', pt:'pt-PT', ru:'ru-RU', ja:'ja-JP', ko:'ko-KR',
      zh:'zh-CN', 'zh-CN':'zh-CN', 'zh-TW':'zh-TW', ar:'ar-SA', nl:'nl-NL',
      pl:'pl-PL', tr:'tr-TR', vi:'vi-VN', th:'th-TH', id:'id-ID', ms:'ms-MY',
      bn:'bn-IN', uk:'uk-UA', he:'he-IL', fa:'fa-IR', cs:'cs-CZ', hu:'hu-HU',
      ro:'ro-RO', sv:'sv-SE', da:'da-DK', fi:'fi-FI', no:'nb-NO', el:'el-GR',
      bg:'bg-BG', hr:'hr-HR', sk:'sk-SK', lt:'lt-LT', lv:'lv-LV', et:'et-EE',
      sr:'sr-RS', ca:'ca-ES', mk:'mk-MK', gu:'gu-IN', mr:'mr-IN', ml:'ml-IN',
      kn:'kn-IN', te:'te-IN', pa:'pa-IN', ur:'ur-PK',
    };
    const lang = sourceLang && sourceLang !== 'auto' ? (localeMap[sourceLang] || sourceLang) : 'en-US';
    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
      }
      if (transcript) {
        setInputText(prev => { const sep = prev && !prev.endsWith(' ') ? ' ' : ''; return prev + sep + transcript; });
        setIsFavorited(false);
      }
    };
    recognition.onerror = () => { setIsListening(false); recognitionRef.current = null; };
    recognition.onend = () => { setIsListening(false); recognitionRef.current = null; };
    recognitionRef.current = recognition;
    recognition.start();
  }, [sourceLang]);

  const toggleVoiceTyping = useCallback(() => {
    isListening ? stopVoiceTyping() : startVoiceTyping();
  }, [isListening, startVoiceTyping, stopVoiceTyping]);

  useEffect(() => { if (mode !== 'text') stopVoiceTyping(); }, [mode, stopVoiceTyping]);

  // ─────────────────────────────────────────────────────────────────
  // TEXT-TO-SIGN voice typing
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'text-to-sign') {
      if (ttsRecognitionRef.current) {
        ttsRecognitionRef.current.onend = null;
        ttsRecognitionRef.current.stop();
        ttsRecognitionRef.current = null;
      }
      setTtsIsListening(false);
      clearTimeout(ttsAutoPlayTimerRef.current);
      setTtsAutoPlaying(false);
    }
  }, [mode]);

  const stopTtsVoiceTyping = useCallback(() => {
    if (ttsRecognitionRef.current) {
      ttsRecognitionRef.current.onend = null;
      ttsRecognitionRef.current.stop();
      ttsRecognitionRef.current = null;
    }
    setTtsIsListening(false);
  }, []);

  const startTtsVoiceTyping = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setTtsIsListening(true);
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
      }
      if (transcript) setTtsInput(prev => { const sep = prev && !prev.endsWith(' ') ? ' ' : ''; return prev + sep + transcript; });
    };
    recognition.onerror = () => { setTtsIsListening(false); ttsRecognitionRef.current = null; };
    recognition.onend = () => { setTtsIsListening(false); ttsRecognitionRef.current = null; };
    ttsRecognitionRef.current = recognition;
    recognition.start();
  }, []);

  const toggleTtsVoice = useCallback(() => {
    ttsIsListening ? stopTtsVoiceTyping() : startTtsVoiceTyping();
  }, [ttsIsListening, stopTtsVoiceTyping, startTtsVoiceTyping]);

  // ─────────────────────────────────────────────────────────────────
  // TEXT-TO-SIGN dictionary lookup
  // ─────────────────────────────────────────────────────────────────
  const loadDictEntries = useCallback(async () => {
    if (dictEntriesCacheRef.current) return dictEntriesCacheRef.current;
    const result = await dictionaryService.getEntries({});
    const entries = result.items || [];
    dictEntriesCacheRef.current = entries;
    return entries;
  }, []);

  const resolveTextToSign = useCallback(async (text) => {
    const entries = await loadDictEntries();
    const trimmed = text.trim();
    const sentenceEntry = entries.find(e => e.label.toLowerCase() === trimmed.toLowerCase() && e.category === 'sentence');
    if (sentenceEntry) return [{ label: trimmed, entry: sentenceEntry }];
    const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
    const result = [];
    for (const word of words) {
      const wordEntry = entries.find(e => e.label.toLowerCase() === word && (e.category === 'word' || e.category === 'sentence'));
      if (wordEntry) {
        result.push({ label: word, entry: wordEntry });
      } else {
        for (const char of word) {
          if (/\d/.test(char)) {
            const numEntry = entries.find(e => e.label === char && e.category === 'number');
            result.push({ label: char, entry: numEntry || null });
          } else {
            const letterEntry = entries.find(e => e.label.toLowerCase() === char && e.category === 'letter');
            result.push({ label: char, entry: letterEntry || null });
          }
        }
      }
    }
    return result;
  }, [loadDictEntries]);

  const handleTextToSignSubmit = useCallback(async () => {
    if (!ttsInput.trim()) return;
    setTtsLoading(true);
    setTtsError('');
    clearTimeout(ttsAutoPlayTimerRef.current);
    setTtsAutoPlaying(false);
    try {
      const tokens = await resolveTextToSign(ttsInput);
      setTtsTokens(tokens);
      setTtsCurrentIdx(0);
      if (tokens.length > 1) setTtsAutoPlaying(true);
    } catch {
      setTtsError('Failed to load sign data. Please try again.');
    } finally {
      setTtsLoading(false);
    }
  }, [ttsInput, resolveTextToSign]);

  // Auto-advance for image / not-found tokens
  useEffect(() => {
    if (!ttsAutoPlaying || ttsTokens.length === 0) return;
    const current = ttsTokens[ttsCurrentIdx];
    if (current?.entry?.media_type === 'video') return;
    const delay = current?.entry ? 2000 : 1200;
    ttsAutoPlayTimerRef.current = setTimeout(() => {
      if (ttsCurrentIdx < ttsTokens.length - 1) {
        setTtsCurrentIdx(i => i + 1);
      } else {
        setTtsAutoPlaying(false);
      }
    }, delay);
    return () => clearTimeout(ttsAutoPlayTimerRef.current);
  }, [ttsAutoPlaying, ttsCurrentIdx, ttsTokens]);

  // ─────────────────────────────────────────────────────────────────
  // RECORDING CONTROLS
  // ─────────────────────────────────────────────────────────────────
  const stopTranslation = (shouldSave = false) => {
    setIsRecording(false);
    if (socketRef.current) socketRef.current.close();
    if (intervalRef.current) clearInterval(intervalRef.current);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setWordFlash(null); setWordAlternatives([]); setIsCollecting(false); setCollectingFrames(0);
    setShowNoHandWarning(false); setShowLowConfWarning(false);
    setHandDetected(true); setHoldProgress(0); setCurrentSign(''); setSignConfidence(0);
    noHandSinceRef.current = null; lowConfSinceRef.current = null;
    noHandWarnShownRef.current = false; lowConfWarnShownRef.current = false;
    if (noHandDismissRef.current) { clearTimeout(noHandDismissRef.current); noHandDismissRef.current = null; }
    if (lowConfDismissRef.current) { clearTimeout(lowConfDismissRef.current); lowConfDismissRef.current = null; }
    if (shouldSave) saveCurrentSession();
  };

  const toggleRecording = () => isRecording ? stopTranslation(true) : setIsRecording(true);

  const handleCameraError = () => { alert('Camera Blocked or Not Found'); setIsRecording(false); };

  const clearAll = () => {
    saveCurrentSession();
    if (autoSaveTimerRef.current) { clearTimeout(autoSaveTimerRef.current); autoSaveTimerRef.current = null; }
    pendingSaveRef.current = null;
    lastSavedRef.current = '';
    setTranslatedText('...'); setInputText(''); setIsFavorited(false);
    setWordFlash(null); setWordAlternatives([]); setLastWord(null);
    lastCommittedRef.current = null; lastCommittedTimeRef.current = 0;
  };

  // Save on page leave / unmount
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

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-4 sm:gap-6">
            <ModeSwitcher
              mode={mode}
              signMode={signMode}
              onModeChange={handleModeChange}
              onSignModeChange={handleSignModeChange}
            />

            {mode === 'text-to-sign' ? (
              <TextToSignInputPanel
                ttsInput={ttsInput}
                setTtsInput={setTtsInput}
                ttsTokens={ttsTokens}
                setTtsTokens={setTtsTokens}
                ttsCurrentIdx={ttsCurrentIdx}
                setTtsCurrentIdx={setTtsCurrentIdx}
                ttsLoading={ttsLoading}
                ttsIsListening={ttsIsListening}
                ttsError={ttsError}
                ttsAutoPlaying={ttsAutoPlaying}
                setTtsAutoPlaying={setTtsAutoPlaying}
                ttsAutoPlayTimerRef={ttsAutoPlayTimerRef}
                ttsVideoRef={ttsVideoRef}
                voiceSupported={voiceSupported}
                toggleTtsVoice={toggleTtsVoice}
                handleTextToSignSubmit={handleTextToSignSubmit}
              />
            ) : (
              <InputPanel
                mode={mode}
                signMode={signMode}
                isRecording={isRecording}
                webcamRef={webcamRef}
                canvasRef={canvasRef}
                initSocket={initSocket}
                onCameraError={handleCameraError}
                toggleRecording={toggleRecording}
                setShowTips={setShowTips}
                isCollecting={isCollecting}
                collectingFrames={collectingFrames}
                wordFlash={wordFlash}
                wordAlternatives={wordAlternatives}
                showNoHandWarning={showNoHandWarning}
                showLowConfWarning={showLowConfWarning}
                handDetected={handDetected}
                currentSign={currentSign}
                signConfidence={signConfidence}
                holdProgress={holdProgress}
                inputText={inputText}
                setInputText={setInputText}
                setIsFavorited={setIsFavorited}
                isListening={isListening}
                voiceSupported={voiceSupported}
                toggleVoiceTyping={toggleVoiceTyping}
              />
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-4">
            {mode === 'text-to-sign' ? (
              <TextToSignSidePanel
                ttsTokens={ttsTokens}
                ttsCurrentIdx={ttsCurrentIdx}
                setTtsCurrentIdx={setTtsCurrentIdx}
                ttsInput={ttsInput}
                setTtsInput={setTtsInput}
                ttsError={ttsError}
                setTtsError={setTtsError}
                setTtsTokens={setTtsTokens}
                setTtsAutoPlaying={setTtsAutoPlaying}
              />
            ) : (
              <TranslationPanel
                mode={mode}
                signMode={signMode}
                sourceLang={sourceLang}
                setSourceLang={setSourceLang}
                targetLang={targetLang}
                setTargetLang={setTargetLang}
                saveStatus={saveStatus}
                isFavorited={isFavorited}
                toggleFavorite={toggleFavorite}
                inputText={inputText}
                setInputText={setInputText}
                setIsFavorited={setIsFavorited}
                translatedText={translatedText}
                isRecording={isRecording}
                isCollecting={isCollecting}
                lastWord={lastWord}
                undoLastWord={undoLastWord}
                isSpeaking={isSpeaking}
                speakText={speakText}
                clearAll={clearAll}
              />
            )}
          </div>
        </div>

        <HistoryFavoritesBar activePanel={activePanel} openPanel={openPanel} />
      </main>

      <TipsModal showTips={showTips} setShowTips={setShowTips} />

      <SidePanel
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        panelLoading={panelLoading}
        historyItems={historyItems}
        favorites={favorites}
        applyHistoryItem={applyHistoryItem}
        applyFavorite={applyFavorite}
        removeFavorite={removeFavorite}
      />

      <Footer />
    </div>
  );
};

export default Translator;
