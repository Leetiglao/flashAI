import Groq from 'groq-sdk'

const MODEL = 'openai/gpt-oss-20b'

let client = null
function getClient() {
  if (!client) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey) throw new Error('Missing VITE_GROQ_API_KEY')
    client = new Groq({ apiKey, dangerouslyAllowBrowser: true })
  }
  return client
}

function trimNotes(notes, max = 12000) {
  return notes.trim().slice(0, max)
}

// Finds the JSON object inside the AI reply, even if it adds extra text
function extractJson(text) {
  const cleaned = (text || '').replace(/```json|```/gi, '')
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('AI did not return JSON')
  return JSON.parse(cleaned.slice(start, end + 1))
}

async function ask(messages, { temperature = 0.5, maxTokens = 4000 } = {}) {
  const res = await getClient().chat.completions.create({
    model: MODEL,
    messages,
    temperature,
    max_completion_tokens: maxTokens,
    reasoning_effort: 'low',
  })
  return res.choices?.[0]?.message?.content || ''
}

/* ---------- Flashcards ---------- */

export async function generateFlashcards(notes, count = 15) {
  const text = await ask(
    [
      {
        role: 'system',
        content:
          'You turn study notes into flashcards. Respond with ONLY valid JSON, no markdown, in this exact shape: {"flashcards":[{"question":"...","answer":"..."}]}. Questions must be clear and specific. Answers must be short (max 25 words). Never repeat the same fact twice.',
      },
      {
        role: 'user',
        content: `Create ${count} flashcards from these notes. Cover every distinct fact and concept. Aim for exactly ${count}; only go lower if the notes truly do not have enough distinct facts.\n\n${trimNotes(notes)}`,
      },
    ],
    { maxTokens: 6000 }
  )

  const data = extractJson(text)
  const cards = (data.flashcards || [])
    .filter((c) => c?.question && c?.answer)
    .map((c) => ({ question: String(c.question), answer: String(c.answer) }))

  if (!cards.length) throw new Error('No flashcards returned')
  return cards
}

/* ---------- Quiz / Mock exam ---------- */

const TYPE_RULES = {
  mcq: 'Every question must be multiple choice with exactly 4 choices.',
  tf: 'Every question must be a True/False statement.',
  mixed:
    'Mix multiple choice questions (exactly 4 choices) and True/False statements. About 70% should be multiple choice.',
}

const DIFFICULTY_RULES = {
  easy: 'Easy: direct recall of key facts and definitions.',
  medium: 'Medium: understanding of concepts and how things relate.',
  hard: 'Hard: application and tricky distractors that look plausible.',
}

function normalizeQuestion(q) {
  if (!q?.question) return null

  const isTF =
    q.type === 'tf' || (Array.isArray(q.choices) && q.choices.length === 2)
  const choices = isTF
    ? ['True', 'False']
    : (q.choices || []).slice(0, 4).map(String)
  if (choices.length < 2) return null

  let answer = q.answer
  if (typeof answer === 'boolean') answer = answer ? 0 : 1
  if (typeof answer === 'string') {
    const t = answer.trim()
    if (/^[A-D]$/i.test(t)) {
      answer = t.toUpperCase().charCodeAt(0) - 65
    } else {
      answer = choices.findIndex((c) => c.toLowerCase() === t.toLowerCase())
    }
  }
  if (!Number.isInteger(answer) || answer < 0 || answer >= choices.length) {
    return null
  }

  return {
    type: isTF ? 'tf' : 'mcq',
    question: String(q.question),
    choices,
    answer,
    explanation: q.explanation ? String(q.explanation) : '',
  }
}

export async function generateQuiz(
  notes,
  { count = 10, type = 'mixed', difficulty = 'medium' } = {}
) {
  const text = await ask(
    [
      {
        role: 'system',
        content: `You write exam questions from study notes. Respond with ONLY valid JSON, no markdown, in this exact shape:
{"title":"short quiz title","questions":[{"type":"mcq","question":"...","choices":["...","...","...","..."],"answer":0,"explanation":"one short sentence"},{"type":"tf","question":"A true or false statement","choices":["True","False"],"answer":1,"explanation":"one short sentence"}]}
"answer" is the zero-based index of the correct choice. Base questions ONLY on the notes. Spread the correct answers across different positions. Never use "all of the above" or "none of the above". Do not repeat questions.`,
      },
      {
        role: 'user',
        content: `Create ${count} questions from these notes.\n${TYPE_RULES[type]}\n${DIFFICULTY_RULES[difficulty]}\n\nNOTES:\n${trimNotes(notes)}`,
      },
    ],
    { temperature: 0.4, maxTokens: 10000 }
  )

  const data = extractJson(text)
  const questions = (data.questions || []).map(normalizeQuestion).filter(Boolean)
  if (!questions.length) throw new Error('No questions returned')

  return { title: data.title || 'Practice Quiz', questions }
}

/* ---------- Study Buddy chat ---------- */

export function buildStudyContext(notes, cards = []) {
  let ctx =
    'You are "Study Buddy", a friendly study tutor inside a flashcard app. Answer using the student\'s notes below. Keep replies short (under 120 words) and in plain text without markdown. If the student asks to be quizzed, ask ONE question at a time, wait for their answer, then say if it is right and explain briefly. If something is not in the notes, say so politely. If there are no notes yet, ask them to paste notes first, but you may still answer general study questions briefly.'

  if (notes.trim()) ctx += `\n\nSTUDENT NOTES:\n${trimNotes(notes, 6000)}`
  if (cards.length) {
    ctx +=
      '\n\nFLASHCARDS:\n' +
      cards.map((c, i) => `${i + 1}. Q: ${c.question} A: ${c.answer}`).join('\n')
  }
  return ctx
}

export async function chat(messages, context) {
  return ask(
    [
      { role: 'system', content: context },
      ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    ],
    { temperature: 0.7, maxTokens: 2000 }
  )
}