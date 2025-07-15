import { supabase } from '@/utils/supabase';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { calculateResourceTotals } from '@/utils/resources';

interface FlattenedResource {
  item: string;
  quantity: number;
}

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
    const resourceTotals = await calculateResourceTotals(itemId);

    // Filter to only base materials and flatten the structure
    const flattenedResources: FlattenedResource[] = resourceTotals
      .filter(resource => resource.is_base_material)
      .map(resource => ({
        item: resource.item_id,
        quantity: resource.total_quantity
      }))
      .sort((a, b) => a.item.localeCompare(b.item));

    return NextResponse.json({
      item: itemId,
      resources: flattenedResources
    });

  } catch (error) {
    console.error('Error calculating resources:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 