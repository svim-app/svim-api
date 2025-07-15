import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const items = [
  { id: 'iron-ore', name: 'Iron Ore', type: 'material' },
  { id: 'iron-ingot', name: 'Iron Ingot', type: 'refined-material' },
  { id: 'iron-sword', name: 'Iron Sword', type: 'weapon' }
];

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const item = items.find((item) => item.id === params.id);

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  return NextResponse.json(item);
}
