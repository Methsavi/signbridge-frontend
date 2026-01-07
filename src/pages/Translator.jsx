import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, StopCircle, Volume2, Trash2, Globe, Keyboard, Video, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { featureService } from '../services/api';

const Translator = () => {
  const webcamRef = useRef(null);
  const [mode, setMode] = useState('camera'); 
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("...");
  const [targetLang, setTargetLang] = useState('si'); 
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); 

  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSavedRef = useRef(""); 

  // --- 1. AUTO SAVE LOGIC ---
  const autoSaveHistory = async (original, translated, lang) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return; 

    const user = JSON.parse(userStr);

    if (original === lastSavedRef.current) return;
    lastSavedRef.current = original;

    try {
      setSaveStatus('saving');
      await featureService.saveHistory(
        user.user_id, 
        original, 
        translated, 
        lang
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error("Auto-save failed:", err);
      setSaveStatus('error');
    }
  };

  // --- 2. HANDLE TRANSLATION ---
  const handleTranslate = async (text) => {
    if (!text) return;
    
    let finalTranslation = text;

    if (targetLang === 'en') {
      setTranslatedText(text);
      if (isAutoSpeak) speakText(text);
    } else {
      try {
        const result = await featureService.translate(text, targetLang);
        setTranslatedText(result.translated);
        finalTranslation = result.translated;
        if (isAutoSpeak) speakText(result.translated);
      } catch (err) {
        console.error("Translation error", err);
      }
    }

    autoSaveHistory(text, finalTranslation, targetLang);
  };

  useEffect(() => {
    if (mode === 'text' && inputText) {
      const timeoutId = setTimeout(() => handleTranslate(inputText), 800);
      return () => clearTimeout(timeoutId);
    }
  }, [inputText, targetLang]);

  // --- 3. WEBSOCKET LOGIC ---
  const startTranslation = () => {
    setIsRecording(true);
    socketRef.current = new WebSocket('ws://127.0.0.1:8000/ws/predict');
    
    socketRef.current.onopen = () => {
      intervalRef.current = setInterval(() => {
        if (webcamRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
          const imgSrc = webcamRef.current.getScreenshot();
          if(imgSrc) socketRef.current.send(imgSrc);
        }
      }, 200);
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.sign && data.sign !== "..." && data.sign !== "Nothing") {
        if (data.sign !== inputText) {
            setInputText(data.sign); 
            handleTranslate(data.sign); 
        }
      }
    };
  };

  const stopTranslation = () => {
    setIsRecording(false);
    if (socketRef.current) socketRef.current.close();
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const toggleRecording = () => isRecording ? stopTranslation() : startTranslation();

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-white bg-gray-900">
      <Navbar />
      <main className="flex-grow p-4 md:p-8">
        <div className="grid grid-cols-1 gap-8 mx-auto max-w-7xl lg:grid-cols-2">
          
          {/* LEFT: INPUT AREA */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 p-2 bg-gray-800 rounded-xl w-fit">
              <button 
                onClick={() => { setMode('camera'); setIsRecording(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${mode === 'camera' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Video size={20} /> Sign Mode
              </button>
              <button 
                onClick={() => { setMode('text'); stopTranslation(); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${mode === 'text' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Keyboard size={20} /> Text Mode
              </button>
            </div>

            <div className="relative flex items-center justify-center overflow-hidden bg-gray-800 border border-gray-700 shadow-2xl rounded-3xl aspect-video">
              {mode === 'camera' ? (
                <>
                  {isRecording ? (
                    <Webcam audio={false} ref={webcamRef} className="w-full h-full object-cover transform scale-x-[-1]" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <Camera className="w-16 h-16 mb-4" />
                      <p>Camera is Off</p>
                    </div>
                  )}
                  <div className="absolute left-0 right-0 flex justify-center bottom-4">
                    <button
                      onClick={toggleRecording}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg ${
                        isRecording ? 'bg-red-500 text-white' : 'bg-primary text-white'
                      }`}
                    >
                      {isRecording ? <><StopCircle /> Stop</> : <><Camera /> Start</>}
                    </button>
                  </div>
                </>
              ) : (
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type here to translate..."
                  className="w-full h-full p-6 text-xl text-white bg-gray-800 resize-none focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* RIGHT: OUTPUT & CONTROLS */}
          <div className="flex flex-col space-y-4">
            
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
              <div className="flex items-center gap-2">
                <Globe className="text-primary" />
                <span className="font-semibold">Translate to:</span>
              </div>
              <select 
                value={targetLang} 
                onChange={(e) => setTargetLang(e.target.value)}
                className="p-2 text-white bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="en">English</option>
                <option value="si">Sinhala (සිංහල)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="fr">French (Français)</option>
                <option value="ja">Japanese (日本語)</option>
              </select>
            </div>

            <div className="relative flex flex-col items-center justify-center flex-grow w-full p-8 text-center bg-gray-800 border border-gray-700 rounded-3xl">
               
               {/* Auto-Save Indicator */}
               <div className="absolute top-4 right-4">
                 <AnimatePresence>
                   {saveStatus === 'saving' && <span className="text-xs text-gray-400 animate-pulse">Saving...</span>}
                   {saveStatus === 'saved' && (
                     <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-1 text-xs text-green-400">
                       <CheckCircle size={12} /> Saved
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>

               <h2 className="mb-4 text-sm tracking-widest text-gray-400 uppercase">Translation Result</h2>
               
               {/* --- CHANGED: Added word-break and responsive sizing --- */}
               <p className="w-full px-4 mb-2 text-3xl font-bold text-white break-words md:text-5xl">
                 {translatedText}
               </p>
               
               {/* --- CHANGED: Reduced font size and handled overflow --- */}
               <p className="w-full px-4 mt-2 text-sm text-gray-500 break-words">
                 Input: {inputText || "..."}
               </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
               <button onClick={() => speakText(translatedText)} className="flex items-center justify-center gap-2 p-4 bg-gray-700 rounded-xl hover:bg-gray-600">
                 <Volume2 /> Speak
               </button>
               <button onClick={() => setIsAutoSpeak(!isAutoSpeak)} className={`p-4 rounded-xl flex justify-center items-center gap-2 border ${isAutoSpeak ? 'bg-green-900 border-green-500 text-green-400' : 'bg-gray-700 border-transparent'}`}>
                 {isAutoSpeak ? "Auto On" : "Auto Off"}
               </button>
               <button onClick={() => { setTranslatedText("..."); setInputText(""); }} className="flex items-center justify-center gap-2 p-4 text-red-400 border bg-red-900/20 border-red-500/30 rounded-xl hover:bg-red-900/40">
                 <Trash2 /> Clear
               </button>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Translator;