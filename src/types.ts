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

export interface Adapter {
  get<T = unknown>(path: string, data?: {}, options?: {}): Promise<T>
  patch<T = unknown>(path: string, data?: {}, options?: {}): Promise<T>
  post<T = unknown>(path: string, data?: {}, options?: {}): Promise<T>
  put<T = unknown>(path: string, data?: {}, options?: {}): Promise<T>
  del<T = unknown>(path: string, data?: {}, options?: {}): Promise<T>
}
