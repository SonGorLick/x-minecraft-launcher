export type Disposable<T> = T & {
  readonly id: string
  dispose(): void
}
