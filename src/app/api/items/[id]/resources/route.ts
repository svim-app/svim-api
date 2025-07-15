import { supabase } from '@/utils/supabase';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { calculateResourceTotals } from '@/utils/resources';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = params.id;

    // Verify the item exists
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Calculate recursive resource totals
    const resources = await calculateResourceTotals(itemId);

    // Sort by item_id for consistent output
    resources.sort((a, b) => a.item_id.localeCompare(b.item_id));

    return NextResponse.json(resources);

  } catch (error) {
    console.error('Error calculating resources:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 