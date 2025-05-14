'use client';

import React, { useState, useEffect } from 'react';
import {
  Server,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ArrowUpDown,
  ExternalLink,
  User,
  Plus,
  Trash2,
  Info,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, getDocs, orderBy, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/config';
import { useAuth } from '@/app/context/AuthContext';

export default function AdminServersPage() {
  const [servers, setServers] = useState([]);
  const [filteredServers, setFilteredServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'uploadedAt', direction: 'desc' });
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [userMap, setUserMap] = useState({});

  const { user, isAdmin } = useAuth();

  const fetchServers = async () => {
    if (!user) return;

    setRefreshing(true);
    setError(null);

    try {
      const serversRef = collection(db, 'servers');
      let q;

      // Admin sees all servers, regular users only see their own
      if (isAdmin()) {
        q = query(serversRef, orderBy('uploadedAt', 'desc'));
      } else {
        q = query(serversRef, where('uploadedBy', '==', user.uid), orderBy('uploadedAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const serversList = [];

      querySnapshot.forEach((doc) => {
        serversList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // For admin view, build a map of user IDs to display names
      if (isAdmin()) {
        const userIds = [...new Set(serversList.map(server => server.uploadedBy))];
        const usersMap = {};

        for (const userId of userIds) {
          if (userId) {
            // Get user data from Firestore
            const usersRef = collection(db, 'users');
            const userQuery = query(usersRef, where('uid', '==', userId));
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
              const userData = userSnapshot.docs[0].data();
              usersMap[userId] = userData.displayName || userData.email || 'Unknown User';
            } else {
              usersMap[userId] = 'Unknown User';
            }
          }
        }

        setUserMap(usersMap);
      }

      setServers(serversList);
      applyFilters(serversList);

    } catch (err) {
      console.error('Error fetching servers:', err);
      setError('Failed to load servers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServers();

    // Set up refresh interval - every 60 seconds
    const intervalId = setInterval(() => {
      fetchServers();
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    applyFilters(servers);
  }, [searchTerm, statusFilter, sortConfig]);

  const applyFilters = (serversList) => {
    let result = [...serversList];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(server =>
        (server.name && server.name.toLowerCase().includes(searchLower)) ||
        (server.url && server.url.toLowerCase().includes(searchLower)) ||
        (server.description && server.description.toLowerCase().includes(searchLower)) ||
        (isAdmin() && server.uploadedBy && userMap[server.uploadedBy] &&
          userMap[server.uploadedBy].toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(server => server.status === statusFilter);
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Handle nested properties like lastChecked
        let aValue, bValue;

        if (sortConfig.key === 'lastChecked') {
          aValue = a.lastChecked ? new Date(a.lastChecked).getTime() : 0;
          bValue = b.lastChecked ? new Date(b.lastChecked).getTime() : 0;
        } else if (sortConfig.key === 'uploadedAt') {
          aValue = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
          bValue = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        } else if (sortConfig.key === 'uploadedBy' && isAdmin()) {
          aValue = userMap[a.uploadedBy] || '';
          bValue = userMap[b.uploadedBy] || '';
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        // Handle string comparison
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
        }
        if (typeof bValue === 'string') {
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredServers(result);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleCheckServer = async (serverId) => {
    try {
      const response = await fetch(`/api/servers/${serverId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid
        },
        body: JSON.stringify({ action: 'check' })
      });

      if (!response.ok) {
        throw new Error('Failed to check server');
      }

      const result = await response.json();

      // Update the server in the list
      setServers(prev =>
        prev.map(server =>
          server.id === serverId
            ? {
              ...server,
              status: result.result.status,
              responseTime: result.result.responseTime,
              error: result.result.error,
              lastChecked: result.result.lastChecked
            }
            : server
        )
      );

      // Also update filtered servers
      applyFilters(servers.map(server =>
        server.id === serverId
          ? {
            ...server,
            status: result.result.status,
            responseTime: result.result.responseTime,
            error: result.result.error,
            lastChecked: result.result.lastChecked
          }
          : server
      ));

    } catch (error) {
      console.error('Error checking server:', error);
    }
  };

  const handleDeleteServer = async (serverId) => {
    if (!serverId) return;

    try {
      const response = await fetch(`/api/servers/${serverId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete server');
      }

      // Remove the server from the lists
      setServers(prev => prev.filter(server => server.id !== serverId));
      setFilteredServers(prev => prev.filter(server => server.id !== serverId));
      setConfirmDelete(null);

    } catch (error) {
      console.error('Error deleting server:', error);
    }
  };

  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';

    let date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp.seconds) {
      // Firestore timestamp
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleString();
  };

  // Render status badge
  const StatusBadge = ({ status }) => {
    const getStatusConfig = () => {
      switch (status) {
        case 'up':
          return { color: 'bg-green-500', text: 'Up' };
        case 'down':
          return { color: 'bg-red-500', text: 'Down' };
        case 'error':
          return { color: 'bg-yellow-500', text: 'Error' };
        default:
          return { color: 'bg-gray-500', text: 'Unknown' };
      }
    };

    const config = getStatusConfig();

    return (
      <span className={`${config.color} text-white text-xs font-semibold px-2 py-1 rounded-full`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#031D27] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">{isAdmin() ? 'All Servers' : 'My Servers'}</h1>
          <div className="flex space-x-3">
            <Link href="/servers/new">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center">
                <Plus size={18} className="mr-2" />
                Add Server
              </button>
            </Link>
            <button
              onClick={() => fetchServers()}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded"
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search servers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg pl-10 p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${statusFilter === 'up' ? 'bg-green-600' : 'bg-gray-700'}`}
              onClick={() => setStatusFilter('up')}
            >
              Up
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${statusFilter === 'down' ? 'bg-red-600' : 'bg-gray-700'}`}
              onClick={() => setStatusFilter('down')}
            >
              Down
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${statusFilter === 'error' ? 'bg-yellow-600' : 'bg-gray-700'}`}
              onClick={() => setStatusFilter('error')}
            >
              Error
            </button>
          </div>
        </div>

        {/* Server List */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredServers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Server
                        {sortConfig.key === 'name' && (
                          <ArrowUpDown size={14} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('url')}
                    >
                      <div className="flex items-center">
                        URL
                        {sortConfig.key === 'url' && (
                          <ArrowUpDown size={14} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortConfig.key === 'status' && (
                          <ArrowUpDown size={14} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('responseTime')}
                    >
                      <div className="flex items-center">
                        Response Time
                        {sortConfig.key === 'responseTime' && (
                          <ArrowUpDown size={14} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('lastChecked')}
                    >
                      <div className="flex items-center">
                        Last Checked
                        {sortConfig.key === 'lastChecked' && (
                          <ArrowUpDown size={14} className="ml-1" />
                        )}
                      </div>
                    </th>
                    {isAdmin() && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('uploadedBy')}
                      >
                        <div className="flex items-center">
                          Added By
                          {sortConfig.key === 'uploadedBy' && (
                            <ArrowUpDown size={14} className="ml-1" />
                          )}
                        </div>
                      </th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredServers.map((server) => (
                    <tr key={server.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Server className="text-gray-400 mr-2" size={18} />
                          <div>
                            <div className="font-medium">{server.name}</div>
                            {server.description && (
                              <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                {server.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={server.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline flex items-center"
                        >
                          {server.url.replace(/^https?:\/\//, '')}
                          <ExternalLink size={14} className="ml-1" />
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={server.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {server.responseTime ? `${server.responseTime} ms` : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {server.lastChecked ? (
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1 text-gray-400" />
                            {formatTimestamp(server.lastChecked)}
                          </div>
                        ) : '—'}
                      </td>
                      {isAdmin() && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <User size={14} className="mr-1 text-gray-400" />
                            {userMap[server.uploadedBy] || 'Unknown User'}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleCheckServer(server.id)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                          title="Check Now"
                        >
                          Check
                        </button>
                        <Link
                          href={`/servers/${server.id}/settings`}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          Details
                        </Link>
                        {confirmDelete === server.id ? (
                          <>
                            <button
                              onClick={() => handleDeleteServer(server.id)}
                              className="text-red-500 hover:text-red-400 mr-1"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-gray-400 hover:text-gray-300"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(server.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Server size={48} className="mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">No servers found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first server to start monitoring'}
              </p>
              <Link href="/servers/new">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded inline-flex items-center">
                  <Plus size={18} className="mr-2" />
                  Add Server
                </button>
              </Link>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 bg-red-900/30 border border-red-600/50 rounded-lg p-4 text-center">
            <AlertTriangle size={32} className="mx-auto text-red-500 mb-2" />
            <h3 className="text-xl font-medium text-white mb-2">Error</h3>
            <p className="text-red-200">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}