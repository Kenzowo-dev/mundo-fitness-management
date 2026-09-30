// @ts-nocheck
import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Tabs, { TabPanel } from '@/components/Tabs'

const defaultTabs = [
  { id: 'tab1', label: 'Tab 1' },
  { id: 'tab2', label: 'Tab 2' },
  { id: 'tab3', label: 'Tab 3', disabled: true },
]

describe('Tabs', () => {
  it('renders tabs', () => {
    render(<Tabs tabs={defaultTabs} ariaLabel="Test tabs" />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeInTheDocument()
  })

  it('shows count badge', () => {
    render(<Tabs tabs={[{ id: 't1', label: 'Tab', count: 5 }]} ariaLabel="Test" />)
    expect(screen.getByText('(5)')).toBeInTheDocument()
  })

  it('marks active tab', () => {
    render(<Tabs tabs={defaultTabs} activeTab="tab2" ariaLabel="Test" />)
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange when tab clicked', () => {
    const handleChange = vi.fn()
    render(<Tabs tabs={defaultTabs} onChange={handleChange} ariaLabel="Test" />)
    fireEvent.click(screen.getByRole('tab', { name: 'Tab 2' }))
    expect(handleChange).toHaveBeenCalledWith('tab2')
  })

  it('does not call onChange for disabled tab', () => {
    const handleChange = vi.fn()
    render(<Tabs tabs={defaultTabs} onChange={handleChange} ariaLabel="Test" />)
    fireEvent.click(screen.getByRole('tab', { name: 'Tab 3' }))
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('supports arrow-key navigation and skips disabled tabs', () => {
    render(<Tabs tabs={defaultTabs} ariaLabel="Test tabs" />)
    const first = screen.getByRole('tab', { name: 'Tab 1' })
    const second = screen.getByRole('tab', { name: 'Tab 2' })

    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(second).toHaveFocus()
    expect(second).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(second, { key: 'ArrowRight' })
    expect(first).toHaveFocus()
    expect(first).toHaveAttribute('aria-selected', 'true')
  })

  it('supports Home and End navigation', () => {
    render(<Tabs tabs={defaultTabs} ariaLabel="Test tabs" />)
    const first = screen.getByRole('tab', { name: 'Tab 1' })
    const second = screen.getByRole('tab', { name: 'Tab 2' })

    first.focus()
    fireEvent.keyDown(first, { key: 'End' })
    expect(second).toHaveFocus()
    fireEvent.keyDown(second, { key: 'Home' })
    expect(first).toHaveFocus()
  })

  it('works in uncontrolled mode', () => {
    render(<Tabs tabs={defaultTabs} defaultActiveTab="tab2" ariaLabel="Test" />)
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('aria-selected', 'true')
  })

  it('calls onChange in uncontrolled mode', () => {
    const handleChange = vi.fn()
    render(<Tabs tabs={defaultTabs} defaultActiveTab="tab1" onChange={handleChange} ariaLabel="Test" />)
    fireEvent.click(screen.getByRole('tab', { name: 'Tab 2' }))
    expect(handleChange).toHaveBeenCalledWith('tab2')
  })

  it('renders with correct ARIA attributes', () => {
    render(<Tabs tabs={defaultTabs} ariaLabel="My tabs" />)
    const tablist = screen.getByRole('tablist')
    expect(tablist).toHaveAttribute('aria-label', 'My tabs')
  })

  it('applies disabled class to disabled tab', () => {
    render(<Tabs tabs={defaultTabs} ariaLabel="Test" />)
    expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveClass('tab-disabled')
    expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('has correct ARIA controls', () => {
    render(<Tabs tabs={defaultTabs} ariaLabel="Test" />)
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-controls', 'panel-tab1')
  })

  it('renders TabPanel', () => {
    render(
      <>
        <Tabs tabs={defaultTabs} activeTab="tab1" ariaLabel="Test" />
        <TabPanel id="tab1" activeTab="tab1">Content 1</TabPanel>
        <TabPanel id="tab2" activeTab="tab1">Content 2</TabPanel>
      </>
    )
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
  })

  it('TabPanel hidden when not active', () => {
    const { rerender } = render(
      <>
        <Tabs tabs={defaultTabs} activeTab="tab1" ariaLabel="Test" />
        <TabPanel id="tab1" activeTab="tab1">Content 1</TabPanel>
        <TabPanel id="tab2" activeTab="tab1">Content 2</TabPanel>
      </>
    )
    // tab1 is active, so tab2 panel content should not be rendered
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
    // tab1 panel should be visible
    expect(screen.getByText('Content 1')).toBeInTheDocument()

    rerender(
      <>
        <Tabs tabs={defaultTabs} activeTab="tab2" ariaLabel="Test" />
        <TabPanel id="tab1" activeTab="tab2">Content 1</TabPanel>
        <TabPanel id="tab2" activeTab="tab2">Content 2</TabPanel>
      </>
    )
    // tab2 is active, so tab1 panel content should not be rendered
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
  })

  it('TabPanel has correct ARIA attributes', () => {
    render(
      <TabPanel id="tab1" activeTab="tab1">Content</TabPanel>
    )
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('id', 'panel-tab1')
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-tab1')
  })

  it('applies custom className', () => {
    render(<Tabs tabs={defaultTabs} className="custom-tabs" ariaLabel="Test" />)
    expect(screen.getByRole('tablist')).toHaveClass('custom-tabs')
  })

  it('applies custom className to TabPanel', () => {
    render(<TabPanel id="tab1" activeTab="tab1" className="custom-panel">Content</TabPanel>)
    expect(screen.getByRole('tabpanel')).toHaveClass('custom-panel')
  })
})
