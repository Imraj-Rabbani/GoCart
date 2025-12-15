import imageKit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { toFile } from "@imagekit/nodejs";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();

        const name = formData.get("name");
        const username = formData.get("username");
        const description = formData.get("description");
        const email = formData.get("email");
        const contact = formData.get("contact");
        const address = formData.get("address");
        const image = formData.get("image"); // File object

        // Required validation
        if (!name || !username || !description || !email || !contact || !address || !image) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user already created a store
        const existingStore = await prisma.store.findFirst({
            where: { userId }
        });

        if (existingStore) {
            return NextResponse.json(
                { status: existingStore.status },
                { status: 200 }
            );
        }

        // Check if store username already exists
        const usernameTaken = await prisma.store.findFirst({
            where: { username: username.toLowerCase() }
        });

        if (usernameTaken) {
            return NextResponse.json(
                { error: "Shop username already taken" },
                { status: 400 }
            );
        }

        // Convert File to Buffer
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload Image to ImageKit
        const uploaded = await imageKit.files.upload({
            file: await toFile(buffer, image.name),
            fileName: image.name,
            folder: "logos"
        });

        

        // Create Store in DB
        const newStore = await prisma.store.create({
            data: {
                userId,
                name,
                description,
                username: username.toLowerCase(),
                email,
                contact,
                address,
                logo: uploaded.url
            }
        });

        // Connect store to User
        await prisma.user.update({
            where: { id: userId },
            data: {
                store: { connect: { id: newStore.id } }
            }
        });

        return NextResponse.json({
            message: "Store created successfully. Waiting for approval.",
            storeId: newStore.id
        });

    } catch (error) {
        console.error("Store Create Error:", error);

        return NextResponse.json(
            { error: error.code || error.message || "Something went wrong" },
            { status: 500 }
        );
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