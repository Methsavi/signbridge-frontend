import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} SignBridge AI. All rights reserved.
        </p>
        <div className="mt-2 space-x-4 text-gray-400 text-sm">
          <a href="#" className="hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-white">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;