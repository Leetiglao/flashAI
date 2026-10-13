import { useEffect, useState } from 'react'
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react'
import { subscribe } from '../lib/toast'

const STYLES = {
  success: {
    icon: CircleCheck,
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  },
  error: {
    icon: CircleAlert,
    cls: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  },
  info: {
    icon: Info,
    cls: 'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200',
  },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return subscribe((t) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 4000)
    })
  }, [])

  function dismiss(id) {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }

  if (!toasts.length) return null

  return (
    <div className="fixed left-4 right-4 top-16 z-50 flex flex-col items-end gap-2 sm:left-auto">
      {toasts.map((t) => {
        const { icon: Icon, cls } = STYLES[t.type] || STYLES.info
        return (
          <div
            key={t.id}
            role="alert"
            className={`animate-slide-in flex w-full max-w-sm items-start gap-3 rounded-xl border p-3 text-sm font-medium shadow-lg ${cls}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}