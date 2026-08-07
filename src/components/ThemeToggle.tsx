'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

/** 低调的主题切换按钮（深/浅），置于顶栏右上 */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="btn btn-ghost btn-icon btn-md"
      aria-label="切换深浅主题"
      title="切换深浅主题"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
