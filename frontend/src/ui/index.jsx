import { useEffect, useRef, useState } from 'react';

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'btn ' + (variant === 'ghost' ? 'btn-ghost' : 'btn-primary')
  return (
    <button className={`${base} ${className}`} {...props}>{children}</button>
  )
}

export function SectionTitle({ title, subtitle, icon }) {
  return (
    <div className="section-title">
      <div className="title-wrap">
        {icon && <i className={icon}></i>}
        <h2>{title}</h2>
      </div>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </div>
  )
}

export function FeatureCard({ icon, title, desc, hover = false, image }) {
  return (
    <div className={`card feature-card ${hover ? 'hoverable' : ''}`}>
      {image && (
        <div className="feature-image">
          <img src={image} alt={title} />
        </div>
      )}
      {icon && <div className="icon" aria-hidden>{icon}</div>}
      <div className="card-title">{title}</div>
      <p className="muted">{desc}</p>
    </div>
  )
}

export function ProcessStep({ step, title, desc }) {
  const [isVisible, setIsVisible] = useState(false);
  const stepRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.3
      }
    );

    if (stepRef.current) {
      observer.observe(stepRef.current);
    }

    return () => {
      if (stepRef.current) {
        observer.unobserve(stepRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={stepRef}
      className={`process-step ${isVisible ? 'animate' : ''}`}
    >
      <div className="step-number">
        {step}
      </div>
      <div className="step-content">
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
}




