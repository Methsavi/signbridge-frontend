import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedbackSection from '../components/FeedbackSection';
import * as api from '../services/api';

vi.mock('lottie-react', () => ({
  default: () => <div data-testid="lottie-mock">Lottie Animation</div>
}));

// Mock IntersectionObserver for framer-motion
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = IntersectionObserverMock;

// Mock fetch for the Lottie animation JSON
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);

describe('FeedbackSection Component', () => {
  it('renders the feedback section and loading state initially', async () => {
    // Mock the feedback service to return an empty array of feedbacks
    const mockGetMyFeedbacks = vi.spyOn(api.feedbackService, 'getMyFeedbacks').mockResolvedValue([]);
    
    // We might need to mock getUser from authService if the component checks it
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(null);

    render(<FeedbackSection />);
    
    // Check for standard text in the component header usually
    // Or just look for specific known text like "Feedback" or "Reviews"
    // (If the exact string fails, we'll refine the test)
    
    // Wait for the mock to resolve and any component side effects to finish
    await waitFor(() => {
      // Check if it renders
      expect(screen.getByText(/Login to Leave a Review/i)).toBeInTheDocument();
    });
  });
});
