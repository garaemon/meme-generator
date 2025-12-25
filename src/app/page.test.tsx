import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from './page'

// Mock the components to avoid complex dependency issues in unit test
jest.mock('@/components/layout/Navigation', () => {
  return function DummyNavigation({ activeTab, onTabChange }: any) {
    return (
      <nav data-testid="navigation">
        <button onClick={() => onTabChange('gallery')}>Gallery</button>
        <button onClick={() => onTabChange('editor')}>Editor</button>
        <button onClick={() => onTabChange('history')}>History</button>
      </nav>
    )
  }
})

jest.mock('@/components/meme/Gallery', () => {
  return function DummyGallery({ onSelect }: any) {
    return <div data-testid="gallery">Gallery Component <button onClick={() => onSelect('http://example.com/image.jpg')}>Select Image</button></div>
  }
})

jest.mock('@/components/meme/History', () => {
  return function DummyHistory({ onSelect }: any) {
    return <div data-testid="history">History Component</div>
  }
})

jest.mock('@/components/meme/CanvasEditor', () => {
  return function DummyCanvasEditor({ initialImage }: any) {
    return <div data-testid="editor">Canvas Editor {initialImage}</div>
  }
})

// Mock the DB
jest.mock('@/lib/db', () => ({
  db: {
    history: {
      add: jest.fn()
    }
  }
}))

describe('Home Page', () => {
  it('renders gallery by default', () => {
    render(<Home />)
    expect(screen.getByTestId('gallery')).toBeInTheDocument()
    expect(screen.queryByTestId('editor')).not.toBeInTheDocument()
  })

  it('switches to editor when image is selected from gallery', async () => {
    render(<Home />)
    
    // Check initial state
    expect(screen.getByTestId('gallery')).toBeInTheDocument()
    
    // Select image
    fireEvent.click(screen.getByText('Select Image'))
    
    // Should now show editor
    await waitFor(() => {
      expect(screen.getByTestId('editor')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('gallery')).not.toBeInTheDocument()
  })

  it('navigates between tabs', () => {
    render(<Home />)
    
    // Go to history
    fireEvent.click(screen.getByText('History'))
    expect(screen.getByTestId('history')).toBeInTheDocument()
    
    // Go back to gallery
    fireEvent.click(screen.getByText('Gallery'))
    expect(screen.getByTestId('gallery')).toBeInTheDocument()
  })
})
