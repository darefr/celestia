"use client"

import { useSyncExternalStore } from "react"

// Minimal zustand-style store. Kept in-repo to avoid an external dependency.
// Supports: useStore(selector), useStore.getState(), useStore.setState(),
// useStore.subscribe().

type Listener = () => void
type SetState<T> = (partial: Partial<T> | ((prev: T) => Partial<T>)) => void
type GetState<T> = () => T
type Initializer<T> = (set: SetState<T>, get: GetState<T>) => T

export interface StoreHook<T> {
  <S>(selector: (state: T) => S): S
  (): T
  getState: GetState<T>
  setState: SetState<T>
  subscribe: (listener: Listener) => () => void
}

export function create<T>(initializer: Initializer<T>): StoreHook<T> {
  let state: T
  const listeners = new Set<Listener>()

  const setState: SetState<T> = (partial) => {
    const next = typeof partial === "function" ? (partial as (p: T) => Partial<T>)(state) : partial
    state = { ...state, ...next }
    listeners.forEach((l) => l())
  }
  const getState: GetState<T> = () => state
  const subscribe = (listener: Listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  state = initializer(setState, getState)

  function useStore<S>(selector?: (state: T) => S) {
    const select = selector ?? ((s: T) => s as unknown as S)
    return useSyncExternalStore(
      subscribe,
      () => select(getState()),
      () => select(getState()),
    )
  }

  const hook = useStore as StoreHook<T>
  hook.getState = getState
  hook.setState = setState
  hook.subscribe = subscribe
  return hook
}
