import { supabase } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function POST() {
  const items = [
    { id: 'iron-ore', name: 'Iron Ore', type: 'material' },
    { id: 'iron-ingot', name: 'Iron Ingot', type: 'refined-material' },
    { id: 'iron-sword', name: 'Iron Sword', type: 'weapon' },
    { id: 'wood-handle', name: 'Wood Handle', type: 'material' },
    { id: 'coal', name: 'Coal', type: 'material' }
  ];

  const dependencies = [
    { parent_item_id: 'iron-sword', component_item_id: 'iron-ingot', quantity: 2 },
    { parent_item_id: 'iron-sword', component_item_id: 'wood-handle', quantity: 1 },
    { parent_item_id: 'iron-ingot', component_item_id: 'iron-ore', quantity: 1 },
    { parent_item_id: 'iron-ingot', component_item_id: 'coal', quantity: 1 }
  ];

  await supabase.from('items').insert(items).select();
  await supabase.from('dependencies').insert(dependencies).select();

  return NextResponse.json({ status: 'seed complete' });
}
