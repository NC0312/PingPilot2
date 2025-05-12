'use client'
import React, { useState } from 'react'

const LandingPage = () => {
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  
  return (
    <div className='flex flex-col min-h-screen bg-[#031D27] text-gray-400'>
      {/* Navigation */}
      <nav className='flex justify-between items-center border-b border-gray-700 p-6'>
        <div className='flex items-center gap-2'>
          <img src='/favicon.png' alt="Ping Pilott Logo" className='h-12 w-12'/>
          <h1 className='font-mono text-2xl font-bold text-gray-300'>Ping Pilott</h1>
        </div>
        <div className='flex gap-4'>
          <button className='px-4 py-2 font-mono text-gray-300 hover:text-white'>Features</button>
          <button className='px-4 py-2 font-mono text-gray-300 hover:text-white'>Pricing</button>
          <button className='px-4 py-2 font-mono text-gray-300 hover:text-white'>About</button>
          <button className='px-4 py-2 font-mono bg-blue-600 text-white rounded-lg hover:bg-blue-700'>Sign In</button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className='flex flex-col md:flex-row items-center justify-between px-8 py-16 border-b border-gray-700'>
        <div className='md:w-1/2 mb-8 md:mb-0'>
          <h1 className='font-mono font-bold text-4xl md:text-5xl text-gray-300 mb-4'>
            Stay Ahead of <span className='text-blue-400'>Downtime</span>
          </h1>
          <h2 className='font-mono font-bold text-2xl md:text-3xl mb-6 text-gray-300'>
            Monitor Your Servers in Real-Time, Anywhere!
          </h2>
          <p className='font-mono text-lg text-gray-400 mb-8 max-w-lg'>
            Track website and server uptime with customizable alerts, smart scheduling, and real-time dashboards — all in one powerful monitoring platform.
          </p>
          <div className='flex gap-4'>
            <button className='px-6 py-3 font-mono text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors'>
              Start Free Trial
            </button>
            {/* <button className='px-6 py-3 font-mono text-gray-300 border-2 border-gray-600 rounded-xl hover:border-gray-400 transition-colors'>
              Learn More
            </button> */}
          </div>
        </div>
        <div className='md:w-1/2 flex justify-center'>
          <img src='/server-monitoring-dashboard.jpeg' alt="Server monitoring dashboard" className='rounded-lg shadow-lg max-w-full'/>
        </div>
      </div>

      {/* Pricing Section */}
      <div className='py-16 px-8'>
        <h2 className='font-mono text-3xl font-semibold text-gray-300 text-center mb-12'>
          Choose a Plan That Fits Your Monitoring Needs
        </h2>
        
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto'>
          {/* Free Plan */}
          <div className='bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all flex flex-col'>
            <div className='mb-6'>
              <h3 className='font-mono text-xl font-bold text-gray-300 mb-2'>FREE</h3>
              <p className='font-mono text-3xl font-bold text-gray-300 mb-2'>$0</p>
              <p className='font-mono text-sm text-gray-400'>2-day trial</p>
            </div>
            <div className='mb-6 flex-grow'>
              <p className='font-mono text-gray-400 mb-4'>Perfect for testing our platform.</p>
              <ul className='space-y-3'>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>1 URL monitoring</span>
                </li>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>2-day access</span>
                </li>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>Basic email alerts</span>
                </li>
                <li className='flex items-center'>
                  <span className='text-red-400 mr-2'>✗</span>
                  <span className='font-mono text-gray-400'>Multiple URLs</span>
                </li>
              </ul>
            </div>
            <button 
              className='w-full px-4 py-3 font-mono text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors'
              onClick={() => setShowPricingPopup(true)}
            >
              Start Free
            </button>
          </div>
          
          {/* Monthly Plan */}
          <div className='bg-gray-800 rounded-xl p-6 border border-blue-600 hover:border-blue-500 transition-all flex flex-col relative overflow-hidden'>
            <div className='absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 font-mono text-xs'>
              POPULAR
            </div>
            <div className='mb-6'>
              <h3 className='font-mono text-xl font-bold text-gray-300 mb-2'>MONTHLY</h3>
              <p className='font-mono text-3xl font-bold text-gray-300 mb-2'>$10</p>
              <p className='font-mono text-sm text-gray-400'>per month</p>
            </div>
            <div className='mb-6 flex-grow'>
              <p className='font-mono text-gray-400 mb-4'>For individual developers and small websites.</p>
              <ul className='space-y-3'>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>Unlimited URLs</span>
                </li>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>Real-time monitoring</span>
                </li>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>Email & SMS alerts</span>
                </li>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>24/7 support</span>
                </li>
              </ul>
            </div>
            <button className='w-full px-4 py-3 font-mono text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors'>
              Choose Monthly
            </button>
          </div>
          
          {/* Half-Yearly Plan */}
          <div className='bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all flex flex-col'>
            <div className='mb-6'>
              <h3 className='font-mono text-xl font-bold text-gray-300 mb-2'>HALF-YEARLY</h3>
              <p className='font-mono text-3xl font-bold text-gray-300 mb-2'>$55</p>
              <p className='font-mono text-sm text-gray-400'>per 6 months (save 8.3%)</p>
            </div>
            <div className='mb-6 flex-grow'>
              <p className='font-mono text-gray-400 mb-4'>For growing businesses with multiple sites.</p>
              <ul className='space-y-3'>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>Everything in Monthly</span>
                </li>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>Faster check intervals</span>
                </li>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>Historical reporting</span>
                </li>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>Webhook integrations</span>
                </li>
              </ul>
            </div>
            <button className='w-full px-4 py-3 font-mono text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors'>
              Choose Half-Yearly
            </button>
          </div>
          
          {/* Yearly Plan */}
          <div className='bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all flex flex-col relative overflow-hidden'>
            <div className='absolute top-0 right-0 bg-green-600 text-white px-4 py-1 font-mono text-xs'>
              BEST VALUE
            </div>
            <div className='mb-6'>
              <h3 className='font-mono text-xl font-bold text-gray-300 mb-2'>YEARLY</h3>
              <p className='font-mono text-3xl font-bold text-gray-300 mb-2'>$105</p>
              <p className='font-mono text-sm text-gray-400'>per year (save 12.5%)</p>
            </div>
            <div className='mb-6 flex-grow'>
              <p className='font-mono text-gray-400 mb-4'>For businesses requiring continuous monitoring.</p>
              <ul className='space-y-3'>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>Everything in Half-Yearly</span>
                </li>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>Advanced analytics</span>
                </li>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>API access</span>
                </li>
                <li className='flex items-center'>
                  <span className='text-green-400 mr-2'>✓</span>
                  <span className='font-mono text-gray-300'>Priority support</span>
                </li>
              </ul>
            </div>
            <button className='w-full px-4 py-3 font-mono text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors'>
              Choose Yearly
            </button>
          </div>
        </div>
        
        <div className='text-center mt-8'>
          <p className='font-mono text-gray-400'>
            Need a custom enterprise solution? We've got you covered.
          </p>
          <button className='mt-4 px-6 py-2 font-mono text-gray-300 border border-gray-600 rounded-lg hover:border-gray-400 transition-colors'>
            Contact Sales
          </button>
        </div>
      </div>
      
      {/* Pricing Popup */}
      {showPricingPopup && (
        <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'>
          <div className='bg-gray-800 rounded-xl p-6 max-w-md w-full'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='font-mono text-xl font-bold text-gray-300'>Upgrade Required</h3>
              <button onClick={() => setShowPricingPopup(false)} className='text-gray-400 hover:text-white'>
                ✕
              </button>
            </div>
            <p className='font-mono text-gray-400 mb-6'>
              To monitor additional URLs, you'll need to upgrade to one of our premium plans.
            </p>
            <div className='space-y-4'>
              <button className='w-full px-4 py-3 font-mono text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors'>
                Monthly Plan - $10/month
              </button>
              <button className='w-full px-4 py-3 font-mono text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors'>
                Half-Yearly Plan - $55/6 months
              </button>
              <button className='w-full px-4 py-3 font-mono text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors'>
                Yearly Plan - $105/year
              </button>
            </div>
            <button 
              onClick={() => setShowPricingPopup(false)}
              className='w-full mt-4 px-4 py-2 font-mono text-gray-400 hover:text-gray-300'
            >
              Continue with Free Plan
            </button>
          </div>
        </div>
      )}

      {/* Features Section - Brief overview */}
      <div className='bg-gray-900 py-16 px-8 border-t border-gray-700'>
        <h2 className='font-mono text-3xl font-semibold text-gray-300 text-center mb-12'>
          Why Choose Ping Pilott?
        </h2>
        
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
          <div className='text-center'>
            <div className='bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6'>
              <span className='text-2xl'>⚡</span>
            </div>
            <h3 className='font-mono text-xl font-bold text-gray-300 mb-2'>Real-Time Alerts</h3>
            <p className='font-mono text-gray-400'>Get instant notifications when your servers go down, before your customers notice.</p>
          </div>
          
          <div className='text-center'>
            <div className='bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6'>
              <span className='text-2xl'>📊</span>
            </div>
            <h3 className='font-mono text-xl font-bold text-gray-300 mb-2'>Detailed Analytics</h3>
            <p className='font-mono text-gray-400'>Track performance metrics and identify patterns to prevent future downtime.</p>
          </div>
          
          <div className='text-center'>
            <div className='bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6'>
              <span className='text-2xl'>🔒</span>
            </div>
            <h3 className='font-mono text-xl font-bold text-gray-300 mb-2'>Secure & Reliable</h3>
            <p className='font-mono text-gray-400'>Our infrastructure is built for 99.9% uptime, because we monitor ourselves too.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className='bg-[#031D27] text-gray-400 border-t border-gray-700 py-12 px-8 mt-auto'>
        <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8'>
          <div>
            <div className='flex items-center gap-2 mb-4'>
              <img src='/api/placeholder/36/36' alt="Ping Pilott Logo" className='h-9 w-9'/>
              <h3 className='font-mono text-xl font-bold text-gray-300'>Ping Pilott</h3>
            </div>
            <p className='font-mono text-sm text-gray-500'>
              Your reliable partner in server monitoring and uptime tracking since 2023.
            </p>
          </div>
          
          <div>
            <h4 className='font-mono text-lg font-semibold text-gray-300 mb-4'>Product</h4>
            <ul className='space-y-2'>
              <li><a href="#" className='font-mono text-sm hover:text-gray-300'>Features</a></li>
              <li><a href="#" className='font-mono text-sm hover:text-gray-300'>Pricing</a></li>
              <li><a href="#" className='font-mono text-sm hover:text-gray-300'>API</a></li>
              <li><a href="#" className='font-mono text-sm hover:text-gray-300'>Integrations</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className='font-mono text-lg font-semibold text-gray-300 mb-4'>Resources</h4>
            <ul className='space-y-2'>
              <li><a href="#" className='font-mono text-sm hover:text-gray-300'>Documentation</a></li>
              <li><a href="#" className='font-mono text-sm hover:text-gray-300'>Blog</a></li>
              <li><a href="#" className='font-mono text-sm hover:text-gray-300'>Knowledge Base</a></li>
              <li><a href="#" className='font-mono text-sm hover:text-gray-300'>Status Page</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className='font-mono text-lg font-semibold text-gray-300 mb-4'>Company</h4>
            <ul className='space-y-2'>
              <li><a href="#" className='font-mono text-sm hover:text-gray-300'>About Us</a></li>
              <li><a href="#" className='font-mono text-sm hover:text-gray-300'>Careers</a></li>
              <li><a href="#" className='font-mono text-sm hover:text-gray-300'>Contact</a></li>
              <li><a href="#" className='font-mono text-sm hover:text-gray-300'>Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className='max-w-6xl mx-auto border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center'>
          <p className='font-mono text-sm text-gray-500 mb-4 md:mb-0'>
            © 2023-2025 Ping Pilott. All rights reserved.
          </p>
          <div className='flex space-x-4'>
            <a href="#" className='text-gray-500 hover:text-gray-300'>
              <span className='sr-only'>Twitter</span>
              <svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84'></path>
              </svg>
            </a>
            <a href="#" className='text-gray-500 hover:text-gray-300'>
              <span className='sr-only'>GitHub</span>
              <svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24'>
                <path fillRule='evenodd' d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' clipRule='evenodd'></path>
              </svg>
            </a>
            <a href="#" className='text-gray-500 hover:text-gray-300'>
              <span className='sr-only'>LinkedIn</span>
              <svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'></path>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage