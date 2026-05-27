import { NextRequest, NextResponse } from 'next/server';
import {
  createCart, getCart, addCartLines,
  updateCartLines, removeCartLines,
} from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, cartId, lines, lineIds } = body;

    switch (action) {
      case 'create': {
        const cart = await createCart();
        return NextResponse.json({ cart });
      }
      case 'get': {
        if (!cartId) return NextResponse.json({ error: 'cartId required' }, { status: 400 });
        const cart = await getCart(cartId);
        return NextResponse.json({ cart });
      }
      case 'add': {
        if (!cartId || !lines) return NextResponse.json({ error: 'cartId and lines required' }, { status: 400 });
        const cart = await addCartLines(cartId, lines);
        return NextResponse.json({ cart });
      }
      case 'update': {
        if (!cartId || !lines) return NextResponse.json({ error: 'cartId and lines required' }, { status: 400 });
        const cart = await updateCartLines(cartId, lines);
        return NextResponse.json({ cart });
      }
      case 'remove': {
        if (!cartId || !lineIds) return NextResponse.json({ error: 'cartId and lineIds required' }, { status: 400 });
        const cart = await removeCartLines(cartId, lineIds);
        return NextResponse.json({ cart });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (e) {
    console.error('Cart API error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
