import { useState } from 'react'
import { ArrowUp, Sparkles, Trash2 } from 'lucide-react'
import { api } from '../api/apiclient'
import { Modal } from './ui'

export default function Assistant({ onClose }) {
  const [messages, setMessages] = useState([]),
    [input, setInput] = useState(''),
    [busy, setBusy] = useState(false),
    [memory, setMemory] = useState(''),
    [error, setError] = useState('')
  async function send(event) {
    event.preventDefault()
    const message = input.trim()
    if (!message || busy) return
    setMessages((previous) => [...previous, { role: 'user', content: message }])
    setInput('')
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post('/agent/chat', {
        message,
        memory: memory || undefined,
        recent: messages.slice(-4).map((m) => ({ role: m.role, content: m.content.slice(0, 600) })),
      })
      if (data.memory) setMemory(data.memory)
      setMessages((previous) => [
        ...previous,
        { role: 'assistant', content: data.reply || 'No reply was returned. Please try again.' },
      ])
    } catch (e) {
      setError(e.response?.data?.message || 'The assistant could not connect. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      title="A little help along the way."
      description="Your DeployHub assistant"
      onClose={onClose}
    >
      <div className="assistant-messages" role="log" aria-live="polite">
        {!messages.length && (
          <div className="assistant-welcome">
            <Sparkles size={26} />
            <h3>What are you working on?</h3>
            <p>Ask about deployments, build errors, or configuring your next project.</p>
            <button
              className="btn"
              onClick={() => setInput('How do I troubleshoot a failed build?')}
            >
              Help me troubleshoot a build
            </button>
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`assistant-message ${message.role}`}>
            <small>{message.role === 'user' ? 'You' : 'Deploy assistant'}</small>
            <p>{message.content}</p>
          </div>
        ))}
        {busy && (
          <p className="muted" role="status">
            Thinking it through…
          </p>
        )}
      </div>
      {error && (
        <div role="alert" className="form-error">
          {error}
        </div>
      )}
      <form className="assistant-composer" onSubmit={send}>
        <input
          autoFocus
          maxLength={3000}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-label="Message the deployment assistant"
          placeholder="Ask about your next deployment…"
        />
        <button className="btn primary" disabled={busy || !input.trim()} aria-label="Send message">
          <ArrowUp size={17} />
        </button>
      </form>
      {!!messages.length && (
        <button
          className="assistant-clear"
          disabled={busy}
          onClick={() => {
            setMessages([])
            setMemory('')
            setError('')
          }}
        >
          <Trash2 size={12} />
          Clear conversation
        </button>
      )}
    </Modal>
  )
}
