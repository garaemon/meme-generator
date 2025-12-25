import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import Gallery from './Gallery'

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
    templates: {
      toArray: jest.fn(() => []),
      add: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'

describe('Gallery Component', () => {
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useLiveQuery as jest.Mock).mockReturnValue([])
  })

  it('renders default templates', () => {
    render(<Gallery onSelect={mockOnSelect} />)
    
    expect(screen.getByText('Drake Hotline Bling')).toBeInTheDocument()
    expect(screen.getByText('Two Buttons')).toBeInTheDocument()
  })

  it('calls onSelect when a default template is clicked', () => {
    render(<Gallery onSelect={mockOnSelect} />)
    
    const drakeTemplate = screen.getByText('Drake Hotline Bling').closest('div.cursor-pointer')
    if (drakeTemplate) fireEvent.click(drakeTemplate)
    
    expect(mockOnSelect).toHaveBeenCalledWith(expect.stringContaining('api/image-proxy?url='))
  })

  it('renders user templates from DB', () => {
    const userTemplates = [
      { id: 1, name: 'My Custom Meme', data: 'data:image/png;base64,xxx', isCustom: true, addedAt: new Date() }
    ]
    ;(useLiveQuery as jest.Mock).mockReturnValue(userTemplates)
    
    render(<Gallery onSelect={mockOnSelect} />)
    
    expect(screen.getByText('My Custom Meme')).toBeInTheDocument()
  })

  it('calls delete when delete button is clicked', () => {
    const userTemplates = [
      { id: 1, name: 'My Custom Meme', data: 'data:image/png;base64,xxx', isCustom: true, addedAt: new Date() }
    ]
    ;(useLiveQuery as jest.Mock).mockReturnValue(userTemplates)
    
    render(<Gallery onSelect={mockOnSelect} />)
    
    const deleteButton = screen.getByRole('button', { name: '' }) // Trash2 icon doesn't have text, but it's a button
    // Actually, let's find it by the svg or the fact that it's in the user template area
    // Looking at the code: <button onClick={(e) => tmpl.id && deleteTemplate(e, tmpl.id)} className="..."> <Trash2 size={14} /> </button>
    
    fireEvent.click(deleteButton)
    
    expect(db.templates.delete).toHaveBeenCalledWith(1)
  })
})
