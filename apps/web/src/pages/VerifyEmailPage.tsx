import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Alert } from '../components/Alert';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { useAuthRouteState } from '../hooks/useAuthRouteState';
import { useFormAction } from '../hooks/useFormAction';
import { confirmRegistration, resendVerificationCode } from '../services/auth';
import { validateCode, validateEmail } from '../utils/validation';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const routeState = useAuthRouteState();
  const { pending, error, run } = useFormAction();

  const [email, setEmail] = useState(routeState.email ?? '');
  const [code, setCode] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();
  const [notice, setNotice] = useState(routeState.notice);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const invalidEmail = validateEmail(email);
    const invalidCode = validateCode(code);
    setEmailError(invalidEmail);
    setCodeError(invalidCode);
    setNotice(undefined);
    if (invalidEmail || invalidCode) {
      return;
    }

    await run(async () => {
      await confirmRegistration(email, code);
      void navigate('/login', {
        state: { email, notice: 'Email verified. You can now log in.' },
      });
    });
  }

  async function handleResend() {
    const invalidEmail = validateEmail(email);
    setEmailError(invalidEmail);
    setNotice(undefined);
    if (invalidEmail) {
      return;
    }

    await run(async () => {
      await resendVerificationCode(email);
      setNotice('We sent a new code. Check your inbox and spam folder.');
    });
  }

  return (
    <AuthLayout
      title="Verify your email"
      intro="Enter the code we emailed you."
      footer={
        <p>
          Already verified? <Link to="/login">Log in</Link>
        </p>
      }
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        {notice && <Alert tone="success">{notice}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}

        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
        />
        <FormField
          label="Verification code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          error={codeError}
        />

        <button type="submit" className="button button--full" disabled={pending}>
          {pending ? 'Please wait…' : 'Verify email'}
        </button>
        <button
          type="button"
          className="button button--secondary button--full"
          onClick={() => void handleResend()}
          disabled={pending}
        >
          Send a new code
        </button>
      </form>
    </AuthLayout>
  );
}
