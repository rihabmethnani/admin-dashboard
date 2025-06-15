"use client"

import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import PropTypes from "prop-types"

// @material-ui core components
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import IconButton from "@mui/material/IconButton"
import Icon from "@mui/material/Icon"
import Badge from "@mui/material/Badge"

// Material Dashboard 2 React components
import MDBox from "components/MDBox"
import MDInput from "components/MDInput"

// Material Dashboard 2 React example components
import Breadcrumbs from "examples/Breadcrumbs"

// Custom components
import NotificationMenu from "components/NotificationMenu"

// Custom styles for DashboardNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles"

// Material Dashboard 2 React context
import {
  useMaterialUIController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
  setSearchTerm,
} from "context"
import { useAuth } from "context/AuthContext"

// Apollo Client et hooks personnalisés
import { ApolloProvider } from "@apollo/client"
import { useNotifications } from "hooks/useNotifications"
import { clientMicroservice3 } from "apolloClients/microservice3"

// Composant interne qui utilise les notifications
function DashboardNavbarContent({ absolute, light, isMini }) {
  const [navbarType, setNavbarType] = useState()
  const [controller, dispatch] = useMaterialUIController()
  const { searchTerm } = controller
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator, darkMode } = controller
  const [openMenu, setOpenMenu] = useState(false)
  const route = useLocation().pathname.split("/").slice(1)
  const { currentUser, logout } = useAuth()

  // Hook pour les notifications
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead } = useNotifications(currentUser?._id)

  useEffect(() => {
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky")
    } else {
      setNavbarType("static")
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar)
    }

    window.addEventListener("scroll", handleTransparentNavbar)
    handleTransparentNavbar()

    return () => window.removeEventListener("scroll", handleTransparentNavbar)
  }, [dispatch, fixedNavbar])

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav)
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator)
  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget)
  const handleCloseMenu = () => setOpenMenu(false)

  // Styles for the navbar icons
  const iconsStyle = ({ palette: { dark, white, text }, functions: { rgba } }) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main

      if (transparentNavbar && !light) {
        colorValue = darkMode ? rgba(text.main, 0.6) : text.main
      }

      return colorValue
    },
  })

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light, darkMode })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        <MDBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          <Breadcrumbs title={route[route.length - 1]} route={route} light={light} />
        </MDBox>
        {isMini ? null : (
          <MDBox sx={(theme) => navbarRow(theme, { isMini })}>
            <MDBox pr={1}>
              {/* <MDInput
                label="Search here"
                // value={searchTerm}
                onChange={(e) => setSearchTerm(dispatch, e.target.value)}
              /> */}
            </MDBox>
            <MDBox color={light ? "white" : "inherit"}>
              <IconButton onClick={() => logout()} sx={navbarIconButton} size="small" disableRipple>
                <Icon sx={iconsStyle}>login</Icon>
              </IconButton>

              <IconButton size="small" disableRipple color="inherit" sx={navbarMobileMenu} onClick={handleMiniSidenav}>
                <Icon sx={iconsStyle} fontSize="medium">
                  {miniSidenav ? "menu_open" : "menu"}
                </Icon>
              </IconButton>

              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarIconButton}
                onClick={handleConfiguratorOpen}
              >
                {/* <Icon sx={iconsStyle}>settings</Icon> */}
              </IconButton>

              {/* Icône de notification simple avec badge */}
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarIconButton}
                aria-controls="notification-menu"
                aria-haspopup="true"
                variant="contained"
                onClick={handleOpenMenu}
              >
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.75rem",
                      minWidth: "16px",
                      height: "16px",
                      borderRadius: "8px",
                    },
                  }}
                >
                  <Icon sx={iconsStyle}>notifications</Icon>
                </Badge>
              </IconButton>

              {/* Menu des notifications simple */}
              <NotificationMenu
                anchorEl={openMenu}
                open={Boolean(openMenu)}
                onClose={handleCloseMenu}
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
              />
            </MDBox>
          </MDBox>
        )}
      </Toolbar>
    </AppBar>
  )
}

// Composant principal avec ApolloProvider
function DashboardNavbar({ absolute, light, isMini }) {
  return (
    <ApolloProvider client={clientMicroservice3}>
      <DashboardNavbarContent absolute={absolute} light={light} isMini={isMini} />
    </ApolloProvider>
  )
}

// Setting default values for the props of DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
}

// Typechecking props for the DashboardNavbar
DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
}

export default DashboardNavbar
