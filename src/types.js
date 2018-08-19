// @flow
export type OptimisticId = string
export type Id = number | OptimisticId
export type RequestState = 'pending' | 'fulfilled' | 'rejected'

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
  onProgress?: () => mixed,
  keepChanges?: boolean
}

export type Response = {
  abort: () => void,
  promise: Promise<*>
}

export type RequestOptions = {
  abort: ?() => void,
  progress?: number,
  labels: Array<string>
}

export type SetOptions = {
  add?: boolean,
  change?: boolean,
  remove?: boolean,
  data?: {}
}

export type GetOptions = {
  required?: boolean,
}

export type FindOptions = {
  required?: boolean,
}

export type Adapter = {
  get(path: string, data?: {}, options?: {}): Response,
  patch(path: string, data?: {}, options?: {}): Response,
  post(path: string, data?: {}, options?: {}): Response,
  put(path: string, data?: {}, options?: {}): Response,
  del(path: string, options?: {}): Response
}
