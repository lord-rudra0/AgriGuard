import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Calendar, AlertTriangle, CheckCircle, Trash2, Filter, X,
    History as HistoryIcon, ShieldCheck, Microscope, Layers, Maximize2, MoreVertical
} from 'lucide-react';

const History = () => {
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [edibilityFilter, setEdibilityFilter] = useState('all'); // all, edible, inedible
    const [healthFilter, setHealthFilter] = useState('all'); // all, healthy, diseased
    const [confidenceFilter, setConfidenceFilter] = useState('all'); // all, high, medium, low
    const [dateFilter, setDateFilter] = useState('all'); // all, 7days, 30days

    const fetchHistory = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/analyze/mushroom/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setHistory(response.data.history);
                setFilteredHistory(response.data.history);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
            setError('Failed to load scan history');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Apply Filters
    useEffect(() => {
        let result = history;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(item =>
                item.analysis?.type?.toLowerCase().includes(lowerTerm) ||
                item.analysis?.diseaseType?.toLowerCase().includes(lowerTerm) ||
                (item.analysis?.confidence && String(Math.round(item.analysis.confidence)).includes(lowerTerm))
            );
        }

        if (edibilityFilter !== 'all') {
            const isEdible = edibilityFilter === 'edible';
            result = result.filter(item => item.analysis.edible === isEdible);
        }

        if (healthFilter !== 'all') {
            const isDiseased = healthFilter === 'diseased';
            result = result.filter(item => item.analysis.disease === isDiseased);
        }

        if (confidenceFilter !== 'all') {
            result = result.filter(item => {
                const score = item.analysis.confidence;
                if (confidenceFilter === 'high') return score >= 90;
                if (confidenceFilter === 'medium') return score >= 70 && score < 90;
                if (confidenceFilter === 'low') return score < 70;
                return true;
            });
        }

        if (dateFilter !== 'all') {
            const now = new Date();
            const days = dateFilter === '7days' ? 7 : 30;
            const cutoff = new Date(now.setDate(now.getDate() - days));
            result = result.filter(item => new Date(item.createdAt) >= cutoff);
        }

        setFilteredHistory(result);
    }, [history, searchTerm, edibilityFilter, healthFilter, confidenceFilter, dateFilter]);

    const deleteScan = async (id, e) => {
        e.stopPropagation();
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
        <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full" />
                <div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-cyan-500/10 dark:bg-cyan-500/5 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/scan')}
                            className="p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700 shadow-sm hover:scale-110 transition-transform"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 uppercase tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                                    <HistoryIcon className="w-6 h-6 text-white" />
                                </div>
                                Scan History
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">Your archive of mushroom discoveries and analyses</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 dark:border-gray-700 shadow-sm">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{history.length} Scans Total</span>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="sticky top-4 z-20 space-y-4">
                    <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[1.5rem] p-3 shadow-xl border border-white/20 dark:border-gray-800 flex flex-col lg:flex-row gap-4 items-center">

                        {/* Search Bar */}
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search identification or disease..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-transparent focus:border-emerald-500/50 rounded-2xl text-sm font-bold text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400 placeholder:font-medium"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    <X className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                            )}
                        </div>

                        {/* Filter Scroll Container */}
                        <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto scrollbar-hide">
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden lg:block mx-2" />

                            <div className="flex p-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                {['all', 'edible', 'inedible'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setEdibilityFilter(filter)}
                                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${edibilityFilter === filter
                                            ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {filter === 'all' ? 'All Types' : filter}
                                    </button>
                                ))}
                            </div>

                            <div className="flex p-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                {['all', 'healthy', 'diseased'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setHealthFilter(filter)}
                                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${healthFilter === filter
                                            ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {filter === 'all' ? 'All Health' : filter}
                                    </button>
                                ))}
                            </div>

                            <div className="flex p-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                {['all', 'high', 'medium', 'low'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setConfidenceFilter(filter)}
                                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${confidenceFilter === filter
                                            ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {filter === 'all' ? 'Any Conf.' : filter}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-4 shadow-sm animate-pulse border border-white/20 dark:border-gray-800">
                                    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4" />
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-3/4 mb-3" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-[2rem] border border-dashed border-red-200 dark:border-red-900/30">
                            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">System Error</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">{error}</p>
                            <button onClick={fetchHistory} className="mt-6 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg">Retry Fetch</button>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-[2rem] border border-dashed border-gray-300 dark:border-gray-800 text-center px-6">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                <Microscope className="w-10 h-10 text-emerald-500 opacity-60" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Archives Empty</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-2 max-w-xs leading-relaxed">
                                {searchTerm ? "No scans matched your refined search parameters." : "You haven't conducted any mushroom analyses yet. Start a scan to begin your archive."}
                            </p>
                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={searchTerm ? () => { setSearchTerm(''); setEdibilityFilter('all'); setHealthFilter('all'); setConfidenceFilter('all'); setDateFilter('all'); } : () => navigate('/scan')}
                                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 hover:scale-105 active:scale-95 transition-all"
                                >
                                    {searchTerm ? "Reset Filters" : "Initialize Scan"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredHistory.map((scan) => (
                                <div
                                    key={scan._id}
                                    className="group relative bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[1.8rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-white/20 dark:border-gray-800"
                                >
                                    {/* Image Container */}
                                    <div className="relative h-52 bg-gray-100 dark:bg-gray-900 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent z-10 opacity-60" />
                                        <img
                                            src={`data:${scan.imageMimeType};base64,${scan.imageBase64}`}
                                            alt={scan.analysis.type}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />

                                        {/* Action Overlays */}
                                        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border ${scan.analysis.edible
                                                ? 'bg-emerald-500/80 text-white border-emerald-400/50'
                                                : 'bg-red-500/80 text-white border-red-400/50'
                                                }`}>
                                                {scan.analysis.edible ? 'Edible' : 'Toxic'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => deleteScan(scan._id, e)}
                                            className="absolute bottom-4 right-4 z-20 p-2.5 rounded-xl bg-white/10 hover:bg-red-500 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-xl border border-white/10"
                                            title="Delete Scan"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        {/* Badge for diseased */}
                                        {scan.analysis.disease && (
                                            <div className="absolute top-4 left-4 z-20">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">
                                                    {scan.analysis.type}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{format(new Date(scan.createdAt), 'MMM d, yyyy')}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-xl font-black ${getConfidenceColor(scan.analysis.confidence)}`}>
                                                    {Math.round(scan.analysis.confidence)}<span className="text-xs ml-0.5">%</span>
                                                </span>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Confidence</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {scan.analysis.disease ? (
                                                <div className="flex flex-col gap-1 p-3 rounded-2xl bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="text-[10px] font-black uppercase tracking-wider">Disease Detected</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-red-700 dark:text-red-300 leading-tight">
                                                        {scan.analysis.diseaseType || 'Unknown Condition'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
                                                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Pristine Condition</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Score Breakdown (Compact) */}
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">ID Precision</span>
                                                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${scan.analysis.typeConfidence}%` }} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Health Acc.</span>
                                                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-teal-500 h-full rounded-full" style={{ width: `${scan.analysis.diseaseTypeConfidence || 100}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination (Future placeholder or manual) */}
                <div className="py-10 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">End of Scout Archives</p>
                </div>
            </div>
        </div >
    );
};

export default History;
