import { createFeatureSelector, createSelector } from '@ngrx/store';
import { InventoryState } from './inventory.reducer';

export const selectInventoryState = createFeatureSelector<InventoryState>('inventory');

export const selectAllInventoryItems = createSelector(
  selectInventoryState,
  state => state.items
);

export const selectInventoryLoading = createSelector(
  selectInventoryState,
  state => state.loading
);

export const selectInventoryError = createSelector(
  selectInventoryState,
  state => state.error
);
