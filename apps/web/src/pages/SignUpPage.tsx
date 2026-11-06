import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Alert } from '../components/Alert';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { useFormAction } from '../hooks/useFormAction';
import { registerUser } from '../services/auth';
import {
  PASSWORD_HINT,
  validateEmail,
  validateName,
  validateNewPassword,
  validatePasswordMatch,
} from '../utils/validation';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmation?: string;
}

export function SignUpPage() {
  const navigate = useNavigate();
  const { pending, error, run } = useFormAction();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const errors: FieldErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validateNewPassword(password),
      confirmation: validatePasswordMatch(password, confirmation),
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    await run(async () => {
      await registerUser(name, email, password);
      void navigate('/verify-email', {
        state: {
          email,
          notice: 'Account created. We sent a verification code to your email.',
        },
      });
    });
  }

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      }
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <FormField
          label="Name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={fieldErrors.confirmation}
        />

        <button type="submit" className="button button--full" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
