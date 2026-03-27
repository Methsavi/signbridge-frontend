import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext'; // <--- NEW IMPORT

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import Translator from './pages/Translator';
import Profile from './pages/Profile';
import Dictionary from './pages/Dictionary';

function App() {
  return (
    // Wrap everything in ToastProvider
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
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;