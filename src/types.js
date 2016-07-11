// @flow
export type Label = 'fetching' | 'creating' | 'updating' | 'destroying'

export type Uuid = string
export type Id = number | Uuid

export type CreateOptions = {
  optimistic: boolean;
}

export type DestroyOptions = {
  optimistic: boolean;
}

export type SaveOptions = {
  optimistic: boolean;
  patch: boolean;
}

export type Error = {
  label: Label;
  body: any;
}

export type Request = {
  label: Label;
  abort: () => void;
}

export type SetOptions = {
  add: ?boolean;
  change: ?boolean;
  remove: ?boolean;
}
