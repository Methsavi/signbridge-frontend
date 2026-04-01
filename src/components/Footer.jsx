import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="py-8 mt-auto text-white bg-black border-t border-gray-800">
      <div className="px-4 mx-auto text-center max-w-7xl">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} SignBridge AI. Bridging communication gaps universally.
        </p>
        
        <div className="flex flex-wrap justify-center mt-4 text-sm text-gray-400 gap-x-6 gap-y-2">
          <Link to="/how-to-use" className="transition-colors hover:text-primary">How to Use</Link>
          <Link to="/privacy" className="transition-colors hover:text-primary">Privacy Policy</Link>
          <Link to="/terms" className="transition-colors hover:text-primary">Terms of Service</Link>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
