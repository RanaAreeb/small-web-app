import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryDrawer } from './HistoryDrawer';
import { api } from '@/lib/api';
import type { Visit } from '@/types';

jest.mock('@/lib/api', () => ({
  api: {
    getHistory: jest.fn(),
    deleteVisit: jest.fn(),
  },
}));

const mockedGetHistory = api.getHistory as jest.MockedFunction<typeof api.getHistory>;
const mockedDeleteVisit = api.deleteVisit as jest.MockedFunction<
  typeof api.deleteVisit
>;

const visitA: Visit = {
  id: '1',
  personId: 'ada',
  address: 'tidepool.zz',
  outcome: 'shown',
  via: 'typed',
  visitedAt: '2024-06-15T14:02:00.000Z',
  site: { id: 's1', address: 'tidepool.zz', title: 'Tidepool Journal' },
};

const visitB: Visit = {
  id: '2',
  personId: 'ada',
  address: 'tidepool.zz',
  outcome: 'shown',
  via: 'link',
  visitedAt: '2024-06-15T14:26:00.000Z',
  site: { id: 's1', address: 'tidepool.zz', title: 'Tidepool Journal' },
};

describe('HistoryDrawer', () => {
  beforeEach(() => {
    mockedGetHistory.mockReset();
    mockedDeleteVisit.mockReset();
  });

  it('lists repeated visits without deduplicating', async () => {
    mockedGetHistory.mockResolvedValue({
      items: [visitB, visitA],
    });

    render(
      <HistoryDrawer
        open
        personId="ada"
        personName="Ada Mercer"
        onClose={jest.fn()}
        onOpenAddress={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('history-list').querySelectorAll('li')).toHaveLength(2);
    });
    expect(screen.getByText(/Ada Mercer’s visits/)).toBeInTheDocument();
    expect(screen.getAllByText('tidepool.zz')).toHaveLength(2);
    expect(screen.getByText(/via typed/i)).toBeInTheDocument();
    expect(screen.getByText(/via link/i)).toBeInTheDocument();
  });

  it('closes and navigates when an item is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onOpenAddress = jest.fn();
    mockedGetHistory.mockResolvedValue({ items: [visitA] });

    render(
      <HistoryDrawer
        open
        personId="ada"
        personName="Ada Mercer"
        onClose={onClose}
        onOpenAddress={onOpenAddress}
      />,
    );

    await screen.findByText('Tidepool Journal');
    await user.click(screen.getByText('Tidepool Journal'));

    expect(onOpenAddress).toHaveBeenCalledWith('tidepool.zz');
  });

  it('shows a Load older control when a next cursor exists', async () => {
    mockedGetHistory.mockResolvedValue({
      items: [visitA],
      nextCursor: 'cursor-1',
    });

    render(
      <HistoryDrawer
        open
        personId="ada"
        onClose={jest.fn()}
        onOpenAddress={jest.fn()}
      />,
    );

    expect(await screen.findByRole('button', { name: /Load older/i })).toBeInTheDocument();
  });

  it('deletes a visit when the delete button is clicked', async () => {
    const user = userEvent.setup();
    mockedGetHistory.mockResolvedValue({ items: [visitA, visitB] });
    mockedDeleteVisit.mockResolvedValue(undefined);

    render(
      <HistoryDrawer
        open
        personId="ada"
        personName="Ada Mercer"
        onClose={jest.fn()}
        onOpenAddress={jest.fn()}
      />,
    );

    await screen.findByText(/via typed/i);
    const deleteButtons = screen.getAllByRole('button', {
      name: /Delete visit to tidepool\.zz/,
    });
    await user.click(deleteButtons[0]!);

    await waitFor(() => {
      expect(mockedDeleteVisit).toHaveBeenCalledWith('1');
    });
    await waitFor(() => {
      expect(screen.getByTestId('history-list').querySelectorAll('li')).toHaveLength(
        1,
      );
    });
  });
});
