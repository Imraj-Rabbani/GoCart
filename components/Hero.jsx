'use client'
import { assets } from '@/assets/assets'
import { ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import React from 'react'


const Hero = () => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    return (
        <div className='mx-6'>
            <div className='flex max-xl:flex-col gap-8 max-w-7xl mx-auto my-10'>
                {/* Main Hero Banner */}
                <div className='relative flex-1 flex flex-col bg-orange-200 rounded-3xl xl:min-h-[500px] group overflow-hidden'>
                    <div className='p-5 sm:p-16 relative z-10'>
                        {/* News Pill */}
                        <div className='inline-flex items-center gap-3 pr-4 p-1 rounded-full text-xs sm:text-sm bg-white/30 backdrop-blur-sm w-fit mb-6'>
                            <span className='px-3 py-1 rounded-full bg-slate-800 text-white text-xs'>NEW ARRIVALS</span> Free Shipping on Orders Above $50! <ChevronRightIcon className='group-hover:ml-2 transition-all' size={16} />
                        </div>
                        
                        {/* Clothing Headline */}
                        <h2 className='text-3xl sm:text-5xl leading-[1.2] my-3 font-medium text-slate-900 max-w-xs sm:max-w-md'>
                            Style that speaks. Comfort that lasts.
                        </h2>
                        
                        {/* Price Point */}
                        <div className='text-slate-800 text-sm font-medium mt-4 sm:mt-8'>
                            <p>Collections start from</p>
                            <p className='text-3xl font-bold'>{currency}499</p>
                        </div>
                        
                        {/* CTA Button */}
                        <button className='bg-slate-800 text-white text-sm py-3 px-7 sm:py-4 sm:px-10 mt-4 sm:mt-10 rounded-full hover:bg-slate-900 hover:scale-105 active:scale-95 transition shadow-lg'>
                            SHOP NOW
                        </button>
                    </div>

                    {/* Hero Image - Adjusted styling for better size and positioning */}
                    <Image 
                        className='sm:absolute z-0 bottom-0 right-0 w-full sm:w-1/2 md:w-[40%] h-auto object-contain object-bottom max-sm:mt-10' 
                        src={assets.hero_model} 
                        alt="Latest Fashion Trends" 
                    />
                </div>
                
            </div>

        </div>

    )
}

export default Hero