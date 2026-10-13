let listeners = []
let nextId = 1

function emit(type, message) {
  const t = { id: nextId++, type, message }
  listeners.forEach((fn) => fn(t))
}

export const toast = {
  success: (message) => emit('success', message),
  error: (message) => emit('error', message),
  info: (message) => emit('info', message),
}

export function subscribe(fn) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}