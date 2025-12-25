import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import Navigation from './Navigation'

describe('Navigation Component', () => {
  const mockOnTabChange = jest.fn()

  beforeEach(() => {
    mockOnTabChange.mockClear()
  })

  it('renders gallery and history buttons', () => {
    render(<Navigation activeTab="gallery" onTabChange={mockOnTabChange} />)
    
    expect(screen.getByText('Gallery')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('GitHub')).toBeInTheDocument()
  })

  it('calls onTabChange when a button is clicked', () => {
    render(<Navigation activeTab="gallery" onTabChange={mockOnTabChange} />)
    
    fireEvent.click(screen.getByText('History'))
    expect(mockOnTabChange).toHaveBeenCalledWith('history')
    
    fireEvent.click(screen.getByText('Gallery'))
    expect(mockOnTabChange).toHaveBeenCalledWith('gallery')
  })

  it('highlights the active tab', () => {
    const { rerender } = render(<Navigation activeTab="gallery" onTabChange={mockOnTabChange} />)
    
    // Check gallery is active
    const galleryButton = screen.getByText('Gallery').closest('button')
    expect(galleryButton).toHaveClass('bg-blue-600')
    
    const historyButton = screen.getByText('History').closest('button')
    expect(historyButton).not.toHaveClass('bg-blue-600')

    // Rerender with history active
    rerender(<Navigation activeTab="history" onTabChange={mockOnTabChange} />)
    
    expect(screen.getByText('Gallery').closest('button')).not.toHaveClass('bg-blue-600')
    expect(screen.getByText('History').closest('button')).toHaveClass('bg-blue-600')
  })
})
