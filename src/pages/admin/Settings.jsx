import React from 'react';
import { Save } from 'lucide-react';

const Settings = () => {
  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Platform Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure global application settings and preferences.</p>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">General Information</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update platform name, contact email and basic settings.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Platform Name</label>
              <input 
                type="text" 
                defaultValue="SignBridge AI"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Support Email</label>
              <input 
                type="email" 
                defaultValue="support@signbridge.com"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Platform Description</label>
            <textarea 
              rows={4}
              defaultValue="SignBridge AI offers real-time sign language translation services to bridge communication gaps."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-100 resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Preferences</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage system toggles and features.</p>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Maintenance Mode</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Disables access for all non-admin users.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">New User Registration</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Allow new users to sign up for accounts.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Email Notifications</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Send automatic welcome and alert emails.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 gap-4">
        <button className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Cancel
        </button>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/30 transition-colors">
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default Settings;
