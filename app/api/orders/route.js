import prisma from '@/lib/prisma';
import authSeller from '@/app/middlewares/authSeller';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try{
        const {userId} = getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const {addressId, items, paymentMethod} = await request.json();

        if(!addressId || !items || !paymentMethod){
            return NextResponse.json({ error: 'Missing Order details' }, { status: 401 });
        }

        const orderByStore = new Map();

        for(const item of items){
            const product = await prisma.product.findUnique({
                where: {
                    id: item.id
                }
            })
        const storeId = product.storeId;
        if(!orderByStore.has(storeId)){
            orderByStore.set(storeId, [])
        }
        orderByStore.get(storeId).push({
            ...item, price: product.price
        })
    }

    let orderIds = []
    let fullAmount = 0;
    let shippingFee = 0;

    for(const [storeId, sellerItems] of orderByStore.entries()){
        let total = sellerItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        fullAmount += total

        fullAmount += shippingFee;

    const order = await prisma.order.create({
        data: {
            userId,
            storeId,
            addressId,
            paymentMethod,
            total: fullAmount,
            status: "pending",
            orderItems: {
                create: sellerItems.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price
                }))
            }

        }
    })
    orderIds.push(order.id)
    }

    await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            cart:{}
        }
    })

    return NextResponse.json({ message: "Order Placed Successfully" }); // Placeholder response

    } catch (error) {
        console.log("[ORDER_POST]", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}



export async function GET(request) {
    try {
        const {userId} = getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const orders = await prisma.order.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return NextResponse.json({ orders });
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}