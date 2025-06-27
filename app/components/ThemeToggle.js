'use client';

import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 15C12.7614 15 15 12.7614 15 10C15 7.23858 12.7614 5 10 5C7.23858 5 5 7.23858 5 10C5 12.7614 7.23858 15 10 15Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 1.66667V3.33333M10 16.6667V18.3333M3.33333 10H1.66667M18.3333 10H16.6667M3.57467 3.57467L4.75267 4.75267M15.2473 15.2473L16.4253 16.4253M3.57467 16.4253L4.75267 15.2473M15.2473 4.75267L16.4253 3.57467"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.5 10.8333C17.0285 12.3878 16.0907 13.7588 14.8094 14.7667C13.528 15.7746 11.9617 16.3706 10.3243 16.4745C8.68683 16.5785 7.05544 16.1851 5.64638 15.3449C4.23732 14.5047 3.11628 13.2568 2.42901 11.7656C1.74174 10.2744 1.52097 8.60916 1.7952 6.9879C2.06942 5.36665 2.82538 3.86433 3.96315 2.67652C5.10093 1.48871 6.56861 0.668097 8.17334 0.318327C9.77807 -0.0314432 11.4481 0.104866 12.975 0.710067C11.7353 2.11622 11.3449 4.05141 11.947 5.81986C12.549 7.58831 14.0594 8.9388 15.8646 9.35065C17.6698 9.7625 19.513 9.18271 20.7917 7.80833C20.8387 8.45388 20.7654 9.10311 20.5754 9.72331C20.3854 10.3435 20.0819 10.9241 19.6806 11.4352C19.2792 11.9464 18.7869 12.3796 18.2287 12.7135C17.6706 13.0473 17.0563 13.276 16.4167 13.3879"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}