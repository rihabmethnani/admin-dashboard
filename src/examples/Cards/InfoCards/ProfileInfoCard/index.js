"use client"

/**
 * Material Dashboard 2 React - v2.2.0
 */

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import PropTypes from "prop-types"

// @mui material components
import Card from "@mui/material/Card"
import Divider from "@mui/material/Divider"
import Tooltip from "@mui/material/Tooltip"
import Icon from "@mui/material/Icon"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import CircularProgress from "@mui/material/CircularProgress"
import Alert from "@mui/material/Alert"

// Material Dashboard 2 React components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"

// Apollo client
import { useMutation, gql } from "@apollo/client"
import { useAuth } from "context/AuthContext"

export const UPDATE_PROFILE = gql`
  mutation UpdateSuperAdminProfile($updateUserDto: UpdateUserDto!) {
    updateSuperAdminProfile(updateUserDto: $updateUserDto) {
      _id
      name
      email
      phone
      address
      image
    }
  }
`;

function ProfileInfoCard({ title, description, info = {}, social, action, shadow }) {
  const [open, setOpen] = useState(false)
  const { currentUser, setCurrentUser } = useAuth()
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Initialize form values with current user data
  const [formValues, setFormValues] = useState({
    name: info?.fullName || "",
    email: info?.email || "",
    phone: info?.mobile || "",
    address: info?.location || "",
    image: info?.image || "",
  })

  const [updateProfile, { loading, error }] = useMutation(UPDATE_PROFILE, {
    onCompleted: (data) => {
      if (setCurrentUser && data.updateSuperAdminProfile) {
        setCurrentUser({
          ...currentUser,
          ...data.updateSuperAdminProfile,
        })
      }
      setSuccessMessage("Profile updated successfully!")
      setTimeout(() => {
        setOpen(false)
        setSuccessMessage("")
      }, 2000)
    },
    onError: (err) => {
      console.error("Update failed", err)
      setErrorMessage(err.message || "Failed to update profile. Please try again.")
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    try {
      await updateProfile({
        variables: {
          updateUserDto: formValues,
        },
      })
    } catch (err) {
      // Error is handled in onError callback
    }
  }

  const handleOpenDialog = () => {
    setFormValues({
      name: info?.fullName || "",
      email: info?.email || "",
      phone: info?.mobile || "",
      address: info?.location || "",
      image: info?.image || "",
    })
    setErrorMessage("")
    setSuccessMessage("")
    setOpen(true)
  }

  // Return loading state if info is not available
  if (!info || Object.keys(info).length === 0) {
    return (
      <Card sx={{ height: "100%", boxShadow: !shadow && "none" }}>
        <MDBox p={3} display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
        </MDBox>
      </Card>
    )
  }

  const labels = []
  const values = []

  // Convert object keys to labels
  Object.keys(info).forEach((el) => {
    if (el.match(/[A-Z\s]+/)) {
      const uppercaseLetter = Array.from(el).find((i) => i.match(/[A-Z]+/))
      const newElement = el.replace(uppercaseLetter, ` ${uppercaseLetter.toLowerCase()}`)
      labels.push(newElement)
    } else {
      labels.push(el)
    }
  })

  // Push the object values into the values array
  Object.values(info).forEach((el) => values.push(el))

  // Render the card info items
  const renderItems = labels.map((label, key) => (
    <MDBox key={label} display="flex" py={1} pr={2}>
      <MDTypography variant="button" fontWeight="bold" textTransform="capitalize">
        {label}: &nbsp;
      </MDTypography>
      <MDTypography variant="button" fontWeight="regular" color="text">
        &nbsp;{values[key] || "N/A"}
      </MDTypography>
    </MDBox>
  ))

  return (
    <Card sx={{ height: "100%", boxShadow: !shadow && "none" }}>
      <MDBox display="flex" justifyContent="flex-end" alignItems="center" pt={2} px={2}>
        <MDTypography component={Link} to={action.route} variant="body2" color="secondary">
          <Tooltip title={action.tooltip} placement="top">
            <Icon onClick={handleOpenDialog} style={{ cursor: "pointer" }}>
              edit
            </Icon>
          </Tooltip>
        </MDTypography>
      </MDBox>
      <MDBox p={2}>
        <MDBox mb={2} lineHeight={1}>
          <MDTypography variant="button" color="text" fontWeight="light">
            {description}
          </MDTypography>
        </MDBox>
        <MDBox opacity={0.3}>
          <Divider />
        </MDBox>
        <MDBox>{renderItems}</MDBox>
      </MDBox>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          <TextField
            margin="dense"
            label="Name"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            fullWidth
            disabled={loading}
          />
          <TextField
            margin="dense"
            label="Email"
            name="email"
            type="email"
            value={formValues.email}
            onChange={handleChange}
            fullWidth
            disabled={loading}
          />
          <TextField
            margin="dense"
            label="Phone"
            name="phone"
            value={formValues.phone}
            onChange={handleChange}
            fullWidth
            disabled={loading}
          />
          <TextField
            margin="dense"
            label="Address"
            name="address"
            value={formValues.address}
            onChange={handleChange}
            fullWidth
            disabled={loading}
            multiline
            rows={2}
          />
          <TextField
            margin="dense"
            label="Image URL"
            name="image"
            value={formValues.image}
            onChange={handleChange}
            fullWidth
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="secondary" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

// Setting default props for the ProfileInfoCard
ProfileInfoCard.defaultProps = {
  shadow: true,
  social: [],
  info: {},
}

// Typechecking props for the ProfileInfoCard
ProfileInfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  info: PropTypes.object,
  social: PropTypes.arrayOf(PropTypes.object),
  action: PropTypes.shape({
    route: PropTypes.string.isRequired,
    tooltip: PropTypes.string.isRequired,
  }).isRequired,
  shadow: PropTypes.bool,
}

export default ProfileInfoCard