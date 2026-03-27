import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check, Sparkles } from 'lucide-react';

// Comprehensive list of languages supported by Google Translate
const LANGUAGES = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'ko', name: 'Korean' },
  { code: 'lo', name: 'Lao' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'my', name: 'Myanmar (Burmese)' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'es', name: 'Spanish' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' }
];

const LanguageSelector = ({ selectedLang, onChange, includeAuto = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter logic
  const filteredLangs = LANGUAGES.filter(lang => 
    lang.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get display name for button
  const getSelectedName = () => {
    if (selectedLang === 'auto') return 'Auto Detect';
    return LANGUAGES.find(l => l.code === selectedLang)?.name || "Select Language";
  };

  return (
    <div className="relative w-full max-w-xs" ref={wrapperRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-xl transition-all border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <span className="flex items-center gap-2 font-medium truncate">
          {selectedLang === 'auto' && <Sparkles className="w-4 h-4 text-yellow-400" />}
          {getSelectedName()}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 w-full mt-2 overflow-hidden bg-gray-800 border border-gray-700 shadow-2xl rounded-xl"
          >
            {/* Search Bar */}
            <div className="sticky top-0 p-2 border-b border-gray-700 bg-gray-800/95 backdrop-blur">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search language..." 
                  className="w-full py-2 pr-3 text-sm text-white placeholder-gray-500 bg-gray-900 border border-gray-700 rounded-lg pl-9 focus:outline-none focus:border-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* List of Languages */}
            <div className="p-1 overflow-y-auto max-h-60 custom-scrollbar">
              
              {/* Auto Detect Option */}
              {includeAuto && (
                <button
                  onClick={() => { onChange('auto'); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                    selectedLang === 'auto' ? 'bg-yellow-500/20 text-yellow-400 font-bold' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> Auto Detect</span>
                  {selectedLang === 'auto' && <Check className="w-4 h-4" />}
                </button>
              )}

              {/* Filtered List */}
              {filteredLangs.length === 0 ? (
                <div className="p-4 text-sm text-center text-gray-500">No language found</div>
              ) : (
                filteredLangs.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onChange(lang.code);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedLang === lang.code 
                        ? 'bg-primary/20 text-primary font-bold' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {lang.name}
                    {selectedLang === lang.code && <Check className="w-4 h-4" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;