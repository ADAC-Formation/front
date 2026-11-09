import { render, screen } from '@testing-library/react'
import { NotificationItem } from './NotificationItem'

const base = { id: 1, type: 'NEW_MESSAGE', content: 'Nouveau message de Marie', entityType: 'MESSAGE', entityId: 7, isRead: false }

function renderItem(notification) {
  return render(
    <ul>
      <NotificationItem notification={notification} onOpen={() => {}} />
    </ul>,
  )
}

describe('NotificationItem — date', () => {
  it('affiche la date dans un élément <time>', () => {
    const { container } = renderItem({ ...base, createdAt: '2026-11-02T10:00:00' })
    const time = container.querySelector('time')
    expect(time).toHaveAttribute('datetime', '2026-11-02T10:00:00')
    expect(time.textContent).toMatch(/nov/)
  })

  it.each([
    ['null', null],
    ['absente', undefined],
    ['vide', ''],
    ['illisible', 'pas une date'],
  ])('reste affichée, sans date, quand createdAt est %s', (_label, createdAt) => {
    const { container } = renderItem({ ...base, createdAt })
    expect(screen.getByText('Nouveau message de Marie')).toBeInTheDocument()
    expect(container.querySelector('time')).toBeNull()
    expect(container).not.toHaveTextContent(/Invalid|NaN/)
  })
})
