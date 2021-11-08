declare module 'multiple-array-sorter' {
  declare type MoveMap = {from: number, to: number}[];
  declare interface SortParams {
    sortProp: string | undefined,
    sortOrder?: 'asc' | 'desc',
  }
  declare interface MoveMapResult<T> {
    moveMap: MoveMap,
    sortedMasterArray: T[]
  }
  export function getMoveMap<T>(arr: T[], sortParams: SortParams): MoveMapResult<T>;
  export function sortArrayBasedOnMoveMap<T>(array: T[], moveMap: MoveMap): T[]
}
