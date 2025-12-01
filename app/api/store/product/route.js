import authSeller from "@/app/middlewares/authSeller"
import imageKit from "@/configs/imageKit"
import prisma from "@/lib/prisma"
import {getAuth} from "@clerk/nextjs/server" 
import { NextResponse } from "next/server"

export async function POST(request){
    try {
        const {userId} = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: 'not authorized'}, {status:401})
        }

        const formData = await request.formData()
        const name = formData.get("name")
        const description = formData.get("description")
        const mrp = Number(formData.get("mrp"))
        const price = Number(formData.get("mrp"))
        const category = formData.get("category")
        const images = formData.getAll("image")

        if(!name || !description || !mrp || !price || !category || images.length< 1){
            return NextResponse.json({error: "Missing Product Details"}, {status: 400})
        } 

        //Uploading Images to Imagekit
        const imagesUrl = await Promise.all(images.map(async(image)=>{
            const buffer = Buffer.from(await image.arrayBuffer());
            const response = await imageKit.upload({
                file:buffer,
                fileNmae:image.name,
                folder: "products",
            })

            const url = imageKit.url({
                path:response.filePath,
                transformation: [
                    {quality: 'auto'},
                    {format: 'webp'},
                    {width: '1024'}
                ]
            })
            return url
        }))

        await prisma.product.create({
            data:{
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
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