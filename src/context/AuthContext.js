import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { gql, useLazyQuery } from '@apollo/client';
import { clientMicroservice1 } from 'apolloClients/microservice1';
import { useNavigate } from 'react-router-dom';

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
  });


    const navigate = useNavigate();
const [currentUser,setCurentUser]=useState(null)
  useEffect(() => {
    const token = localStorage.getItem("access_token"); // Get the token from local storage

   const loadCurrentUser = async () => {
      if (!token) {
        navigate("/authentication/sign-in");
      } else {

        const { data: userData } = await loadMe({ variables: { token } });
        if (userData && userData.loadMe) {
          setCurentUser(userData.loadMe); // Store the user data in the context
          console.log("Current User:", userData.loadMe);
          console.log('currentUser',currentUser)
          navigate("/dashboard");
        }
      }
    };
    loadCurrentUser();
  }, []);


  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ logout,currentUser,setCurentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
