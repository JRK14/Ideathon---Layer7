import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

const PROVIDERS = [
  { id: 'openai', name: 'ChatGPT (OpenAI)', model: 'gpt-4o-mini', endpoint: '/api/chat/openai' },
  { id: 'gemini', name: 'Gemini (Google)', model: 'gemini-2.0-flash', endpoint: '/api/chat/gemini' },
]

function App() {
  const [provider, setProvider] = useState('gemini')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [apiKey, setApiKey] = useState({ openai: '', gemini: '' })
  const [showKeys, setShowKeys] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const currentEndpoint = PROVIDERS.find((p) => p.id === provider)?.endpoint

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const body = {
        messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
      }
      if (provider === 'openai' && apiKey.openai) body.apiKey = apiKey.openai
      if (provider === 'gemini' && apiKey.gemini) body.apiKey = apiKey.gemini

      const res = await fetch(currentEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const isRateLimit = res.status === 429
        const message = data.error || res.statusText
        throw new Error(isRateLimit ? (data.retryAfter ? `Rate limit reached. Try again in ${data.retryAfter} seconds.` : message) : message)
      }
      setMessages((m) => [...m, { role: 'assistant', content: data.content }])
    } catch (err) {
      setError(err.message)
      setMessages((m) => [...m, { role: 'assistant', content: null, error: err.message }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
    inputRef.current?.focus()
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">StudyBuddy</h1>
          <p className="tagline">AI tutor for your doubts — clear, accurate, and patient.</p>
          <div className="header-actions">
            <select
              className="provider-select"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-ghost" onClick={() => setShowKeys((s) => !s)}>
              API keys
            </button>
            <button type="button" className="btn btn-ghost" onClick={clearChat}>
              New chat
            </button>
          </div>
          {showKeys && (
            <div className="api-keys">
              <label>
                <span>OpenAI key (optional if set in server)</span>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey.openai}
                  onChange={(e) => setApiKey((k) => ({ ...k, openai: e.target.value }))}
                />
              </label>
              <label>
                <span>Gemini key (optional if set in server)</span>
                <input
                  type="password"
                  placeholder="AIza..."
                  value={apiKey.gemini}
                  onChange={(e) => setApiKey((k) => ({ ...k, gemini: e.target.value }))}
                />
              </label>
              <p className="api-hint">
                Get Gemini key free: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.
                Or set OPENAI_API_KEY / GEMINI_API_KEY in a <code>.env</code> file in the project root.
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="chat-main">
        {messages.length === 0 && (
          <div className="welcome">
            <h2>Ask anything</h2>
            <p>Math, science, languages, exam prep, study tips — get clear, step-by-step explanations.</p>
            <div className="suggestions">
              {[
                'Explain quadratic equations in simple steps',
                'What is photosynthesis?',
                'How do I improve my essay structure?',
                'Help me understand Newton’s first law',
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => setInput(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message message-${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '📚'}
              </div>
              <div className="message-body">
                {msg.role === 'user' ? (
                  <p className="message-text">{msg.content}</p>
                ) : msg.error ? (
                  <p className="message-error">{msg.error}</p>
                ) : (
                  <div className="chat-message-content message-text"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message message-assistant">
              <div className="message-avatar">📚</div>
              <div className="message-body">
                <div className="typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className={`banner ${error.toLowerCase().includes('rate limit') ? 'banner-warning' : 'banner-error'}`}>
            {error}
            {error.toLowerCase().includes('rate limit') && (
              <p className="banner-tip">Free tier has daily and per-minute limits. Wait a minute or try again later.</p>
            )}
          </div>
        )}

        <div className="input-area">
          <textarea
            ref={inputRef}
            className="input"
            placeholder="Ask your doubt..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            Send
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
