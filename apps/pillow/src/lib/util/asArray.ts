export const asArray = <T,>(v?: T | T[]): T[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v]; 