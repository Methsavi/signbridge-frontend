import React from 'react';
import { motion } from 'framer-motion';
import { Hand, Globe, Mic, ArrowRight, Zap, Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

// Floating Icons Configuration
const floatingIcons = [
  { icon: "✋", x: "10%", y: "20%", delay: 0 },
  { icon: "👌", x: "80%", y: "15%", delay: 2 },
  { icon: "✌️", x: "15%", y: "70%", delay: 4 },
  { icon: "🤟", x: "85%", y: "80%", delay: 1 },
  { icon: "👍", x: "50%", y: "50%", delay: 3 },
  { icon: "👋", x: "90%", y: "40%", delay: 5 },
];

const Home = () => {
  return (
    <div className="relative flex flex-col min-h-screen text-gray-900 bg-gray-50 dark:text-white dark:bg-gray-900 transition-colors duration-300">
      {/* --- BACKGROUND ANIMATION --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />

        {/* Floating Signs */}
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className="absolute text-6xl select-none opacity-20"
            initial={{ x: item.x, y: item.y }}
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              delay: item.delay,
              ease: "easeInOut" 
            }}
            style={{ left: item.x, top: item.y }}
          >
            {item.icon}
          </motion.div>
        ))}
      </div>

      <Navbar />

      <main className="relative flex-grow z-10">
        
        {/* --- HERO SECTION --- */}
        <div className="relative z-10 px-4 pt-20 pb-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="mb-2 font-semibold tracking-wide uppercase text-primary">
                Universal Communication
              </h2>
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl">
                Break the Silence <br/> with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">AI Power</span>
              </h1>
              <p className="max-w-2xl mx-auto mt-4 text-xl text-gray-600 dark:text-gray-400">
                Experience real-time Sign Language Translation powered by advanced Computer Vision.
                Bridging the gap between signers and speakers instantly.
              </p>
            </motion.div>

          <motion.div 
              className="flex justify-center gap-4 mt-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {/* Button 1: Goes to Translator */}
              <Link 
                to="/translator" 
                className="flex items-center gap-2 px-8 py-4 text-lg font-bold text-white transition-all rounded-full shadow-lg bg-primary hover:bg-indigo-600 group"
              >
                Start Translating
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              
              {/* Button 2: Goes to Dictionary */}
              <Link 
                to="/dictionary" 
                className="px-8 py-4 text-lg font-bold text-gray-900 transition-all bg-white border border-gray-300 rounded-full dark:text-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Sign Dictionary
              </Link>
            </motion.div>
            
          </div>
        </div>

        {/* --- FEATURES GRID --- */}
        <div className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            
            <FeatureCard 
              icon={<Hand className="w-8 h-8 text-primary" />}
              title="Real-Time Detection"
              desc="Instant hand gesture recognition using MediaPipe's advanced skeletal tracking."
              delay={0.2}
            />
            
            <FeatureCard 
              icon={<Mic className="w-8 h-8 text-green-400" />}
              title="Sign-to-Speech"
              desc="Convert hand signs into audible speech instantly for seamless conversation."
              delay={0.4}
            />
            
            <FeatureCard 
              icon={<Globe className="w-8 h-8 text-blue-400" />}
              title="Multi-Language"
              desc="Translate sign language into English, Sinhala, and Tamil automatically."
              delay={0.6}
            />

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Sub-component for Feature Cards
const FeatureCard = ({ icon, title, desc, delay }) => {
  return (
    <motion.div 
      className="p-8 transition-colors border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl hover:border-primary/50 dark:hover:border-primary/50 shadow-sm dark:shadow-none"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      <div className="flex items-center justify-center mb-6 bg-gray-100 dark:bg-gray-700/50 w-14 h-14 rounded-xl">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="leading-relaxed text-gray-600 dark:text-gray-400">{desc}</p>
    </motion.div>
  );
};

export default Home;