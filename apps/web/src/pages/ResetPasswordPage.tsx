import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Alert } from '../components/Alert';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { useAuthRouteState } from '../hooks/useAuthRouteState';
import { useFormAction } from '../hooks/useFormAction';
import { confirmPasswordReset, requestPasswordReset } from '../services/auth';
import {
  PASSWORD_HINT,
  validateCode,
  validateEmail,
  validateNewPassword,
  validatePasswordMatch,
} from '../utils/validation';

interface FieldErrors {
  email?: string;
  code?: string;
  password?: string;
  confirmation?: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const routeState = useAuthRouteState();
  const { pending, error, run } = useFormAction();

  const [email, setEmail] = useState(routeState.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState(routeState.notice);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const errors: FieldErrors = {
      email: validateEmail(email),
      code: validateCode(code),
      password: validateNewPassword(password),
      confirmation: validatePasswordMatch(password, confirmation),
    };
    setFieldErrors(errors);
    setNotice(undefined);
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    await run(async () => {
      await confirmPasswordReset(email, code, password);
      void navigate('/login', {
        state: {
          email,
          notice: 'Password updated. You can now log in with your new password.',
        },
      });
    });
  }

  async function handleResend() {
    const invalidEmail = validateEmail(email);
    setFieldErrors({ email: invalidEmail });
    setNotice(undefined);
    if (invalidEmail) {
      return;
    }

    await run(async () => {
      await requestPasswordReset(email);
      setNotice('If an account exists for that email, we sent it a new code.');
    });
  }

  return (
    <AuthLayout
      title="Reset your password"
      intro="Enter the code we emailed you and choose a new password."
      footer={<Link to="/login">Back to log in</Link>}
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
          error={fieldErrors.email}
        />
        <FormField
          label="Code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          error={fieldErrors.code}
        />
        <FormField
          label="New password"
          type="password"
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        <FormField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={fieldErrors.confirmation}
        />

        <button type="submit" className="button button--full" disabled={pending}>
          {pending ? 'Please wait…' : 'Reset password'}
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
