import authSeller from "@/app/middlewares/authSeller"
import imageKit from "@/configs/imageKit";
import prisma from "@/lib/prisma"
import {getAuth} from "@clerk/nextjs/server" 
import { NextResponse } from "next/server"
import { toFile } from "@imagekit/nodejs";

export async function POST(request){
    try {
        const {userId} = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: 'not authorized'}, {status:401})
        }

        const formData = await request.formData()
        const name = formData.get("name")
        const tags = formData.get("tags") || ""
        const mrp =  499
        const category = formData.get("productType")
        const images = formData.getAll("images")
        const color = formData.get("color")

        if(!name || !mrp || !category || images.length< 1){
            return NextResponse.json({error: "Missing Product Details"}, {status: 400})
        } 

        
        const imagesUrl = [];

        for (const img of images) {
            const arrayBuffer = await img.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to ImageKit
            const uploaded = await imageKit.files.upload({
                file: await toFile(buffer, img.name),
                fileName: img.name,
                folder: "/product-images"
            });


            imagesUrl.push(uploaded.url);
        }

        

        await prisma.product.create({
            data:{
                name,
                tags,
                mrp,
                category,
                images: imagesUrl,
                color,
                storeId
            }
        })

        return NextResponse.json({message: "Product added successfully"})

    } catch (error) {
        console.log(error);
        return NextResponse.json({error: error.code ||error.message}, {status: 400})
    }
}


export async function GET(request){
    try {
        const {userId} = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: 'not authorized'}, {status:401})
        }

        const products = await prisma.product.findMany({where: {storeId}})

        return NextResponse.json({products})
         
    } catch (error) {
        console.log(error);
        return NextResponse.json({error: error.code ||error.message}, {status: 400})
    }
}