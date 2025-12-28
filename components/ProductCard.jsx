'use client'
import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const ProductCard = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'


    return (
        <Link href={`/product/${product.id}`} className=' group max-xl:mx-auto'>
            <div className='bg-[#F5F5F5] h-30  sm:w-60 sm:h-60 shadow-xl rounded-xl flex items-center justify-center'>
                <Image width={5000} height={500} className='rounded-xl w-auto group-hover:scale-115 transition duration-300' src={product.images[0]} alt="" />
            </div>
            <div className='flex justify-between gap-3 text-xl text-slate-800 pt-2 max-w-60'>
                <div>
                    <p>{product.name}</p>
                </div>
                <p>{currency}{product.mrp}</p>
            </div>
        </Link>
    )
}

export default ProductCard