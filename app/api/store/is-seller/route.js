import authSeller from "@/app/middlewares/authSeller"
import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"



export async function GET(request){
    try {
        console.log("Ashche")
        const {userId} = getAuth(request)
        const isSeller = await authSeller(userId)

        if(!isSeller){
            return NextResponse.json({error: "Not Authorized"}, {status: 401})
        }

        const storeInfo = await prisma.store.findUnique({where: {userId}})
        console.log(storeInfo)
        
        return NextResponse.json({isSeller, storeInfo})

    } catch (error) {
        console.log(error);
        return NextResponse.json({error: error.code ||error.message}, {status: 400})
    }

}