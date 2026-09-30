import { useState } from 'react'
import { Link } from 'react-router-dom'
import '@/styles/LandingPage.css'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="app">
      <header className="navbar" aria-label="Encabezado del sitio">
        <div className="logo">
          <img
            src="/assets/Logo.png"
            alt="Mundo Fitness"
            className="logo-image"
          />
        </div>

        {/* Botón hamburguesa para mobile (WCAG 2.4.1) */}
        <button
          type="button"
          className={`menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
          aria-expanded={mobileMenuOpen}
          aria-controls="main-nav"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="hamburger"></span>
        </button>

        <nav
          id="main-nav"
          className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}
          aria-label="Navegación principal"
        >
          <a href="#inicio" onClick={closeMobileMenu}>Inicio</a>
          <a href="#nosotros" onClick={closeMobileMenu}>Nosotros</a>
          <a href="#ubicacion" onClick={closeMobileMenu}>Ubicación</a>
        </nav>

        <div className="auth-buttons">
          <Link to="/login" className="btn btn-login">
            Iniciar sesión
          </Link>

          <Link to="/registro" className="btn btn-register">
            Registrarse
          </Link>
        </div>
      </header>

      <main id="main-content">
        <section id="inicio" className="hero-section" aria-labelledby="hero-title">
          <div className="hero-content">
            <p className="hero-subtitle">
              TU MEJOR VERSIÓN COMIENZA AQUÍ
            </p>

            <h1 id="hero-title">
              TRANSFORMA TU
              <span> CUERPO.</span>
              <br />
              SUPERA TUS
              <span> LÍMITES.</span>
            </h1>

            <p className="hero-description">
              Entrena con nosotros, alcanza tus objetivos y forma parte de una
              comunidad que busca superarse cada día.
            </p>

            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="btn btn-secondary">
                Registrarse
              </Link>
            </div>
          </div>

          <div className="hero-image">
            <img
              src="/assets/hero.png"
              alt="Instalaciones modernas de Mundo Fitness"
              className="hero-img-cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
            />
          </div>
        </section>

        <section id="nosotros" className="about-section" aria-labelledby="about-title">
          <div className="section-title">
            <p>CONÓCENOS</p>
            <h2 id="about-title">
              Entrena. Mejora. <span>Supérate.</span>
            </h2>
          </div>

          <div className="about-content">
            <article className="about-card">
              <h3>Entrenamiento</h3>
              <p>
                Espacios y equipos pensados para ayudarte a alcanzar tus
                objetivos.
              </p>
            </article>

            <article className="about-card">
              <h3>Comunidad</h3>
              <p>
                Forma parte de una comunidad que comparte tu motivación y tus
                ganas de mejorar.
              </p>
            </article>

            <article className="about-card">
              <h3>Resultados</h3>
              <p>
                Trabaja constantemente y convierte tus metas en resultados
                reales.
              </p>
            </article>
          </div>
        </section>

        <section id="ubicacion" className="location-section" aria-labelledby="location-title">
          <div className="section-title">
            <p>VISÍTANOS</p>
            <h2 id="location-title">
              Encuentra <span>nuestro gimnasio.</span>
            </h2>
          </div>

          <div className="location-content">
            <div className="location-info">
              <h3>¿Dónde estamos?</h3>

              <p>
                Ven a conocernos y comienza tu entrenamiento con nosotros.
              </p>

              <address className="address">
                <strong>Mundo Fitness Palermo</strong>
                <span>Av. César Vallejo 690, Trujillo 13006</span>
              </address>

              <a
                href="https://maps.app.goo.gl/StUWA2QRRnUzpuGN6"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-map"
              >
                Abrir en Google Maps
              </a>
            </div>

            <div className="map-container">
              <div className="map-placeholder">
                <span>GOOGLE MAPS</span>
                <small>
                  Aquí colocaremos la ubicación del gimnasio
                </small>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section" aria-labelledby="cta-title">
          <div className="cta-content">
            <h2 id="cta-title">¿Listo para comenzar?</h2>
            <p>Únete a Mundo Fitness y transforma tu rutina hoy mismo.</p>
            <div className="cta-actions">
              <Link to="/login" className="btn btn-primary">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="btn btn-outline">
                Crear cuenta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" aria-label="Pie de página">
        <p>© 2026 Mundo Fitness. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}