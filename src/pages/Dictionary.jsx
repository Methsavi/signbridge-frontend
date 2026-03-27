import React, { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
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
    <div className="flex flex-col min-h-screen text-white bg-gray-900">
      <Navbar />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Header Section */}
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Text-to-Sign Dictionary</h1>
          </div>
          <p className="mb-8 text-gray-400">
            Type any English word or number below to instantly see how to sign it in American Sign Language.
          </p>

          {/* Input Section */}
          <div className="relative flex items-center mb-12">
            <Search className="absolute text-gray-400 left-4" size={24} />
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a word (e.g., Hello 123)..."
              className="w-full py-4 pl-12 pr-4 text-xl bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Results Display Section with Adjusted Container Size */}
          <div className="p-8 bg-gray-800 border border-gray-700 min-h-[300px] rounded-3xl">
            {inputText.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Start typing to see the sign language sequence...
              </div>
            ) : (
              // Results container with flexible layout
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-6">
                {/* Process each character individually */}
                {inputText.split('').map((char, index) => {
                  const imageSrc = getImagePath(char);

                  // If it's a space or unknown character, render a gap
                  if (!imageSrc) {
                    return <div key={index} className="w-14 md:w-20"></div>;
                  }

                  return (
                    <div key={index} className="flex flex-col items-center">
                      {/* --- ADJUSTED: Smaller, Square, and Containment --- */}
                      <div className="flex items-center justify-center p-2 overflow-hidden bg-gray-900 border border-gray-700 shadow-lg rounded-xl w-14 h-14 md:w-20 md:h-20 aspect-square">
                        <img 
                          src={imageSrc} 
                          alt={`Sign for ${char}`} 
                          // --- ADJUSTED: Use contain to fix cropping, full height/width fit ---
                          className="object-contain max-w-full max-h-full"
                          onError={(e) => {
                            // Fallback if image doesn't exist
                            e.target.onerror = null; 
                            e.target.parentElement.innerHTML = '<span class="text-xs text-red-400">Missing</span>';
                          }}
                        />
                      </div>
                      
                      {/* --- ADJUSTED: Text color changed to match user input case, removed uppercase --- */}
                      <span className="mt-2 font-mono text-lg text-gray-300">
                        {char}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dictionary;