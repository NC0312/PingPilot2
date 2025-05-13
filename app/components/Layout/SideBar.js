'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Server, Bell, User, LogOut, Menu, X, BarChart4, Users, Settings } from 'lucide-react';

const SideBar = () => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Navigation items based on user role
    const navItems = [
        { name: 'Dashboard', icon: <Home size={20} />, href: '/dashboard' },
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
                        <img src='/logo.png' alt="Ping Pilott Logo" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-3 rounded-md transition-colors ${pathname === item.href
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                <span className={`mr-3 ${pathname === item.href ? 'text-white' : 'text-gray-400'}`}>
                                    {item.icon}
                                </span>
                                {item.name}
                            </Link>
                        ))}

                        {adminItems.length > 0 && (
                            <>
                                <div className="pt-4 mt-4 border-t border-gray-700">
                                    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Admin
                                    </h3>
                                </div>
                                {adminItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center px-4 py-3 rounded-md transition-colors ${pathname === item.href
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            }`}
                                    >
                                        <span className={`mr-3 ${pathname === item.href ? 'text-white' : 'text-gray-400'}`}>
                                            {item.icon}
                                        </span>
                                        {item.name}
                                    </Link>
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
                            <p className="text-sm font-medium">{user ? user.displayName || user.email : 'User'}</p>
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
                    <Link
                        href="/settings"
                        className={`flex items-center mt-4 px-4 py-2 rounded-md text-sm transition-colors ${pathname === '/settings'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                    >
                        <Settings size={16} className="mr-2" />
                        Settings
                    </Link>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden bg-[#031D27] text-white w-full top-0 z-10 sticky">
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
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-3 rounded-md transition-colors ${pathname === item.href
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span className={`mr-3 ${pathname === item.href ? 'text-white' : 'text-gray-400'}`}>
                                    {item.icon}
                                </span>
                                {item.name}
                            </Link>
                        ))}

                        {adminItems.length > 0 && (
                            <>
                                <div className="pt-4 mt-4 border-t border-gray-700">
                                    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Admin
                                    </h3>
                                </div>
                                {adminItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center px-4 py-3 rounded-md transition-colors ${pathname === item.href
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <span className={`mr-3 ${pathname === item.href ? 'text-white' : 'text-gray-400'}`}>
                                            {item.icon}
                                        </span>
                                        {item.name}
                                    </Link>
                                ))}
                            </>
                        )}

                        <div className="pt-4 mt-4 border-t border-gray-700">
                            <Link
                                href="/settings"
                                className={`flex items-center px-4 py-3 rounded-md transition-colors ${pathname === '/settings'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span className={`mr-3 ${pathname === '/settings' ? 'text-white' : 'text-gray-400'}`}>
                                    <Settings size={20} />
                                </span>
                                Settings
                            </Link>
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleLogout();
                                }}
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

export default SideBar;