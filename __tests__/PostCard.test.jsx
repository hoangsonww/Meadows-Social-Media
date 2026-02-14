import { render, screen, fireEvent } from '@testing-library/react';
import PostCard from '@/components/PostCard';
import { createSupabaseComponentClient } from '@/utils/supabase/clients/component';
import { toast } from 'sonner';

jest.mock('@/utils/supabase/clients/component');
jest.mock('sonner');

const fakeUser = { id: 'u1' };
const fakePost = {
  id: 'p1',
  author: { id: 'u2', name: 'Alice', handle: 'alice', avatar_url: null },
  content: 'Hello world',
  likes: [{ profile_id: 'u1' }, { profile_id: 'u3' }],
  vibes: [{ profile_id: 'u1', vibe: 'real' }],
  attachments: [],
  poll: null,
  attachment_url: null,
};

describe('PostCard', () => {
  let toggleLikeSpy;

  beforeEach(() => {
    toggleLikeSpy = jest.fn();
    createSupabaseComponentClient.mockReturnValue({ storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }) } });
    jest.mock('@/utils/supabase/queries/post', () => ({
      toggleLike: toggleLikeSpy,
    }));
  });

  it('renders content and like count', () => {
    render(<PostCard user={fakeUser} post={fakePost} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    // initial likes: 2, user already liked so shows 1+1 = 2
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('toggles like and shows toast', () => {
    render(<PostCard user={fakeUser} post={fakePost} />);
    const btn = screen.getByRole('button', { name: /2/i });
    fireEvent.click(btn);
    expect(toggleLikeSpy).toHaveBeenCalledWith(expect.anything(), fakeUser, 'p1');
    expect(toast.success).toHaveBeenCalledWith('Unliked post');
  });
});
