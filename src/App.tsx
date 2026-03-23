import { lazy, Suspense, type ReactNode } from 'react'
import Layout from './components/Layout'
import MoodSelector from './components/MoodSelector'
import QuestionCard from './components/QuestionCard'
import questions from './data/questions'
import { useQuestionnaire } from './hooks/useQuestionnaire'
import type { Recommendation, UserProfile } from './types'

const ResultsView = lazy(() => import('./components/ResultsView'))

type MessageCardProps = {
  eyebrow: string
  title: string
  body: string
  actions?: ReactNode
}

function MessageCard({ eyebrow, title, body, actions }: MessageCardProps) {
  return (
    <section className="rounded-sm border border-[color:var(--cm-border)] bg-[color:var(--cm-panel)] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <p className="[font-family:var(--cm-font-mono)] text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--cm-lavender)]">
        {eyebrow}
      </p>
      <h1 className="mt-4 text-3xl leading-tight text-[color:var(--cm-text)] [font-family:var(--cm-font-serif)] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-5 text-base leading-7 text-[color:var(--cm-text-soft)] [font-family:var(--cm-font-serif)]">
        {body}
      </p>
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  )
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <MessageCard
        eyebrow="Loading"
        title="Projecting your next film"
        body="We’re calibrating mood, intensity, and moral complexity into a tighter recommendation set."
      />
      {Array.from({ length: 3 }, (_, index) => (
        <section
          key={index}
          aria-hidden="true"
          className="animate-pulse rounded-sm border border-[color:var(--cm-border)] bg-[color:var(--cm-panel-muted)] p-6"
        >
          <div className="h-3 w-24 rounded-full bg-[rgba(212,168,67,0.18)]" />
          <div className="mt-4 h-7 w-3/4 rounded-full bg-[rgba(232,224,212,0.12)]" />
          <div className="mt-6 space-y-3">
            <div className="h-3 rounded-full bg-[rgba(232,224,212,0.08)]" />
            <div className="h-3 rounded-full bg-[rgba(232,224,212,0.08)]" />
            <div className="h-3 w-5/6 rounded-full bg-[rgba(232,224,212,0.08)]" />
          </div>
        </section>
      ))}
    </div>
  )
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string
  onRetry: () => void
}) {
  return (
    <MessageCard
      actions={
        <button
          className="cinematch-focus rounded-sm border border-[color:var(--cm-border-strong)] px-4 py-3 [font-family:var(--cm-font-mono)] text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--cm-text)] transition hover:border-[color:var(--cm-gold)] hover:bg-[rgba(212,168,67,0.08)]"
          onClick={onRetry}
          type="button"
        >
          Retry
        </button>
      }
      body={error}
      eyebrow="Error"
      title="Recommendation request failed"
    />
  )
}

function ResultsFallback({
  profile,
  recommendations,
}: {
  profile: UserProfile
  recommendations: Recommendation[]
}) {
  return (
    <div className="space-y-6">
      <MessageCard
        eyebrow="Results"
        title="Preparing the results view"
        body={`Loaded ${recommendations.length} recommendations for your ${profile.mood} profile with ${profile.copingStyle ?? 'balanced'} mood regulation.`}
      />
    </div>
  )
}

function App() {
  const {
    getProfile,
    handleAnswer,
    handleMood,
    error,
    loading,
    recommendations,
    retryRecommendations,
    reset,
    step,
  } = useQuestionnaire()
  const profile = getProfile()

  let content = <LoadingState />

  if (step <= 4) {
    content = (
      <QuestionCard
        currentStep={step}
        onAnswer={handleAnswer}
        question={questions[step]}
      />
    )
  } else if (step === 5) {
    content = <MoodSelector onMoodSelect={handleMood} />
  } else if (step === 6) {
    content = loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={retryRecommendations} /> : <LoadingState />
  } else if (step === 7 && recommendations && profile) {
    content = (
      <Suspense
        fallback={
          <ResultsFallback
            profile={profile}
            recommendations={recommendations}
          />
        }
      >
        <ResultsView profile={profile} recommendations={recommendations} />
      </Suspense>
    )
  }

  return (
    <Layout onRestart={reset} step={step}>
      <div key={step} className="fade-step">
        {content}
      </div>
    </Layout>
  )
}

export default App
