import React, { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { useTheme } from "../context/ThemeContext";

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}) => {
  const { theme, toggleTheme: contextToggleTheme } = useTheme();
  const [isDark, setIsDark] = useState(theme === "dark");
  const buttonRef = useRef(null);

  useEffect(() => {
    setIsDark(theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current;
    if (!button) {
      contextToggleTheme();
      return;
    }

    const { top, left, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    );

    const applyTheme = () => {
      // Use the existing theme context to update the theme
      contextToggleTheme();
      const newTheme = !isDark;
      setIsDark(newTheme);
    };

    if (typeof document.startViewTransition !== "function") {
      applyTheme();
      return;
    }

    const transition = document.startViewTransition(() => {
      flushSync(applyTheme);
    });

    const ready = transition?.ready;
    if (ready && typeof ready.then === "function") {
      ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      });
    }
  }, [isDark, duration, contextToggleTheme]);

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className={className}
      aria-label="Toggle Dark Mode"
      {...props}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
