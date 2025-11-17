'use client';

import { useState, useEffect } from 'react';

interface MonitoredUser {
  id: number;
  username: string;
  display_name: string | null;
  active: boolean;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function MonitoredUsers() {
  const [users, setUsers] = useState<MonitoredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/monitored-users`);
      if (!response.ok) {
        // Try to get error message from response
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch monitored users`);
      }
      const data = await response.json();
      // Ensure data is an array
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch monitored users. Please check if the backend is running.';
      setError(errorMessage);
      console.error('Error fetching monitored users:', err);
      // Set empty array on error so UI can still function
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setError('Please enter a username');
      return;
    }

    try {
      setAdding(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/monitored-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          display_name: newUsername.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add user');
      }

      setNewUsername('');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding user:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to remove @${username} from monitoring?`)) {
      return;
    }

    try {
      setDeleting(username);
      setError(null);
      const response = await fetch(`${API_URL}/api/monitored-users/${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove user');
      }

      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
      console.error('Error removing user:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (username: string, currentActive: boolean) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/monitored-users/${encodeURIComponent(username)}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle user status');
      }

      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
      console.error('Error toggling user:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Monitored Twitter Users</h1>
        <p className="text-gray-600 mt-1">Add or remove Twitter users to monitor for trading signals</p>
      </div>

      {/* Add User Form */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New User</h2>
        <form onSubmit={handleAddUser} className="flex gap-3">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter Twitter username (e.g., Crypto_Arki or @Crypto_Arki)"
            style={{ color: '#1f2937' }}
            className="glass-input flex-1 px-4 py-2 text-gray-800 placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={adding}
          />
          <button
            type="submit"
            disabled={adding || !newUsername.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {adding ? 'Adding...' : 'Add User'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-2">
          💡 Tip: You can enter the username with or without the @ symbol
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Users List */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Monitored Users ({users.length})
          </h2>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:text-gray-400"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No users are being monitored yet.</p>
            <p>Add a Twitter username above to start monitoring their tweets for trading signals.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 glass-card rounded-xl transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🐦</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">@{user.username}</span>
                        {!user.active && (
                          <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      {user.display_name && user.display_name !== user.username && (
                        <p className="text-sm text-gray-500">{user.display_name}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Added {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(user.username, user.active)}
                    className={`px-3 py-1 text-sm rounded ${
                      user.active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    {user.active ? '✓ Active' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.username)}
                    disabled={deleting === user.username}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                  >
                    {deleting === user.username ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How It Works</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Added users will be monitored for new tweets</li>
          <li>Tweets are analyzed using AI to extract trading signals</li>
          <li>Signals are displayed on the Dashboard and Signals pages</li>
          <li>You can activate/deactivate users without removing them</li>
          <li>Only active users are monitored by the ingestion service</li>
        </ul>
      </div>
    </div>
  );
}

