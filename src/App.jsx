import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext'; 

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import Translator from './pages/Translator';
import Profile from './pages/Profile';
import Dictionary from './pages/Dictionary';
import HowToUse from './pages/HowToUse';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

function App() {
  return (
   
    <ToastProvider> 
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/translator" element={<Translator />} />
          <Route path="/dictionary" element={<Dictionary />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;