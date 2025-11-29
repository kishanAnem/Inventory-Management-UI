import { createReducer, on } from '@ngrx/store';
import { InventoryActions } from './inventory.actions';
import { InventoryItem } from '../services/inventory.service';

export interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: any;
}

export const initialState: InventoryState = {
  items: [],
  loading: false,
  error: null,
};

export const inventoryReducer = createReducer(
  initialState,
  on(InventoryActions.loadInventory, state => ({ ...state, loading: true, error: null })),
  on(InventoryActions.loadInventorySuccess, (state, { items }) => ({ ...state, items, loading: false })),
  on(InventoryActions.loadInventoryFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(InventoryActions.addItemSuccess, (state, { item }) => ({ ...state, items: [...state.items, item] })),
  on(InventoryActions.updateItemSuccess, (state, { item }) => ({
    ...state,
    items: state.items.map(i => i.id === item.id ? item : i)
  })),
  on(InventoryActions.deleteItemSuccess, (state, { id }) => ({
    ...state,
    items: state.items.filter(i => i.id !== id)
  })),
  on(InventoryActions.addItemFailure, InventoryActions.updateItemFailure, InventoryActions.deleteItemFailure, (state, { error }) => ({ ...state, error })),
);
