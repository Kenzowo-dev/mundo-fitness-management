import Skeleton from "./Skeleton";
export default function RouteSkeleton() {
  return (
    <div
      className="route-skeleton"
      aria-busy="true"
      aria-label="Cargando tu espacio"
    >
      <p role="status" className="sr-only">
        Cargando tu espacio…
      </p>
      <div aria-hidden="true">
        <Skeleton width="160px" height="44px" />
        <div className="route-skeleton-content">
          <Skeleton width="65%" height="52px" />
          <Skeleton width="85%" height="20px" />
          <div className="route-skeleton-grid">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} height="160px" />
            ))}
          </div>
          <Skeleton height="240px" />
        </div>
      </div>
    </div>
  );
}
