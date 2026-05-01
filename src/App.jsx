import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext'; 
import { ThemeProvider } from './context/ThemeContext';

import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import Login from './pages/user/Login';
import Register from './pages/user/Register';
import About from './pages/About';
import Translator from './pages/Translator';
import Profile from './pages/user/Profile';
import Dictionary from './pages/Dictionary';
import HowToUse from './pages/HowToUse';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUserManagement from './pages/admin/UserManagement';
import AdminManagement from './pages/admin/AdminManagement';
import AdminSettings from './pages/admin/Settings';
import AdminLogin from './pages/admin/AdminLogin';
import AdminFeedbacks from './pages/admin/AdminFeedbacks';
import ManageDictionary from './pages/admin/ManageDictionary';
import Analytics from './pages/admin/Analytics';

function App() {
  return (
   
    <ToastProvider> 
      <ThemeProvider>
        <Router>
          <ScrollToTop />
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
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="admins" element={<AdminManagement />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="feedbacks" element={<AdminFeedbacks />} />
              <Route path="dictionary" element={<ManageDictionary />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>

            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;