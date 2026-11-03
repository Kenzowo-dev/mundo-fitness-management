import { useEffect, type RefObject } from "react";

function canReceiveFocus(element: HTMLElement) {
  if (element.tabIndex < 0 || element.closest("[hidden], [inert]"))
    return false;
  for (
    let current: HTMLElement | null = element;
    current;
    current = current.parentElement
  ) {
    const style = getComputedStyle(current);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (
      current instanceof HTMLDetailsElement &&
      !current.open &&
      !current.querySelector("summary")?.contains(element)
    )
      return false;
  }
  return true;
}

export function useFocusScope({
  active,
  container,
  background,
}: {
  active: boolean;
  container: RefObject<HTMLElement | null>;
  background?: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    if (!active || !container.current) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const backgroundElement = background?.current;
    const previousInert = backgroundElement?.inert ?? false;
    const element = container.current;
    const focusable = () =>
      Array.from(
        element.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ),
      ).filter(canReceiveFocus);
    document.body.style.overflow = "hidden";
    if (backgroundElement) backgroundElement.setAttribute("inert", "");
    const initialFocus = focusable()[0] ?? element;
    initialFocus.focus();
    const keepFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !element.contains(event.target))
        (focusable()[0] ?? element).focus();
    };
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) {
        event.preventDefault();
        element.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapTab);
    document.addEventListener("focusin", keepFocus);
    return () => {
      document.removeEventListener("keydown", trapTab);
      document.removeEventListener("focusin", keepFocus);
      document.body.style.overflow = previousOverflow;
      if (backgroundElement)
        backgroundElement.toggleAttribute("inert", previousInert);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, [active, container, background]);
}
