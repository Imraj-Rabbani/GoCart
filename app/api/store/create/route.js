import imageKit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { toFile } from "@imagekit/nodejs";
import { NextResponse } from "next/server";



//create the store
export async function POST(request){
    try {
        const {userId} = getAuth(request)
        const formData = await request.formData()

        const name = formData.get("name")
        const username = formData.get("username")
        const description = formData.get("description")
        const email = formData.get("email")
        const contact = formData.get("contact")
        const address = formData.get("address")
        const image = formData.get("image")

        if(!name || !username || !description || !email || !contact || !address || !image){
            return NextResponse.json({error: "missing store info"},{status: 400})
        }
        //checking if user already have a store
        const store = await prisma.store.findFirst({
            where: { userId: userId}
        })

        if(store){
            return NextResponse.json({status: store.status})
        }

        const isUsernameTaken = await prisma.store.findFirst({
            where: {username : username.toLowerCase()}
        })

        if(isUsernameTaken){
            return NextResponse.json({error: "Shop Username already taken"}, {status:400});
        }


        
        const response = await imageKit.files.upload({
            file: image, 
            fileName: image.name,
            folder: "logos"
        })

        const optimizedImage = imageKit.helper.buildSrc({
            src: response.filePath,
            transformation: [
                {quality: "auto"},
                {format: "webp"},
                {width: "512"}
            ]
        })

        const newStore = await prisma.store.create({
            data: {
                userId,
                name,
                description,
                username:userId.toLowerCase(),
                email,
                contact,
                address,
                logo: optimizedImage
            }
        })

        await prisma.user.update({
            where: {id:userId},
            data: {store: {connect: {id: newStore.id}}}
        })

        return NextResponse.json({message: "applied, waiting for approval"})


    } catch (error) {
        console.log(error);
        return NextResponse.json({error: error.code ||error.message}, {status: 400})
    }
}

export async function GET(request){
    try {
        const {userId} = getAuth(request)

        const store = await prisma.store.findFirst({
            where: { userId: userId}
        })

        if(store){
            return NextResponse.json({status: store.status})
        }

        return NextResponse.json({status: "not registered"})
        
    } catch (error) {
        console.log(error);
        return NextResponse.json({error: error.code ||error.message}, {status: 400})
    }
}