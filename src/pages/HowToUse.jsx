import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Keyboard, BookOpen, History, UserCheck, HelpCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HowToUse = () => {
  const steps = [
    {
      icon: <Camera className="text-primary" size={32} />,
      title: "Sign-to-Text Mode",
      desc: "Go to the Translator page and select 'Sign Mode'. Grant camera access, and perform ASL signs. Our AI will track your hand landmarks and build a sentence in real-time."
    },
    {
      icon: <BookOpen className="text-green-400" size={32} />,
      title: "ASL Dictionary",
      desc: "Use the Dictionary to learn signs. Type any English word or number, and the app will instantly show you the corresponding ASL hand gestures."
    },
    {
      icon: <Keyboard className="text-purple-400" size={32} />,
      title: "Text Translation",
      desc: "Switch to 'Text Mode' in the translator to type sentences directly. You can translate between English, Sinhala, and Tamil with audio playback."
    },
    {
      icon: <History className="text-orange-400" size={32} />,
      title: "Save Your Progress",
      desc: "Create an account to automatically save your translation history. You can revisit your past conversations anytime from your Profile page."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen text-gray-900 bg-gray-50 dark:text-white dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      <main className="flex-grow p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold">How to Use SignBridge AI</h1>
          </div>
          
          <p className="mb-12 text-lg text-gray-600 dark:text-gray-400">
            Welcome! SignBridge AI is designed to make communication between the deaf community and the hearing majority seamless. Follow these steps to get started.
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {steps.map((step, index) => (
              <div key={index} className="p-6 transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none rounded-2xl hover:border-primary dark:hover:border-primary">
                <div className="mb-4">{step.icon}</div>
                <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-8 mt-16 text-center border bg-primary/10 border-primary/20 rounded-3xl">
            <UserCheck className="mx-auto mb-4 text-primary" size={48} />
            <h2 className="mb-2 text-2xl font-bold">Pro Tip: Stability is Key</h2>
            <p className="text-gray-700 dark:text-gray-300">
              When using the AI camera, keep your hand steady for about 1 second to register a letter. 
              The green landmarks will show you if the AI is tracking you correctly!
            </p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default HowToUse;