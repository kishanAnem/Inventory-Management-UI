import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { InventoryItem } from '../services/inventory.service';

export const InventoryActions = createActionGroup({
  source: 'Inventory',
  events: {
    'Load Inventory': emptyProps(),
    'Load Inventory Success': props<{ items: InventoryItem[] }>(),
    'Load Inventory Failure': props<{ error: any }>(),

    'Add Item': props<{ item: InventoryItem }>(),
    'Add Item Success': props<{ item: InventoryItem }>(),
    'Add Item Failure': props<{ error: any }>(),

    'Update Item': props<{ item: InventoryItem }>(),
    'Update Item Success': props<{ item: InventoryItem }>(),
    'Update Item Failure': props<{ error: any }>(),

    'Delete Item': props<{ id: string }>(),
    'Delete Item Success': props<{ id: string }>(),
    'Delete Item Failure': props<{ error: any }>(),
  }
});
