import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchResultsView } from './ContentViews';

const results = [
  {
    address: 'moss-library.zz',
    title: 'Moss Library',
    snippet: 'Low shelves and damp air.',
    author: { id: '1', name: 'Priya Shah', slug: 'priya-shah' },
  },
  {
    address: 'rainroom.zz',
    title: 'Rain Room',
    snippet: 'A roof tuned to weather.',
    author: { id: '2', name: 'Priya Shah', slug: 'priya-shah' },
  },
];

describe('SearchResultsView', () => {
  it('shows query, result count, title, address, author and snippet', () => {
    render(
      <SearchResultsView
        query="moss"
        results={results}
        onOpenResult={jest.fn()}
      />,
    );

    expect(screen.getByText(/Results for “moss”/)).toBeInTheDocument();
    expect(screen.getByTestId('search-result-count')).toHaveTextContent('2 results');
    expect(screen.getByText('Moss Library')).toBeInTheDocument();
    expect(screen.getByText('moss-library.zz')).toBeInTheDocument();
    expect(screen.getByText('Low shelves and damp air.')).toBeInTheDocument();
    expect(screen.getAllByText(/by Priya Shah/).length).toBeGreaterThan(0);
  });

  it('shows empty, loading and error states', () => {
    const { rerender } = render(
      <SearchResultsView
        query="ghost"
        results={[]}
        loading
        onOpenResult={jest.fn()}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/Searching/);

    rerender(
      <SearchResultsView
        query="ghost"
        results={[]}
        error="Network down"
        onOpenResult={jest.fn()}
        onRetry={jest.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();

    rerender(
      <SearchResultsView
        query="ghost"
        results={[]}
        onOpenResult={jest.fn()}
      />,
    );
    expect(screen.getByTestId('search-empty')).toHaveTextContent(/No sites matched/);
  });

  it('navigates when a result is clicked', async () => {
    const user = userEvent.setup();
    const onOpenResult = jest.fn();
    render(
      <SearchResultsView
        query="moss"
        results={results}
        onOpenResult={onOpenResult}
      />,
    );

    await user.click(screen.getByText('Moss Library'));
    expect(onOpenResult).toHaveBeenCalledWith('moss-library.zz');
  });
});
