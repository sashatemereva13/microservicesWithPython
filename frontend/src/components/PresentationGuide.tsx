import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DEFAULT_PRESENTATION_STEP_ID, PRESENTATION_STEPS, type PresentationStepId } from '../presentation'

interface PresentationGuideProps {
  activeStepId: PresentationStepId
  onStepSelect: (stepId: PresentationStepId) => void
  onTogglePresentationMode: () => void
  presentationMode: boolean
}

const PresentationGuide = ({
  activeStepId,
  onStepSelect,
  onTogglePresentationMode,
  presentationMode,
}: PresentationGuideProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const scrollToTarget = (targetId: string) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(targetId)

        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    })
  }

  const activeStep =
    PRESENTATION_STEPS.find((step) => step.id === activeStepId) ??
    PRESENTATION_STEPS.find((step) => step.id === DEFAULT_PRESENTATION_STEP_ID)!

  return (
    <>
      <button
        type="button"
        className={`presentation-dock-trigger ${isOpen ? 'presentation-dock-trigger--open' : ''}`}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>Live flow</span>
        <strong>{activeStep.id}</strong>
      </button>

      <aside className={`presentation-guide ${isOpen ? 'presentation-guide--open' : ''}`} aria-label="Presentation menu">
        <div className="presentation-guide__header">
          <div>
            <p className="eyebrow">Presentation mode</p>
            <h2>Live flow</h2>
          </div>
          <div className="presentation-guide__controls">
            <span className="pill pill--muted">{PRESENTATION_STEPS.length} steps</span>
            <button type="button" className="presentation-toggle" onClick={onTogglePresentationMode}>
              {presentationMode ? 'Focus on' : 'Focus off'}
            </button>
            <button type="button" className="presentation-close" onClick={() => setIsOpen(false)} aria-label="Close live flow">
              Close
            </button>
          </div>
        </div>

        <div className="presentation-guide__summary">
          <strong>Step {activeStep.id} · {activeStep.title}</strong>
          <p>{activeStep.say}</p>
          <small>{activeStep.do}</small>
        </div>

        <div className="presentation-steps">
          {PRESENTATION_STEPS.map((step) => {
            const isRouteActive = location.pathname === step.route
            const isSelected = activeStepId === step.id

            return (
              <button
                key={step.id}
                type="button"
                className={`presentation-step ${isSelected ? 'presentation-step--active' : ''} ${isRouteActive ? 'presentation-step--route' : ''}`}
                onClick={() => {
                  onStepSelect(step.id)
                  navigate({
                    pathname: step.route,
                    hash: `#${step.targetId}`,
                  })
                  scrollToTarget(step.targetId)
                  setIsOpen(false)
                }}
              >
                <div className="presentation-step__top">
                  <span className="presentation-step__id">{step.id}</span>
                  <span className={`presentation-step__route ${isRouteActive ? 'presentation-step__route--active' : ''}`}>
                    {step.routeLabel}
                  </span>
                </div>

                <strong>{step.title}</strong>
                <p>{step.say}</p>
                <small>{step.do}</small>
              </button>
            )
          })}
        </div>
      </aside>
    </>
  )
}

export default PresentationGuide
