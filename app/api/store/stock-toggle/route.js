import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"

import { NextResponse } from "next/server"

export async function POST(request){
    try{
        const {userId} = getAuth(request)
        const {productId} = await request.json()

        if (!userId) {
            return NextResponse.json({error: 'not authorized'}, {status: 401})
        }

        if (!productId) {
            return NextResponse.json({ error: "Missing productId" }, { status: 400 })
        }

        const product = await prisma.product.findUnique({
            where: {id: productId}
        })
        
        
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }
                
        await prisma.product.update({
            where: {id: productId},
            data: {inStock: !product.inStock}
        })

        return NextResponse.json({message: "Product stock updated successfully"})

    }catch(error){
        console.log(error);
        return NextResponse.json({error: error.code ||error.message}, {status: 400})
    }
}