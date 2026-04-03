import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, StopCircle, Volume2, Trash2, Globe, Keyboard, Video, CheckCircle, Save, Delete } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { featureService } from '../services/api';
import LanguageSelector from '../components/LanguageSelector';

const Translator = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null); // <--- NEW: Reference for our drawing canvas
  
  // State
  const [mode, setMode] = useState('camera'); 
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState(""); // This builds the sentence
  const [translatedText, setTranslatedText] = useState("...");
  
  const [targetLang, setTargetLang] = useState('si'); 
  const [sourceLang, setSourceLang] = useState('auto'); 
  
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); 

  // Sentence Building Refs
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSavedRef = useRef(""); 
  
  // Logic: Keep track of consecutive detections
  const stableSignRef = useRef({ sign: "", count: 0 }); 
  const lastAddedSignRef = useRef(""); 

  // --- NEW: DRAWING FUNCTION FOR HAND LANDMARKS ---
  const drawHand = (landmarks) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video) return;

    // Ensure the canvas internal resolution matches the actual video feed to prevent stretching
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    
    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Skeleton map: How the 21 dots connect to form fingers
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

    // Draw the skeletal bones
    connections.forEach(([startIdx, endIdx]) => {
      const startPoint = landmarks[startIdx];
      const endPoint = landmarks[endIdx];

      ctx.beginPath();
      // Because the webcam is CSS flipped (scale-x-[-1]), we invert the X coordinate (1 - x)
      ctx.moveTo((1 - startPoint.x) * canvas.width, startPoint.y * canvas.height);
      ctx.lineTo((1 - endPoint.x) * canvas.width, endPoint.y * canvas.height);
      ctx.stroke();
    });

    // Draw the joint dots
    landmarks.forEach((point) => {
      ctx.beginPath();
      ctx.arc((1 - point.x) * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // --- 1. SENTENCE BUILDER LOGIC ---
  const handleSignStream = (newSign) => {
    // Ignore noise
    if (!newSign || newSign === "..." || newSign === "Nothing") return;

    // Check if sign is stable (same as previous frame)
    if (newSign === stableSignRef.current.sign) {
        stableSignRef.current.count += 1;
    } else {
        // Reset if sign changed
        stableSignRef.current = { sign: newSign, count: 1 };
    }

    // THRESHOLD: If we see the same sign 5 times (~1 second), we accept it
    if (stableSignRef.current.count === 5) {
        // Prevent spamming the same letter endlessly (Debounce)
        // Only add if it's different from the LAST added character OR enough time has passed
        if (newSign !== lastAddedSignRef.current) {
            processStableSign(newSign);
            lastAddedSignRef.current = newSign;
        }
    }
  };

  const processStableSign = (sign) => {
    setInputText(prev => {
        // Handle Special Commands
        if (sign.toLowerCase() === "space") return prev + " ";
        if (sign.toLowerCase() === "del" || sign.toLowerCase() === "delete") return prev.slice(0, -1);
        
        // Append normal character
        return prev + sign;
    });
  };

  // --- 2. TRANSLATION (Triggered manually or on stop) ---
  const handleTranslate = async (text) => {
    if (!text) return;
    
    try {
        const result = await featureService.translate(text, targetLang, sourceLang);
        setTranslatedText(result.translated);
        if (isAutoSpeak) speakText(result.translated);
        
        // Auto Save ONLY when translation happens (Complete sentence)
        autoSaveHistory(text, result.translated, targetLang);
    } catch (err) {
        console.error("Translation error", err);
    }
  };

  const autoSaveHistory = async (original, translated, lang) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return; 
    const user = JSON.parse(userStr);

    if (original === lastSavedRef.current) return;
    lastSavedRef.current = original;

    try {
      setSaveStatus('saving');
      await featureService.saveHistory(user.user_id, original, translated, lang);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error("Auto-save failed:", err);
      setSaveStatus('error');
    }
  };

  // Debounced translation for Text Mode
  useEffect(() => {
    if (mode === 'text' && inputText) {
      const timeoutId = setTimeout(() => handleTranslate(inputText), 800);
      return () => clearTimeout(timeoutId);
    }
  }, [inputText, targetLang, sourceLang]);

  // WEBSOCKET logic
  const startTranslation = () => {
    setIsRecording(true);
    socketRef.current = new WebSocket('ws://127.0.0.1:8000/ws/predict');
    
    stableSignRef.current = { sign: "", count: 0 };
    lastAddedSignRef.current = "";

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
      
      if (data.sign) {
        handleSignStream(data.sign); // Send raw stream to builder logic
      }

      // <--- NEW: Trigger the canvas drawing if landmarks are returned
      if (data.landmarks) {
        drawHand(data.landmarks);
      } else {
        // If no hand is in frame, clear the canvas
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  };

  const stopTranslation = () => {
    setIsRecording(false);
    if (socketRef.current) socketRef.current.close();
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Clear canvas when stopped
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    // FINAL TRANSLATION ON STOP
    handleTranslate(inputText);
  };

  const toggleRecording = () => isRecording ? stopTranslation() : startTranslation();

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-gray-900 bg-gray-50 dark:text-white dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      <main className="flex-grow p-4 md:p-8">
        <div className="grid grid-cols-1 gap-8 mx-auto max-w-7xl lg:grid-cols-2">
          
          {/* LEFT: INPUT AREA */}
          <div className="flex flex-col gap-6">
            
            {/* Elegant Mode Toggle */}
            <div className="inline-flex p-1.5 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md rounded-full shadow-inner border border-gray-200/50 dark:border-gray-700/50 w-fit">
              <button 
                onClick={() => { setMode('camera'); setIsRecording(false); }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${mode === 'camera' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
              >
                <Video size={18} /> Sign Mode
              </button>
              <button 
                onClick={() => { setMode('text'); stopTranslation(); }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${mode === 'text' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
              >
                <Keyboard size={18} /> Text Mode
              </button>
            </div>

            {/* Premium Camera/Input Container */}
            <div className="relative flex items-center justify-center overflow-hidden bg-gray-100/50 border border-gray-200/50 shadow-2xl dark:bg-gray-800/30 dark:border-gray-700/50 rounded-3xl aspect-video backdrop-blur-sm group">
              
              {/* Subtle inner glow */}
              <div className="absolute inset-0 z-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-black/5 dark:ring-white/5" />

              {mode === 'camera' ? (
                <>
                  {isRecording ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-0 w-full h-full">
                      {/* Webcam Video */}
                      <Webcam audio={false} ref={webcamRef} className="object-cover w-full h-full transform scale-x-[-1]" />
                      {/* Canvas Overlay placed exactly over the webcam */}
                      <canvas ref={canvasRef} className="absolute inset-0 z-10 object-cover w-full h-full pointer-events-none" />
                      
                      {/* Recording Indicator */}
                      <div className="absolute z-20 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full top-4 right-4 shadow-lg border border-white/10">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        <span className="text-xs font-medium tracking-wide text-white uppercase">Live</span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="z-10 flex flex-col items-center text-gray-400 dark:text-gray-500 transition-transform duration-500 group-hover:scale-105">
                      <div className="flex items-center justify-center w-20 h-20 mb-6 bg-white shadow-sm dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700">
                        <Camera className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-lg font-medium tracking-wide text-gray-800 dark:text-gray-300">Ready to translate</p>
                      <p className="mt-1 text-sm opacity-70">Turn on camera to begin signing</p>
                    </div>
                  )}
                  
                  {/* Floating Action Button */}
                  <div className="absolute left-0 right-0 z-20 flex justify-center bottom-6">
                    <button
                      onClick={toggleRecording}
                      className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold shadow-2xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 ${
                        isRecording 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/40 ring-4 ring-red-500/20' 
                        : 'bg-primary hover:bg-indigo-600 text-white shadow-primary/40 ring-4 ring-primary/20'
                      }`}
                    >
                      {isRecording ? <><StopCircle size={22} /> Stop Translation</> : <><Camera size={22} /> Start Signing</>}
                    </button>
                  </div>
                </>
              ) : (
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Start typing your phrase here..."
                  className="relative z-10 w-full h-full p-8 text-xl text-gray-900 bg-transparent resize-none md:text-2xl dark:text-white placeholder-gray-400/80 dark:placeholder-gray-600 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* RIGHT: OUTPUT AREA */}
          <div className="flex flex-col space-y-4">
            
            {/* Language Selectors */}
            <div className="relative z-50 flex flex-col gap-4 p-5 bg-white border border-gray-200 shadow-sm dark:bg-[#1e293b] dark:border-gray-700/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">From:</span>
                <div className="w-56 sm:w-64">
                  <LanguageSelector selectedLang={sourceLang} onChange={setSourceLang} includeAuto={true} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">To:</span>
                <div className="w-56 sm:w-64">
                  <LanguageSelector selectedLang={targetLang} onChange={setTargetLang} includeAuto={false} />
                </div>
              </div>
            </div>

            {/* Translation Result Card */}
            <div className="relative flex flex-col w-full min-h-[220px] flex-grow p-6 bg-white border border-gray-200 shadow-sm dark:bg-[#1e293b]/60 dark:border-gray-700/30 rounded-[2rem]">
               
               {/* Auto-Save Indicator */}
               <div className="absolute top-6 right-6">
                 <AnimatePresence>
                   {saveStatus === 'saving' && (
                     <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full dark:bg-[#334155] dark:text-gray-400">
                       <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></span> Saving...
                     </motion.div>
                   )}
                   {saveStatus === 'saved' && (
                     <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
                       <CheckCircle size={12} /> Saved
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>

               {/* 1. Sentence Being Built (Only shown in camera mode) */}
               {mode === 'camera' && (
                 <div className="flex-1 pb-6 mb-6 border-b border-gray-100 dark:border-gray-600/30">
                   <h2 className="mb-6 text-xs tracking-widest text-gray-500 uppercase dark:text-gray-400/80">
                     Input Sentence
                   </h2>
                   <p className="w-full min-h-[60px] text-xl font-mono text-gray-700 break-words dark:text-gray-500/80">
                     {inputText || "Waiting for signs..."}
                     {isRecording && <span className="inline-block w-2.5 h-5 ml-1 align-middle bg-primary animate-pulse"></span>}
                   </p>
                 </div>
               )}

               {/* 2. Final Translation */}
               <div className="flex-1">
                 <h2 className="mb-6 text-xs tracking-widest text-gray-500 uppercase dark:text-gray-400/80">
                   Translation Result
                 </h2>
                 <p className="w-full text-4xl font-extrabold tracking-tight text-gray-900 break-words md:text-5xl dark:text-white leading-tight">
                   {translatedText}
                 </p>
               </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
               <button onClick={() => speakText(translatedText)} className="flex items-center justify-center gap-3 p-4 text-gray-700 transition-colors bg-white border border-gray-200 rounded-xl dark:text-white dark:bg-[#334155] dark:border-transparent hover:brightness-110">
                 <Volume2 size={20} />
                 <span className="text-sm font-medium">Speak</span>
               </button>
               
               <button onClick={() => setInputText(prev => prev.slice(0, -1))} className="flex items-center justify-center gap-3 p-4 text-gray-700 transition-colors bg-white border border-gray-200 rounded-xl dark:text-white dark:bg-[#334155] dark:border-transparent hover:brightness-110">
                 <Delete size={20} />
                 <span className="text-sm font-medium">Backspace</span>
               </button>
               
               <button onClick={() => setInputText(prev => prev + " ")} className="flex items-center justify-center gap-3 p-4 text-gray-700 transition-colors bg-white border border-gray-200 rounded-xl dark:text-white dark:bg-[#334155] dark:border-transparent hover:brightness-110">
                 <Keyboard size={20} />
                 <span className="text-sm font-medium">Space</span>
               </button>
               
               <button onClick={() => { setTranslatedText("..."); setInputText(""); }} className="flex items-center justify-center gap-3 p-4 text-red-500 transition-colors bg-red-50 border border-red-100 rounded-xl dark:bg-[#341b25] dark:border-[#52212d] dark:text-[#f87171] hover:brightness-110">
                 <Trash2 size={20} />
                 <span className="text-sm font-medium">Clear</span>
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