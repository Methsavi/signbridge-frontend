import React, { useEffect, useState } from 'react';
import { Users, Activity, Languages, BookOpen, ArrowUpRight } from 'lucide-react';
import { adminService } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const activityData = [
  { name: 'Mon', translations: 150, sessions: 80 },
  { name: 'Tue', translations: 230, sessions: 120 },
  { name: 'Wed', translations: 180, sessions: 150 },
  { name: 'Thu', translations: 290, sessions: 180 },
  { name: 'Fri', translations: 200, sessions: 140 },
  { name: 'Sat', translations: 340, sessions: 220 },
  { name: 'Sun', translations: 400, sessions: 280 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-glass p-4 rounded-xl">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full shadow-sm" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{entry.name}</span>
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <div className="bg-glass p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/50 dark:hover:border-white/30">
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
  const [dashboard, setDashboard] = useState({
    total_users: 0,
    active_users: 0,
    total_admins: 0,
    new_users_30d: 0,
    recent_users: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setDashboard(data);
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = [
    { title: 'Total Users', value: dashboard.total_users, icon: Users, trend: '+0%', colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { title: 'Active Users', value: dashboard.active_users, icon: Activity, trend: '+0%', colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    { title: 'Total Admins', value: dashboard.total_admins, icon: Languages, trend: '+0%', colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    { title: 'New Users (30d)', value: dashboard.new_users_30d, icon: BookOpen, trend: '+0%', colorClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-glass p-6 rounded-2xl min-h-[400px] flex flex-col transition-all hover:-translate-y-1 duration-300 hover:shadow-2xl hover:border-white/50 dark:hover:border-white/30">
          <div className="mb-4 flex items-center justify-end">
            <div className="flex items-center gap-4 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 px-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Translations</span>
              </div>
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
              <div className="flex items-center gap-2 px-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Sessions</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTranslations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.15} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.4 }} />
                <Area 
                  type="monotone" 
                  dataKey="translations" 
                  name="Translations"
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTranslations)" 
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
                <Area 
                  type="monotone" 
                  dataKey="sessions" 
                  name="Sessions"
                  stroke="#34d399" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSessions)" 
                  animationDuration={2000}
                  animationBegin={300}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-glass p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/50 dark:hover:border-white/30">
          <div className="space-y-4">
            {loading && (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading recent activity...</p>
            )}
            {!loading && dashboard.recent_users.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No recent user activity found.</p>
            )}
            {!loading && dashboard.recent_users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {(user.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.username} registered</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
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
