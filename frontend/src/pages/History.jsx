import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Search, Calendar, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { theme } = useTheme();

    const fetchHistory = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/analyze/mushroom/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setHistory(response.data.history);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
            setError('Failed to load scan history');
        } finally {
            setLoading(false);
        }
    }, []); // No dependencies needed as it only uses stable functions and localStorage

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]); // fetchHistory is now a dependency because it's wrapped in useCallback

    const deleteScan = async (id, e) => {
        e.stopPropagation(); // Prevent card click
        if (!window.confirm('Are you sure you want to delete this scan?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/analyze/mushroom/history/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setHistory(prev => prev.filter(item => item._id !== id));
            }
        } catch (err) {
            console.error('Failed to delete scan:', err);
            alert('Failed to delete scan');
        }
    };

    const getConfidenceColor = (score) => {
        if (score >= 90) return 'text-emerald-500';
        if (score >= 70) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/scan')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scan History</h1>
                        <p className="text-gray-500 dark:text-gray-400">View your recent mushroom analysis results</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm animate-pulse">
                            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Error loading history</h3>
                    <p className="text-gray-500 dark:text-gray-400">{error}</p>
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No scans yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Start scanning mushrooms to build your history</p>
                    <button
                        onClick={() => navigate('/scan')}
                        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Start Scanning
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((scan) => (
                        <div key={scan._id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
                            <div className="relative h-56 bg-gray-100 dark:bg-gray-900 group">
                                <img
                                    src={`data:${scan.imageMimeType};base64,${scan.imageBase64}`}
                                    alt={scan.analysis.type}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute top-3 right-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm ${scan.analysis.edible
                                        ? 'bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30'
                                        : 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30'
                                        }`}>
                                        {scan.analysis.edible ? 'Edible' : 'Inedible'}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => deleteScan(scan._id, e)}
                                    className="absolute top-3 left-3 p-2 rounded-full bg-black/40 hover:bg-red-500 text-white backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Scan"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                                        {scan.analysis.type}
                                    </h3>
                                    <div className="flex items-center gap-1 text-sm font-medium">
                                        <span className={getConfidenceColor(scan.analysis.confidence)}>
                                            {Math.round(scan.analysis.confidence)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>{format(new Date(scan.createdAt), 'MMM d, yyyy • h:mm a')}</span>
                                    </div>

                                    {scan.analysis.disease && (
                                        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">
                                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span>
                                                <span className="font-semibold">Disease Detected:</span> {scan.analysis.diseaseType || 'Unknown Condition'}
                                            </span>
                                        </div>
                                    )}

                                    {!scan.analysis.disease && (
                                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 p-2 rounded-lg">
                                            <CheckCircle className="w-4 h-4 shrink-0" />
                                            <span className="font-medium">Healthy Condition</span>
                                        </div>
                                    )}
                                </div>

                                {/* Granular Scores (Mini) */}
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl">
                                    <div className="flex justify-between">
                                        <span>ID Confidence</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{scan.analysis.typeConfidence}%</span>
                                    </div>
                                    {scan.analysis.disease && (
                                        <div className="flex justify-between">
                                            <span>Diagnosis</span>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{scan.analysis.diseaseTypeConfidence}%</span>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            )
            }
        </div >
    );
};

export default History;
