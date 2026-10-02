import { useState, useRef } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const QUESTION_TYPES = [
  { id: 'short', label: 'Short answer', icon: '📝', description: 'Single line text input' },
  { id: 'paragraph', label: 'Paragraph', icon: '📄', description: 'Multi-line text input' },
  { id: 'multiple_choice', label: 'Multiple choice', icon: '🔘', description: 'Select one option' },
  { id: 'checkboxes', label: 'Checkboxes', icon: '☑️', description: 'Select multiple options' },
  { id: 'dropdown', label: 'Dropdown', icon: '🔽', description: 'Select from a list' },
  { id: 'linear_scale', label: 'Linear scale', icon: '📊', description: 'Rate on a scale' },
  { id: 'date', label: 'Date', icon: '📅', description: 'Date picker' },
  { id: 'time', label: 'Time', icon: '🕐', description: 'Time picker' },
]

function FormBuilder({ isDark }) {
  const [formTitle, setFormTitle] = useState('Untitled Form')
  const [formDescription, setFormDescription] = useState('')
  const [questions, setQuestions] = useState([
    { id: 1, type: 'short', title: 'Question 1', required: false, options: [] },
  ])
  const [nextId, setNextId] = useState(2)
  const [selectedQuestionId, setSelectedQuestionId] = useState(1)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewAnswers, setPreviewAnswers] = useState({})
  const formRef = useRef(null)

  const addQuestion = (type) => {
    const newQuestion = {
      id: nextId,
      type,
      title: `Question ${nextId}`,
      required: false,
      options: ['multiple_choice', 'checkboxes', 'dropdown'].includes(type) ? ['Option 1', 'Option 2'] : [],
    }
    setQuestions((prev) => [...prev, newQuestion])
    setNextId((prev) => prev + 1)
    setSelectedQuestionId(newQuestion.id)
    setShowAddMenu(false)
  }

  const updateQuestion = (id, updates) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    )
  }

  const deleteQuestion = (id) => {
    if (questions.length <= 1) return
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    if (selectedQuestionId === id) {
      setSelectedQuestionId(questions[0]?.id || null)
    }
  }

  const duplicateQuestion = (id) => {
    const question = questions.find((q) => q.id === id)
    if (!question) return
    const newQuestion = {
      ...question,
      id: nextId,
      title: `${question.title} (copy)`,
    }
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id)
      return [...prev.slice(0, idx + 1), newQuestion, ...prev.slice(idx + 1)]
    })
    setNextId((prev) => prev + 1)
  }

  const moveQuestion = (id, direction) => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id)
      if (idx === -1) return prev
      const newIdx = idx + direction
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const newQuestions = [...prev]
      ;[newQuestions[idx], newQuestions[newIdx]] = [newQuestions[newIdx], newQuestions[idx]]
      return newQuestions
    })
  }

  const addOption = (questionId) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: [...q.options, `Option ${q.options.length + 1}`] }
          : q
      )
    )
  }

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, i) => (i === optionIndex ? value : opt)),
            }
          : q
      )
    )
  }

  const removeOption = (questionId, optionIndex) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
          : q
      )
    )
  }

  const handlePreviewInput = (questionId, value) => {
    setPreviewAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const exportAsPDF = async () => {
    if (!formRef.current) return

    const originalPreview = previewMode
    setPreviewMode(true)
    await new Promise((r) => setTimeout(r, 100))

    try {
      const canvas = await html2canvas(formRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${formTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setPreviewMode(originalPreview)
    }
  }

  const exportAsJSON = () => {
    const data = {
      title: formTitle,
      description: formDescription,
      questions: questions.map((q) => ({
        type: q.type,
        title: q.title,
        required: q.required,
        options: q.options,
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formTitle.replace(/[^a-z0-9]/gi, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFromJSON = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (data.title) setFormTitle(data.title)
        if (data.description) setFormDescription(data.description)
        if (data.questions && Array.isArray(data.questions)) {
          const importedQuestions = data.questions.map((q, i) => ({
            id: nextId + i,
            type: q.type || 'short',
            title: q.title || `Question ${i + 1}`,
            required: q.required || false,
            options: q.options || [],
          }))
          setQuestions(importedQuestions)
          setNextId((prev) => prev + importedQuestions.length)
          setSelectedQuestionId(importedQuestions[0]?.id || null)
        }
      } catch (err) {
        console.error('Import failed:', err)
        alert('Failed to import form. Invalid JSON file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const getTypeInfo = (typeId) => QUESTION_TYPES.find((t) => t.id === typeId) || QUESTION_TYPES[0]

  const getQuestionComponent = (question) => {
    switch (question.type) {
      case 'short':
        return (
          <input
            type="text"
            placeholder="Your answer"
            value={previewAnswers[question.id] || ''}
            onChange={(e) => handlePreviewInput(question.id, e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
                : 'bg-white border-gray-200 text-gray-700'
            }`}
            disabled={!previewMode}
          />
        )
      case 'paragraph':
        return (
          <textarea
            placeholder="Your answer"
            value={previewAnswers[question.id] || ''}
            onChange={(e) => handlePreviewInput(question.id, e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
                : 'bg-white border-gray-200 text-gray-700'
            }`}
            rows={3}
            disabled={!previewMode}
          />
        )
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition ${
                  previewAnswers[question.id] === opt
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : isDark
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`q_${question.id}`}
                  value={opt}
                  checked={previewAnswers[question.id] === opt}
                  onChange={() => handlePreviewInput(question.id, opt)}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                  disabled={!previewMode}
                />
                <span className="text-base">{opt}</span>
              </label>
            ))}
          </div>
        )
      case 'checkboxes':
        return (
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition ${
                  (previewAnswers[question.id] || []).includes(opt)
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : isDark
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  value={opt}
                  checked={(previewAnswers[question.id] || []).includes(opt)}
                  onChange={(e) =>
                    handlePreviewInput(
                      question.id,
                      e.target.checked
                        ? [...(previewAnswers[question.id] || []), opt]
                        : (previewAnswers[question.id] || []).filter((o) => o !== opt)
                    )
                  }
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  disabled={!previewMode}
                />
                <span className="text-base">{opt}</span>
              </label>
            ))}
          </div>
        )
      case 'dropdown':
        return (
          <select
            value={previewAnswers[question.id] || ''}
            onChange={(e) => handlePreviewInput(question.id, e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-100'
                : 'bg-white border-gray-200 text-gray-700'
            }`}
            disabled={!previewMode}
          >
            <option value="">Select an option</option>
            {question.options.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )
      case 'linear_scale':
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>1 - Low</span>
              <span>5 - High</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePreviewInput(question.id, num)}
                  className={`flex-1 py-3 rounded-xl font-medium transition ${
                    previewAnswers[question.id] === num
                      ? 'bg-indigo-600 text-white'
                      : isDark
                      ? 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={!previewMode}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )
      case 'date':
        return (
          <input
            type="date"
            value={previewAnswers[question.id] || ''}
            onChange={(e) => handlePreviewInput(question.id, e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-100'
                : 'bg-white border-gray-200 text-gray-700'
            }`}
            disabled={!previewMode}
          />
        )
      case 'time':
        return (
          <input
            type="time"
            value={previewAnswers[question.id] || ''}
            onChange={(e) => handlePreviewInput(question.id, e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-100'
                : 'bg-white border-gray-200 text-gray-700'
            }`}
            disabled={!previewMode}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 p-4 rounded-2xl border">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Form title"
              className={`text-2xl font-bold border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded px-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            />
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
                previewMode
                  ? 'bg-indigo-600 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {previewMode ? '🔧 Edit' : '👁️ Preview'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportAsPDF}
              className="px-4 py-2 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-2"
            >
              📄 Export PDF
            </button>
            <button
              onClick={exportAsJSON}
              className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
                isDark
                  ? 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💾 Export JSON
            </button>
            <label
              className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📂 Import JSON
              <input
                type="file"
                accept=".json"
                onChange={importFromJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Form Header */}
        <div className="mb-8 p-6 rounded-2xl border">
          <h1 className={`text-3xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formTitle}
          </h1>
          {formDescription && (
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {formDescription}
            </p>
          )}
          {!previewMode && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Form description (optional)"
                className={`flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              />
            </div>
          )}
        </div>

        {/* Add Question Button */}
        {!previewMode && (
          <div className="mb-6">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full py-3 border-2 border-dashed rounded-2xl font-medium transition flex items-center justify-center gap-2"
              style={{
                borderColor: isDark ? '#374151' : '#d1d5db',
                color: isDark ? '#9ca3af' : '#6b7280',
                backgroundColor: isDark ? '#1f2937' : '#f9fafb',
              }}
            >
              <span>➕</span>
              <span>Add question</span>
            </button>
          </div>
        )}

        {/* Add Question Menu */}
        {!previewMode && showAddMenu && (
          <div className="mb-6 animate-fade-in-up">
            <div
              className={`bg-white dark:bg-gray-800 border rounded-2xl shadow-xl p-4 ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUESTION_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => addQuestion(type.id)}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      isDark
                        ? 'border-gray-700 hover:border-indigo-500 hover:bg-gray-700'
                        : 'border-gray-200 hover:border-indigo-500 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        <div ref={formRef} className="space-y-4">
          {questions.map((question, index) => {
            const typeInfo = getTypeInfo(question.type)
            const isSelected = selectedQuestionId === question.id
            const RequiredIndicator = question.required ? (
              <span className="text-red-500 ml-1" title="Required">*</span>
            ) : null

            return (
              <div
                key={question.id}
                className={`relative group transition-all ${
                  isSelected && !previewMode ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                {!previewMode && (
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveQuestion(question.id, -1)}
                      disabled={index === 0}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border shadow hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveQuestion(question.id, 1)}
                      disabled={index === questions.length - 1}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border shadow hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                )}

                <div
                  className={`p-6 rounded-2xl border transition-all ${
                    previewMode
                      ? isDark
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                      : isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 shadow-lg'
                      : isDark
                      ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => !previewMode && setSelectedQuestionId(question.id)}
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-2xl ${
                        previewMode
                          ? 'bg-indigo-100 dark:bg-indigo-900/30'
                          : isDark
                          ? 'bg-gray-700'
                          : 'bg-gray-100'
                      }`}
                    >
                      {typeInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      {!previewMode ? (
                        <input
                          type="text"
                          value={question.title}
                          onChange={(e) => {
                            e.stopPropagation()
                            updateQuestion(question.id, { title: e.target.value })
                          }}
                          className={`w-full text-xl font-semibold border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded px-1 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        />
                      ) : (
                        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {question.title}
                          {RequiredIndicator}
                        </h3>
                      )}
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {typeInfo.label}
                      </p>
                    </div>
                    {!previewMode && (
                      <div className="flex items-center gap-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => {
                              e.stopPropagation()
                              updateQuestion(question.id, { required: e.target.checked })
                            }}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm">Required</span>
                        </label>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateQuestion(question.id)
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          title="Duplicate"
                        >
                          📋
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteQuestion(question.id)
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Question Content */}
                  <div className="mt-2">
                    {getQuestionComponent(question)}

                    {/* Options editor for choice questions */}
                    {!previewMode &&
                      ['multiple_choice', 'checkboxes', 'dropdown'].includes(question.type) && (
                        <div className="mt-4 space-y-2">
                          {question.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => updateOption(question.id, i, e.target.value)}
                                className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                              <button
                                onClick={() => removeOption(question.id, i)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remove option"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addOption(question.id)}
                            className="w-full py-2 border-2 border-dashed rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                            style={{
                              borderColor: isDark ? '#374151' : '#d1d5db',
                              color: isDark ? '#9ca3af' : '#6b7280',
                              backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                            }}
                          >
                            <span>➕</span>
                            <span>Add option</span>
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )
          })}

          {questions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No questions yet. Click "Add question" to get started!
              </p>
            </div>
          )}
        </div>

        {/* Preview mode notice */}
        {previewMode && (
          <div className="mt-8 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
            <p className="text-center text-indigo-700 dark:text-indigo-300 font-medium">
              👁️ Preview Mode — Fill out the form to test it. Click "Edit" to return to editing.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FormBuilder