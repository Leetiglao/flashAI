import { useState, useEffect } from 'react'
import Groq from 'groq-sdk'
import NavBar from './components/NavBar'
import ChatBot from './components/ChatBot'
import FormBuilder from './components/FormBuilder'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
})

function FlashcardsView({ notes, cards, loading, flipped, toggleFlip, generateFlashcards, setNotes, isDark }) {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10 flex-1">
      <div className="text-center mb-8">
        <h2 className={`text-4xl font-extrabold mb-3 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Turn your notes into{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            flashcards
          </span>
        </h2>
        <p className={`text-base font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Paste your notes below and let AI do the studying prep for you
        </p>
      </div>

      <div
        className={`rounded-2xl shadow-sm border p-6 mb-8 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}
      >
        <textarea
          className={`w-full h-40 p-4 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none ${
            isDark
              ? 'bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500'
              : 'bg-white border-gray-200 text-gray-700'
          }`}
          placeholder="Paste your notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          onClick={generateFlashcards}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold tracking-wide py-3 rounded-xl hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all duration-150 shadow-sm"
        >
          {loading ? '✨ Generating...' : '✨ Generate Flashcards'}
        </button>
      </div>

      {cards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <div
              key={i}
              onClick={() => toggleFlip(i)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`animate-fade-in-up flip-card cursor-pointer min-h-[140px] ${
                flipped[i] ? 'flipped' : ''
              }`}
            >
              <div className="flip-card-inner">
                <div
                  className={`flip-card-front shadow-sm border ${
                    isDark
                      ? 'bg-gray-800 text-gray-100 border-gray-700'
                      : 'bg-white text-gray-800 border-gray-100'
                  }`}
                >
                  <div>
                    <p className={`text-[11px] uppercase tracking-widest font-bold mb-2 ${
                      isDark ? 'text-indigo-400' : 'text-indigo-500'
                    }`}>
                      Question
                    </p>
                    <p className={`font-semibold leading-snug ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                      {card.question}
                    </p>
                  </div>
                </div>
                <div className="flip-card-back shadow-sm border bg-indigo-600 text-white border-indigo-600">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest font-bold mb-2 text-indigo-200">
                      Answer
                    </p>
                    <p className="font-semibold leading-snug">{card.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cards.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No flashcards yet
          </h3>
          <p className={`text-gray-500 dark:text-gray-400`}>
            Paste your notes above and click "Generate Flashcards" to get started
          </p>
        </div>
      )}
    </main>
  )
}

function App() {
  const [notes, setNotes] = useState('')
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [flipped, setFlipped] = useState({})
  const [chatOpen, setChatOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [activeTab, setActiveTab] = useState('flashcards')

  // Load theme preference
  useEffect(() => {
    const saved = localStorage.getItem('flashai-dark')
    if (saved !== null) {
      setIsDark(saved === 'true')
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('flashai-dark', isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // Handle chat close event
  useEffect(() => {
    const handleClose = () => setChatOpen(false)
    window.addEventListener('close-chat', handleClose)
    return () => window.removeEventListener('close-chat', handleClose)
  }, [])

  async function generateFlashcards() {
    if (!notes.trim()) return
    setLoading(true)
    setCards([])

    try {
      const completion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content:
              'You generate flashcards from study notes. Always respond with ONLY valid JSON, no extra text, no markdown formatting. Format: {"flashcards":[{"question":"...","answer":"..."}]}',
          },
          {
            role: 'user',
            content: `Create 15 flashcards from these notes. Cover as many distinct facts/concepts as possible without repeating ideas.\n\n${notes}`,
          },
        ],
        temperature: 0.5,
      })

      const raw = completion.choices[0].message.content
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setCards(parsed.flashcards)
    } catch (err) {
      console.error(err)
      alert('Something went wrong generating flashcards. Check console.')
    } finally {
      setLoading(false)
    }
  }

  function toggleFlip(index) {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const handleTabChange = (tab) => {
    if (tab === 'mobile') return
    setActiveTab(tab)
    if (tab === 'chatbot') setChatOpen(true)
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark
          ? 'bg-gray-900'
          : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
      }`}
    >
      <NavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
      />

      {activeTab === 'flashcards' && (
        <FlashcardsView
          notes={notes}
          cards={cards}
          loading={loading}
          flipped={flipped}
          toggleFlip={toggleFlip}
          generateFlashcards={generateFlashcards}
          setNotes={setNotes}
          isDark={isDark}
        />
      )}

      {activeTab === 'chatbot' && (
        <main className="max-w-6xl mx-auto px-6 py-10 flex-1">
          <div className="mb-8">
            <h2 className={`text-3xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AI Study Tutor
            </h2>
            <p className={`text-gray-500 dark:text-gray-400`}>
              Chat with an AI tutor that knows your notes and flashcards
            </p>
          </div>
          {(!notes.trim() && cards.length === 0) && (
            <div className={`p-6 rounded-2xl border text-center ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                📝 Add some notes or generate flashcards first, then come back here for personalized tutoring!
              </p>
            </div>
          )}
        </main>
      )}

      {activeTab === 'formbuilder' && (
        <FormBuilder isDark={isDark} />
      )}

      {/* Floating chat button (only on flashcards tab) */}
      {activeTab === 'flashcards' && (
        <button
          onClick={() => { setChatOpen(true); setActiveTab('chatbot'); }}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-2xl"
          title="Open AI Tutor"
        >
          🤖
        </button>
      )}

      {/* Chat panel */}
      {chatOpen && (
        <ChatBot
          notes={notes}
          cards={cards}
          isDark={isDark}
        />
      )}
    </div>
  )
}

export default App