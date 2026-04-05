import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { SearchX, Home as HomeIcon } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="relative flex flex-col min-h-screen text-gray-900 bg-gray-50 dark:text-white dark:bg-gray-900 transition-colors duration-300">
      <Navbar />

      <main className="relative flex-grow flex items-center justify-center p-4 z-10">
        {/* Background Decorative Blur Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[10%] w-72 h-72 bg-purple-500/20 rounded-full blur-[100px]" />
        </div>

        <motion.div 
          className="relative z-10 text-center max-w-2xl w-full px-6 py-16 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [-10, 10, -10] }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "easeInOut"
            }}
            className="flex justify-center mb-6 text-primary drop-shadow-md"
          >
            <SearchX size={96} strokeWidth={1.5} />
          </motion.div>
          
          <h1 className="text-7xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-primary to-purple-600 mb-6 drop-shadow-sm">
            404
          </h1>
          
          <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Destination Unknown
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-10 text-lg max-w-md mx-auto leading-relaxed">
            The page you are looking for has either drifted into the digital void, or never existed in the first place.
          </p>

          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all transform rounded-full shadow-lg bg-gradient-to-r from-primary to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0"
          >
            <HomeIcon className="w-5 h-5" />
            Return Home
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
