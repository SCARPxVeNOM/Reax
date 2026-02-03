'use client';

import React, { useState, useEffect } from 'react';
import { strategyVersionApi } from '@/lib/api';

interface StrategyVersion {
    strategy_id: number;
    version: number;
    strategy_snapshot: any;
    changed_at: number;
    change_reason?: string;
}

interface StrategyVersionHistoryProps {
    strategyId: number;
    onVersionSelect?: (version: StrategyVersion) => void;
}

export const StrategyVersionHistory: React.FC<StrategyVersionHistoryProps> = ({
    strategyId,
    onVersionSelect,
}) => {
    const [versions, setVersions] = useState<StrategyVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

    useEffect(() => {
        const fetchVersions = async () => {
            setLoading(true);
            try {
                const data = await strategyVersionApi.getVersions(strategyId);
                setVersions(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch strategy versions:', error);
                setVersions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchVersions();
    }, [strategyId]);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp / 1000).toLocaleString();
    };

    if (loading) {
        return (
            <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (versions.length === 0) {
        return (
            <div className="bg-gray-800/50 rounded-xl p-4 text-center text-gray-400">
                <p>No version history available</p>
                <p className="text-sm mt-1">Updates will appear here after changes</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-600">
                <h4 className="text-white font-medium flex items-center gap-2">
                    <span>📜</span> Version History
                    <span className="text-gray-400 text-sm">({versions.length} versions)</span>
                </h4>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {versions.map((version) => (
                    <div
                        key={version.version}
                        className="border-b border-gray-700/50 last:border-0"
                    >
                        <button
                            onClick={() => setExpandedVersion(
                                expandedVersion === version.version ? null : version.version
                            )}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 font-mono text-sm">
                                    v{version.version}
                                </span>
                                <div className="text-left">
                                    <p className="text-gray-300 text-sm">
                                        {version.change_reason || 'Strategy updated'}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        {formatDate(version.changed_at)}
                                    </p>
                                </div>
                            </div>
                            <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${expandedVersion === version.version ? 'rotate-180' : ''
                                    }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {expandedVersion === version.version && (
                            <div className="px-4 pb-4 space-y-3">
                                <pre className="bg-gray-900 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto">
                                    {JSON.stringify(version.strategy_snapshot, null, 2)}
                                </pre>
                                <button
                                    onClick={() => onVersionSelect?.(version)}
                                    className="w-full py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors"
                                >
                                    Restore This Version
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StrategyVersionHistory;
