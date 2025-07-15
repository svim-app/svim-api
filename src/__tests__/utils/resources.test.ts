import { calculateResourceTotals, ResourceTotal } from '@/utils/resources';
import { supabase } from '@/utils/supabase';

// Helper to mock the supabase chain for item queries
function mockSupabaseItemQuery(itemData: any, error: any = null) {
  return {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: itemData, error }),
      }),
    }),
  };
}

// Helper to mock the supabase chain for dependency queries
function mockSupabaseDepsQuery(depsData: any, error: any = null) {
  return {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: depsData, error }),
    }),
  };
}

jest.mock('@/utils/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('calculateResourceTotals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array for non-existent item', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'items') return mockSupabaseItemQuery(null, { message: 'Not found' });
      return mockSupabaseDepsQuery([]);
    }) as any;
    const result = await calculateResourceTotals('non-existent-item');
    expect(result).toEqual([]);
  });

  it('should return base material when item has no dependencies', async () => {
    const mockItem = { id: 'iron-ore', name: 'Iron Ore', type: 'material' };
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'items') return mockSupabaseItemQuery(mockItem);
      if (table === 'dependencies') return mockSupabaseDepsQuery([]);
      return undefined as any;
    }) as any;
    const result = await calculateResourceTotals('iron-ore');
    expect(result).toEqual([
      {
        item_id: 'iron-ore',
        item_name: 'Iron Ore',
        item_type: 'material',
        total_quantity: 1,
        is_base_material: true,
      },
    ]);
  });

  it('should calculate totals for simple dependency chain', async () => {
    const mockItems: Record<string, { id: string; name: string; type: string }> = {
      'iron-sword': { id: 'iron-sword', name: 'Iron Sword', type: 'weapon' },
      'iron-ingot': { id: 'iron-ingot', name: 'Iron Ingot', type: 'refined' },
      'iron-ore': { id: 'iron-ore', name: 'Iron Ore', type: 'material' },
    };
    const deps: Record<string, { component_item_id: string; quantity: number }[]> = {
      'iron-sword': [{ component_item_id: 'iron-ingot', quantity: 2 }],
      'iron-ingot': [{ component_item_id: 'iron-ore', quantity: 3 }],
      'iron-ore': [],
    };
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'items') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(({ }, id: string) => ({
              single: jest.fn().mockResolvedValue({ data: mockItems[id], error: null }),
            })),
          }),
        };
      }
      if (table === 'dependencies') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(({ }, id: string) => Promise.resolve({ data: deps[id], error: null })),
          }),
        };
      }
      return undefined as any;
    }) as any;
    const result = await calculateResourceTotals('iron-sword');
    expect(result).toEqual([
      {
        item_id: 'iron-ore',
        item_name: 'Iron Ore',
        item_type: 'material',
        total_quantity: 6, // 2 iron-ingots * 3 iron-ore each
        is_base_material: true,
      },
    ]);
  });

  it('should handle multiple dependencies correctly', async () => {
    const mockItems: Record<string, { id: string; name: string; type: string }> = {
      'complex-item': { id: 'complex-item', name: 'Complex Item', type: 'weapon' },
      'component-a': { id: 'component-a', name: 'Component A', type: 'refined' },
      'component-b': { id: 'component-b', name: 'Component B', type: 'refined' },
      'base-1': { id: 'base-1', name: 'Base 1', type: 'material' },
      'base-2': { id: 'base-2', name: 'Base 2', type: 'material' },
    };
    const deps: Record<string, { component_item_id: string; quantity: number }[]> = {
      'complex-item': [
        { component_item_id: 'component-a', quantity: 2 },
        { component_item_id: 'component-b', quantity: 1 },
      ],
      'component-a': [{ component_item_id: 'base-1', quantity: 3 }],
      'component-b': [{ component_item_id: 'base-2', quantity: 2 }],
      'base-1': [],
      'base-2': [],
    };
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'items') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(({ }, id: string) => ({
              single: jest.fn().mockResolvedValue({ data: mockItems[id], error: null }),
            })),
          }),
        };
      }
      if (table === 'dependencies') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(({ }, id: string) => Promise.resolve({ data: deps[id], error: null })),
          }),
        };
      }
      return undefined as any;
    }) as any;
    const result = await calculateResourceTotals('complex-item');
    expect(result).toEqual([
      {
        item_id: 'base-1',
        item_name: 'Base 1',
        item_type: 'material',
        total_quantity: 6, // 2 component-a * 3 base-1 each
        is_base_material: true,
      },
      {
        item_id: 'base-2',
        item_name: 'Base 2',
        item_type: 'material',
        total_quantity: 2, // 1 component-b * 2 base-2 each
        is_base_material: true,
      },
    ]);
  });

  it('should handle circular dependencies gracefully', async () => {
    const mockItems: Record<string, { id: string; name: string; type: string }> = {
      'item-a': { id: 'item-a', name: 'Item A', type: 'refined' },
      'item-b': { id: 'item-b', name: 'Item B', type: 'refined' },
    };
    const deps: Record<string, { component_item_id: string; quantity: number }[]> = {
      'item-a': [{ component_item_id: 'item-b', quantity: 1 }],
      'item-b': [{ component_item_id: 'item-a', quantity: 1 }],
    };
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'items') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(({ }, id: string) => ({
              single: jest.fn().mockResolvedValue({ data: mockItems[id], error: null }),
            })),
          }),
        };
      }
      if (table === 'dependencies') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(({ }, id: string) => Promise.resolve({ data: deps[id], error: null })),
          }),
        };
      }
      return undefined as any;
    }) as any;
    const result = await calculateResourceTotals('item-a');
    expect(result).toEqual([]);
  });

  it('should apply multiplier correctly', async () => {
    const mockItems: Record<string, { id: string; name: string; type: string }> = {
      'iron-sword': { id: 'iron-sword', name: 'Iron Sword', type: 'weapon' },
      'iron-ore': { id: 'iron-ore', name: 'Iron Ore', type: 'material' },
    };
    const deps: Record<string, { component_item_id: string; quantity: number }[]> = {
      'iron-sword': [{ component_item_id: 'iron-ore', quantity: 3 }],
      'iron-ore': [],
    };
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'items') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(({ }, id: string) => ({
              single: jest.fn().mockResolvedValue({ data: mockItems[id], error: null }),
            })),
          }),
        };
      }
      if (table === 'dependencies') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(({ }, id: string) => Promise.resolve({ data: deps[id], error: null })),
          }),
        };
      }
      return undefined as any;
    }) as any;
    const result = await calculateResourceTotals('iron-sword', 2); // multiplier of 2
    expect(result).toEqual([
      {
        item_id: 'iron-ore',
        item_name: 'Iron Ore',
        item_type: 'material',
        total_quantity: 6, // 2 * 3 iron-ore
        is_base_material: true,
      },
    ]);
  });

  it('should aggregate quantities for same base materials', async () => {
    const mockItems: Record<string, { id: string; name: string; type: string }> = {
      'complex-item': { id: 'complex-item', name: 'Complex Item', type: 'weapon' },
      'component-1': { id: 'component-1', name: 'Component 1', type: 'refined' },
      'component-2': { id: 'component-2', name: 'Component 2', type: 'refined' },
      'iron-ore': { id: 'iron-ore', name: 'Iron Ore', type: 'material' },
    };
    const deps: Record<string, { component_item_id: string; quantity: number }[]> = {
      'complex-item': [
        { component_item_id: 'component-1', quantity: 1 },
        { component_item_id: 'component-2', quantity: 1 },
      ],
      'component-1': [{ component_item_id: 'iron-ore', quantity: 2 }],
      'component-2': [{ component_item_id: 'iron-ore', quantity: 3 }],
      'iron-ore': [],
    };
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'items') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(({ }, id: string) => ({
              single: jest.fn().mockResolvedValue({ data: mockItems[id], error: null }),
            })),
          }),
        };
      }
      if (table === 'dependencies') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(({ }, id: string) => Promise.resolve({ data: deps[id], error: null })),
          }),
        };
      }
      return undefined as any;
    }) as any;
    const result = await calculateResourceTotals('complex-item');
    expect(result).toEqual([
      {
        item_id: 'iron-ore',
        item_name: 'Iron Ore',
        item_type: 'material',
        total_quantity: 5, // 2 + 3 iron-ore (aggregated)
        is_base_material: true,
      },
    ]);
  });
}); 