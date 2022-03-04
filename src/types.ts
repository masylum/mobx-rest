export type OptimisticId = string
export type Id = number | OptimisticId
export type RequestState = 'pending' | 'fulfilled' | 'rejected'

export interface CreateOptions {
  optimistic?: boolean
  path?: string
}

export interface DestroyOptions {
  data?: {}
  optimistic?: boolean
  path?: string
}

export interface SaveOptions {
  optimistic?: boolean
  patch?: boolean
  keepChanges?: boolean
  path?: string
}

export interface SetOptions {
  add?: boolean
  change?: boolean
  remove?: boolean
  data?: {}
}

export interface GetOptions {
  required?: boolean
}

export interface FindOptions {
  required?: boolean
}

export type RestVerbs = 'get' | 'patch' | 'post' | 'put' | 'del'

export type Adapter = {
  [key in RestVerbs]: <R = unknown>(
    path: string,
    data?: {},
    options?: {}
  ) => Promise<R>
} & {
  get<R = unknown>(path: string, data?: {}, options?: {}): Promise<R>
  patch<R = unknown>(path: string, data?: {}, options?: {}): Promise<R>
  post<R = unknown>(path: string, data?: {}, options?: {}): Promise<R>
  put<R = unknown>(path: string, data?: {}, options?: {}): Promise<R>
  del<R = unknown>(path: string, data?: {}, options?: {}): Promise<R>
}
