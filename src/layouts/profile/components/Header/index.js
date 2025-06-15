"use client"

/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect } from "react"

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types"

// @mui material components
import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import { alpha } from "@mui/material/styles"

// Material Dashboard 2 React components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDAvatar from "components/MDAvatar"

// Material Dashboard 2 React base styles
import breakpoints from "assets/theme/base/breakpoints"

// Images
import burceMars from "assets/images/image.png"
import backgroundImage from "assets/images/profile-bg.jpg"
import { useAuth } from "context/AuthContext"

// Theme colors
const WARNING_COLOR = "#ff9800" // Orange warning color

function Header({ children }) {
  const [tabsOrientation, setTabsOrientation] = useState("horizontal")
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    // A function that sets the orientation state of the tabs.
    function handleTabsOrientation() {
      return window.innerWidth < breakpoints.values.sm
        ? setTabsOrientation("vertical")
        : setTabsOrientation("horizontal")
    }

    /** 
     The event listener that's calling the handleTabsOrientation function when resizing the window.
    */
    window.addEventListener("resize", handleTabsOrientation)

    // Call the handleTabsOrientation function to set the state with the initial value.
    handleTabsOrientation()

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleTabsOrientation)
  }, [tabsOrientation])

  const handleSetTabValue = (event, newValue) => setTabValue(newValue)
  const { currentUser, setCurentUser } = useAuth()

  return (
    <MDBox position="relative" mb={5}>
      <MDBox
        display="flex"
        alignItems="center"
        position="relative"
        height="25rem" // Reduced height for the cover image
        borderRadius="xl"
        sx={{
          backgroundImage: ({ functions: { rgba, linearGradient }, palette: { gradients } }) =>
            `${linearGradient(
              rgba(gradients.warning.main, 0.6),
              rgba(gradients.warning.state, 0.6),
            )}, url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
        }}
      />
      <Card
        sx={{
          position: "relative",
          mt: -8, // Move the card up to overlap with the background image
          mx: 3,
          py: 2,
          px: 2,
          backdropFilter: "blur(4px)",
          backgroundColor: ({ palette: { white, transparent } }) => alpha(white.main, 0.8),
          boxShadow: ({ boxShadows: { xxl } }) => xxl,
          overflow: "visible",
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <MDAvatar
              src={currentUser?.image || burceMars}
              alt="profile-image"
              size="lg" // Smaller avatar size (changed from xl to lg)
              shadow="sm"
              sx={{
                mt: -6, // Move the avatar up to overlap with the card
                border: `3px solid ${WARNING_COLOR}`,
                backgroundColor: "white",
                transform: "translateY(-30%)", // Further adjust position
                boxShadow: `0 0 20px ${alpha(WARNING_COLOR, 0.5)}`,
              }}
            />
          </Grid>
          <Grid item>
            <MDBox height="100%" mt={0.5} lineHeight={1}>
              <MDTypography variant="h5" fontWeight="medium" color="warning">
                {currentUser?.name || "User Name"}
              </MDTypography>
              <MDTypography variant="button" color="text" fontWeight="regular">
                {currentUser?.role || "Role"}
              </MDTypography>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ ml: "auto" }}>
            {/* You can add additional content here if needed */}
          </Grid>
        </Grid>
        {children}
      </Card>
    </MDBox>
  )
}

// Setting default props for the Header
Header.defaultProps = {
  children: "",
}

// Typechecking props for the Header
Header.propTypes = {
  children: PropTypes.node,
}

export default Header
