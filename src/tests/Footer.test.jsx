import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Footer from '../components/Footer';

describe('Footer Component', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    
    // Check if the logo/text renders
    const brandElements = screen.getAllByText(/SignBridge/i);
    expect(brandElements.length).toBeGreaterThan(0);
    
    // Check if expected description renders
    const descElement = screen.getByText(/translation and learning platform/i);
    expect(descElement).toBeInTheDocument();
  });
});