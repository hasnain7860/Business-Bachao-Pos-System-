// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../Appfullcontext.jsx'


const ProtectedRoute = ({ children }) => {
  const context = useAppContext()
  return context.isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;