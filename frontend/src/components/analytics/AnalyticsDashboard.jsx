import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../api/analytics.service';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const DEVICE_COLORS = {
  Desktop: '#6366f1',
  Mobile: '#10b981',
  Tablet: '#f59e0b',
  Unknown: '#64748b',
};

export const AnalyticsDashboard = () => {
  const { accessToken } = useAuth();
  const [data, setData] = useState({
    totalClicks: 0,
    clicksOverTime: [],
    topReferrers: [],
    deviceDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getAnalytics(accessToken);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load analytics data.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching analytics.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const { totalClicks, clicksOverTime, topReferrers, deviceDistribution } = data;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Analytics Dashboard</h1>
          <p className="text-slate-400 text-sm">
            Real-time click telemetry and audience insights for your short links
          </p>
        </div>
        <Button
          onClick={fetchAnalytics}
          variant="secondary"
          disabled={loading}
          className="self-start sm:self-auto"
        >
          {loading ? 'Refreshing...' : 'Refresh Analytics'}
        </Button>
      </div>

      {error && <Alert variant="error" message={error} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Total Clicks
          </p>
          <p className="text-3xl font-extrabold text-indigo-400 mt-2">
            {loading ? '...' : totalClicks.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">All-time link traffic</p>
        </Card>

        <Card className="p-5 border border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Active Dates
          </p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">
            {loading ? '...' : clicksOverTime.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Days with click activity</p>
        </Card>

        <Card className="p-5 border border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Top Referrer
          </p>
          <p className="text-xl font-bold text-amber-400 mt-2 truncate">
            {loading
              ? '...'
              : topReferrers.length > 0
              ? topReferrers[0].referrer
              : 'Direct / None'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {topReferrers.length > 0
              ? `${topReferrers[0].clicks} clicks`
              : 'No referrer data'}
          </p>
        </Card>

        <Card className="p-5 border border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Dominant Device
          </p>
          <p className="text-xl font-bold text-purple-400 mt-2 truncate">
            {loading
              ? '...'
              : deviceDistribution.length > 0
              ? deviceDistribution[0].deviceType
              : 'N/A'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {deviceDistribution.length > 0
              ? `${deviceDistribution[0].clicks} clicks`
              : 'No device telemetry'}
          </p>
        </Card>
      </div>

      {/* Main Visualizations */}
      {!loading && totalClicks === 0 ? (
        <Card className="p-8 text-center border border-slate-800 bg-slate-900/40">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            📊
          </div>
          <h3 className="text-lg font-semibold text-slate-200">No Click Telemetry Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
            Share your branded short links or bio hub to collect redirection insights, referrer sources, and device statistics.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Clicks Over Time Area Chart */}
          <Card className="p-6 border border-slate-800 bg-slate-900/60 backdrop-blur">
            <h2 className="text-lg font-bold text-slate-200 mb-4">
              Total Clicks Over Time
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={clicksOverTime}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      color: '#f8fafc',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Grid: Top Referrers & Device Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Referrers Bar Chart & Table */}
            <Card className="p-6 border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col">
              <h2 className="text-lg font-bold text-slate-200 mb-4">
                Top Referrers
              </h2>
              <div className="h-60 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topReferrers} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="referrer"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        color: '#f8fafc',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Bar dataKey="clicks" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Referrer Detail Table */}
              <div className="overflow-x-auto mt-auto border-t border-slate-800 pt-4">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs uppercase bg-slate-800/60 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 rounded-l">Referrer Source</th>
                      <th className="px-3 py-2 text-right rounded-r">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {topReferrers.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-3 py-2 font-mono text-xs text-indigo-300">
                          {item.referrer}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-400">
                          {item.clicks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Device Distribution Donut Chart */}
            <Card className="p-6 border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col">
              <h2 className="text-lg font-bold text-slate-200 mb-4">
                Device Distribution
              </h2>
              <div className="h-60 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceDistribution}
                      dataKey="clicks"
                      nameKey="deviceType"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {deviceDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={DEVICE_COLORS[entry.deviceType] || '#64748b'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        color: '#f8fafc',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Device Detail Table */}
              <div className="overflow-x-auto mt-auto border-t border-slate-800 pt-4">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs uppercase bg-slate-800/60 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 rounded-l">Device Type</th>
                      <th className="px-3 py-2 text-right rounded-r">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {deviceDistribution.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-3 py-2 font-medium text-slate-200 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{
                              backgroundColor:
                                DEVICE_COLORS[item.deviceType] || '#64748b',
                            }}
                          />
                          {item.deviceType}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-indigo-400">
                          {item.clicks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
