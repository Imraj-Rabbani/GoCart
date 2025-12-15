import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

//Update User Cart
export async function POST(request){
    try {
        const {userId} = getAuth(request)
        const {cart} = await request.json()

        await prisma.user.update({
            where:{id: userId},
            data:{ cart: cart}
        })

        return NextResponse.json({message: "Cart Updated"})
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: "An internal server error occurred"},{status:500})
    }
}

//Get User cart
export async function GET(request){
    try {
        const {userId} = getAuth(request)
        const user = await prisma.user.findUnique({
            where: {id: userId}
        })

        return NextResponse.json({cart: user.cart})
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: "An internal server error occurred"},{status:500})
    }
}