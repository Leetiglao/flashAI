import { FileText, Trash2 } from 'lucide-react'

const SAMPLE_NOTES = `The water cycle describes how water moves through Earth's systems. Evaporation occurs when heat from the sun turns liquid water into water vapor, mostly from oceans, lakes, and rivers. This vapor rises into the atmosphere and cools, a process called condensation, forming clouds. When water droplets in clouds become too heavy, they fall back to Earth as precipitation, which can be rain, snow, sleet, or hail. Once on the ground, water either collects in bodies of water, soaks into the soil (infiltration), or flows across the surface toward rivers and oceans (runoff). Plants also release water vapor into the air through a process called transpiration. This continuous cycle is powered by solar energy and gravity, and it is essential for distributing fresh water across the planet.`

export default function NotesBox({ notes, setNotes }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <label
          htmlFor="notes"
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          <FileText size={16} />
          Your notes
        </label>
        <div className="flex gap-3 text-xs font-medium">
          <button
            onClick={() => setNotes(SAMPLE_NOTES)}
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Use sample notes
          </button>
          {notes && (
            <button
              onClick={() => setNotes('')}
              className="flex items-center gap-1 text-slate-500 hover:text-red-500"
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      <textarea
        id="notes"
        rows={7}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Paste your notes here..."
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
      <p className="mt-2 text-right text-xs text-slate-400">
        {notes.length.toLocaleString()} characters
      </p>
    </section>
  )
}