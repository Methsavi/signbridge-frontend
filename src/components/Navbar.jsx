import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold text-primary">SignBridge AI</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md font-medium">Home</a>
            <a href="#" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md font-medium">Translator</a>
            <a href="#" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md font-medium">About</a>
            <a href="#" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">Login</a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;