import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bgTheme, setBgTheme] = useState(localStorage.getItem('adminBgTheme') || 'liquid');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/admin/login');
        return;
      }
      
      try {
        const user = JSON.parse(userStr);
        if (!user.is_admin_session) {
          navigate('/admin/login');
        }
      } catch (err) {
        navigate('/admin/login');
      }
    };

    checkAuth();
    window.addEventListener('user-update', checkAuth);
    
    const updateTheme = () => setBgTheme(localStorage.getItem('adminBgTheme') || 'liquid');
    window.addEventListener('admin-theme-update', updateTheme);
    
    return () => {
      window.removeEventListener('user-update', checkAuth);
      window.removeEventListener('admin-theme-update', updateTheme);
    };
  }, [navigate]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const bgClass = bgTheme === 'solid' ? 'bg-slate-50 dark:bg-slate-950' : 'admin-bg';

  return (
    <div className={`min-h-screen ${bgClass} text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
        <Topbar toggleSidebar={toggleSidebar} />

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
