'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Server, Settings, Plus, Clock, ArrowUpDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const Dashboard = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // In a real implementation, this would fetch from your API
    const fetchServers = async () => {
      try {
        const response = await fetch('/api/servers');
        const data = await response.json();
        setServers(data.servers || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching servers:', error);
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  const getFilteredServers = () => {
    if (filter === 'all') return servers;
    return servers.filter(server => server.status === filter);
  };

  // Conditional status badge component
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
          <h1 className="text-2xl font-bold">Server Dashboard</h1>
          <div className="flex space-x-3">
            <Link href="/servers/new">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center cursor-pointer">
                <Plus size={18} className="mr-2" />
                Add Server
              </button>
            </Link>
            <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded cursor-pointer">
              <Bell size={20} />
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded cursor-pointer">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex mb-6 space-x-2">
          <button
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-700'} cursor-pointer`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${filter === 'up' ? 'bg-green-600' : 'bg-gray-700'} cursor-pointer`}
            onClick={() => setFilter('up')}
          >
            Up
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${filter === 'down' ? 'bg-red-600' : 'bg-gray-700'} cursor-pointer`}
            onClick={() => setFilter('down')}
          >
            Down
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${filter === 'error' ? 'bg-yellow-600' : 'bg-gray-700'} cursor-pointer`}
            onClick={() => setFilter('error')}
          >
            Error
          </button>
        </div>

        {/* Server List */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : servers.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Server</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      Response Time
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Checked</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {getFilteredServers().map((server) => (
                  <tr key={server.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Server className="text-gray-400 mr-2" size={18} />
                        <span className="font-medium">{server.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a href={server.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center">
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
                          {new Date(server.lastChecked.seconds * 1000).toLocaleTimeString()}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-400 hover:text-blue-300 mr-3">
                        Details
                      </button>
                      <button className="text-red-400 hover:text-red-300">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <Server size={48} className="mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">No servers found</h3>
              <p className="text-gray-400 mb-6">Add your first server to start monitoring</p>
              <Link href="/servers/new">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded inline-flex items-center cursor-pointer">
                  <Plus size={18} className="mr-2" />
                  Add Server
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;