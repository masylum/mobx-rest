// @flow
export type OptimisticId = string
export type Id = number | OptimisticId

export type CreateOptions = {
  optimistic?: boolean,
  onProgress?: () => mixed
}

export type DestroyOptions = {
  optimistic?: boolean
}

export type SaveOptions = {
  optimistic?: boolean,
  patch?: boolean,
  onProgress?: () => mixed
}

export type Response = {
  abort: () => void,
  promise: Promise<*>
}

export type SetOptions = {
  add?: boolean,
  change?: boolean,
  remove?: boolean,
  data?: {}
}

export type GetOptions = {
  mustGet?: boolean,
}

export type FindOptions = {
  mustFind?: boolean,
}

export type Adapter = {
  get(path: string, options?: {}): Response,
  patch(path: string, options?: {}): Response,
  post(path: string, options?: {}): Response,
  put(path: string, options?: {}): Response,
  del(path: string, options?: {}): Response
}
