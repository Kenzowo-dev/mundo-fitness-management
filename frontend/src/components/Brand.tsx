import { Link } from "react-router-dom";
export default function Brand({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`brand ${className}`}
      aria-label="Mundo Fitness, inicio"
      translate="no"
    >
      <span className="brand-symbol" aria-hidden="true">
        <img
          src="/assets/logo-transparent.png"
          alt=""
          width="190"
          height="86"
        />
      </span>
    </Link>
  );
}
