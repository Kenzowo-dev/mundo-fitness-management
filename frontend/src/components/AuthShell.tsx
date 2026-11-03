import type { ReactNode } from "react";
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";
import { gym } from "../config/gym";
import "@/styles/auth/auth-base.css";
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-experience">
      <header className="auth-topbar">
        <Brand />
        <ThemeToggle />
      </header>
      <aside className="auth-story" aria-label={`${gym.name}, ${gym.slogan}`}>
        <img src={gym.hero.src} alt="" width="960" height="720" />
        <div className="auth-story-copy">
          <p className="auth-story-eyebrow">TU MOMENTO EMPIEZA AQUÍ</p>
          <h2>
            Un paso hoy.
            <br />
            <span>Más fuerte mañana.</span>
          </h2>
          <p>A tu ritmo. Con tus metas. En tu ciudad.</p>
          <span className="auth-story-location">
            {gym.name} · {gym.city}
            {gym.hero.isReference ? " · Imagen referencial" : ""}
          </span>
        </div>
      </aside>
      <div className="auth-form-pane">{children}</div>
    </div>
  );
}
