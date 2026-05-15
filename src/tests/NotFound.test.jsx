import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import NotFound from '../pages/NotFound';

// Mock child components to isolate the page test
vi.mock('../components/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));
vi.mock('../components/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

describe('NotFound Page', () => {
  it('renders the 404 page correctly', () => {
    // We only need the test environment wrapped appropriately
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
    
    // Check if the 404 text renders
    expect(screen.getByText('404')).toBeInTheDocument();
    
    // Check if expected description text renders
    expect(screen.getByText(/Destination Unknown/i)).toBeInTheDocument();
    expect(screen.getByText(/The page you are looking for/i)).toBeInTheDocument();
    
    // Check if the Navbar was rendered
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });
});