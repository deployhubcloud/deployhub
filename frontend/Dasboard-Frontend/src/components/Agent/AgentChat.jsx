import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/apiclient'

const WELCOME = 'Hi — how can I help with your DeployHub projects?\n\nI can check fleet health, diagnose failures, analytics, domains, billing, create a free static project, redeploy, and more.'

function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words
          ${isUser
            ? 'bg-amber-500/90 text-black rounded-br-md'
            : 'bg-white/[0.06] text-neutral-200 border border-white/[0.06] rounded-bl-md'
          }`}
      >
        {content}
      </div>
    </div>
  )
}

export default function AgentChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: WELCOME }])
    }
  }, [open, messages.length])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, messages, sending])

  const send = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    setError(null)
    setInput('')
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setSending(true)

    try {
      const history = next
        .filter((m) => !(m.role === 'assistant' && m.content === WELCOME))
        .map(({ role, content }) => ({ role, content }))

      const { data } = await api.post('/agent/chat', { messages: history })

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data?.reply || 'Sorry, I could not generate a reply.' },
      ])
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Agent request failed'
      setError(msg)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Something went wrong: ${msg}` },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-colors"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[min(560px,70vh)] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214] shadow-2xl shadow-black/50">
          <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">DeployHub Assistant</p>
              <p className="text-xs text-neutral-500">Projects, builds, logs &amp; actions</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMessages([{ role: 'assistant', content: WELCOME }])
                setError(null)
              }}
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              Clear
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} />
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.06] px-3.5 py-2.5 text-sm text-neutral-500">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p className="px-4 pb-1 text-xs text-red-400/90">{error}</p>
          )}

          <form onSubmit={send} className="border-t border-white/[0.06] p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                placeholder="Ask about your projects…"
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-500/40"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded-xl bg-amber-500 px-3.5 text-sm font-medium text-black disabled:opacity-40 hover:bg-amber-400"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
