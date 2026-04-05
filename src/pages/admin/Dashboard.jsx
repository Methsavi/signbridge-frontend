import React from 'react';
import { Users, Activity, Languages, BookOpen, ArrowUpRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-transform hover:-translate-y-1">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</h3>
      </div>
      <div className={`p-4 rounded-full ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className="flex items-center text-emerald-500 font-medium">
        <ArrowUpRight className="w-4 h-4 mr-1" />
        {trend}
      </span>
      <span className="text-slate-500 dark:text-slate-400 ml-2">vs last month</span>
    </div>
  </div>
);

const Dashboard = () => {
  const stats = [
    { title: 'Total Users', value: '4,521', icon: Users, trend: '+12.5%', colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { title: 'Active Translators', value: '853', icon: Activity, trend: '+5.2%', colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    { title: 'Translations Made', value: '1.2M', icon: Languages, trend: '+28.4%', colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    { title: 'Dictionary Hits', value: '89.2K', icon: BookOpen, trend: '+14.1%', colorClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back. Here's what's happening with SignBridge today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm min-h-[400px] flex flex-col items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400 italic">Chart Placeholder (System Activity over time)</p>
        </div>
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?img=${i+10}`} alt="user" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">New user registered</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{i * 2} minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
