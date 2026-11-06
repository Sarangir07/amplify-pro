import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface AuthLayoutProps {
  title: string;
  intro?: string;
  children: ReactNode;
  /** Links shown below the card, such as "Already have an account?". */
  footer?: ReactNode;
}

/** The shared frame around the sign-up, login and password pages. */
export function AuthLayout({ title, intro, children, footer }: AuthLayoutProps) {
  return (
    <main className="page page--narrow">
      <Link to="/" className="brand">
        Amplify Project
      </Link>
      <div className="card">
        <h1 className="card-title">{title}</h1>
        {intro && <p className="card-intro">{intro}</p>}
        {children}
      </div>
      {footer && <div className="auth-footer">{footer}</div>}
    </main>
  );
}
