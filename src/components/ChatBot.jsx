import { useState, useRef, useEffect } from 'react'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
})

function ChatBot({ notes, cards, isDark }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI Study Buddy. Ask me anything about your notes or flashcards!',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const buildContext = () => {
    let context = 'You are an AI study tutor helping a student. '

    if (notes.trim()) {
      context += `\n\nStudent's Notes:\n${notes}`
    }

    if (cards.length > 0) {
      context += '\n\nGenerated Flashcards:'
      cards.forEach((card, i) => {
        context += `\n${i + 1}. Q: ${card.question} A: ${card.answer}`
      })
    }

    context += '\n\nAnswer questions based on the notes and flashcards. Be helpful, encouraging, and educational. If asked about something not in the notes, say so politely and offer to help with what you do know.'

    return context
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    setLoading(true)

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    try {
      const completion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: buildContext() },
          ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })

      const response = completion.choices[0].message.content
      setMessages((prev) => [...prev, { role: 'assistant', content: response }])
    } catch (err) {
      console.error(err)
      setError('Failed to get response. Please try again.')
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again!' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  return (
    <div
      className={`fixed bottom-24 right-6 w-96 rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
      style={{ maxHeight: '60vh', minHeight: '400px' }}
    >
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🤖</span>
          <span className="font-bold text-sm tracking-wide">AI Study Buddy</span>
          {notes.trim() && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">📚 Notes loaded</span>
          )}
          {cards.length > 0 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              🃏 {cards.length} cards
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
              ⚠️ Error
            </span>
          )}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('close-chat'))}
            className="text-white/80 hover:text-white p-1"
            title="Close chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: 'calc(60vh - 140px)' }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : isDark
                  ? 'bg-gray-700 text-gray-100 rounded-bl-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-gray-50 dark:bg-gray-900/50">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your notes..."
            className={`flex-1 resize-none px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
                : 'bg-white border-gray-200 text-gray-700'
            }`}
            rows={1}
            style={{ maxRows: 4 }}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Sending...</span>
              </>
            ) : (
              '➤'
            )}
          </button>
        </div>
        <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}

export default ChatBot