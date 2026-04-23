import { useEffect, useState } from 'react';
import { applyTheme, getInitialTheme, type Theme } from '../lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      className="ghost"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      aria-pressed={theme === 'dark'}
      style={{ width: '100%', marginTop: '0.5rem' }}
    >
      {theme === 'dark' ? '☀ Light mode' : '☾ Dark mode'}
    </button>
  );
}
