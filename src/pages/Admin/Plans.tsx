// Redirect to Plan Management page
import { Navigate } from "react-router-dom";

export default function PlansPage() {
  return <Navigate to="/admin/plans/manage" replace />;
}
