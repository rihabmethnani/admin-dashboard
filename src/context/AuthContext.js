import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { gql, useLazyQuery } from '@apollo/client';
import { clientMicroservice1 } from 'apolloClients/microservice1';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const LOAD_ME_QUERY = gql`
    query LoadMe($token: String!) {
      loadMe(token: $token) {
        _id
        name
        email
        role
      }
    }
  `;

  const [loadMe] = useLazyQuery(LOAD_ME_QUERY, {
    client: clientMicroservice1,
    fetchPolicy: 'network-only', // very important: always refetch, don't use cache
  });

  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = localStorage.getItem("access_token"); // Always get the latest token
      if (!token) {
        setCurrentUser(null);
        if (location.pathname !== '/authentication/sign-in') {
          navigate("/authentication/sign-in", { replace: true });
        }
        return;
      }
      try {
        const { data: userData } = await loadMe({ variables: { token } });
        if (userData?.loadMe) {
          setCurrentUser(userData.loadMe);
        } else {
          // Token is invalid
          setCurrentUser(null);
          navigate("/authentication/sign-in", { replace: true });
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        setCurrentUser(null);
        navigate("/authentication/sign-in", { replace: true });
      }
    };

    loadCurrentUser();
  }, [location.pathname]); // Re-run every time location changes

  const logout = () => {
    localStorage.removeItem("access_token");
    setCurrentUser(null);
    navigate("/authentication/sign-in", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ logout, currentUser, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
