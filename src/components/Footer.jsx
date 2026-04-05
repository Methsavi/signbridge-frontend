import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Facebook, Twitter, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="pt-16 pb-8 mt-auto text-gray-900 transition-colors duration-300 bg-indigo-50 border-t border-indigo-100 dark:text-gray-300 dark:bg-gray-950 dark:border-gray-800 z-10 relative">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        
        {/* Top Section: 3 Columns */}
        <div className="grid grid-cols-1 gap-12 mb-16 md:grid-cols-3">
          
          {/* Brand */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-bold tracking-wide text-gray-900 dark:text-white">
                SignBridge<span className="text-primary">AI</span>
              </span>
            </div>
            <p className="leading-relaxed text-gray-600 dark:text-gray-400">
              Your Intelligent Sign Language <br />
              translation and learning platform.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-start md:items-center">
            <div>
              <h3 className="mb-6 text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-white">Quick Links</h3>
              <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/about" className="transition-colors hover:text-primary">About Platform</Link></li>
                <li><Link to="/translator" className="transition-colors hover:text-primary">Translator</Link></li>
                <li><Link to="/dictionary" className="transition-colors hover:text-primary">Dictionary</Link></li>
                <li><Link to="/how-to-use" className="transition-colors hover:text-primary">How to Use</Link></li>
              </ul>
            </div>
          </div>

          {/* Connect With Us */}
          <div className="flex flex-col items-start md:items-end">
            <div className="w-full md:w-auto">
              <h3 className="mb-6 text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-white">Connect With Us</h3>
              <div className="flex gap-4 mb-6">
                <Link to="/not-found" className="p-2.5 text-gray-600 transition-colors bg-gray-100 rounded-full dark:bg-gray-800/50 dark:text-gray-300 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white">
                  <Facebook className="w-5 h-5" />
                </Link>
                <Link to="/not-found" className="p-2.5 text-gray-600 transition-colors bg-gray-100 rounded-full dark:bg-gray-800/50 dark:text-gray-300 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white">
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link to="/not-found" className="p-2.5 text-gray-600 transition-colors bg-gray-100 rounded-full dark:bg-gray-800/50 dark:text-gray-300 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white">
                  <Github className="w-5 h-5" />
                </Link>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                contact@signbridge.ai
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between pt-8 text-sm text-gray-600 border-t border-gray-200 gap-y-4 md:flex-row dark:border-gray-800/50 dark:text-gray-500">
          <p>&copy; {new Date().getFullYear()} SignBridge AI. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/privacy" className="transition-colors hover:text-primary">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors hover:text-primary">Terms of Service</Link>
            <Link to="/not-found" className="transition-colors hover:text-primary">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
