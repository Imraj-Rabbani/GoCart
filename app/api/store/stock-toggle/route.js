import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"


export async function POST(request){
    try{
        const {userId} = getAuth(request)
        const {productId} = await request.json()

        if (!productId) {
            return NextResponse.json({error: 'not authorized'}, {status: 401})
        }

        const product = await prisma.product.findFirst({
            where: {id: productId, storeId}
        })

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