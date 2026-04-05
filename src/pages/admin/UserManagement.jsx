import React from 'react';
import { MoreHorizontal, Plus, Search } from 'lucide-react';

const UserManagement = () => {
  const users = [
    { id: 1, name: 'Alice Smith', email: 'alice@example.com', role: 'User', status: 'Active', joined: 'Oct 24, 2023' },
    { id: 2, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Offline', joined: 'Oct 23, 2023' },
    { id: 3, name: 'Charlie Davis', email: 'charlie@example.com', role: 'Premium', status: 'Active', joined: 'Oct 20, 2023' },
    { id: 4, name: 'Diana Rigg', email: 'diana@example.com', role: 'User', status: 'Suspended', joined: 'Oct 15, 2023' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all registered users in the system.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-500/30 font-medium">
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 w-full sm:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none transition-all shadow-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                <th className="py-4 px-6 font-medium">User</th>
                <th className="py-4 px-6 font-medium">Role</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Joined</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold shadow-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">{user.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                      user.status === 'Offline' ? 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20' :
                      'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'Active' ? 'bg-emerald-500' : 
                        user.status === 'Offline' ? 'bg-slate-500' : 'bg-red-500'
                      }`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">{user.joined}</td>
                  <td className="py-4 px-6 text-right">
                    <button className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <div>Showing 1 to 4 of 4 entries</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
