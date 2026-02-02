'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Navbar from './components/Landing Page/Navbar'

// Lazy load PricingCard for better performance
const PricingCard = dynamic(() => import('./components/Landing Page/PricingCard'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-xl h-96"></div>,
  ssr: true
});

const LandingPage = () => {
  const [showPricingPopup, setShowPricingPopup] = useState(false)

  // Animation variants for reuse
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3
      }
    }
  }

  // State for billing cycle
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'

  // Pricing plans configuration
  const getPricingPlans = () => {
    const isMonthly = billingCycle === 'monthly';
    return [
      {
        title: "FREE",
        price: "$0",
        period: "2-day trial",
        description: "Perfect for testing our platform.",
        features: [
          { included: true, text: "1 URL monitoring" },
          { included: true, text: "5-minute check interval" },
          { included: true, text: "Basic email alerts" },
          { included: false, text: "Multiple URLs" }
        ],
        buttonText: "Start Free",
        buttonAction: () => setShowPricingPopup(true),
        buttonStyle: "gray",
        tag: null
      },
      {
        title: "STARTER",
        price: isMonthly ? "$10" : "$100",
        period: isMonthly ? "per month" : "per year (save 17%)",
        description: "For individual developers.",
        features: [
          { included: true, text: "10 URL monitoring" },
          { included: true, text: "3-minute check interval" },
          { included: true, text: "Email alerts" },
          { included: true, text: "Historical reporting" }
        ],
        buttonText: `Choose Starter ${isMonthly ? 'Monthly' : 'Yearly'}`,
        buttonStyle: "gray",
        tag: null
      },
      {
        title: "PRO",
        price: isMonthly ? "$29" : "$290",
        period: isMonthly ? "per month" : "per year (save 17%)",
        description: "For growing websites.",
        features: [
          { included: true, text: "30 URL monitoring" },
          { included: true, text: "1-minute check interval" },
          { included: true, text: "Email & SMS alerts" },
          { included: true, text: "Priority support" }
        ],
        buttonText: `Choose Pro ${isMonthly ? 'Monthly' : 'Yearly'}`,
        buttonStyle: "blue",
        tag: { text: "POPULAR", color: "blue" }
      },
      {
        title: "BUSINESS",
        price: isMonthly ? "$79" : "$790",
        period: isMonthly ? "per month" : "per year (save 17%)",
        description: "For SaaS & Enterprise.",
        features: [
          { included: true, text: "100 URL monitoring" },
          { included: true, text: "1-minute check interval" },
          { included: true, text: "Webhook integrations" },
          { included: true, text: "API Access" }
        ],
        buttonText: `Choose Business ${isMonthly ? 'Monthly' : 'Yearly'}`,
        buttonStyle: "gray",
        tag: { text: "BEST VALUE", color: "green" }
      }
    ];
  };

  const pricingPlans = getPricingPlans();

  return (
    <div className='flex flex-col min-h-screen bg-[#031D27] text-gray-400'>
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className='flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-8 md:py-16 border-b border-gray-700 overflow-hidden'
      >
        <motion.div
          variants={fadeInUp}
          className='md:w-1/2 mb-8 md:mb-0'
        >
          <motion.h1
            variants={fadeInUp}
            className='font-mono font-bold text-3xl sm:text-4xl md:text-5xl text-gray-300 mb-4'
          >
            Stay Ahead of <motion.span
              className='text-blue-400'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Downtime
            </motion.span>
          </motion.h1>
          <motion.h2
            variants={fadeInUp}
            className='font-mono font-bold text-xl sm:text-2xl md:text-3xl mb-6 text-gray-300'
          >
            Monitor Your Servers in Real-Time, Anywhere!
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className='font-mono text-base md:text-lg text-gray-400 mb-8 max-w-lg'
          >
            Track website and server uptime with customizable alerts, smart scheduling, and real-time dashboards — all in one powerful monitoring platform.
          </motion.p>
          <motion.div
            variants={staggerContainer}
            className='flex flex-wrap gap-4'
          >
            <motion.button
              variants={fadeInUp}
              whileHover={{ scale: 1.05, backgroundColor: "#2563eb" }}
              whileTap={{ scale: 0.95 }}
              className='px-6 py-3 font-mono text-white bg-blue-600 rounded-xl transition-colors'
            >
              Start Free Trial Today
            </motion.button>
          </motion.div>
        </motion.div>
        <motion.div
          className='md:w-1/2 flex justify-center'
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="relative w-full h-80 md:h-96">
            <Image
              src='/server-monitoring-dashboard.jpeg'
              alt="Server monitoring dashboard"
              className='rounded-lg shadow-lg object-contain'
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Pricing Section */}
      <motion.div
        id='pricing'
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className='py-8 md:py-16 px-4 md:px-8'
      >
        <motion.h2
          variants={fadeInUp}
          className='font-mono text-2xl md:text-3xl font-semibold text-gray-300 text-center mb-8 md:mb-12'
        >
          Choose a Plan That Fits Your Monitoring Needs
        </motion.h2>

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-800 p-1 rounded-xl flex items-center relative">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`relative z-10 px-6 py-2 rounded-lg font-mono transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`relative z-10 px-6 py-2 rounded-lg font-mono transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Yearly
            </button>
            <motion.div
              className="absolute top-1 bottom-1 bg-blue-600 rounded-lg"
              initial={false}
              animate={{
                x: billingCycle === 'monthly' ? 4 : '100%',
                left: billingCycle === 'monthly' ? 0 : -4,
                width: '50%'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto'
        >
          {pricingPlans.map((plan, index) => (
            <PricingCard key={index} plan={plan} cardVariants={containerVariants} />
          ))}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className='text-center mt-8'
        >
          <p className='font-mono text-gray-400'>
            Need a custom enterprise solution? We've got you covered.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='mt-4 px-6 py-2 font-mono text-gray-300 border border-gray-600 rounded-lg hover:border-gray-400 transition-colors'
          >
            Contact Sales
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Pricing Popup */}
      <AnimatePresence>
        {showPricingPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/75 bg-opacity-75 flex items-center justify-center z-50 p-4'
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowPricingPopup(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", damping: 25 }}
              className='bg-gray-800 rounded-xl p-6 max-w-md w-full'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex justify-between items-center mb-4'>
                <h3 className='font-mono text-xl font-bold text-gray-300'>Upgrade Required</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPricingPopup(false)}
                  className='text-gray-400 hover:text-white'
                >
                  ✕
                </motion.button>
              </div>
              <p className='font-mono text-gray-400 mb-6'>
                To monitor additional URLs, you'll need to upgrade to one of our premium plans.
              </p>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className='space-y-4'
              >
                <motion.button
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='w-full px-4 py-3 font-mono text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Monthly Plan - $10/month
                </motion.button>
                <motion.button
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='w-full px-4 py-3 font-mono text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors'
                >
                  Half-Yearly Plan - $55/6 months
                </motion.button>
                <motion.button
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='w-full px-4 py-3 font-mono text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors'
                >
                  Yearly Plan - $105/year
                </motion.button>
              </motion.div>
              <motion.button
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowPricingPopup(false)}
                className='w-full mt-4 px-4 py-2 font-mono text-gray-400 hover:text-gray-300'
              >
                Continue with Free Plan
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Features Section - Brief overview */}
      <motion.div
        id='features'
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className='bg-gray-900 py-8 md:py-16 px-4 md:px-8 border-t border-gray-700'
      >
        <motion.h2
          variants={fadeInUp}
          className='font-mono text-2xl md:text-3xl font-semibold text-gray-300 text-center mb-8 md:mb-12'
        >
          Why Choose Ping Pilott?
        </motion.h2>

        <motion.div
          variants={staggerContainer}
          className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto'
        >
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -5 }}
            className='text-center'
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className='bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6'
            >
              <span className='text-2xl'>⚡</span>
            </motion.div>
            <h3 className='font-mono text-xl font-bold text-gray-300 mb-2'>Real-Time Alerts</h3>
            <p className='font-mono text-gray-400'>Get instant notifications when your servers go down, before your customers notice.</p>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -5 }}
            className='text-center'
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className='bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6'
            >
              <span className='text-2xl'>📊</span>
            </motion.div>
            <h3 className='font-mono text-xl font-bold text-gray-300 mb-2'>Detailed Analytics</h3>
            <p className='font-mono text-gray-400'>Track performance metrics and identify patterns to prevent future downtime.</p>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -5 }}
            className='text-center sm:col-span-2 md:col-span-1 sm:mx-auto'
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className='bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6'
            >
              <span className='text-2xl'>🔒</span>
            </motion.div>
            <h3 className='font-mono text-xl font-bold text-gray-300 mb-2'>Secure & Reliable</h3>
            <p className='font-mono text-gray-400'>Our infrastructure is built for 99.9% uptime, because we monitor ourselves too.</p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className='bg-[#031D27] text-gray-400 border-t border-gray-700 py-8 md:py-12 px-4 md:px-8 mt-auto'
      >
        <div className='max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8'>
          <motion.div variants={fadeInUp}>
            <div className='flex items-center gap-2 mb-4'>
              <div className="relative h-9 w-9">
                <Image
                  src='/favicon.png'
                  alt="Ping Pilott Logo"
                  fill
                  sizes="36px"
                />
              </div>
              <h3 className='font-mono text-xl font-bold text-gray-300'>Ping Pilott</h3>
            </div>
            <p className='font-mono text-sm text-gray-500'>
              Your reliable partner in server monitoring and uptime tracking since 2025.
            </p>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <h4 className='font-mono text-lg font-semibold text-gray-300 mb-4'>Product</h4>
            <ul className='space-y-2'>
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link href="#" className='font-mono text-sm hover:text-gray-300'>API</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link href="#" className='font-mono text-sm hover:text-gray-300'>Integrations</Link>
              </motion.li>
            </ul>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <h4 className='font-mono text-lg font-semibold text-gray-300 mb-4'>Resources</h4>
            <ul className='space-y-2'>
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link href="#" className='font-mono text-sm hover:text-gray-300'>Documentation</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link href="#" className='font-mono text-sm hover:text-gray-300'>Blog</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link href="#" className='font-mono text-sm hover:text-gray-300'>Knowledge Base</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link href="#" className='font-mono text-sm hover:text-gray-300'>Status Page</Link>
              </motion.li>
            </ul>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <h4 className='font-mono text-lg font-semibold text-gray-300 mb-4'>Company</h4>
            <ul className='space-y-2'>
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link href="#" className='font-mono text-sm hover:text-gray-300'>About Us</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link href="#" className='font-mono text-sm hover:text-gray-300'>Careers</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link href="#" className='font-mono text-sm hover:text-gray-300'>Contact</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link href="#" className='font-mono text-sm hover:text-gray-300'>Privacy Policy</Link>
              </motion.li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          variants={fadeInUp}
          className='max-w-6xl mx-auto border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center'
        >
          <p className='font-mono text-sm text-gray-500 mb-4 md:mb-0'>
            © 2023-2025 Ping Pilott. All rights reserved.
          </p>
          <div className='flex space-x-4'>
            <motion.a
              href="#"
              className='text-gray-500 hover:text-gray-300'
              whileHover={{ scale: 1.2, color: "#60a5fa" }}
              whileTap={{ scale: 0.9 }}
              aria-label="Twitter"
            >
              <svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84'></path>
              </svg>
            </motion.a>
            <motion.a
              href="#"
              className='text-gray-500 hover:text-gray-300'
              whileHover={{ scale: 1.2, color: "#60a5fa" }}
              whileTap={{ scale: 0.9 }}
              aria-label="GitHub"
            >
              <svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24'>
                <path fillRule='evenodd' d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' clipRule='evenodd'></path>
              </svg>
            </motion.a>
            <motion.a
              href="#"
              className='text-gray-500 hover:text-gray-300'
              whileHover={{ scale: 1.2, color: "#60a5fa" }}
              whileTap={{ scale: 0.9 }}
              aria-label="LinkedIn"
            >
              <svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'></path>
              </svg>
            </motion.a>
          </div>
        </motion.div>
      </motion.footer>
    </div>
  )
}

export default LandingPage;