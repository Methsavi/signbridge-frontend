import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ScrollToTop from '../components/ScrollToTop';

describe('ScrollToTop Component', () => {
  it('calls window.scrollTo on mount/route change', () => {
    // Mock window.scrollTo
    window.scrollTo = vi.fn();

    render(
      <BrowserRouter>
        <ScrollToTop />
      </BrowserRouter>
    );
    
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});