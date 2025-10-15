export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'btn ' + (variant === 'ghost' ? 'btn-ghost' : 'btn-primary')
  return (
    <button className={`${base} ${className}`} {...props}>{children}</button>
  )
}

export function SectionTitle({ overline, title }) {
  return (
    <div className="section-title">
      {overline && <div className="overline">{overline}</div>}
      <h2>{title}</h2>
    </div>
  )
}

export function FeatureCard({ icon, title, desc, hover = false }) {
  return (
    <div className={`card feature-card ${hover ? 'hoverable' : ''}`}>
      {icon && <div className="icon" aria-hidden>{icon}</div>}
      <div className="card-title">{title}</div>
      <p className="muted">{desc}</p>
    </div>
  )
}

export function TestimonialCard({ quote, author, role }) {
  return (
    <div className="card testimonial-card hoverable">
      <p className="quote">"{quote}"</p>
      <div className="author">
        <div className="author-name">— {author}</div>
        {role && <div className="author-role">{role}</div>}
      </div>
    </div>
  )
}

export function StatsCard({ number, label, color = 'blue' }) {
  return (
    <div className={`stats-card stats-card-${color}`}>
      <div className="stats-number">{number}</div>
      <div className="stats-label">{label}</div>
    </div>
  )
}

export function ProcessStep({ step, title, desc, icon }) {
  return (
    <div className="process-step">
      <div className="step-number">{step}</div>
      {icon && <div className="step-icon" aria-hidden>{icon}</div>}
      <div className="step-content">
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  )
}

export function PartnerLogo({ name }) {
  return (
    <div className="partner-logo">
      <div className="partner-name">{name}</div>
    </div>
  )
}


