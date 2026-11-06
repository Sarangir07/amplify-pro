import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Alert } from '../components/Alert';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { useAuthRouteState } from '../hooks/useAuthRouteState';
import { useFormAction } from '../hooks/useFormAction';
import { requestPasswordReset } from '../services/auth';
import { validateEmail } from '../utils/validation';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const routeState = useAuthRouteState();
  const { pending, error, run } = useFormAction();

  const [email, setEmail] = useState(routeState.email ?? '');
  const [emailError, setEmailError] = useState<string>();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const invalidEmail = validateEmail(email);
    setEmailError(invalidEmail);
    if (invalidEmail) {
      return;
    }

    await run(async () => {
      await requestPasswordReset(email);
      void navigate('/reset-password', {
        state: {
          email,
          // Worded carefully: this page mustn't reveal which emails have accounts.
          notice: 'If an account exists for that email, we sent it a code.',
        },
      });
    });
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      intro="Enter your email and we’ll send you a code to reset it."
      footer={<Link to="/login">Back to log in</Link>}
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
        />

        <button type="submit" className="button button--full" disabled={pending}>
          {pending ? 'Sending…' : 'Send code'}
        </button>
      </form>
    </AuthLayout>
  );
}
