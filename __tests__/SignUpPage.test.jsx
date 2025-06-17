import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUpPage from '@/pages/signup';
import { createSupabaseComponentClient } from '@/utils/supabase/clients/component';
import { toast } from 'sonner';

jest.mock('@/utils/supabase/clients/component');
jest.mock('sonner');

describe('SignUpPage', () => {
  let signUpSpy;

  beforeEach(() => {
    signUpSpy = jest.fn();
    createSupabaseComponentClient.mockReturnValue({
      auth: { signUp: signUpSpy },
    });
  });

  it('validates empty fields', () => {
    render(<SignUpPage />);
    fireEvent.click(screen.getByText('Sign Up'));
    expect(toast.error).toHaveBeenCalledWith('Please fill out all fields!');
  });

  it('calls supabase and shows success toast', async () => {
    signUpSpy.mockResolvedValue({ data: { user: {} }, error: null });
    render(<SignUpPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'u@v.com' } });
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/Handle/i), { target: { value: 'user123' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(signUpSpy).toHaveBeenCalledWith({
        email: 'u@v.com',
        password: 'pass',
        options: { data: { name: 'User', handle: 'user123' } },
      });
      expect(toast.success).toHaveBeenCalledWith('Sign-up successful!');
    });
  });

  it('handles supabase error', async () => {
    signUpSpy.mockResolvedValue({ data: null, error: { message: 'Oops' } });
    render(<SignUpPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'e@f.com' } });
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'E' } });
    fireEvent.change(screen.getByLabelText(/Handle/i), { target: { value: 'e' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'p' } });
    fireEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Oops');
    });
  });
});
