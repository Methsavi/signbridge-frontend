import React from 'react';
import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            Break the Silence with <span className="text-primary">AI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Real-time Sign Language Translation for everyone. 
            Communicate seamlessly across barriers using our advanced AI technology.
          </p>
          
          <div className="flex justify-center space-x-4">
            <button className="px-8 py-4 bg-primary text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition transform hover:-translate-y-1">
              Start Translating
            </button>
            <button className="px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl shadow border border-gray-200 hover:bg-gray-50 transition">
              Learn More
            </button>
          </div>

          {/* Feature Grid Mockup */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">🖐️</div>
              <h3 className="text-xl font-bold mb-2">Real-time Recognition</h3>
              <p className="text-gray-500">Instant detection of hand gestures using advanced Computer Vision.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">🗣️</div>
              <h3 className="text-xl font-bold mb-2">Text-to-Speech</h3>
              <p className="text-gray-500">Convert translated signs into spoken voice instantly.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold mb-2">Multi-language</h3>
              <p className="text-gray-500">Translate signs into English, Sinhala, and more.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;