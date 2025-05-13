'use client'
import React from 'react'
import { motion } from 'framer-motion'

const PricingCard = ({ plan, cardVariants }) => {
    const { title, price, period, description, features, buttonText, buttonAction, buttonStyle, tag } = plan

    // Define border and button styles based on plan type
    const getBorderStyle = () => {
        if (tag && tag.color === 'blue') {
            return 'border-blue-600'
        }
        return 'border-gray-700'
    }

    const getButtonStyle = () => {
        if (buttonStyle === 'blue') {
            return 'text-white bg-blue-600 hover:bg-blue-700'
        }
        return 'text-gray-300 border border-gray-600 hover:bg-gray-700'
    }

    return (
        <motion.div
            variants={cardVariants}
            whileHover={{
                y: -5,
                scale: 1.02,
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                borderColor: "#3b82f6",
                transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 10
                }
            }}
            className={`bg-gray-800 rounded-xl p-4 md:p-6 border ${getBorderStyle()} transition-all flex flex-col relative overflow-hidden`}
        >
            {tag && (
                <div className={`absolute top-0 right-0 bg-${tag.color}-600 text-white px-4 py-1 font-mono text-xs`}>
                    {tag.text}
                </div>
            )}

            <div className='mb-6'>
                <h3 className='font-mono text-xl font-bold text-gray-300 mb-2'>{title}</h3>
                <p className='font-mono text-3xl font-bold text-gray-300 mb-2'>{price}</p>
                <p className='font-mono text-sm text-gray-400'>{period}</p>
            </div>

            <div className='mb-6 flex-grow'>
                <p className='font-mono text-gray-400 mb-4'>{description}</p>
                <ul className='space-y-3'>
                    {features.map((feature, index) => (
                        <li key={index} className='flex items-center'>
                            <span className={feature.included ? 'text-green-400 mr-2' : 'text-red-400 mr-2'}>
                                {feature.included ? '✓' : '✗'}
                            </span>
                            <span className={`font-mono ${feature.included ? 'text-gray-300' : 'text-gray-400'}`}>
                                {feature.text}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={buttonAction}
                className={`w-full px-4 py-3 font-mono rounded-lg transition-colors ${getButtonStyle()}`}
            >
                {buttonText}
            </motion.button>
        </motion.div>
    )
}

export default PricingCard