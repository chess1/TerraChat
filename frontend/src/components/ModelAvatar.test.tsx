import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelAvatar from './ModelAvatar';
// N.B. The path to ModelAvatarContext here is relative to the test file itself
import { useModelAvatar } from '../contexts/ModelAvatarContext';

// Mock the useModelAvatar hook
jest.mock('../contexts/ModelAvatarContext', () => ({
  // Keep other exports from the module if any, or mock them as needed
  ...jest.requireActual('../contexts/ModelAvatarContext'),
  useModelAvatar: jest.fn(),
}));

// Helper function to set up the mock for useModelAvatar
const setupMockUseModelAvatar = (showAvatars: boolean) => {
  (useModelAvatar as jest.Mock).mockReturnValue({
    showModelAvatars: showAvatars,
    // toggleModelAvatars is also part of the context but not directly used by ModelAvatar rendering logic being tested
    toggleModelAvatars: jest.fn(),
  });
};

describe('ModelAvatar', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (useModelAvatar as jest.Mock).mockClear();
  });

  it('renders the avatar for a given model name when showModelAvatars is true', () => {
    setupMockUseModelAvatar(true); // Tell the mock to show avatars
    // The ModelAvatar component takes 'source' as a prop, not 'modelName'
    render(<ModelAvatar source="models/gemini-1.5-pro" />);

    // Check if the Gemini avatar image is rendered
    // The alt text is the display name, which is "Gemini AI Pro" for "models/gemini-1.5-pro"
    const avatarImage = screen.getByAltText('Gemini AI Pro');
    expect(avatarImage).toBeInTheDocument();
    // The image path is constructed internally by ModelAvatar using getAssistantAvatar
    expect(avatarImage).toHaveAttribute('src', '/images/gemini.png');
  });

  it('renders the default avatar if model name is not found and showModelAvatars is true', () => {
    setupMockUseModelAvatar(true); // Tell the mock to show avatars
    render(<ModelAvatar source="unknown-model" />);

    // Check if the default avatar image is rendered
    // The alt text will be "unknown-model" because it's not in MODEL_DISPLAY_NAMES
    const avatarImage = screen.getByAltText('unknown-model');
    expect(avatarImage).toBeInTheDocument();
    // The image path for default is /images/terra_ai.png
    expect(avatarImage).toHaveAttribute('src', '/images/terra_ai.png');
  });

  it('renders the default avatar when showModelAvatars is false', () => {
    setupMockUseModelAvatar(false); // Tell the mock to hide avatars
    render(<ModelAvatar source="models/gemini-1.5-pro" />);

    // Even with a known model, it should render the default avatar
    const avatarImage = screen.getByAltText('Gemini AI Pro'); // Alt text is still based on source
    expect(avatarImage).toBeInTheDocument();
    expect(avatarImage).toHaveAttribute('src', '/images/terra_ai.png'); // Default image
    // Check that the model name and source are not displayed
    expect(screen.queryByText('(models/gemini-1.5-pro)')).not.toBeInTheDocument();
  });
});
