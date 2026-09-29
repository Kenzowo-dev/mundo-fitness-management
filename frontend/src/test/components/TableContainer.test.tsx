// @ts-nocheck
import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TableContainer from '@/components/TableContainer'

const columns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status', render: (row) => <span>{row.status}</span> },
]

const data = [
  { id: 1, name: 'Item 1', status: 'active' },
  { id: 2, name: 'Item 2', status: 'inactive' },
  { id: 3, name: 'Item 3', status: 'pending' },
]

describe('TableContainer', () => {
  it('renders headers', () => {
    render(<TableContainer data={data} columns={columns} rowKey="id" />)
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()
  })

  it('renders rows with data', () => {
    render(<TableContainer data={data} columns={columns} rowKey="id" />)
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('uses custom render function', () => {
    render(<TableContainer data={data} columns={columns} rowKey="id" />)
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('inactive')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<TableContainer data={[]} columns={columns} rowKey="id" loading />)
    expect(screen.getAllByLabelText('Cargando fila')).toHaveLength(5)
    const container = screen.getAllByLabelText('Cargando fila')[0].closest('.table-container')
    expect(container).toHaveAttribute('aria-busy', 'true')
  })

  it('shows skeleton rows', () => {
    render(<TableContainer data={[]} columns={columns} rowKey="id" loading skeletonRows={3} />)
    expect(screen.getAllByLabelText('Cargando fila')).toHaveLength(3)
  })

  it('shows empty state when no data', () => {
    render(<TableContainer data={[]} columns={columns} rowKey="id" emptyState={{ title: 'No data' }} />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('shows empty state action', () => {
    const handleClick = vi.fn()
    render(<TableContainer data={[]} columns={columns} rowKey="id" emptyState={{ title: 'No data', action: { label: 'Add', onClick: handleClick } }} />)
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('uses custom empty state icon', () => {
    render(<TableContainer data={[]} columns={columns} rowKey="id" emptyState={{ title: 'No data', icon: <span>📦</span> }} />)
    expect(screen.getByText('📦')).toBeInTheDocument()
  })

  it('calls onRowClick', () => {
    const handleRowClick = vi.fn()
    render(<TableContainer data={data} columns={columns} rowKey="id" onRowClick={handleRowClick} />)
    fireEvent.click(screen.getByText('Item 1').closest('tr')!)
    expect(handleRowClick).toHaveBeenCalledWith(data[0])
  })

  it('applies cursor pointer when onRowClick provided', () => {
    render(<TableContainer data={data} columns={columns} rowKey="id" onRowClick={vi.fn()} />)
    const row = screen.getByText('Item 1').closest('tr')
    expect(row).toHaveStyle({ cursor: 'pointer' })
  })

  it('uses function rowKey', () => {
    const dataWithFunc = [{ id: 1, name: 'Item' }]
    const rowKeyFn = vi.fn((row) => `custom-${row.id}`)
    render(<TableContainer data={dataWithFunc} columns={columns} rowKey={rowKeyFn} />)
    expect(screen.getByText('Item')).toBeInTheDocument()
  })

  it('applies table className', () => {
    const { container } = render(<TableContainer data={data} columns={columns} rowKey="id" tableClassName="custom-table" />)
    expect(container.querySelector('table')).toHaveClass('custom-table')
  })

  it('applies tbody className', () => {
    const { container } = render(<TableContainer data={data} columns={columns} rowKey="id" tbodyClassName="custom-tbody" />)
    expect(container.querySelector('tbody')).toHaveClass('custom-tbody')
  })

  it('passes additional props to container', () => {
    render(<TableContainer data={data} columns={columns} rowKey="id" data-testid="table-container" />)
    expect(screen.getByTestId('table-container')).toBeInTheDocument()
  })

  it('has correct ARIA on table', () => {
    render(<TableContainer data={data} columns={columns} rowKey="id" />)
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
  })

  it('headers have scope=col', () => {
    render(<TableContainer data={data} columns={columns} rowKey="id" />)
    expect(screen.getByRole('columnheader', { name: 'ID' })).toHaveAttribute('scope', 'col')
  })

  it('shows empty state description', () => {
    render(<TableContainer data={[]} columns={columns} rowKey="id" emptyState={{ title: 'Empty', description: 'No items found' }} />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })
})