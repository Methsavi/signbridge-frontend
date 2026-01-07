import React from 'react';

const Footer = () => {
  return (
    <footer className="py-8 mt-auto text-white bg-black border-t border-gray-800">
      <div className="px-4 mx-auto text-center max-w-7xl">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} SignBridge AI. Bridging communication gaps universally.
        </p>
        <div className="flex justify-center mt-4 space-x-6 text-sm text-gray-400">
          <a href="#" className="transition-colors hover:text-primary">Privacy Policy</a>
          <a href="#" className="transition-colors hover:text-primary">Terms of Service</a>
          <a href="#" className="transition-colors hover:text-primary">Contact Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;