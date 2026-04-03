import React, { useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Dictionary = () => {
  const [inputText, setInputText] = useState('');

  // Function to determine the image path based on the character
  const getImagePath = (char) => {
    const lowerChar = char.toLowerCase();
    
    // Check if it's a letter (a-z)
    if (/[a-z]/.test(lowerChar)) {
      return `/letters/${lowerChar}.jpeg`;
    } 
    // Check if it's a number (0-9)
    else if (/[0-9]/.test(lowerChar)) {
      return `/digits/${lowerChar}.jpeg`;
    }
    
    // Return null for spaces or special characters
    return null; 
  };

  return (
    <div className="flex flex-col min-h-screen text-gray-900 transition-colors duration-300 bg-gray-50 dark:text-white dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Elegant Header Section */}
          <div className="flex flex-col items-center justify-center mb-12 text-center">
             <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 border rounded-full bg-primary/10 dark:bg-primary/20 border-primary/20">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold tracking-widest uppercase text-primary">Dictionary</span>
             </div>
             <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl dark:text-white">
                Learn to Sign
             </h1>
             <p className="max-w-2xl mt-4 text-lg text-gray-600 dark:text-gray-400">
               Type any sentence below to instantly visualize how to sign it using American Sign Language gestures.
             </p>
          </div>

          {/* Glowing Search Input Section */}
          <div className="relative max-w-3xl mx-auto mb-16 group">
            <div className="absolute inset-0 transition-opacity duration-300 opacity-25 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 blur-xl group-hover:opacity-40" />
            <div className="relative flex items-center overflow-hidden transition-all border border-gray-200 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl dark:border-gray-700/50 rounded-2xl focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
              <div className="pl-6 text-primary animate-pulse">
                <Search size={26} />
              </div>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a word or phrase (e.g. Hello 123)"
                className="w-full py-5 pl-4 pr-6 text-2xl font-medium text-gray-900 bg-transparent dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
              />
              <AnimatePresence>
                {inputText.length > 0 && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setInputText('')}
                    className="p-2 mr-4 text-gray-400 transition-colors rounded-full hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                  >
                     <X size={20} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Fancy Display Section */}
          <div className="relative w-full p-8 md:p-12 min-h-[400px] overflow-hidden bg-white/80 border border-gray-200/80 shadow-2xl dark:bg-gray-800/60 dark:border-gray-700/50 backdrop-blur-2xl rounded-[3rem] group">
             
             {/* Decorative Ambient Glow */}
             <div className="absolute transition-colors duration-1000 -translate-x-1/2 pointer-events-none top-1/2 left-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10 group-hover:bg-primary/10" />

            {inputText.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center h-full mt-10 text-center opacity-60"
              >
                <BookOpen className="w-16 h-16 mb-6 text-gray-300 dark:text-gray-600" />
                <p className="text-xl font-medium text-gray-500 dark:text-gray-400">Your translation sequence will appear here</p>
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Supported characters: A-Z, 0-9</p>
              </motion.div>
            ) : (
              // Animated Results Container
              <motion.div 
                layout
                className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8 min-h-[150px] items-center"
              >
                <AnimatePresence>
                  {inputText.split('').map((char, index) => {
                    const imageSrc = getImagePath(char);

                    // If it's a space or unknown character, render a clear visible gap
                    if (!imageSrc) {
                      return (
                        <motion.div 
                          layout 
                          initial={{ opacity: 0, scale: 0.5, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          key={`space-${index}`} 
                          className="flex flex-col items-center px-1 md:px-2 opacity-60"
                        >
                          <div className="flex items-center justify-center p-1 mb-4 w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24">
                             <div className="w-1/2 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                          </div>
                          <span className="flex items-center justify-center px-3 h-8 font-mono text-xs font-bold tracking-widest text-gray-500 bg-gray-100/50 border border-gray-200/50 shadow-sm rounded-xl dark:bg-gray-800/30 dark:text-gray-500 dark:border-gray-700/50 uppercase">
                            Space
                          </span>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        // Using index in the key alongside char ensures uniqueness but allows individual pop-ins
                        key={`${index}-${char}`} 
                        className="flex flex-col items-center group/card"
                      >
                        <div className="relative flex items-center justify-center p-1 mb-4 overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-md dark:bg-gray-900/80 dark:border-gray-700/80 rounded-2xl w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 group-hover/card:-translate-y-2 group-hover/card:shadow-2xl group-hover/card:border-primary/50 group-hover/card:ring-4 group-hover/card:ring-primary/20">
                          <img 
                            src={imageSrc} 
                            alt={`Sign for ${char}`} 
                            className="object-contain w-full h-full drop-shadow-sm transition-transform duration-500 group-hover/card:scale-110"
                            onError={(e) => {
                              // Fallback if image doesn't exist
                              e.target.onerror = null; 
                              e.target.parentElement.innerHTML = '<span class="text-xs font-bold text-red-500">N/A</span>';
                            }}
                          />
                        </div>
                        
                        <span className="flex items-center justify-center w-8 h-8 font-mono text-lg font-bold text-gray-700 bg-gray-100 border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                          {char}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dictionary;