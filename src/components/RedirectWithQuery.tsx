import { Navigate, useLocation } from 'react-router-dom';

interface RedirectWithQueryProps {
  to: string;
}

/**
 * Redirects to the target path while preserving query parameters (e.g. UTM, ref).
 */
export function RedirectWithQuery({ to }: RedirectWithQueryProps) {
  const location = useLocation();
  const search = location.search || '';
  const target = search ? `${to}${search}` : to;
  return <Navigate to={target} replace />;
}
