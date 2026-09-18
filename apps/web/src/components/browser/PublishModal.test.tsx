import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublishModal } from './PublishModal';
import { api } from '@/lib/api';
import { ApiError } from '@/types';

jest.mock('@/lib/api', () => ({
  api: {
    publishSite: jest.fn(),
  },
}));

const mockedPublish = api.publishSite as jest.MockedFunction<typeof api.publishSite>;

describe('PublishModal', () => {
  beforeEach(() => {
    mockedPublish.mockReset();
  });

  it('shows author, address guidance and tidepool example', () => {
    render(
      <PublishModal
        open
        authorId="ada"
        authorName="Ada Mercer"
        onClose={jest.fn()}
        onPublished={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Author')).toHaveValue('Ada Mercer');
    expect(screen.getByText(/one valid/i)).toBeInTheDocument();
    expect(screen.getByText(/100 KB/i)).toBeInTheDocument();
    expect((screen.getByLabelText('HTML') as HTMLTextAreaElement).value).toContain(
      'tidepool.zz',
    );
  });

  it('surfaces duplicate-address errors from the API', async () => {
    const user = userEvent.setup();
    mockedPublish.mockRejectedValue(
      new ApiError(409, 'Site already exists', { statusCode: 409 }),
    );

    render(
      <PublishModal
        open
        authorId="ada"
        authorName="Ada Mercer"
        onClose={jest.fn()}
        onPublished={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Address'), 'dup.zz');
    await user.type(screen.getByLabelText('Title'), 'Dup');
    await user.click(screen.getByRole('button', { name: 'Publish site' }));

    expect(await screen.findByTestId('publish-error')).toHaveTextContent(
      /already published/i,
    );
  });

  it('closes via onPublished after a successful publish', async () => {
    const user = userEvent.setup();
    const onPublished = jest.fn();
    mockedPublish.mockResolvedValue({
      address: 'new-garden.zz',
      title: 'Garden',
      sanitizedHtml: '<p>Hi</p>',
      author: { id: 'ada', name: 'Ada Mercer', slug: 'ada-mercer' },
    });

    render(
      <PublishModal
        open
        authorId="ada"
        authorName="Ada Mercer"
        onClose={jest.fn()}
        onPublished={onPublished}
      />,
    );

    await user.clear(screen.getByLabelText('HTML'));
    await user.type(
      screen.getByLabelText('HTML'),
      '<p><a href="tidepool.zz">tide</a></p>',
    );
    await user.type(screen.getByLabelText('Address'), 'new-garden.zz');
    await user.type(screen.getByLabelText('Title'), 'Garden');
    await user.click(screen.getByRole('button', { name: 'Publish site' }));

    await waitFor(() => {
      expect(onPublished).toHaveBeenCalledWith('new-garden.zz');
    });
  });
});
