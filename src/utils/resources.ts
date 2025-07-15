import { supabase } from './supabase';

export interface ResourceTotal {
  item_id: string;
  item_name: string;
  item_type: string;
  total_quantity: number;
  is_base_material: boolean;
}

/**
 * Recursively calculate resource totals for an item
 */
export async function calculateResourceTotals(
  itemId: string,
  multiplier: number = 1,
  visited: Set<string> = new Set()
): Promise<ResourceTotal[]> {
  const totals: ResourceTotal[] = [];
  
  // Prevent infinite recursion
  if (visited.has(itemId)) {
    return totals;
  }
  visited.add(itemId);

  // Get the item details
  const { data: itemData, error: itemError } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (itemError || !itemData) {
    return totals;
  }

  // Get direct dependencies for this item
  const { data: dependencies, error: depsError } = await supabase
    .from('dependencies')
    .select('component_item_id, quantity')
    .eq('parent_item_id', itemId);

  if (depsError || !dependencies || dependencies.length === 0) {
    // This is a base material (no dependencies)
    const resourceTotal: ResourceTotal = {
      item_id: itemId,
      item_name: itemData.name,
      item_type: itemData.type,
      total_quantity: multiplier,
      is_base_material: true
    };
    totals.push(resourceTotal);
    return totals;
  }

  // Process each dependency recursively
  for (const dep of dependencies) {
    const subTotals = await calculateResourceTotals(
      dep.component_item_id,
      multiplier * dep.quantity,
      new Set(visited)
    );

    // Merge sub-totals into main totals
    for (const subTotal of subTotals) {
      const existing = totals.find(t => t.item_id === subTotal.item_id);
      if (existing) {
        existing.total_quantity += subTotal.total_quantity;
      } else {
        totals.push(subTotal);
      }
    }
  }

  return totals;
} 