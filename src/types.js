// @flow
export type Label = 'fetching' | 'creating' | 'updating' | 'destroying'

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

export type Adapter = {
  get(path: string, data?: {}, options?: {}): Response,
  post(path: string, data?: {}, options?: {}): Response,
  put(path: string, data?: {}, options?: {}): Response,
  del(path: string, options?: {}): Response
}
