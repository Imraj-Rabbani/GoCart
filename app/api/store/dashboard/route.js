import authSeller from "@/app/middlewares/authSeller";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";




export async function GET(request){
    try {
        
        const {userId} = getAuth(request)
        const storeId = await authSeller(userId)

        const orders = await prisma.order.findMany({where: {storeId}})

        const products = await prisma.product.findMany({where: {storeId}})

        const ratings = await prisma.rating.findMany({
            where: {productId: {in: products.map(product => product.id)}},
            include: {user: true, product: true}
        })

        const dashboardData = {
            ratings,
            totalOrders: orders.length,
            totalEarnings: Math.round(orders.reduce((acc,order)=> acc + order.total,0)),
            totalProducts: products.length
        }

        return NextResponse.json({dashboardDataw})

    } catch (error) {
        console.log(error);
        return NextResponse.json({error: error.code ||error.message}, {status: 400})
    }
}