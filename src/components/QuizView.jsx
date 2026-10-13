import { useState } from 'react'
import { ClipboardCheck, LoaderCircle, Download, RotateCcw, Sparkles } from 'lucide-react'
import NotesBox from './NotesBox'
import { generateQuiz } from '../lib/ai'
import { exportQuizPdf } from '../lib/exportQuizPdf'
import { toast } from '../lib/toast'

const LETTERS = ['A', 'B', 'C', 'D']

const selectCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </label>
      {children}
    </div>
  )
}

export default function QuizView({ notes, setNotes }) {
  const [count, setCount] = useState(10)
  const [type, setType] = useState('mixed')
  const [difficulty, setDifficulty] = useState('medium')
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (notes.trim().length < 40) {
      toast.info('Add a bit more notes first (at least a couple of sentences).')
      return
    }
    setLoading(true)
    setQuiz(null)
    setAnswers({})
    setSubmitted(false)
    try {
      const result = await generateQuiz(notes, { count, type, difficulty })
      setQuiz(result)
      toast.success(`Created ${result.questions.length} questions`)
    } catch (err) {
      console.error(err)
      toast.error('Could not generate the quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleExport(withAnswers) {
    try {
      exportQuizPdf(quiz, { withAnswers })
    } catch (err) {
      console.error(err)
      toast.error('PDF export failed.')
    }
  }

  function retake() {
    setAnswers({})
    setSubmitted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const total = quiz?.questions.length || 0
  const answered = Object.keys(answers).length
  const score = quiz
    ? quiz.questions.filter((q, i) => answers[i] === q.answer).length
    : 0
  const percent = total ? Math.round((score / total) * 100) : 0

  function choiceStyle(q, qi, ci) {
    const picked = answers[qi] === ci
    if (!submitted) {
      return picked
        ? 'border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100'
        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
    }
    if (ci === q.answer) {
      return 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
    }
    if (picked) {
      return 'border-red-400 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
    }
    return 'border-slate-200 opacity-60 dark:border-slate-700'
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Make a quiz or{' '}
          <span className="text-indigo-600 dark:text-indigo-400">mock exam</span>
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Generate questions from your notes, take them here, or export a PDF.
        </p>
      </div>

      <NotesBox notes={notes} setNotes={setNotes} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Number of questions">
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className={selectCls}
          >
            {[5, 10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>
                {n} questions
              </option>
            ))}
          </select>
        </Field>
        <Field label="Question type">
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
            <option value="mixed">Mixed</option>
            <option value="mcq">Multiple choice (4 choices)</option>
            <option value="tf">True or False</option>
          </select>
        </Field>
        <Field label="Difficulty">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className={selectCls}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </Field>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !notes.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <LoaderCircle size={18} className="animate-spin" />
            Generating quiz...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate Quiz
          </>
        )}
      </button>

      {quiz ? (
        <section className="animate-fade-in-up space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">{quiz.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {answered}/{total} answered
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExport(false)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Download size={16} />
                Exam PDF
              </button>
              <button
                onClick={() => handleExport(true)}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                <Download size={16} />
                PDF with answers
              </button>
            </div>
          </div>

          {submitted && (
            <div
              className={`rounded-2xl border p-5 text-center ${
                percent >= 75
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100'
                  : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100'
              }`}
            >
              <p className="text-3xl font-extrabold">
                {score} / {total}
              </p>
              <p className="text-sm font-medium">
                {percent}% {percent >= 75 ? 'Great job!' : 'Keep practicing, you got this.'}
              </p>
            </div>
          )}

          {quiz.questions.map((q, qi) => (
            <article
              key={qi}
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-3 flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {qi + 1}
                </span>
                <p className="font-semibold leading-snug">{q.question}</p>
              </div>

              <div className={`grid gap-2 ${q.type === 'tf' ? 'sm:grid-cols-2' : ''}`}>
                {q.choices.map((c, ci) => (
                  <button
                    key={ci}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [qi]: ci }))}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition ${choiceStyle(
                      q,
                      qi,
                      ci
                    )}`}
                  >
                    <span className="font-bold opacity-60">{LETTERS[ci]}</span>
                    <span>{c}</span>
                  </button>
                ))}
              </div>

              {submitted && q.explanation && (
                <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <span className="font-semibold">Why: </span>
                  {q.explanation}
                </p>
              )}
            </article>
          ))}

          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              disabled={answered === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ClipboardCheck size={18} />
              Submit answers
            </button>
          ) : (
            <button
              onClick={retake}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RotateCcw size={18} />
              Retake quiz
            </button>
          )}
        </section>
      ) : (
        !loading && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
            <ClipboardCheck
              size={32}
              className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
            />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No quiz yet</p>
            <p className="text-sm text-slate-400">
              Add notes, choose your settings, and generate.
            </p>
          </div>
        )
      )}
    </div>
  )
}