const KEY = 'theme';

export function initTheme(button: HTMLElement) {
  const root = document.documentElement;
  try {
    const t = localStorage.getItem(KEY);
    if (t) root.dataset.theme = t;
  } catch {}
  button.addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try {
      localStorage.setItem(KEY, root.dataset.theme);
    } catch {}
  });
}
