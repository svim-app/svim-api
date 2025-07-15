import { NextResponse } from 'next/server';

const dependencies = [
  {
    parent: 'iron-sword',
    components: [
      { id: 'iron-ingot', quantity: 2 },
      { id: 'wood-handle', quantity: 1 }
    ]
  },
  {
    parent: 'iron-ingot',
    components: [
      { id: 'iron-ore', quantity: 1 },
      { id: 'coal', quantity: 1 }
    ]
  }
];

export async function GET() {
  return NextResponse.json(dependencies);
}
