import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Brand from "../components/Brand";
import ThemeToggle from "../components/ThemeToggle";
import Skeleton from "../components/Skeleton";
import { gym, whatsappUrl } from "../config/gym";
import "@/styles/LandingPage.css";

const benefits = [
  {
    title: "El primer paso es tuyo",
    text: "Empieza desde donde estás. Cada día es una nueva oportunidad para moverte.",
    icon: "↗",
  },
  {
    title: "Tu ciudad. Tu espacio.",
    text: `Encuéntranos en ${gym.city}. Ven a conocer ${gym.locationName} y conversa con recepción.`,
    icon: "◎",
  },
  {
    title: "Todo más claro",
    text: "Tu plan, vigencia y pagos en tu cuenta. Menos dudas para enfocarte en tu próxima meta.",
    icon: "✓",
  },
];
const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(
    amount,
  );

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllPlans, setShowAllPlans] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const plans = useQuery({
    queryKey: ["public-membership-plans"],
    queryFn: () => api.getPublicMembershipPlans(),
    retry: 1,
    staleTime: 300_000,
  });
  const contactUrl = whatsappUrl();
  const visiblePlans = showAllPlans ? plans.data : plans.data?.slice(0, 3);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="public-site">
      <a className="public-skip-link" href="#main-content">
        Saltar al contenido principal
      </a>
      <header className="public-header">
        <Brand />
        <div className="public-header-controls">
          <ThemeToggle />
          <button
            ref={menuButton}
            type="button"
            className="public-menu-toggle"
            aria-label={
              mobileMenuOpen ? "Cerrar navegación" : "Abrir navegación"
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="public-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
        <nav
          id="public-navigation"
          className={`public-navigation${mobileMenuOpen ? " is-open" : ""}`}
          aria-label="Navegación principal"
        >
          <a href="#experiencia" onClick={closeMenu}>
            El gimnasio
          </a>
          <a href="#planes" onClick={closeMenu}>
            Planes
          </a>
          <a href="#ubicacion" onClick={closeMenu}>
            Visítanos
          </a>
          <Link
            className="public-navigation-login"
            to="/login"
            onClick={closeMenu}
          >
            Iniciar sesión <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </header>
      <main id="main-content">
        <section className="public-hero" aria-labelledby="hero-title">
          <img
            className="public-hero-image"
            src={gym.hero.src}
            alt={gym.hero.alt}
            width="960"
            height="720"
            fetchPriority="high"
          />
          <div className="public-hero-shade" />
          <div className="public-hero-copy">
            <p className="public-eyebrow">
              <span aria-hidden="true" /> HECHO PARA MOVERTE ·{" "}
              {gym.city.toUpperCase()}
            </p>
            <h1 id="hero-title">
              Tu próxima
              <br />
              versión empieza
              <br />
              <span>hoy.</span>
            </h1>
            <p className="public-hero-description">
              No importa tu punto de partida. Encuentra tu ritmo, da el primer
              paso y vive diferente con Mundo Fitness.
            </p>
            <div className="public-hero-actions">
              <a
                className="public-button public-button-primary"
                href="#ubicacion"
              >
                Conoce el gimnasio <span aria-hidden="true">↗</span>
              </a>
              <a
                className="public-button public-button-hero-secondary"
                href="#planes"
              >
                Explorar planes
              </a>
            </div>
            <p className="public-hero-note">
              A tu ritmo. Con tus metas. En tu ciudad.
            </p>
          </div>
          <div className="public-hero-bottom">
            <span>VIVE DIFERENTE</span>
            <span>
              {gym.hero.isReference ? "Imagen referencial" : gym.locationName}
            </span>
            <a
              href="#experiencia"
              aria-label="Descubrir la experiencia Mundo Fitness"
            >
              ↓
            </a>
          </div>
        </section>
        <section
          id="experiencia"
          className="public-features"
          aria-labelledby="experience-title"
        >
          <div className="public-section-heading">
            <p className="public-eyebrow">MÁS QUE UN PUNTO DE PARTIDA</p>
            <h2 id="experience-title">
              Entrena para ti.
              <br />
              <span>Nos vemos en Mundo Fitness.</span>
            </h2>
            <p>
              Un espacio en Trujillo para empezar, retomar y seguir adelante.
            </p>
          </div>
          <div className="public-feature-grid">
            {benefits.map((benefit, index) => (
              <article className="public-feature-card" key={benefit.title}>
                <div className="public-feature-top">
                  <span className="public-feature-icon" aria-hidden="true">
                    {benefit.icon}
                  </span>
                  <span className="public-feature-number" aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          id="planes"
          className="public-plans"
          aria-labelledby="plans-title"
          aria-busy={plans.isPending}
        >
          <div className="public-section-heading">
            <p className="public-eyebrow">ELIGE CÓMO EMPEZAR</p>
            <h2 id="plans-title">
              Una meta tuya.
              <br />
              <span>Un plan para acompañarte.</span>
            </h2>
            <p>
              Consulta los planes disponibles. Recepción te ayudará a confirmar
              tu membresía.
            </p>
          </div>
          {plans.isPending && (
            <>
              <p role="status" className="sr-only">
                Cargando planes…
              </p>
              <div className="public-plan-grid" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <div className="public-plan-card" key={index}>
                    <Skeleton width="45%" height="24px" />
                    <Skeleton height="70px" />
                    <Skeleton height="90px" />
                    <Skeleton height="48px" />
                  </div>
                ))}
              </div>
            </>
          )}
          {plans.isError && (
            <div className="public-plan-notice" role="status">
              <h3>Conversemos sobre tu próximo plan.</h3>
              <p>
                No pudimos cargar los precios. Puedes reintentar o consultar las
                opciones en recepción.
              </p>
              <div className="public-hero-actions">
                <button
                  className="public-button public-button-secondary"
                  type="button"
                  onClick={() => void plans.refetch()}
                >
                  Volver a intentar
                </button>
                <a
                  className="public-button public-button-primary"
                  href="#ubicacion"
                >
                  Consultar en el gimnasio
                </a>
              </div>
            </div>
          )}
          {!plans.isPending && !plans.isError && !plans.data?.length && (
            <div className="public-plan-notice">
              <h3>Tu próximo paso, en recepción.</h3>
              <p>
                Estamos actualizando los planes. Visítanos para conocer las
                opciones disponibles.
              </p>
              <a
                className="public-button public-button-primary"
                href="#ubicacion"
              >
                Conoce el gimnasio
              </a>
            </div>
          )}
          {!plans.isError && (
            <div className="public-plan-grid">
              {visiblePlans?.map((plan) => (
                <article className="public-plan-card" key={plan.id}>
                  <span className="public-plan-duration">
                    {plan.durationDays} días para avanzar
                  </span>
                  <h3>{plan.name}</h3>
                  <p className="public-plan-price">
                    {money(plan.price, plan.currency)}
                    <span>por {plan.durationDays} días</span>
                  </p>
                  {plan.description && <p>{plan.description}</p>}
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <span aria-hidden="true">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    className="public-button public-button-secondary"
                    to={`/registro?plan=${plan.id}`}
                  >
                    Me interesa este plan <span aria-hidden="true">↗</span>
                  </Link>
                  <small>Recepción confirma la contratación.</small>
                </article>
              ))}
            </div>
          )}
          {!plans.isError && (plans.data?.length ?? 0) > 3 && (
            <button
              type="button"
              className="public-button public-button-secondary public-show-plans"
              onClick={() => setShowAllPlans((show) => !show)}
              aria-expanded={showAllPlans}
            >
              {showAllPlans ? "Mostrar menos planes" : "Ver todos los planes"}
            </button>
          )}
        </section>
        <section className="public-join" aria-labelledby="join-title">
          <div>
            <p className="public-eyebrow">TU ESPACIO, TAMBIÉN ONLINE</p>
            <h2 id="join-title">
              Menos vueltas.
              <br />
              Más foco en ti.
            </h2>
            <p>
              Crea tu cuenta de socio y consulta tu membresía y pagos en un solo
              lugar.
            </p>
          </div>
          <div className="public-join-action">
            <Link
              className="public-button public-button-primary"
              to="/registro"
            >
              Crear cuenta de socio <span aria-hidden="true">↗</span>
            </Link>
            <span>
              ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
            </span>
          </div>
        </section>
        <section
          id="ubicacion"
          className="public-location"
          aria-labelledby="location-title"
        >
          <div className="public-location-copy">
            <p className="public-eyebrow">AQUÍ EMPIEZA TU SIGUIENTE PASO</p>
            <h2 id="location-title">
              {gym.city} se mueve.
              <br />
              <span>Muévete con nosotros.</span>
            </h2>
            <address>
              <strong>{gym.locationName}</strong>
              <span>{gym.address}</span>
            </address>
            <div className="public-hero-actions">
              <a
                className="public-button public-button-primary"
                href={gym.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Cómo llegar <span aria-hidden="true">↗</span>
              </a>
              {contactUrl && (
                <a
                  className="public-button public-button-secondary"
                  href={contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Consultar por WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="public-location-details">
            <span className="public-location-symbol" aria-hidden="true">
              ↗
            </span>
            <h3>Encuentra tu momento</h3>
            <dl>
              {gym.schedule.map((row) => (
                <div key={row.days}>
                  <dt>{row.days}</dt>
                  <dd>{row.hours}</dd>
                </div>
              ))}
            </dl>
            {gym.scheduleIsExample && (
              <p className="public-example-note">
                Horarios de ejemplo. Confirma en recepción antes de tu visita.
              </p>
            )}
            <p className="public-contact-note">
              {contactUrl
                ? "¿Tienes dudas? Escríbenos y conversemos."
                : "¿Tienes dudas? Visítanos y conversa con recepción."}
            </p>
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <Brand />
        <span>
          © {new Date().getFullYear()} {gym.name} · {gym.city}
        </span>
        <Link to="/login">
          Acceso de socios y personal <span aria-hidden="true">↗</span>
        </Link>
      </footer>
    </div>
  );
}
