import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/pages/login';
import { createSupabaseComponentClient } from '@/utils/supabase/clients/component';
import { toast } from 'sonner';

jest.mock('@/utils/supabase/clients/component');
jest.mock('sonner');

describe('LoginPage', () => {
  let signInSpy;

  beforeEach(() => {
    // Mock supabase.auth.signInWithPassword
    signInSpy = jest.fn();
    createSupabaseComponentClient.mockReturnValue({
      auth: { signInWithPassword: signInSpy },
    });
  });

  it('shows validation error if fields empty', async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText('Login'));
    expect(toast.error).toHaveBeenCalledWith('Please enter both email and password!');
  });

  it('calls supabase and shows success toast on login', async () => {
    signInSpy.mockResolvedValue({ data: { user: {} }, error: null });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(signInSpy).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' });
      expect(toast.success).toHaveBeenCalledWith('Logged in successfully!');
    });
  });

  it('shows error toast on supabase error', async () => {
    signInSpy.mockResolvedValue({ data: null, error: { message: 'Bad creds' } });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'x@y.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'pw' } });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Bad creds');
    });
  });
});
