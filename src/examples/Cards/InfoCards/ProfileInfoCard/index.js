"use client"

import { useState, useEffect, useMemo } from "react"
import PropTypes from "prop-types"

// @mui material components
import Card from "@mui/material/Card"
import Divider from "@mui/material/Divider"
import Tooltip from "@mui/material/Tooltip"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import TextField from "@mui/material/TextField"
import CircularProgress from "@mui/material/CircularProgress"
import Alert from "@mui/material/Alert"
import Avatar from "@mui/material/Avatar"
import Box from "@mui/material/Box"
import InputAdornment from "@mui/material/InputAdornment"
import { alpha } from "@mui/material/styles"

// Material Dashboard 2 React components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDButton from "components/MDButton"

// Apollo client
import { useMutation, gql } from "@apollo/client"
import { useAuth } from "context/AuthContext"
import { clientMicroservice1 } from "apolloClients/microservice1"

// Icons
import PersonIcon from "@mui/icons-material/Person"
import EmailIcon from "@mui/icons-material/Email"
import PhoneIcon from "@mui/icons-material/Phone"
import HomeIcon from "@mui/icons-material/Home"
import ImageIcon from "@mui/icons-material/Image"
import EditIcon from "@mui/icons-material/Edit"

// Define all mutations
const UPDATE_SUPER_ADMIN_PROFILE = gql`
  mutation UpdateSuperAdminProfile($updateUserDto: UpdateUserDto!) {
    updateSuperAdminProfile(updateUserDto: $updateUserDto) {
      _id
      name
      email
      phone
      address
      image
      role
      createdAt
      updatedAt
    }
  }
`

const UPDATE_ADMIN_PROFILE = gql`
  mutation UpdateAdminProfile($updateUserDto: UpdateUserDto!, $adminId: String) {
    updateAdminProfile(updateUserDto: $updateUserDto, adminId: $adminId) {
      _id
      name
      email
      phone
      address
      image
      role
      createdAt
      updatedAt
    }
  }
`

const UPDATE_ASSISTANT_ADMIN_PROFILE = gql`
  mutation UpdateAssistantAdminProfile($updateUserDto: UpdateUserDto!, $assistantAdminId: String) {
    updateAssistantAdminProfile(updateUserDto: $updateUserDto, assistantAdminId: $assistantAdminId) {
      _id
      name
      email
      phone
      address
      image
      role
      createdAt
      updatedAt
    }
  }
`

// Theme colors
const WARNING_COLOR = "#ff9800" // Orange warning color
const WARNING_LIGHT = alpha("#ff9800", 0.1)

function ProfileInfoCard({ title, description, info, social, action, shadow }) {
  const [open, setOpen] = useState(false)
  const { currentUser, setCurrentUser } = useAuth()
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Initialize form values with current user data
  const [formValues, setFormValues] = useState({
    name: info.fullName || "",
    email: info.email || "",
    phone: info.mobile || "",
    address: info.location || "",
    image: info.image || "",
  })

  // Update form values when info prop changes
  useEffect(() => {
    setFormValues({
      name: info.fullName || "",
      email: info.email || "",
      phone: info.mobile || "",
      address: info.location || "",
      image: info.image || "",
    })
  }, [info])

  // Form validation
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) ? "" : "Please enter a valid email address"
  }

  const validatePhone = (phone) => {
    return !phone || /^\d+$/.test(phone) ? "" : "Phone must contain only numbers"
  }

  const validateRequired = (value, fieldName) => {
    return value ? "" : `${fieldName} is required`
  }

  const validateForm = () => {
    const newErrors = {
      name: validateRequired(formValues.name, "Name"),
      email: validateEmail(formValues.email),
      phone: validatePhone(formValues.phone),
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== "")
  }

  // Determine which mutation to use based on user role
  const { mutation, mutationName, idField } = useMemo(() => {
    const userRole = currentUser?.role?.toLowerCase() || ""

    if (userRole.includes("super")) {
      return {
        mutation: UPDATE_SUPER_ADMIN_PROFILE,
        mutationName: "updateSuperAdminProfile",
        idField: null,
      }
    } else if (userRole.includes("admin") && !userRole.includes("assistant")) {
      return {
        mutation: UPDATE_ADMIN_PROFILE,
        mutationName: "updateAdminProfile",
        idField: "adminId",
      }
    } else {
      return {
        mutation: UPDATE_ASSISTANT_ADMIN_PROFILE,
        mutationName: "updateAssistantAdminProfile",
        idField: "assistantAdminId",
      }
    }
  }, [currentUser?.role])

  const [updateProfile, { loading }] = useMutation(mutation, {
    client: clientMicroservice1,
    onCompleted: (data) => {
      if (setCurrentUser && data[mutationName]) {
        setCurrentUser({
          ...currentUser,
          ...data[mutationName],
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

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!validateForm()) {
      return
    }

    try {
      // Create base variables object
      const variables = {
        updateUserDto: {
          name: formValues.name,
          email: formValues.email,
          phone: formValues.phone,
          address: formValues.address,
          image: formValues.image,
        },
      }

      // Add ID field if needed based on role
      if (idField) {
        variables[idField] = currentUser?._id
      }

      await updateProfile({ variables })
    } catch (err) {
      // Error is handled in onError callback
    }
  }

  const handleOpenDialog = () => {
    setFormValues({
      name: info.fullName || "",
      email: info.email || "",
      phone: info.mobile || "",
      address: info.location || "",
      image: info.image || "",
    })
    setErrorMessage("")
    setSuccessMessage("")
    setOpen(true)
  }

  const labels = []
  const values = []

  Object.keys(info).forEach((el) => {
    if (el.match(/[A-Z\s]+/)) {
      const uppercaseLetter = Array.from(el).find((i) => i.match(/[A-Z]+/))
      const newElement = el.replace(uppercaseLetter, ` ${uppercaseLetter.toLowerCase()}`)
      labels.push(newElement)
    } else {
      labels.push(el)
    }
  })

  Object.values(info).forEach((el) => values.push(el))

  const renderItems = labels.map((label, key) => (
    <MDBox key={label} display="flex" py={1} pr={2}>
      <MDTypography variant="button" fontWeight="bold" textTransform="capitalize">
        {label}: &nbsp;
      </MDTypography>
      <MDTypography variant="button" fontWeight="regular" color="text">
        &nbsp;{values[key]}
      </MDTypography>
    </MDBox>
  ))

  return (
    <Card
      sx={{
        height: "100%",
        boxShadow: !shadow && "none",
        border: `1px solid ${alpha(WARNING_COLOR, 0.2)}`,
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          boxShadow: `0 8px 16px 0 ${alpha(WARNING_COLOR, 0.2)}`,
        },
      }}
    >
      <MDBox
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        pt={2}
        px={2}
        sx={{
          borderBottom: `1px solid ${alpha(WARNING_COLOR, 0.2)}`,
          pb: 1,
        }}
      >
        <MDTypography variant="h6" fontWeight="medium" color="warning">
          {title}
        </MDTypography>
        <Tooltip title={action.tooltip} placement="top">
          <MDButton variant="outlined" color="warning" size="small" circular iconOnly onClick={handleOpenDialog}>
            <EditIcon fontSize="small" />
          </MDButton>
        </Tooltip>
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

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "10px",
            boxShadow: `0 8px 16px 0 ${alpha(WARNING_COLOR, 0.3)}`,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: WARNING_COLOR,
            color: "white",
            py: 2,
          }}
        >
          <MDTypography variant="h6" color="white">
            Edit Profile {currentUser?.role ? `(${currentUser.role})` : ""}
          </MDTypography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3 }}>
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

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            mb={3}
            sx={{
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: "-20px",
                width: "80%",
                height: "1px",
                backgroundColor: alpha(WARNING_COLOR, 0.2),
              },
            }}
          >
            <Avatar
              src={formValues.image}
              alt={formValues.name}
              sx={{
                width: 100,
                height: 100,
                border: `3px solid ${WARNING_COLOR}`,
                mb: 1,
                boxShadow: `0 4px 8px ${alpha(WARNING_COLOR, 0.3)}`,
              }}
            >
              {formValues.name?.charAt(0) || "U"}
            </Avatar>
            <MDTypography variant="caption" color="text" sx={{ mt: 1, mb: 2 }}>
              {currentUser?.role || "User"} Profile
            </MDTypography>
          </Box>

          <Box sx={{ mt: 4 }}>
            <TextField
              margin="dense"
              label="Name"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              fullWidth
              error={!!errors.name}
              helperText={errors.name}
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: WARNING_COLOR }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: WARNING_COLOR,
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: WARNING_COLOR,
                },
              }}
            />
            <TextField
              margin="dense"
              label="Email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              fullWidth
              error={!!errors.email}
              helperText={errors.email}
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: WARNING_COLOR }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: WARNING_COLOR,
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: WARNING_COLOR,
                },
              }}
            />
            <TextField
              margin="dense"
              label="Phone"
              name="phone"
              value={formValues.phone}
              onChange={handleChange}
              fullWidth
              error={!!errors.phone}
              helperText={errors.phone}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: WARNING_COLOR }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: WARNING_COLOR,
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: WARNING_COLOR,
                },
              }}
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <HomeIcon sx={{ color: WARNING_COLOR }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: WARNING_COLOR,
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: WARNING_COLOR,
                },
              }}
            />
            <TextField
              margin="dense"
              label="Image URL"
              name="image"
              value={formValues.image}
              onChange={handleChange}
              fullWidth
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ImageIcon sx={{ color: WARNING_COLOR }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1,
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: WARNING_COLOR,
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: WARNING_COLOR,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between" }}>
          <MDButton onClick={() => setOpen(false)} variant="outlined" color="warning" disabled={loading}>
            Cancel
          </MDButton>
          <MDButton
            onClick={handleSubmit}
            color="warning"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
            sx={{
              boxShadow: `0 4px 8px ${alpha(WARNING_COLOR, 0.3)}`,
              "&:hover": {
                boxShadow: `0 6px 12px ${alpha(WARNING_COLOR, 0.4)}`,
              },
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </MDButton>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

ProfileInfoCard.defaultProps = {
  shadow: true,
  social: [],
}

ProfileInfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  info: PropTypes.objectOf(PropTypes.string).isRequired,
  social: PropTypes.arrayOf(PropTypes.object),
  action: PropTypes.shape({
    route: PropTypes.string.isRequired,
    tooltip: PropTypes.string.isRequired,
  }).isRequired,
  shadow: PropTypes.bool,
}

export default ProfileInfoCard
