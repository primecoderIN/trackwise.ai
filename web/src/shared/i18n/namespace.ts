// Type utility ensuring every non-English locale file mirrors the nested structure of its English source file
// (where missing or extra keys become compile errors via `satisfies Translation<typeof en>`).

/** Shape of a translation file matching `T`'s nested keys with string leaves. */
export type Translation<T> = {
  [K in keyof T]: T[K] extends string ? string : Translation<T[K]>
}
