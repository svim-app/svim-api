import { NextResponse } from 'next/server';

const items = [
  { id: 'iron-ore', name: 'Iron Ore', type: 'material' },
  { id: 'iron-ingot', name: 'Iron Ingot', type: 'refined-material' },
  { id: 'iron-sword', name: 'Iron Sword', type: 'weapon' }
];

export async function GET() {
  return NextResponse.json(items);
}
