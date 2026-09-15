import { useState } from 'react'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
})

function App() {
  const [notes, setNotes] = useState('')
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [flipped, setFlipped] = useState({})
  const [chatOpen, setChatOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

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
            content: `Create 8 flashcards from these notes:\n\n${notes}`,
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

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark
          ? 'bg-gray-900'
          : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
      }`}
    >
      <header
        className={`border-b sticky top-0 z-10 backdrop-blur-sm ${
          isDark
            ? 'border-gray-800 bg-gray-900/80'
            : 'border-gray-200 bg-white/80'
        }`}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              FlashAI by Group 6
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-3 py-1 rounded-full font-semibold tracking-wide">
              AI-POWERED
            </span>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="Toggle day/night mode"
            >
              {isDark ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
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
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card, i) => (
              <div
                key={i}
                onClick={() => toggleFlip(i)}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`animate-fade-in-up flip-card cursor-pointer min-h-[130px] ${
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
      </main>

      {/* Floating chat button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-2xl"
      >
        💬
      </button>

      {/* Chat panel */}
      {chatOpen && (
        <div
          className={`animate-slide-in fixed bottom-24 right-6 w-80 rounded-2xl shadow-2xl border overflow-hidden ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>🤖</span>
              <span className="font-bold text-sm tracking-wide">AI Study Buddy</span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="p-6 text-center">
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              🚧 Coming soon — chat with an AI tutor based on your notes.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App