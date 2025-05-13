'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Server, Bell, User, LogOut, Menu, X, BarChart4, Users, Settings, ShieldCheck } from 'lucide-react';

const SideBar = () => {
    const { user, logout, isAdmin } = useAuth();
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

    // Base navigation items for all users
    const baseNavItems = [
        { name: 'Dashboard', icon: <Home size={20} />, href: '/dashboard' },
        { name: 'Servers', icon: <Server size={20} />, href: '/servers' },
    ];

    // Admin only navigation items
    const adminNavItems = [
        { name: 'Admin', icon: <ShieldCheck size={20} />, href: '/admin' },
        { name: 'Analytics', icon: <BarChart4 size={20} />, href: '/admin/analytics' },
        { name: 'Users', icon: <Users size={20} />, href: '/admin/users' },
    ];

    // Determine which navigation items to show based on role
    const navItems = baseNavItems;
    const adminItems = user && user.role === 'admin' ? adminNavItems : [];

    // Render a navigation link with active state handling
    const NavLink = ({ item, mobile = false }) => (
        <Link
            href={item.href}
            className={`flex items-center px-4 py-3 rounded-md transition-colors ${pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
        >
            <span className={`mr-3 ${pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'text-white'
                    : 'text-gray-400'
                }`}>
                {item.icon}
            </span>
            {item.name}
        </Link>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-[#031D27] text-white h-screen fixed">
                <div className="p-5 border-b border-gray-700">
                    <div className="flex items-center">
                        <img src='/logo.png' alt="Ping Pilot Logo" className="h-8" />
                        <span className="ml-2 text-lg font-bold">Ping Pilot</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink key={item.name} item={item} />
                        ))}

                        {adminItems.length > 0 && (
                            <>
                                <div className="pt-4 mt-4 border-t border-gray-700">
                                    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Admin
                                    </h3>
                                </div>
                                {adminItems.map((item) => (
                                    <NavLink key={item.name} item={item} />
                                ))}
                            </>
                        )}
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="h-10 w-10 rounded-full" />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{user ? user.displayName || user.email : 'User'}</p>
                            <p className="text-xs text-gray-400 capitalize">{user?.role || 'User'}</p>
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
                    <div className="flex items-center space-x-2">
                        {user?.role === 'admin' && (
                            <span className="bg-purple-600 px-2 py-0.5 text-xs rounded-full font-medium">
                                Admin
                            </span>
                        )}
                        <button
                            onClick={toggleMobileMenu}
                            className="p-2"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-20 bg-[#031D27] pt-16">
                    <div className="p-4 mb-6 flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="h-10 w-10 rounded-full" />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">{user ? user.displayName || user.email : 'User'}</p>
                            <p className="text-xs text-gray-400 capitalize">{user?.role || 'User'}</p>
                        </div>
                    </div>

                    <nav className="p-4">
                        {navItems.map((item) => (
                            <NavLink key={item.name} item={item} mobile={true} />
                        ))}

                        {adminItems.length > 0 && (
                            <>
                                <div className="pt-4 mt-4 border-t border-gray-700">
                                    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Admin
                                    </h3>
                                </div>
                                {adminItems.map((item) => (
                                    <NavLink key={item.name} item={item} mobile={true} />
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