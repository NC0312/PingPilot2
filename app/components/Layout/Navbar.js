'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Home, Server, Bell, User, LogOut, Menu, X, BarChart4, Users, Settings } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleLogout = async () => {
        try {
            await logout();
            // Redirect will be handled by the auth context
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Navigation items based on user role
    const navItems = [
        { name: 'Dashboard', icon: <Home size={20} />, href: '/' },
        { name: 'Servers', icon: <Server size={20} />, href: '/servers' },
        { name: 'Alerts', icon: <Bell size={20} />, href: '/alerts' },
    ];

    // Admin only navigation items
    const adminItems = user && user.role === 'admin' ? [
        { name: 'Analytics', icon: <BarChart4 size={20} />, href: '/admin/analytics' },
        { name: 'Users', icon: <Users size={20} />, href: '/admin/users' },
    ] : [];

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-[#031D27] text-white h-screen fixed">
                <div className="p-5 border-b border-gray-700">
                    <div className="flex items-center">
                        {/* <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                            <Server size={24} />
                        </div> */}
                        {/* <h1 className="text-xl font-bold">Ping Pilott</h1> */}
                        <img src='/logo.png'/>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                            >
                                <span className="mr-3 text-gray-400">{item.icon}</span>
                                {item.name}
                            </a>
                        ))}

                        {adminItems.length > 0 && (
                            <>
                                <div className="pt-4 mt-4 border-t border-gray-700">
                                    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Admin
                                    </h3>
                                </div>
                                {adminItems.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                                    >
                                        <span className="mr-3 text-gray-400">{item.icon}</span>
                                        {item.name}
                                    </a>
                                ))}
                            </>
                        )}
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                                <User size={20} />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{user ? user.name || user.email : 'User'}</p>
                            <p className="text-xs text-gray-400">{user?.role || 'User'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="ml-auto text-gray-400 hover:text-white"
                            aria-label="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                    <a
                        href="/settings"
                        className="flex items-center mt-4 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md text-sm transition-colors"
                    >
                        <Settings size={16} className="mr-2" />
                        Settings
                    </a>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden bg-[#031D27] text-white fixed w-full top-0 z-10">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
                            <Server size={18} />
                        </div>
                        <h1 className="text-lg font-bold">Ping Pilot</h1>
                    </div>
                    <button
                        onClick={toggleMobileMenu}
                        className="p-2"
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-20 bg-[#031D27] pt-16">
                    <nav className="p-4">
                        {navItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span className="mr-3 text-gray-400">{item.icon}</span>
                                {item.name}
                            </a>
                        ))}

                        {adminItems.length > 0 && (
                            <>
                                <div className="pt-4 mt-4 border-t border-gray-700">
                                    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Admin
                                    </h3>
                                </div>
                                {adminItems.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <span className="mr-3 text-gray-400">{item.icon}</span>
                                        {item.name}
                                    </a>
                                ))}
                            </>
                        )}

                        <div className="pt-4 mt-4 border-t border-gray-700">
                            <a
                                href="/settings"
                                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span className="mr-3 text-gray-400"><Settings size={20} /></span>
                                Settings
                            </a>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                            >
                                <span className="mr-3 text-gray-400"><LogOut size={20} /></span>
                                Logout
                            </button>
                        </div>
                    </nav>
                </div>
            )}
        </>
    );
};

export default Navbar;