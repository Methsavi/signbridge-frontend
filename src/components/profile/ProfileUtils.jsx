import React from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

export const InfoRow = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
    <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <Icon className="w-4 h-4" /> {label}
    </span>
    <span className={`text-sm font-semibold ${accent ? 'text-primary' : 'text-gray-800 dark:text-white'}`}>{value}</span>
  </div>
);

export const FormField = ({ label, icon: Icon, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
      {Icon && <Icon className="w-3.5 h-3.5" />} {label}
    </label>
    {children}
  </div>
);

export const PasswordField = ({ label, value, show, onToggle, onChange, placeholder }) => (
  <FormField label={label} icon={KeyRound}>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="profile-input pr-10"
        placeholder={placeholder}
        autoComplete="new-password"
      />
      <button type="button" onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  </FormField>
);
