'use client';

import { useState } from 'react';

interface ImportTweetsButtonProps {
  onImport?: () => void;
}

export function ImportTweetsButton({ onImport }: ImportTweetsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleImport = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      // Trigger backend to fetch latest tweets
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tweets/fetch-latest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'Anubhav06_2004', // Fetch from @Anubhav06_2004
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger tweet import');
      }

      const data = await response.json();
      setStatus('success');
      setMessage('Tweet import triggered! Check ingestion service logs for results.');
      
      // Call callback to refresh signals
      if (onImport) {
        setTimeout(() => {
          onImport();
        }, 2000); // Wait 2 seconds for processing
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to import tweets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleImport}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Importing...</span>
          </>
        ) : (
          <>
            <span>📥</span>
            <span>Import Recent Tweets</span>
          </>
        )}
      </button>
      
      {status !== 'idle' && (
        <div className={`absolute top-full mt-2 left-0 w-64 p-2 rounded text-xs ${
          status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}

