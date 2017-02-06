// @flow
export type Label = 'fetching' | 'creating' | 'updating' | 'destroying'

export type OptimisticId = string
export type Id = number | OptimisticId

export type CreateOptions = {
  optimistic?: boolean;
  onProgress?: () => mixed;
}

export type DestroyOptions = {
  optimistic?: boolean;
}

export type SaveOptions = {
  optimistic?: boolean;
  patch?: boolean;
}

export type ErrorType = {
  label: Label;
  body: {};
}

export type Request = {
  label: Label;
  abort: () => void;
  progress: number;
}

export type SetOptions = {
  add?: boolean;
  change?: boolean;
  remove?: boolean;
  data?: {};
}

export type Adapter = {
  get (path: string, data?: {}, options?: {}): Request;
  post (path: string, data?: {}, options?: {}): Request;
  put (path: string, data?: {}, options?: {}): Request;
  del (path: string, options?: {}): Request;
}
