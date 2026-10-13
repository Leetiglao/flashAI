import { jsPDF } from 'jspdf'

const LETTERS = ['A', 'B', 'C', 'D']

// jsPDF's default font only supports basic Latin characters
const clean = (s = '') =>
  String(s)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '')

export function exportQuizPdf(quiz, { withAnswers = false } = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentW = pageW - margin * 2
  let y = margin

  function ensureSpace(h) {
    if (y + h > pageH - margin) {
      doc.addPage()
      y = margin
    }
  }

  function write(
    text,
    { size = 11, bold = false, indent = 0, after = 2, color = [0, 0, 0] } = {}
  ) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lineH = size * 0.5
    const lines = doc.splitTextToSize(clean(text), contentW - indent)
    for (const line of lines) {
      ensureSpace(lineH)
      y += lineH
      doc.text(line, margin + indent, y)
    }
    y += after
  }

  // Header
  write(quiz.title || 'Practice Quiz', { size: 20, bold: true, after: 4 })
  write(
    `Name: ______________________    Date: ______________    Score: ______ / ${quiz.questions.length}`,
    { size: 10, after: 3 }
  )
  write('Instructions: Choose the best answer for each question.', {
    size: 10,
    color: [90, 90, 90],
    after: 2,
  })
  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // Questions
  quiz.questions.forEach((q, i) => {
    ensureSpace(30)
    write(`${i + 1}. ${q.question}`, { size: 11.5, bold: true, after: 1.5 })
    q.choices.forEach((c, ci) => {
      write(`${LETTERS[ci]}.  ${c}`, { indent: 6, after: 1 })
    })
    y += 4
  })

  // Answer key
  if (withAnswers) {
    doc.addPage()
    y = margin
    write('Answer Key', { size: 18, bold: true, after: 4 })
    quiz.questions.forEach((q, i) => {
      ensureSpace(14)
      write(`${i + 1}. ${LETTERS[q.answer]}. ${q.choices[q.answer]}`, {
        bold: true,
        after: 0.5,
      })
      if (q.explanation) {
        write(q.explanation, {
          size: 9.5,
          indent: 6,
          color: [90, 90, 90],
          after: 2.5,
        })
      } else {
        y += 2
      }
    })
  }

  // Page numbers
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(140, 140, 140)
    doc.text(`Page ${p} of ${pages}`, pageW / 2, pageH - 8, { align: 'center' })
  }

  const slug =
    (quiz.title || 'quiz')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'quiz'
  doc.save(`${slug}${withAnswers ? '-with-answers' : ''}.pdf`)
}