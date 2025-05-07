"use client"

import { useAuth } from "context/AuthContext" // Assurez-vous que ce chemin est correct
import Icon from "@mui/material/Icon"
import Tooltip from "@mui/material/Tooltip"
import MDBox from "components/MDBox"

function SignOutButton() {
  const { logout } = useAuth()

  return (
    <MDBox
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        cursor: "pointer",
        padding: "12px",
        borderRadius: "50%",
        transition: "background-color 0.3s",
        "&:hover": {
          backgroundColor: "rgba(255, 152, 0, 0.1)",
        },
      }}
      onClick={logout} // Utilise directement la fonction logout de votre AuthContext
    >
      <Tooltip title="Se déconnecter" placement="right">
        <Icon sx={{ color: "#ff9800" }}>logout</Icon>
      </Tooltip>
    </MDBox>
  )
}

export default SignOutButton
