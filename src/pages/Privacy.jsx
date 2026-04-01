import React from 'react';
import { ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Privacy = () => {
  return (
    <div className="flex flex-col min-h-screen text-white bg-gray-900">
      <Navbar />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl p-8 mx-auto bg-gray-800 border border-gray-700 shadow-xl rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-primary" size={32} />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          
          <div className="space-y-6 leading-relaxed text-gray-300">
            <section>
              <h2 className="mb-2 text-xl font-semibold text-white">1. Camera Data</h2>
              <p>SignBridge AI processes video frames locally and on our secure backend to extract hand landmarks. <strong>We do not store your raw video or images.</strong> Only numerical coordinate data is used for real-time translation.</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-white">2. Data We Collect</h2>
              <p>When you create an account, we store your username, email, and translation history. This data is used solely to provide you with your personal dashboard and history features.</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-white">3. Third-Party Services</h2>
              <p>We utilize MongoDB Atlas for database security and Google Translate API for language processing. These services adhere to high-standard privacy protocols.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;