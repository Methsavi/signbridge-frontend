import React from 'react';
import { motion } from 'framer-motion';
import { Code, Cpu, Heart, Linkedin, Github, Mail, Globe } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className="flex flex-col min-h-screen text-white bg-gray-900">
      <Navbar />

      <main className="relative flex-grow overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

        {/* --- HERO SECTION --- */}
        <section className="relative z-10 px-4 py-20 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-6 text-4xl font-bold md:text-6xl">
              Our Mission is <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                Connection
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl leading-relaxed text-gray-400">
              SignBridge AI was born from a simple belief: <br />
              <span className="font-semibold text-white">Communication is a fundamental human right.</span> <br />
              We are using cutting-edge Artificial Intelligence to break down the barriers between sign language users and the rest of the world.
            </p>
          </motion.div>
        </section>

        {/* --- HOW IT WORKS (TECH STACK) --- */}
        <section className="py-20 bg-gray-800/30 backdrop-blur-sm">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-16 text-center"
            >
              <h2 className="mb-4 text-3xl font-bold">Powered by Advanced Tech</h2>
              <p className="text-gray-400">A seamless blend of modern web technologies and computer vision.</p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              <TechCard 
                icon={<Cpu className="w-10 h-10 text-primary" />}
                title="Computer Vision"
                desc="Utilizing MediaPipe and OpenCV to track 21 distinct hand landmarks in real-time with millisecond precision."
                delay={0.1}
              />
              <TechCard 
                icon={<Code className="w-10 h-10 text-blue-400" />}
                title="Smart Backend"
                desc="Built on FastAPI and Python, our engine processes gestures and manages secure user data via MongoDB."
                delay={0.2}
              />
              <TechCard 
                icon={<Globe className="w-10 h-10 text-green-400" />}
                title="Modern Frontend"
                desc="A responsive, accessible interface crafted with React, Tailwind CSS, and Framer Motion for the best user experience."
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* --- DEVELOPER SECTION --- */}
        <section className="px-4 py-24 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="relative p-8 overflow-hidden border border-gray-700 shadow-2xl bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl md:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10 flex flex-col items-center gap-12 md:flex-row">
              {/* Profile Image / Placeholder */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="flex items-center justify-center w-48 h-48 bg-gray-700 border-4 border-gray-600 rounded-full shadow-xl"
              >
                <UserAvatar />
              </motion.div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="mb-2 text-3xl font-bold">Hewa M Savindya</h2>
                <p className="mb-6 font-medium text-primary">Lead Developer & Researcher</p>
                <p className="mb-8 leading-relaxed text-gray-400">
                  I am a Software Engineering undergraduate passionate about using technology for social good. 
                  SignBridge is my individual computing project aimed at solving real-world accessibility challenges through AI innovation.
                </p>
                
                <div className="flex justify-center gap-4 md:justify-start">
                  <SocialLink icon={<Github className="w-5 h-5" />} href="#" label="GitHub" />
                  <SocialLink icon={<Linkedin className="w-5 h-5" />} href="#" label="LinkedIn" />
                  <SocialLink icon={<Mail className="w-5 h-5" />} href="mailto:savindya@example.com" label="Contact" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

// --- Helper Components ---

const TechCard = ({ icon, title, desc, delay }) => (
  <motion.div 
    initial={{ y: 20, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="p-8 transition-colors bg-gray-800 border border-gray-700 rounded-2xl hover:border-primary hover:shadow-lg hover:shadow-primary/10"
  >
    <div className="mb-4">{icon}</div>
    <h3 className="mb-3 text-xl font-bold">{title}</h3>
    <p className="leading-relaxed text-gray-400">{desc}</p>
  </motion.div>
);

const SocialLink = ({ icon, href, label }) => (
  <a 
    href={href} 
    className="p-3 transition-all transform bg-gray-700 rounded-full hover:bg-primary hover:text-white hover:-translate-y-1"
    aria-label={label}
  >
    {icon}
  </a>
);

const UserAvatar = () => (
  <svg className="w-24 h-24 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export default About;