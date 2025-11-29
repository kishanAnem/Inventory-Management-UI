import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { InventoryService } from '../services/inventory.service';
import { InventoryActions } from './inventory.actions';
import { catchError, map, mergeMap, of } from 'rxjs';

@Injectable()
export class InventoryEffects {
  private actions$ = inject(Actions);
  private inventoryService = inject(InventoryService);

  loadInventory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InventoryActions.loadInventory),
      mergeMap(() =>
        this.inventoryService.getAll().pipe(
          map(items => InventoryActions.loadInventorySuccess({ items })),
          catchError(error => of(InventoryActions.loadInventoryFailure({ error })))
        )
      )
    );
  });

  addItem$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InventoryActions.addItem),
      mergeMap(({ item }) =>
        this.inventoryService.create(item).pipe(
          map(newItem => InventoryActions.addItemSuccess({ item: newItem })),
          catchError(error => of(InventoryActions.addItemFailure({ error })))
        )
      )
    );
  });

  updateItem$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InventoryActions.updateItem),
      mergeMap(({ item }) =>
        this.inventoryService.update(item.id, item).pipe(
          map(updatedItem => InventoryActions.updateItemSuccess({ item: updatedItem })),
          catchError(error => of(InventoryActions.updateItemFailure({ error })))
        )
      )
    );
  });

  deleteItem$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InventoryActions.deleteItem),
      mergeMap(({ id }) =>
        this.inventoryService.delete(id).pipe(
          map(() => InventoryActions.deleteItemSuccess({ id })),
          catchError(error => of(InventoryActions.deleteItemFailure({ error })))
        )
      )
    );
  });
}


