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
                    <>
                      {/* Webcam Video */}
                      <Webcam audio={false} ref={webcamRef} className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] z-0" />
                      {/* NEW: Canvas Overlay placed exactly over the webcam */}
                      <canvas ref={canvasRef} className="absolute inset-0 z-10 object-cover w-full h-full pointer-events-none" />
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <Camera className="w-16 h-16 mb-4" />
                      <p>Camera is Off</p>
                    </div>
                  )}
                  <div className="absolute left-0 right-0 z-20 flex justify-center bottom-4">
                    <button
                      onClick={toggleRecording}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg ${
                        isRecording ? 'bg-red-500 text-white' : 'bg-primary text-white'
                      }`}
                    >
                      {isRecording ? <><StopCircle /> Stop & Translate</> : <><Camera /> Start Signing</>}
                    </button>
                  </div>
                </>
              ) : (
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type here..."
                  className="w-full h-full p-6 text-xl text-white bg-gray-800 resize-none focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* RIGHT: OUTPUT */}
          <div className="flex flex-col space-y-4">
            
            <div className="flex flex-col gap-3 p-4 bg-gray-800 rounded-xl">
              <div className="flex items-center justify-between gap-4">
                <span className="w-12 text-sm font-semibold text-gray-400">From:</span>
                <LanguageSelector selectedLang={sourceLang} onChange={setSourceLang} includeAuto={true} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="w-12 text-sm font-semibold text-gray-400">To:</span>
                <LanguageSelector selectedLang={targetLang} onChange={setTargetLang} includeAuto={false} />
              </div>
            </div>

            <div className="bg-gray-800 flex-grow rounded-3xl p-8 flex flex-col border border-gray-700 relative w-full min-h-[300px]">
               
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

               {/* Split Display */}
               
               {/* 1. Sentence Being Built */}
               <div className="flex-1 pb-4 mb-4 border-b border-gray-700">
                 <h2 className="mb-2 text-xs tracking-widest text-gray-400 uppercase">Input Sentence</h2>
                 <p className="text-2xl font-mono text-gray-300 w-full break-words min-h-[60px]">
                   {inputText || <span className="text-gray-600 opacity-50">Waiting for signs...</span>}
                   {/* Blinking Cursor */}
                   {isRecording && <span className="inline-block w-2 h-6 ml-1 align-middle bg-primary animate-pulse"></span>}
                 </p>
               </div>

               {/* 2. Final Translation */}
               <div className="flex-1">
                 <h2 className="mb-2 text-xs tracking-widest text-gray-400 uppercase">Translation Result</h2>
                 <p className="w-full text-3xl font-bold text-white break-words md:text-4xl">
                   {translatedText}
                 </p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
               <button onClick={() => speakText(translatedText)} className="flex items-center justify-center gap-2 p-4 bg-gray-700 rounded-xl hover:bg-gray-600"><Volume2 /> Speak</button>
               <button onClick={() => setInputText(prev => prev.slice(0, -1))} className="flex items-center justify-center gap-2 p-4 bg-gray-700 rounded-xl hover:bg-gray-600"><Delete size={20} /> Backspace</button>
               <button onClick={() => setInputText(prev => prev + " ")} className="flex items-center justify-center gap-2 p-4 bg-gray-700 rounded-xl hover:bg-gray-600"><Keyboard size={20} /> Space</button>
               <button onClick={() => { setTranslatedText("..."); setInputText(""); }} className="flex items-center justify-center gap-2 p-4 text-red-400 border bg-red-900/20 border-red-500/30 rounded-xl hover:bg-red-900/40"><Trash2 /> Clear</button>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Translator;