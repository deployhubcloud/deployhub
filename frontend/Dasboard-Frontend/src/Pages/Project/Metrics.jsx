import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/apiclient';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from 'recharts';

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
                setSummary(response.data.data); // Accessing the nested 'data'
            } catch (err) {
                setError(err.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading metrics...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                Error: {error}
            </div>
        );
    }

    if (!summary) return null;

    // Prepare data for request bar chart
    const requestChartData = [
        { name: 'Last 5 min', value: summary.requests.last5m },
        { name: 'Last 1 hour', value: summary.requests.last1h },
        { name: 'Last 24 hours', value: summary.requests.last24h },
    ];

    // Prepare data for error pie/doughnut chart
    const errorChartData = [
        { name: '4xx Errors', value: summary.error['4xx'] },
        { name: '5xx Errors', value: summary.error['5xx'] },
    ];

    const COLORS = ['#f59e0b', '#ef4444']; // amber for 4xx, red for 5xx

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">API Metrics</h1>
                <p className="text-gray-500 text-sm">Real‑time summary for endpoint ID: <span className="font-mono">{id}</span></p>
            </div>

            {/* Request statistics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {requestChartData.map((item) => (
                    <div
                        key={item.name}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition hover:shadow-md"
                    >
                        <p className="text-sm font-medium text-gray-500">{item.name}</p>
                        <p className="text-3xl font-semibold text-gray-900 mt-1">
                            {item.value.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            {/* Requests bar chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Request Volume Comparison</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={requestChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                        <YAxis tick={{ fill: '#6b7280' }} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            formatter={(val) => val.toLocaleString()}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Requests" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Errors section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Error counts cards */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Errors (Last 5 min)</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-medium">4xx Client Errors</span>
                            <span className="text-2xl font-bold text-amber-500">{summary.error['4xx']}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-medium">5xx Server Errors</span>
                            <span className="text-2xl font-bold text-red-500">{summary.error['5xx']}</span>
                        </div>
                    </div>
                </div>

                {/* Error distribution pie chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Error Distribution</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={errorChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {errorChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                formatter={(val) => val.toLocaleString()}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}