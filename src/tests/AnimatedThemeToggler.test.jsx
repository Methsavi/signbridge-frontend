import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AnimatedThemeToggler } from '../components/AnimatedThemeToggler';
import * as ThemeContext from '../context/ThemeContext';

describe('AnimatedThemeToggler Component', () => {
  it('renders and toggles theme when clicked', () => {
    // Mock the useTheme hook
    const mockToggleTheme = vi.fn();
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme
    });

    render(<AnimatedThemeToggler />);
    
    // Find the button inside the toggler (assuming it renders an accessible button context)
    // Because it might be just an SVG wrapper, let's find the SVG or the button role
    const button = screen.getByRole('button', { hidden: true });
    
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(mockToggleTheme).toHaveBeenCalled();
  });
});