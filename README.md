# SVIM API – Developer Notes for AI Assistants (Cursor)

This is a TypeScript API project built using Next.js.  
It is used to serve item, crafting, and dependency data for BitCraft via simple JSON endpoints.

## Purpose
SVIM provides a public-facing API that allows external tools to:
- Fetch item information
- Fetch dependency chains
- Calculate raw resource totals needed to craft advanced items

## Key Design Goals
- The backend is **read-only**, powered by **Supabase** (PostgreSQL).
- API routes return **plain JSON** over HTTP.
- The API is hosted on **Vercel** and mirrors the file-based structure of `/api`.

## Current Tables in Supabase
- `items`:  
  - `id` (text, PK)  
  - `name` (text)  
  - `type` (text – e.g., "material", "refined", "weapon")

- `dependencies`:  
  - `parent_item_id` → item that is being crafted  
  - `component_item_id` → component required  
  - `quantity` (int)

## API Routes (in progress)
- `GET /api/items`  
- `GET /api/items/[id]`  
- `GET /api/dependencies`  
- `GET /api/items/[id]/resources` → returns **recursive dependency breakdown**

## Notes for Cursor AI:
- Do not modify the database schema unless explicitly asked.
- Keep all responses clean, structured JSON for consumption by external tools.
- Focus on recursion, dependency resolution, and total quantity aggregation.
- Don’t over-engineer: no need for services, DB abstraction layers, etc.

## Improved `/api/items/[id]/resources` Endpoint

The `/api/items/[id]/resources` endpoint has been improved to properly handle recursive quantity calculations. Here's what the endpoint does:

### Key Features:

1. **Recursive Dependency Resolution**: The `calculateResourceTotals` function recursively traverses the dependency tree, calculating total quantities needed for each base material.

2. **Cycle Detection**: Uses a `visited` Set to prevent infinite recursion in case of circular dependencies.

3. **Quantity Multiplication**: Properly multiplies quantities through the dependency chain (e.g., if you need 2 iron ingots to make a sword, and each ingot needs 3 iron ore, you'll need 6 iron ore total).

4. **Base Material Identification**: Marks items with no dependencies as base materials (`is_base_material: true`).

5. **Comprehensive Response**: Returns:
   - Item details (id, name, type)
   - Array of all required resources with total quantities
   - Summary statistics (total base materials, unique materials)

### Example Response Structure:
```json
{
  "item_id": "iron-sword",
  "item_name": "Iron Sword", 
  "item_type": "weapon",
  "resources": [
    {
      "item_id": "iron-ore",
      "item_name": "Iron Ore",
      "item_type": "material", 
      "total_quantity": 6,
      "is_base_material": true
    }
  ],
  "total_base_materials": 1,
  "total_unique_materials": 1
}
```

The endpoint will now properly calculate the total quantities needed for any item, no matter how complex the dependency chain is. It handles nested crafting recipes and aggregates quantities correctly across multiple dependency levels.

---

You can safely use this context to help enhance recursive breakdown logic or generate helper utilities if needed.
