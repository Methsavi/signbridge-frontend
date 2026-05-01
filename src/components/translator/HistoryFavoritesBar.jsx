import React from 'react';
import { Clock, Star } from 'lucide-react';

const BUTTONS = [
  {
    id: 'history',
    icon: Clock,
    label: 'History',
    activeColor: 'text-primary border-primary bg-primary/10',
    defaultColor: 'border-gray-200 dark:border-gray-700',
  },
  {
    id: 'favorites',
    icon: Star,
    label: 'Saved',
    activeColor: 'text-rose-500 border-rose-400 bg-rose-50 dark:bg-rose-900/20',
    defaultColor: 'border-gray-200 dark:border-gray-700',
  },
];

const HistoryFavoritesBar = ({ activePanel, openPanel }) => {
  return (
    <div className="flex justify-center gap-12 py-6 mt-2 sm:gap-16 sm:py-8">
      {BUTTONS.map(({ id, icon: Icon, label, activeColor, defaultColor }) => (
        <button
          key={id}
          onClick={() => openPanel(id)}
          className={`flex flex-col items-center gap-1.5 group transition-all duration-200 ${
            activePanel === id ? activeColor.split(' ')[0] : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
            activePanel === id ? activeColor : defaultColor
          }`}>
            <Icon size={20} fill={id === 'favorites' && activePanel === id ? 'currentColor' : 'none'} />
          </div>
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default HistoryFavoritesBar;
