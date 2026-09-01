import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, Bot, ExternalLink, LoaderCircle, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getFAQAnswer, listFAQQuestions } from '@/services/chatService'

import './chatboard.css'

type FaqQuestion = {
  id: number
  question: string
}

type FaqAnswer = {
  id: number
  question: string
  answer: string
}

type ChatStatus = 'loading' | 'error' | 'ready' | 'answering'

const WHATSAPP_NUMBER = '15550214001'
const WHATSAPP_MESSAGE =
  'Hello Sportsphere Academy! I would like to get more information about your football programsand admissions.'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

const OPENING_MESSAGE =
  "Hi there! 👋 I'm the Sportsphere FAQ assistant. Tap one of the questions below and I'll get you an answer right away."

/**
 * Render `[label](url)` markdown-style links as safe anchors.
 * Only `https://`, `http://` and `mailto:` URLs are allowed; anything else
 * (or a plain text match) is rendered as escaped text, so no raw HTML or
 * unsafe links ever reach the DOM.
 */
function renderAnswerText(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null = null

  while ((match = pattern.exec(text)) !== null) {
    const label = match[1]
    const rawUrl = match[2].trim()
    const isSafe = /^(https?:\/\/|mailto:)/i.test(rawUrl)

    nodes.push(text.slice(lastIndex, match.index))

    if (isSafe) {
      nodes.push(
        <a
          key={`link-${match.index}`}
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="chatboard__link"
        >
          {label}
        </a>,
      )
    } else {
      nodes.push(`[${label}](${rawUrl})`)
    }

    lastIndex = match.index + match[0].length
  }

  nodes.push(text.slice(lastIndex))
  return nodes
}

export default function ChatBoard() {
  const [questions, setQuestions] = useState<FaqQuestion[]>([])
  const [selected, setSelected] = useState<FaqQuestion | null>(null)
  const [answer, setAnswer] = useState<FaqAnswer | null>(null)
  const [status, setStatus] = useState<ChatStatus>('loading')
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const loadQuestions = useCallback(async () => {
    setStatus('loading')
    try {
      const payload = await listFAQQuestions()
      if (!payload?.success) {
        throw new Error(payload?.message || 'Could not load FAQ questions.')
      }
      const items: FaqQuestion[] = Array.isArray(payload.data) ? payload.data : []
      if (!items.length) {
        throw new Error('No FAQ questions are available right now.')
      }
      setQuestions(items)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const handleSelectQuestion = useCallback(
    async (question: FaqQuestion) => {
      setSelected(question)
      setAnswer(null)
      setStatus('answering')
      try {
        const payload = await getFAQAnswer(question.id)
        if (!payload?.success) {
          throw new Error(payload?.message || 'Could not load the answer.')
        }
        setAnswer(payload.data)
        setStatus('ready')
      } catch {
        setStatus('error')
      }
    },
    [],
  )

  const handleBack = useCallback(() => {
    setSelected(null)
    setAnswer(null)
    setStatus((current) => (current === 'answering' ? 'loading' : 'ready'))
  }, [])

  // Keep the latest message / typing indicator scrolled into view.

  useEffect(() => {
    if (selected) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else {
      bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [selected, answer, status])

  const answeringBefore = status === 'answering'
  const answered = Boolean(answer)

  return (
    <section id="chat" className="relative z-20 scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#1b8a4a]/40 bg-[#1b8a4a]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-[#1b8a4a]">
            FAQ Assistant
          </span>
          <h2 className="text-balance text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">How can we help you?</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Answers to the most common questions about the Sportsphere Academy — registration, timings, programs, age groups, location and contact details.

          </p>
        </div>
{/* The Chatboard itself: header + always-visible body + footer */}
        <div className="mx-auto mt-12 w-full max-w-4xl overflow-hidden rounded-3xl border border-[#1b8a4a]/30 bg-slate-950/85 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          {/* Board header */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-[#126a37] via-[#15803d] to-[#1b8a4a] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white shadow-[0_0_20px_rgba(27,138,74,0.45)]">
                <Bot className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-black tracking-tight text-white sm:text-lg">FAQ Assistant</h3>
                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-100">
                  <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" aria-hidden="true" />
                  Online — replies instantly
                </p>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-200 sm:inline-flex">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Public Help Desk
            </span>
          </div>

          {/* Conversation body */}
          <div
            ref={bodyRef}
            role="log"
            aria-live="polite"
            aria-label="FAQ conversation"
            className="chatboard__body flex h-96 flex-col gap-3 overflow-y-auto px-4 py-5 sm:h-105 sm:px-6"
          >
            {/* Opening bot message */}
            <div className="flex items-start gap-2.5">
              <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-[#1b8a4a]/40 bg-[#126a37] text-white" aria-hidden="true">
                <Bot className="size-4" />
              </span>
              <p className="chatboard__bubble chatboard__bubble-bot">{OPENING_MESSAGE}</p>
            </div>

            {status === 'loading' && (
              <div className="flex flex-col gap-2.5 pl-10" aria-busy="true" aria-label="Loading FAQ questions">
                <div className="chatboard__skeleton h-10 w-4/5" />
                <div className="chatboard__skeleton h-10 w-3/5" />
                <div className="chatboard__skeleton h-10 w-full" />
                <div className="chatboard__skeleton h-10 w-2/3" />
              </div>
            )}

            {status === 'error' && !selected && (
              <div className="ml-10 flex flex-col items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/5 px-4 py-4">
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold text-rose-300">We couldn't reach the FAQ assistant.</p>
                  <p className="text-xs leading-relaxed text-slate-400">
                    This usually happens due to a temporary network glitch. Please try again in a moment.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-rose-400/30 text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
                  onClick={loadQuestions}
                >
                  <LoaderCircle className="size-3.5" aria-hidden="true" />
                  Try again
                </Button>
              </div>
            )}

            {status !== 'loading' && !selected && (
              <div className="mt-1 flex flex-col gap-2.5 pl-10" role="list" aria-label="Available questions">
                <p className="chatboard__bubble chatboard__bubble-bot">Here are the questions visitors ask us the most 👇</p>
                {questions.map((question) => (
                  <button
                    key={question.id}
                    type="button"
                    role="listitem"
                    onClick={() => handleSelectQuestion(question)}
                    className="group flex w-fit max-w-full items-center gap-2 rounded-2xl border border-[#1b8a4a]/30 bg-[#1b8a4a]/10 px-4 py-2.5 text-left text-sm font-medium text-emerald-100 transition-all duration-200 hover:border-[#1b8a4a] hover:bg-[#1b8a4a]/20 hover:text-white focus-visible:ring-3 focus-visible:ring-[#1b8a4a]/40"
                  >
                    <span className="flex size-1.5 shrink-0 rounded-full bg-emerald-400 transition-transform group-hover:scale-150" aria-hidden="true" />
                    {question.question}
                  </button>
                ))}
              </div>
            )}
{/* Conversation view (a question has been picked) */}
            {selected && (
              <div className="flex flex-col gap-3">
                {/* User message */}
                <div className="flex justify-end">
                  <p className="chatboard__bubble chatboard__bubble-user text-right">{selected.question}</p>
                </div>

                {/* Bot response / loading / answer-fetch error */}
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-[#1b8a4a]/40 bg-[#126a37] text-white" aria-hidden="true">
                    <Bot className="size-4" />
                  </span>
                  {status === 'answering' ? (
                    <p className="chatboard__bubble chatboard__bubble-bot" aria-busy="true" aria-label="Loading answer">
                      <span className="chatboard__typing" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="ml-2 text-xs text-slate-300">Looking up the answer…</span>
                    </p>
                  ) : status === 'error' ? (
                    <div className="flex flex-col gap-2.5 rounded-2xl border border-rose-400/20 bg-rose-500/5 px-4 py-3">
                      <p className="text-xs leading-relaxed text-slate-400">
                        Something went wrong while fetching this answer. Please try again.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-fit border-rose-400/30 text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
                        onClick={() => selected && handleSelectQuestion(selected)}
                      >
                        <LoaderCircle className="size-3.5" aria-hidden="true" />
                        Try again
                      </Button>
                    </div>
                  ) : (
                    answer && (
                      <p className="chatboard__bubble chatboard__bubble-bot">
                        {renderAnswerText(answer.answer)}
                      </p>
                    )
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
{/* Board footer */}
          <div className="flex flex-col gap-3 border-t border-white/10 bg-slate-900/70 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2">
              {selected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/15 text-slate-200 hover:bg-white/5 hover:text-white"
                  onClick={handleBack}
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  {answeringBefore ? 'Cancel' : 'Back to questions'}
                </Button>
              ) : (
                <span className="text-xs text-slate-500">
                  {answered ? '1 question answered' : `${questions.length || '…'} curated questions available`}
                </span>
              )}
            </div>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#25D366] to-[#128C7E] px-4 py-2 text-xs font-bold text-white shadow-[0_0_18px_rgba(37,211,102,0.35)] transition-all duration-200 hover:shadow-[0_0_26px_rgba(37,211,102,0.55)] hover:brightness-110 active:scale-95"
              aria-label="Continue the conversation on WhatsApp with Sportsphere Academy"
            >
              <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              Chat on WhatsApp
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <p className="mx-auto mt-5 flex max-w-3xl items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <Sparkles className="size-3.5 text-[#1b8a4a]" aria-hidden="true" />
          Powered by the Sportsphere public knowledge base. Prefer a human? Use the WhatsApp button above.

        </p>
      </div>
    </section>
  )
}