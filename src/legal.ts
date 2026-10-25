import { LEGAL, type LegalKey } from "./legal-text";

/** The legal pages, shown over the page; the build also writes them as standalone pages. */
const FILE = (k: LegalKey) => `${k}.html`;

const isKey = (s: string): s is LegalKey => s in LEGAL;
const keyOf = (hash: string) => {
  const k = hash.replace(/^#/, "");
  return isKey(k) ? k : null;
};

export function initLegal(overlay: HTMLElement) {
  const sheet = overlay.querySelector<HTMLElement>(".sheet")!;
  const content = overlay.querySelector<HTMLElement>(".sheet-body")!;
  const close = overlay.querySelector<HTMLButtonElement>(".sheet-close")!;
  let opener: HTMLElement | null = null;
  let pushed = false;

  function show(key: LegalKey) {
    content.innerHTML = LEGAL[key].main;
    content.querySelector("h1")!.id = "sheet-title";
    sheet.scrollTop = 0;
    overlay.hidden = false;
    document.documentElement.classList.add("sheet-open");
    close.focus({ preventScroll: true });
  }

  function hide() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.documentElement.classList.remove("sheet-open");
    opener?.focus({ preventScroll: true });
    opener = null;
  }

  /** Closing through the page's own UI also takes the hash out of the address. */
  function dismiss() {
    if (pushed) {
      pushed = false;
      history.back();
    } else {
      history.replaceState(null, "", location.pathname + location.search);
      hide();
    }
  }

  function sync() {
    const key = keyOf(location.hash);
    if (key) show(key);
    else hide();
  }

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey)
      return;
    const a = (e.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!a) return;
    const key = (Object.keys(LEGAL) as LegalKey[]).find((k) =>
      a.getAttribute("href")!.endsWith(FILE(k)),
    );
    if (!key) return;
    e.preventDefault();
    opener = a;
    if (location.hash !== `#${key}`) {
      history.pushState(null, "", `#${key}`);
      pushed = true;
    }
    show(key);
  });
  close.addEventListener("click", dismiss);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) dismiss();
  });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      dismiss();
    } else if (e.key === "Tab") {
      // keep focus inside the sheet while it is open
      const items = [
        ...overlay.querySelectorAll<HTMLElement>("a[href], button"),
      ];
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  window.addEventListener("popstate", () => {
    pushed = false;
    sync();
  });
  window.addEventListener("hashchange", sync);
  sync();
}
