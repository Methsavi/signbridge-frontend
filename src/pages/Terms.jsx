import React from 'react';
import { FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Terms = () => {
  return (
    <div className="flex flex-col min-h-screen text-gray-900 bg-gray-50 dark:text-white dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl p-8 mx-auto bg-white border border-gray-200 shadow-xl dark:bg-gray-800 dark:border-gray-700 rounded-3xl transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="text-primary" size={32} />
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>
          
          <div className="space-y-6 leading-relaxed text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">1. Use of Service</h2>
              <p>SignBridge AI is an educational tool designed to assist in sign language communication. It should not be relied upon for critical medical, legal, or emergency communications.</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">2. AI Accuracy</h2>
              <p>Our translation models are based on machine learning and may occasionally produce incorrect results due to lighting, camera quality, or gesture complexity.</p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">3. Account Responsibility</h2>
              <p>Users are responsible for maintaining the confidentiality of their login credentials. SignBridge AI reserves the right to terminate accounts that violate community standards.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;