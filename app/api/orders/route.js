import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { addressId, items, paymentMethod } = await request.json();

    if (!addressId || !items?.length || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing order details' },
        { status: 400 }
      );
    }

    // Group items by store
    const orderByStore = new Map();

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        select: {
          id: true,
          mrp: true,
          storeId: true,
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (!Number.isFinite(product.mrp)) {
        throw new Error('Invalid product price');
      }

      if (!orderByStore.has(product.storeId)) {
        orderByStore.set(product.storeId, []);
      }

      orderByStore.get(product.storeId).push({
        productId: product.id,
        quantity: item.quantity,
        price: product.mrp, 
      });
    }

    const orderIds = [];
    const shippingFee = 0; 

    // Create orders per store
    for (const [storeId, sellerItems] of orderByStore.entries()) {
      const storeTotal = sellerItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      if (!Number.isFinite(storeTotal)) {
        throw new Error('Invalid order total');
      }

      const order = await prisma.order.create({
        data: {
          user: {
            connect: { id: userId },
          },
          store: {
            connect: { id: storeId },
          },
          address: {
            connect: { id: addressId },
          },
          total: storeTotal + shippingFee,
          paymentMethod,
          isPaid: false,
          orderItems: {
            create: sellerItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      orderIds.push(order.id);
    }

    // Clear cart
    await prisma.user.update({
      where: { id: userId },
      data: {
        cart: {},
      },
    });

    return NextResponse.json({
      message: 'Order placed successfully',
      orderIds,
    });
  } catch (error) {
    console.error('[ORDER_POST]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: true,
        store: true,
        address: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
