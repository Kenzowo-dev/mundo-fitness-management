import { Link, Route, Routes } from 'react-router-dom'
import Register from './componentes/auth/Register'
import Login from './pages/auth/Login'
import Membresias from './pages/membresias/Membresias'
import RegistrarMembresia from './pages/membresias/RegistrarMembresia'
import EditarMembresia from './pages/membresias/EditarMembresia'
import DetalleMembresia from './pages/membresias/DetalleMembresia'
import Usuario from './pages/Usuario'
import './App.css'

function LandingPage() {
  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">
          <img  
            src="/src/assets/Logo.png"
            alt="Mundo Fitness"
            className="logo-image"
          />
        </div>

        <nav className="nav-links">
          <a href="#inicio">Inicio</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#ubicacion">Ubicación</a>
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

      <main>
        <section id="inicio" className="hero-section">
          <div className="hero-content">
            <p className="hero-subtitle">
              TU MEJOR VERSIÓN COMIENZA AQUÍ
            </p>

            <h1>
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

            <button className="btn btn-start">
              Comenzar ahora
            </button>
          </div>

          <div className="hero-image">
            <div className="image-placeholder">
              <span>IMAGEN DEL GIMNASIO</span>
              <small>Aquí colocaremos la imagen principal</small>
            </div>
          </div>
        </section>

        <section id="nosotros" className="about-section">
          <div className="section-title">
            <p>CONÓCENOS</p>
            <h2>
              Entrena. Mejora. <span>Supérate.</span>
            </h2>
          </div>

          <div className="about-content">
            <div className="about-card">
              <h3>Entrenamiento</h3>
              <p>
                Espacios y equipos pensados para ayudarte a alcanzar tus
                objetivos.
              </p>
            </div>

            <div className="about-card">
              <h3>Comunidad</h3>
              <p>
                Forma parte de una comunidad que comparte tu motivación y tus
                ganas de mejorar.
              </p>
            </div>

            <div className="about-card">
              <h3>Resultados</h3>
              <p>
                Trabaja constantemente y convierte tus metas en resultados
                reales.
              </p>
            </div>
          </div>
        </section>

        <section id="ubicacion" className="location-section">
          <div className="section-title">
            <p>VISÍTANOS</p>
            <h2>
              Encuentra <span>nuestro gimnasio.</span>
            </h2>
          </div>

          <div className="location-content">
            <div className="location-info">
              <h3>¿Dónde estamos?</h3>

              <p>
                Ven a conocernos y comienza tu entrenamiento con nosotros.
              </p>

              <div className="address">
                <strong>Mundo Fitness Palermo</strong>
                <span>Av. César Vallejo 690, Trujillo 13006</span>
              </div>

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
      </main>

      <footer className="footer">
        <p>© 2026 Mundo Fitness. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/membresias" element={<Membresias />} />
      <Route path="/membresias/nueva" element={<RegistrarMembresia />} />
      <Route path="/membresias/:id" element={<DetalleMembresia />} />
      <Route path="/membresias/:id/editar" element={<EditarMembresia />} />
      <Route path="/usuario" element={<Usuario />} />
    </Routes>
  )
}

export default App
