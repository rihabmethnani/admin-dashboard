// src/components/Basic.js

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useLazyQuery } from "@apollo/client";
import gql from "graphql-tag";

// @mui material components
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Grid from "@mui/material/Grid";
import MuiLink from "@mui/material/Link";

// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

// Authentication layout components
import BasicLayout from "layouts/authentication/components/BasicLayout";

// Images
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import { clientMicroservice1 } from "apolloClients/microservice1";
import { useAuth } from "context/AuthContext";


function Basic() {
  const {currentUser,setCurentUser}=useAuth()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  // GraphQL Mutation
  const LOGIN_MUTATION = gql`
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        access_token
      }
    }
  `;

  // Utilisez le client spécifique pour le microservice 1
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION, {
    client: clientMicroservice1,
    onCompleted:(data)=>{
    console.log(data)
    }, // Spécifiez explicitement le client ici
    
  });
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


  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!email || !password) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
  
    try {
      const { data } = await login({ variables: { email, password } });
      const token = data.login.access_token;
  
      localStorage.setItem("access_token", token);
  
      // Now fetch the current user using loadMe
      const { data: userData } = await loadMe({ variables: { token } });
  if (userData && userData.loadMe) {
        setCurentUser(userData.loadMe); // Store the user data in the context
        console.log("Current User:", userData.loadMe);
        console.log('currentUser',currentUser)
      }
  
      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
    }
  };
  return (
    <BasicLayout image={bgImage}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="info"
          mx={2}
          mt={-3}
          p={2}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            Sign in
          </MDTypography>
          {/* <Grid container spacing={3} justifyContent="center" sx={{ mt: 1, mb: 2 }}>
            <Grid item xs={2}>
              <MDTypography component={MuiLink} href="#" variant="body1" color="white">
                <FacebookIcon color="inherit" />
              </MDTypography>
            </Grid>
            <Grid item xs={2}>
              <MDTypography component={MuiLink} href="#" variant="body1" color="white">
                <GitHubIcon color="inherit" />
              </MDTypography>
            </Grid>
            <Grid item xs={2}>
              <MDTypography component={MuiLink} href="#" variant="body1" color="white">
                <GoogleIcon color="inherit" />
              </MDTypography>
            </Grid>
          </Grid> */}
        </MDBox>
        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit}>
            <MDBox mb={2}>
              <MDInput
                type="email"
                label="Email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="password"
                label="Password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </MDBox>
            <MDBox display="flex" alignItems="center" ml={-1}>
              <Switch checked={rememberMe} onChange={handleSetRememberMe} />
              <MDTypography
                variant="button"
                fontWeight="regular"
                color="text"
                onClick={handleSetRememberMe}
                sx={{ cursor: "pointer", userSelect: "none", ml: -1 }}
              >
                &nbsp;&nbsp;Remember me
              </MDTypography>
            </MDBox>
            <MDBox mt={4} mb={1}>
              <MDButton variant="gradient" color="info" fullWidth type="submit">
                {loading ? "Signing in..." : "Sign in"}
              </MDButton>
            </MDBox>
            {/* <MDBox mt={3} mb={1} textAlign="center">
              <MDTypography variant="button" color="text">
                Don&apos;t have an account?{" "}
                <MDTypography
                  component={Link}
                  to="/authentication/sign-up"
                  variant="button"
                  color="info"
                  fontWeight="medium"
                  textGradient
                >
                  Sign up
                </MDTypography>
              </MDTypography>
            </MDBox> */}
            {error && (
              <MDBox mt={2}>
                <MDTypography variant="caption" color="error">
                  Invalid credentials. Please try again.
                </MDTypography>
              </MDBox>
            )}
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default Basic;