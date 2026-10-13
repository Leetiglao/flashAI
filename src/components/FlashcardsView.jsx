import { useState } from 'react'
import { Sparkles, LoaderCircle, Brain } from 'lucide-react'
import NotesBox from './NotesBox'
import { generateFlashcards } from '../lib/ai'
import { toast } from '../lib/toast'

export default function FlashcardsView({ notes, setNotes, cards, setCards }) {
  const [count, setCount] = useState(15)
  const [loading, setLoading] = useState(false)
  const [flipped, setFlipped] = useState({})

  async function handleGenerate() {
    if (notes.trim().length < 40) {
      toast.info('Add a bit more notes first (at least a couple of sentences).')
      return
    }
    setLoading(true)
    setCards([])
    setFlipped({})
    try {
      const result = await generateFlashcards(notes, count)
      setCards(result)
      toast.success(`Generated ${result.length} flashcards`)
    } catch (err) {
      console.error(err)
      toast.error('Could not generate flashcards. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const flip = (i) => setFlipped((prev) => ({ ...prev, [i]: !prev[i] }))

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Turn your notes into{' '}
          <span className="text-indigo-600 dark:text-indigo-400">flashcards</span>
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Paste your notes, pick how many cards you want, and let AI do the rest.
        </p>
      </div>

      <NotesBox notes={notes} setNotes={setNotes} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-48">
          <label
            htmlFor="card-count"
            className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400"
          >
            Number of cards
          </label>
          <select
            id="card-count"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {[10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>
                {n} cards
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !notes.trim()}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <LoaderCircle size={18} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate Flashcards
            </>
          )}
        </button>
      </div>

      {cards.length > 0 ? (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {cards.length} cards. Tap a card to flip it.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => flip(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    flip(i)
                  }
                }}
                aria-label={`Flashcard ${i + 1}. Press Enter to flip.`}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                className={`animate-fade-in-up flip-card h-52 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  flipped[i] ? 'flipped' : ''
                }`}
              >
                <div className="flip-card-inner">
                  <div className="flip-face rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                    <span className="mb-2 text-[11px] font-bold uppercase tracking-widest text-indigo-500">
                      Question {i + 1}
                    </span>
                    <p className="font-semibold leading-snug">{card.question}</p>
                  </div>
                  <div className="flip-face flip-back rounded-2xl bg-indigo-600 text-white shadow-sm">
                    <span className="mb-2 text-[11px] font-bold uppercase tracking-widest text-indigo-200">
                      Answer
                    </span>
                    <p className="font-medium leading-snug">{card.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        !loading && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
            <Brain size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              No flashcards yet
            </p>
            <p className="text-sm text-slate-400">
              Add notes above and hit Generate.
            </p>
          </div>
        )
      )}
    </div>
  )
}