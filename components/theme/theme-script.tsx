/**
 * Inline script no <head> que aplica o tema ANTES do React hidratar.
 * Evita flash de tema errado (FOUC) ao carregar a página.
 *
 * Uso no app/layout.tsx:
 *   <head>
 *     <ThemeScript />
 *   </head>
 */

const SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('simulai.theme');
    var theme = (stored === 'light' || stored === 'dark') ? stored
              : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
