import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  ComposedChart, Line,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Languages, Users, BookOpen,
  ArrowUpRight, ArrowDownRight, BarChart2, RefreshCw,
} from 'lucide-react';
import { adminService } from '../../services/api';

// ─── Colour palettes ────────────────────────────────────────────────────────
const LANG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

// ─── Shared tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-glass backdrop-blur-md p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl min-w-[140px]">
      {label && <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Pie custom label ─────────────────────────────────────────────────────────
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Stat mini-card ───────────────────────────────────────────────────────────
const MiniStat = ({ label, value, sub, icon: Icon, color, trend }) => {
  const isUp = trend >= 0;
  return (
    <div className="bg-glass p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-md hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{value?.toLocaleString() ?? '—'}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-semibold ${isUp ? 'text-emerald-500' : 'text-red-400'}`}>
          {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
};

// ─── Chart card wrapper ───────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <div className={`bg-glass p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-md hover:-translate-y-0.5 transition-transform duration-300 ${className}`}>
    {title && (
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wide">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const Skeleton = ({ h = 'h-64' }) => (
  <div className={`${h} bg-slate-200/60 dark:bg-slate-800/60 rounded-xl animate-pulse`} />
);

// ─── Main component ───────────────────────────────────────────────────────────
const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await adminService.getAnalyticsStats();
      setData(result);
    } catch (err) {
      setError('Failed to load analytics. Please check the server connection.');
      console.error('Analytics fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Trend % for translations this vs last month
  const translationTrend = useMemo(() => {
    if (!data) return undefined;
    const { translations_this_month: curr, translations_last_month: prev } = data;
    if (!prev) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }, [data]);

  // Shorten date labels for daily chart
  const dailyData = useMemo(() => {
    if (!data?.translations_per_day) return [];
    return data.translations_per_day.map(d => ({
      ...d,
      label: d.date.slice(5), // MM-DD
    }));
  }, [data]);

  // Every 3rd label for 30-day axis
  const dailyTick = (value, index) => index % 3 === 0 ? value : '';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200/50 dark:border-indigo-500/30 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h="h-28" />)
        ) : (
          <>
            <MiniStat
              label="Total Translations"
              value={data?.total_translations}
              sub="All-time history entries"
              icon={TrendingUp}
              color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              trend={translationTrend}
            />
            <MiniStat
              label="This Month"
              value={data?.translations_this_month}
              sub={`Last month: ${data?.translations_last_month?.toLocaleString()}`}
              icon={BarChart2}
              color="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            />
            <MiniStat
              label="Languages Used"
              value={data?.language_distribution?.length}
              sub="Distinct target languages"
              icon={Languages}
              color="bg-pink-500/10 text-pink-600 dark:text-pink-400"
            />
            <MiniStat
              label="Dictionary Entries"
              value={data?.total_dictionary_entries}
              sub={`${data?.dictionary_by_category?.length ?? 0} categories`}
              icon={BookOpen}
              color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
          </>
        )}
      </div>

      {/* ── Row 1: Daily Translations (wide) + Language Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="Translation Activity"
          subtitle="Daily translation requests over the last 30 days"
          className="lg:col-span-2"
        >
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTrans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.12} />
                <XAxis
                  dataKey="label"
                  tickFormatter={dailyTick}
                  axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  dy={8}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dx={-4} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.3 }} />
                <Area
                  type="monotone" dataKey="count" name="Translations"
                  stroke="#6366f1" strokeWidth={2.5}
                  fillOpacity={1} fill="url(#gradTrans)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={1800} animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Language Distribution"
          subtitle="Most used target languages"
        >
          {loading ? <Skeleton /> : (
            data?.language_distribution?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.language_distribution}
                      dataKey="count"
                      nameKey="language"
                      cx="50%" cy="50%"
                      outerRadius={85}
                      labelLine={false}
                      label={PieLabel}
                      animationBegin={0}
                      animationDuration={1400}
                    >
                      {data.language_distribution.map((_, i) => (
                        <Cell key={i} fill={LANG_COLORS[i % LANG_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {data.language_distribution.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: LANG_COLORS[i % LANG_COLORS.length] }} />
                        <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{item.language}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex-shrink-0">{item.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">No translation data yet</div>
            )
          )}
        </ChartCard>
      </div>

      {/* ── Row 2: User Registrations (combo bar+line) ── */}
      <ChartCard
        title="User Registrations"
        subtitle="New sign-ups per month (bars) and cumulative total users (line) over the last 12 months"
      >
        {loading ? <Skeleton h="h-72" /> : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data?.registrations_per_month} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.12} />
              <XAxis
                dataKey="month"
                axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                yAxisId="left"
                axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                dx={-4}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right" orientation="right"
                axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                dx={4}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Legend
                wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
                formatter={(value) => <span className="text-slate-600 dark:text-slate-300">{value}</span>}
              />
              <Bar
                yAxisId="left" dataKey="new_users" name="New Users"
                fill="url(#gradNew)" radius={[6, 6, 0, 0]}
                animationDuration={1600}
              />
              <Line
                yAxisId="right" type="monotone" dataKey="total_users" name="Total Users"
                stroke="#34d399" strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={1800} animationBegin={400}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Row 3: Top Translators + Dictionary by Category ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top Translators"
          subtitle="Users with the highest number of translation history entries"
        >
          {loading ? <Skeleton h="h-72" /> : (
            data?.top_translators?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  layout="vertical"
                  data={data.top_translators}
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradUser" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" strokeOpacity={0.12} />
                  <XAxis
                    type="number"
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category" dataKey="username"
                    width={90}
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                  <Bar
                    dataKey="translations" name="Translations"
                    fill="url(#gradUser)" radius={[0, 6, 6, 0]}
                    animationDuration={1600}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">No translation history yet</div>
            )
          )}
        </ChartCard>

        <ChartCard
          title="Dictionary by Category"
          subtitle="Number of ASL dictionary entries per category"
        >
          {loading ? <Skeleton h="h-72" /> : (
            data?.dictionary_by_category?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.dictionary_by_category}
                      dataKey="count"
                      nameKey="category"
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      labelLine={false}
                      animationBegin={0}
                      animationDuration={1400}
                    >
                      {data.dictionary_by_category.map((_, i) => (
                        <Cell key={i} fill={LANG_COLORS[i % LANG_COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
                  {data.dictionary_by_category.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: LANG_COLORS[i % LANG_COLORS.length] }} />
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{item.category}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-100 ml-auto flex-shrink-0">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">No dictionary entries yet</div>
            )
          )}
        </ChartCard>
      </div>

      {/* ── Row 4: Translation volume radial ── */}
      {!loading && data?.translations_per_day && (() => {
        // Compute weekday averages from the daily data
        const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayTotals = Array(7).fill(0);
        const dayCounts = Array(7).fill(0);
        data.translations_per_day.forEach(({ date, count }) => {
          const d = new Date(date);
          const wd = d.getUTCDay();
          dayTotals[wd] += count;
          dayCounts[wd] += 1;
        });
        const weekdayAvg = DAYS.map((name, i) => ({
          name,
          avg: dayCounts[i] ? Math.round(dayTotals[i] / dayCounts[i]) : 0,
          fill: LANG_COLORS[i % LANG_COLORS.length],
        }));

        return (
          <ChartCard
            title="Average Translations by Day of Week"
            subtitle="Average daily translation count for each weekday (based on last 30 days)"
          >
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={240}>
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="15%"
                  outerRadius="90%"
                  data={weekdayAvg}
                  startAngle={180}
                  endAngle={-180}
                >
                  <RadialBar
                    minAngle={15}
                    dataKey="avg"
                    background={{ fill: 'rgba(148,163,184,0.08)' }}
                    cornerRadius={6}
                    label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 700 }}
                    animationDuration={1600}
                  />
                  <Tooltip content={<ChartTooltip />} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 lg:min-w-[140px]">
                {weekdayAvg.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-8">{item.name}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (item.avg / (Math.max(...weekdayAvg.map(d => d.avg)) || 1)) * 100)}%`,
                          backgroundColor: item.fill,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 w-6 text-right">{item.avg}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        );
      })()}
    </div>
  );
};

export default Analytics;
