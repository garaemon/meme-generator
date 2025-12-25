import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import History from './History'

// Mock next/image
jest.mock('next/image', () => {
  return function DummyImage({ fill, unoptimized, ...props }: any) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />
  }
})

// Mock dexie-react-hooks
jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: jest.fn((callback) => callback()),
}))

// Mock db
jest.mock('@/lib/db', () => ({
  db: {
    history: {
      orderBy: jest.fn(() => ({
        reverse: jest.fn(() => ({
          toArray: jest.fn(() => []),
        })),
      })),
      delete: jest.fn(),
    },
  },
}))

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'

describe('History Component', () => {
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useLiveQuery as jest.Mock).mockReturnValue([])
  })

  it('renders empty state when no history exists', () => {
    render(<History onSelect={mockOnSelect} />)
    
    expect(screen.getByText('No history yet. Create your first meme!')).toBeInTheDocument()
  })

  it('renders history items', () => {
    const historyItems = [
      { id: 1, thumbnail: 'data:image/png;base64,xxx', canvasState: {}, createdAt: new Date() }
    ]
    ;(useLiveQuery as jest.Mock).mockReturnValue(historyItems)
    
    render(<History onSelect={mockOnSelect} />)
    
    expect(screen.getByAltText('History Item')).toBeInTheDocument()
  })

  it('calls onSelect when a history item is clicked', () => {
    const canvasState = { objects: [] }
    const historyItems = [
      { id: 1, thumbnail: 'data:image/png;base64,xxx', canvasState, createdAt: new Date() }
    ]
    ;(useLiveQuery as jest.Mock).mockReturnValue(historyItems)
    
    render(<History onSelect={mockOnSelect} />)
    
    const item = screen.getByAltText('History Item').closest('div.cursor-pointer')
    if (item) fireEvent.click(item)
    
    expect(mockOnSelect).toHaveBeenCalledWith(canvasState)
  })

  it('calls delete when delete button is clicked', () => {
    const historyItems = [
      { id: 1, thumbnail: 'data:image/png;base64,xxx', canvasState: {}, createdAt: new Date() }
    ]
    ;(useLiveQuery as jest.Mock).mockReturnValue(historyItems)
    
    render(<History onSelect={mockOnSelect} />)
    
    const deleteButton = screen.getByRole('button', { name: '' })
    fireEvent.click(deleteButton)
    
    expect(db.history.delete).toHaveBeenCalledWith(1)
  })
})
