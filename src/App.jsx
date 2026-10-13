import { useEffect, useState } from 'react'
import NavBar from './components/NavBar'
import FlashcardsView from './components/FlashcardsView'
import QuizView from './components/QuizView'
import ChatBot from './components/ChatBot'
import { ToastContainer } from './components/Toast'

function getInitialDark() {
  try {
    const saved = localStorage.getItem('flashai-dark')
    if (saved !== null) return saved === 'true'
  } catch {
    /* ignore */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export default function App() {
  const [activeTab, setActiveTab] = useState('flashcards')
  const [isDark, setIsDark] = useState(getInitialDark)
  const [notes, setNotes] = useState('')
  const [cards, setCards] = useState([])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      localStorage.setItem('flashai-dark', String(isDark))
    } catch {
      /* ignore */
    }
  }, [isDark])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <NavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Both views stay mounted so nothing is lost when switching tabs */}
        <div className={activeTab === 'flashcards' ? '' : 'hidden'}>
          <FlashcardsView
            notes={notes}
            setNotes={setNotes}
            cards={cards}
            setCards={setCards}
          />
        </div>
        <div className={activeTab === 'quiz' ? '' : 'hidden'}>
          <QuizView notes={notes} setNotes={setNotes} />
        </div>
      </main>

      <ChatBot notes={notes} cards={cards} />
      <ToastContainer />
    </div>
  )
}