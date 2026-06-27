import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/apiclient';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const COLORS = ['#f59e0b', '#ef4444'];

function StatCard({ label, value, sub }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{Number(value).toLocaleString()}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
    );
}

function SectionTitle({ children }) {
    return <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{children}</h2>;
}

const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#f9fafb',
    fontSize: 13,
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
};

export function Metrics() {
    const { id } = useParams();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get(`/analytics/summary/${id}`);
                setSummary(response.data.data);
            } catch (err) {
                setError(err.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="ml-3 text-gray-400 text-sm">Loading metrics...</span>
        </div>
    );

    if (error) return (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
        </div>
    );

    if (!summary) return null;

    const errData = summary.errors || summary.error || { '4xx': 0, '5xx': 0 };

    const requestChartData = [
        { name: 'Last 5m', value: summary.requests.last5m },
        { name: 'Last 1h', value: summary.requests.last1h },
        { name: 'Last 24h', value: summary.requests.last24h },
    ];

    const errorChartData = [
        { name: '4xx', value: errData['4xx'] },
        { name: '5xx', value: errData['5xx'] },
    ];

    const totalErrors = errData['4xx'] + errData['5xx'];

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-white">Metrics</h1>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">{id}</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard label="Last 5 min" value={summary.requests.last5m} sub="requests" />
                <StatCard label="Last 1 hour" value={summary.requests.last1h} sub="requests" />
                <StatCard label="Last 24 hours" value={summary.requests.last24h} sub="requests" />
                <StatCard label="Unique Visitors" value={summary.uniqueVisitors} sub="last 24h" />
            </div>

            {/* Request Volume Chart */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <SectionTitle>Request Volume</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={requestChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(val) => [val.toLocaleString(), 'Requests']} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={48} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Errors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <SectionTitle>Errors (Last 5 min)</SectionTitle>
                    <div className="space-y-4 mt-2">
                        <div className="flex items-center justify-between py-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                                <span className="text-sm text-gray-400">4xx Client Errors</span>
                            </div>
                            <span className="text-2xl font-bold text-amber-400">{errData['4xx']}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                                <span className="text-sm text-gray-400">5xx Server Errors</span>
                            </div>
                            <span className="text-2xl font-bold text-red-400">{errData['5xx']}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-500">Total</span>
                            <span className="text-lg font-semibold text-gray-300">{totalErrors.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <SectionTitle>Error Distribution</SectionTitle>
                    {totalErrors === 0 ? (
                        <div className="flex items-center justify-center h-40 text-gray-600 text-sm">No errors</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={errorChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                                    {errorChartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} formatter={(val) => val.toLocaleString()} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ color: '#9ca3af', fontSize: 13 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Countries + Endpoints */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <SectionTitle>Top Countries (24h)</SectionTitle>
                    {!summary.topCountries?.length ? (
                        <p className="text-sm text-gray-600">No data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {summary.topCountries.map(({ country, count }) => {
                                const max = summary.topCountries[0].count;
                                return (
                                    <div key={country}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-300">{country === 'unknown' ? '🌐 Unknown' : `🌍 ${country}`}</span>
                                            <span className="text-gray-500">{count.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-1.5">
                                            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <SectionTitle>Top Endpoints (24h)</SectionTitle>
                    {!summary.topEndpoints?.length ? (
                        <p className="text-sm text-gray-600">No data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {summary.topEndpoints.map(({ path, count }) => {
                                const max = summary.topEndpoints[0].count;
                                return (
                                    <div key={path}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-mono text-gray-300 truncate max-w-[180px]">{path}</span>
                                            <span className="text-gray-500 ml-2">{count.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-1.5">
                                            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}