import React from 'react';
import { ShieldAlert, ShieldCheck, MoreVertical, Plus } from 'lucide-react';

const AdminManagement = () => {
  const admins = [
    { id: 1, name: 'Admin User', email: 'admin@signbridge.com', role: 'Superadmin', status: 'Active', lastActive: '2 mins ago' },
    { id: 2, name: 'Support Team', email: 'support@signbridge.com', role: 'Moderator', status: 'Active', lastActive: '1 hr ago' },
    { id: 3, name: 'Dev Ops', email: 'devops@signbridge.com', role: 'Developer', status: 'Offline', lastActive: '1 day ago' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Admin Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage administrators, roles and permissions.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-indigo-500/30 font-medium">
          <Plus className="w-5 h-5" />
          Invite Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative group overflow-hidden">
            {/* Background design element */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl ${
              admin.role === 'Superadmin' ? 'bg-purple-500' : 'bg-blue-500'
            }`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 text-xl">
                {admin.name.charAt(0)}
              </div>
              <button className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{admin.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{admin.email}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                {admin.role === 'Superadmin' ? (
                  <ShieldAlert className="w-4 h-4 text-purple-500" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                )}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{admin.role}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {admin.status === 'Active' ? (
                  <span className="text-emerald-500 font-medium tracking-wide">• Online</span>
                ) : (
                  `Last seen ${admin.lastActive}`
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminManagement;
