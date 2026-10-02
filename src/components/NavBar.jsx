import { useState } from 'react'

function NavBar({ activeTab, onTabChange, isDark, onToggleDark }) {
  const tabs = [
    { id: 'flashcards', label: '🧠 Flashcards', icon: '🧠' },
    { id: 'chatbot', label: '🤖 AI Tutor', icon: '🤖' },
    { id: 'formbuilder', label: '📝 Form Builder', icon: '📝' },
  ]

  return (
    <header
      className={`border-b sticky top-0 z-50 backdrop-blur-sm ${
        isDark
          ? 'border-gray-800 bg-gray-900/90'
          : 'border-gray-200 bg-white/90'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              FlashAI
            </h1>
            <span className="text-xs bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold tracking-wide hidden sm:inline">
              by Group 6
            </span>
          </div>

          {/* Navigation tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => onTabChange(activeTab === 'mobile' ? null : 'mobile')}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ☰
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDark}
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

        {/* Mobile tabs dropdown */}
        {activeTab === 'mobile' && (
          <div className="md:hidden mt-3 bg-gray-100 dark:bg-gray-800 rounded-xl p-2 animate-slide-in">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}

export default NavBar