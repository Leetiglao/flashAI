import { Brain, ClipboardCheck, Sun, Moon } from 'lucide-react'

const TABS = [
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
  { id: 'quiz', label: 'Quiz Maker', icon: ClipboardCheck },
]

export default function NavBar({ activeTab, onTabChange, isDark, onToggleDark }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Brain size={20} />
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              FlashAI
            </p>
            <p className="text-[11px] font-medium text-slate-400">by Group 6</p>
          </div>
        </div>

        <nav className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  active
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            )
          })}
        </nav>

        <button
          onClick={onToggleDark}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}