import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '@/styles/LandingPage.css'

const membershipFeatures = [
  {
    title: 'Tu membresía, clara',
    description: 'Consulta el plan asociado a tu cuenta y revisa su periodo de vigencia.',
  },
  {
    title: 'Pagos a la vista',
    description: 'Revisa el historial de pagos registrados por recepción.',
  },
  {
    title: 'Atención en recepción',
    description: 'El equipo del gimnasio puede ayudarte con renovaciones y datos de tu cuenta.',
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!mobileMenuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileMenuOpen])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="public-site">
      <a className="public-skip-link" href="#main-content">Saltar al contenido principal</a>

      <header className="public-header">
        <Link to="/" className="public-brand" aria-label="Mundo Fitness, inicio" onClick={closeMobileMenu}>
          <img src="/assets/Logo.png" alt="" width="150" height="56" />
        </Link>

        <button
          type="button"
          className="public-menu-toggle"
          aria-label={mobileMenuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
          aria-expanded={mobileMenuOpen}
          aria-controls="public-navigation"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>

        <nav
          id="public-navigation"
          className={`public-navigation${mobileMenuOpen ? ' is-open' : ''}`}
          aria-label="Navegación principal"
        >
          <a href="#beneficios" onClick={closeMobileMenu}>Tu cuenta</a>
          <a href="#ubicacion" onClick={closeMobileMenu}>Visítanos</a>
          <Link className="public-navigation-login" to="/login" onClick={closeMobileMenu}>Iniciar sesión</Link>
        </nav>
      </header>

      <main id="main-content">
        <section className="public-hero" aria-labelledby="hero-title">
          <div className="public-hero-copy">
            <p className="public-eyebrow">Mundo Fitness · Trujillo</p>
            <h1 id="hero-title">Tu entrenamiento sigue. <span>Tu membresía también.</span></h1>
            <p className="public-hero-description">
              Accede a tu cuenta para revisar tu membresía, su vigencia y los pagos registrados.
              Si trabajas en recepción, entra al espacio de gestión del gimnasio.
            </p>
            <div className="public-hero-actions">
              <Link className="public-button public-button-primary" to="/login">Acceder a mi cuenta</Link>
              <Link className="public-button public-button-secondary" to="/registro">Crear cuenta de socio</Link>
            </div>
            <p className="public-staff-note">
              ¿Trabajas en recepción? <Link to="/login">Ingresa al sistema de gestión</Link>.
            </p>
          </div>

          <div className="public-hero-media">
            <img
              src="/assets/gym-membership-hero.jpg"
              alt="Imagen referencial de una zona de entrenamiento con pesas y máquinas"
              width="960"
              height="720"
              fetchPriority="high"
            />
            <div className="public-media-caption">
              <span className="public-status-dot" aria-hidden="true" />
              <span>Entrena hoy. Consulta tu cuenta cuando lo necesites.</span>
            </div>
          </div>
        </section>

        <section id="beneficios" className="public-features" aria-labelledby="features-title">
          <div className="public-section-heading">
            <p className="public-eyebrow">Tu espacio, más sencillo</p>
            <h2 id="features-title">Lo esencial de tu membresía, en un solo lugar.</h2>
          </div>
          <div className="public-feature-grid">
            {membershipFeatures.map((feature, index) => (
              <article className="public-feature-card" key={feature.title}>
                <span className="public-feature-number" aria-hidden="true">0{index + 1}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="ubicacion" className="public-location" aria-labelledby="location-title">
          <div>
            <p className="public-eyebrow">Estamos cerca</p>
            <h2 id="location-title">Ven a entrenar con nosotros.</h2>
            <address>
              <strong>Mundo Fitness Palermo</strong>
              <span>Av. César Vallejo 690, Trujillo 13006</span>
            </address>
          </div>
          <a
            className="public-button public-button-secondary"
            href="https://maps.app.goo.gl/StUWA2QRRnUzpuGN6"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir ubicación en Google Maps <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>

      <footer className="public-footer">
        <Link to="/" aria-label="Mundo Fitness, inicio">Mundo Fitness</Link>
        <span>© 2026 Mundo Fitness</span>
        <Link to="/login">Acceso a mi cuenta</Link>
      </footer>
    </div>
  )
}
