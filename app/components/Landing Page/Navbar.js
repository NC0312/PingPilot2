'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const Navbar = () => {
    const [isMobile, setIsMobile] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Check for mobile viewport on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        // Initial check
        checkMobile()

        // Add resize listener
        window.addEventListener('resize', checkMobile)

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('resize', checkMobile)
        }
    }, [])

    // Scroll to section function
    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId)
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' })
            setMobileMenuOpen(false)
        }
    }

    // Nav links data with section IDs
    const navLinks = [
        { name: "Features", href: "#features", sectionId: "features" },
        { name: "Pricing", href: "#pricing", sectionId: "pricing" },
    ]

    return (
        <>
            <nav className='flex justify-between items-center border-b border-gray-700 px-4 md:px-6 py-4 md:py-6 sticky top-0 bg-[#031D27] z-40'>
                <motion.div
                    className='flex items-center gap-2'
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="relative h-10 w-10 md:h-12 md:w-12">
                        <Image
                            src='/favicon.png'
                            alt="Ping Pilott Logo"
                            fill
                            sizes="(max-width: 768px) 40px, 48px"
                            priority
                        />
                    </div>
                    <h1 className='font-mono text-xl md:text-2xl font-bold text-gray-300'>Ping Pilott</h1>
                </motion.div>

                {/* Mobile menu button */}
                {isMobile && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className='text-gray-300 focus:outline-none'
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="w-6 h-6"
                            aria-hidden="true"
                        >
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </motion.button>
                )}

                {/* Desktop menu */}
                {!isMobile && (
                    <motion.div
                        className='flex gap-4'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {navLinks.map((link, index) => (
                            <motion.div key={index}>
                                <a
                                    href={link.href}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        scrollToSection(link.sectionId)
                                    }}
                                >
                                    <motion.span
                                        whileHover={{ scale: 1.05, color: "#ffffff" }}
                                        whileTap={{ scale: 0.95 }}
                                        className='px-4 py-2 font-mono text-gray-300 inline-block cursor-pointer'
                                    >
                                        {link.name}
                                    </motion.span>
                                </a>
                            </motion.div>
                        ))}
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "#2563eb" }}
                            whileTap={{ scale: 0.95 }}
                            className='px-4 py-2 font-mono bg-blue-600 text-white rounded-lg'
                        >
                            Sign In
                        </motion.button>
                    </motion.div>
                )}
            </nav>

            {/* Mobile menu dropdown */}
            <AnimatePresence>
                {isMobile && mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className='flex flex-col bg-gray-800 border-b border-gray-700 z-30'
                    >
                        {navLinks.map((link, index) => (
                            <a
                                key={index}
                                href={link.href}
                                onClick={(e) => {
                                    e.preventDefault()
                                    scrollToSection(link.sectionId)
                                }}
                                className="block"
                            >
                                <motion.div
                                    whileTap={{ scale: 0.95 }}
                                    className='px-4 py-3 font-mono text-gray-300 text-left border-b border-gray-700 cursor-pointer'
                                >
                                    {link.name}
                                </motion.div>
                            </a>
                        ))}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className='px-4 py-3 font-mono text-white bg-blue-600 m-4 rounded-lg text-center'
                        >
                            Sign In
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default Navbar