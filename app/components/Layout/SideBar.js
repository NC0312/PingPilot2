'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    Server,
    Bell,
    User,
    LogOut,
    Menu,
    X,
    BarChart4,
    Users,
    Settings,
    ShieldCheck,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';

const SideBar = () => {
    const { user, logout, isAdmin } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Handle escape key to close mobile menu
    useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === 'Escape' && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscKey);
        return () => window.removeEventListener('keydown', handleEscKey);
    }, [isMobileMenuOpen]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
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
        { name: 'Admin Overview', icon: <ShieldCheck size={20} />, href: '/admin' },
        { name: 'Analytics', icon: <BarChart4 size={20} />, href: '/admin/analytics' },
        { name: 'Users', icon: <Users size={20} />, href: '/admin/users' },
    ];

    // Determine which navigation items to show based on role
    const navItems = baseNavItems;
    const adminItems = user && user.role === 'admin' ? adminNavItems : [];

    // Animation variants
    const sidebarVariants = {
        expanded: { width: '256px' },
        collapsed: { width: '72px' }
    };

    const fadeInOut = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } }
    };

    const mobileMenuVariants = {
        closed: { x: '100%', opacity: 0 },
        open: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } }
    };

    // Render a navigation link with active state handling
    const NavLink = ({ item, mobile = false }) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
            <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-md transition-all duration-200 ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
                    }`}
                onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
            >
                <motion.span
                    className={`${isActive ? 'text-white' : 'text-gray-400'} ${!isCollapsed || mobile ? 'mr-3' : 'mx-auto'}`}
                    whileHover={{ scale: 1.1 }}
                >
                    {item.icon}
                </motion.span>

                {(!isCollapsed || mobile) && (
                    <span className="whitespace-nowrap">{item.name}</span>
                )}

                {isCollapsed && !mobile && hoveredItem === item.name && (
                    <motion.div
                        className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded z-50 whitespace-nowrap shadow-lg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        {item.name}
                    </motion.div>
                )}
            </Link>
        );
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.div
                className="hidden md:flex flex-col bg-[#031D27] text-white h-screen fixed shadow-xl z-20"
                variants={sidebarVariants}
                animate={isCollapsed ? 'collapsed' : 'expanded'}
                initial="expanded"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className={`p-5 border-b border-gray-700 flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center`}>
                    {!isCollapsed && (
                        <div className="flex items-center">
                            <motion.img
                                src='/logo.png'
                                alt="Ping Pilot Logo"
                                className="h-16 w-40"
                                // whileHover={{ rotate: 10, scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                            />
                        </div>
                    )}

                    {isCollapsed && (
                        <motion.img
                            src='/favicon.png'
                            alt="Ping Pilot Logo"
                            className="h-8"
                            whileHover={{ rotate: 10, scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        />
                    )}

                    <motion.button
                        onClick={toggleSidebar}
                        className={`rounded-full p-1 hover:bg-gray-700 ${isCollapsed ? 'ml-0' : 'ml-2'}`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </motion.button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <motion.nav className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink key={item.name} item={item} />
                        ))}

                        {adminItems.length > 0 && (
                            <>
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            className="pt-4 mt-4 border-t border-gray-700"
                                            variants={fadeInOut}
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                        >
                                            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                Admin
                                            </h3>
                                        </motion.div>
                                    )}
                                    {isCollapsed && (
                                        <div className="pt-4 mt-4 border-t border-gray-700" />
                                    )}
                                </AnimatePresence>

                                {adminItems.map((item) => (
                                    <NavLink key={item.name} item={item} />
                                ))}
                            </>
                        )}
                    </motion.nav>
                </div>

                <div className={`p-4 border-t border-gray-700 ${isCollapsed ? 'items-center justify-center' : ''}`}>
                    {!isCollapsed ? (
                        <div className="flex items-center">
                            <motion.div
                                className="flex-shrink-0"
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </div>
                            </motion.div>
                            <div className="ml-3 truncate">
                                <p className="text-sm font-medium truncate">{user ? user.displayName || user.email : 'User'}</p>
                                <p className="text-xs text-gray-400 capitalize">{user?.role || 'User'}</p>
                            </div>
                            <motion.button
                                onClick={handleLogout}
                                className="ml-auto text-gray-400 hover:text-white"
                                aria-label="Logout"
                                whileHover={{ scale: 1.1, color: '#f56565' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <LogOut size={20} />
                            </motion.button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <motion.div
                                className="flex-shrink-0"
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </div>
                            </motion.div>
                            <motion.button
                                onClick={handleLogout}
                                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
                                aria-label="Logout"
                                whileHover={{ scale: 1.1, color: '#f56565' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <LogOut size={18} />
                            </motion.button>
                        </div>
                    )}

                    {!isCollapsed && (
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
                    )}

                    {isCollapsed && (
                        <div
                            className="mt-4 flex justify-center"
                            onMouseEnter={() => setHoveredItem('settings')}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <Link
                                href="/settings"
                                className={`p-2 rounded-md transition-colors ${pathname === '/settings'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                <Settings size={18} />

                                {hoveredItem === 'settings' && (
                                    <motion.div
                                        className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded z-50 whitespace-nowrap shadow-lg"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        Settings
                                    </motion.div>
                                )}
                            </Link>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Mobile Header */}
            <div className="md:hidden bg-[#031D27] text-white w-full top-0 z-10 sticky shadow-md">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                        <motion.div
                            className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Server size={18} />
                        </motion.div>
                        <h1 className="text-lg font-bold">Ping Pilot</h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        {user?.role === 'admin' && (
                            <motion.span
                                className="bg-purple-600 px-2 py-0.5 text-xs rounded-full font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                Admin
                            </motion.span>
                        )}
                        <motion.button
                            onClick={toggleMobileMenu}
                            className="p-1 rounded-full hover:bg-gray-700/70"
                            aria-label="Toggle mobile menu"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu - with overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            className="md:hidden fixed inset-0 bg-black/50 z-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        <motion.div
                            className="md:hidden fixed right-0 top-0 bottom-0 w-3/4 max-w-xs bg-[#031D27] z-30 pt-16 shadow-xl"
                            variants={mobileMenuVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                        >
                            <div className="p-4 mb-6 flex items-center">
                                <motion.div
                                    className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </motion.div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-white truncate">{user ? user.displayName || user.email : 'User'}</p>
                                    <p className="text-xs text-gray-400 capitalize">{user?.role || 'User'}</p>
                                </div>
                            </div>

                            <motion.nav
                                className="p-4 space-y-1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, staggerChildren: 0.05 }}
                            >
                                {navItems.map((item, index) => (
                                    <motion.div
                                        key={item.name}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <NavLink item={item} mobile={true} />
                                    </motion.div>
                                ))}

                                {adminItems.length > 0 && (
                                    <>
                                        <motion.div
                                            className="pt-4 mt-4 border-t border-gray-700"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                Admin
                                            </h3>
                                        </motion.div>
                                        {adminItems.map((item, index) => (
                                            <motion.div
                                                key={item.name}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: (navItems.length + index) * 0.05 }}
                                            >
                                                <NavLink item={item} mobile={true} />
                                            </motion.div>
                                        ))}
                                    </>
                                )}

                                <motion.div
                                    className="pt-4 mt-4 border-t border-gray-700"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Link
                                        href="/settings"
                                        className={`flex items-center px-4 py-3 rounded-md transition-colors ${pathname === '/settings'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <motion.span
                                            className={`mr-3 ${pathname === '/settings' ? 'text-white' : 'text-gray-400'}`}
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <Settings size={20} />
                                        </motion.span>
                                        Settings
                                    </Link>
                                    <motion.button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                                        whileHover={{ backgroundColor: '#f56565', color: 'white' }}
                                    >
                                        <motion.span
                                            className="mr-3 text-gray-400"
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <LogOut size={20} />
                                        </motion.span>
                                        Logout
                                    </motion.button>
                                </motion.div>
                            </motion.nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default SideBar;