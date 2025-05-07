"use client"

import { useEffect, useState } from "react"
import { useQuery, gql, useMutation } from "@apollo/client"
import Grid from "@mui/material/Grid"
import Card from "@mui/material/Card"
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import DashboardLayout from "examples/LayoutContainers/DashboardLayout"
import DashboardNavbar from "examples/Navbars/DashboardNavbar"
import DataTable from "examples/Tables/DataTable"
import Author from "./Author"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  FormHelperText,
  Divider,
  InputAdornment,
  IconButton,
  Avatar,
  Box,
  Chip,
  CircularProgress,
} from "@mui/material"
import MDButton from "components/MDButton"
import PropTypes from "prop-types"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import { useMaterialUIController } from "context"
import { clientMicroservice1 } from "apolloClients/microservice1"
import { useAuth } from "context/AuthContext"
import { UPDATE_DRIVER } from "graphql/mutations/userMutations"
import PhoneIcon from "@mui/icons-material/Phone"
import EmailIcon from "@mui/icons-material/Email"
import HomeIcon from "@mui/icons-material/Home"
import PersonIcon from "@mui/icons-material/Person"
import LockIcon from "@mui/icons-material/Lock"
import VisibilityIcon from "@mui/icons-material/Visibility"
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff"
import ImageIcon from "@mui/icons-material/Image"
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar"

// GraphQL Query to get drivers
const GET_DRIVERS = gql`
  query GetDrivers {
    getUsersByRole(role: "DRIVER") {
      _id
      name
      email
      phone
      address
      image
    }
  }
`

// Mutation to update a user
const UPDATE_USER = gql`
  mutation UpdateUser($id: String!, $updateUserDto: UpdateUserDto!) {
    updateUser(id: $id, updateUserDto: $updateUserDto) {
      _id
      name
      email
      phone
      address
      image
    }
  }
`

// Mutation to delete a user (soft remove)
const SOFT_REMOVE_USER = gql`
  mutation SoftRemoveUser($id: String!) {
    softRemoveUser(id: $id) {
      _id
      name
      email
      deletedAt
    }
  }
`

// Mutation to create a new driver
const CREATE_DRIVER = gql`
  mutation CreateDriver($createUserDto: CreateUserDto!) {
    createDriver(createUserDto: $createUserDto) {
      _id
      name
      email
      phone
      address
      role
    }
  }
`

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) ? "" : "Please enter a valid email address"
}

const validatePhone = (phone) => {
  // Allow empty phone or phone with only digits
  return !phone || /^\d+$/.test(phone) ? "" : "Phone number must contain only digits"
}

const validateRequired = (value, fieldName) => {
  return value ? "" : `${fieldName} is required`
}

const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword ? "" : "Passwords do not match"
}

const validatePasswordStrength = (password) => {
  if (!password) return "Password is required"
  if (password.length < 6) return "Password must be at least 6 characters long"
  return ""
}

function DriverTable() {
  const { loading, error, data, refetch } = useQuery(GET_DRIVERS, {
    client: clientMicroservice1,
  })
  const [drivers, setDrivers] = useState([])
  const [controller] = useMaterialUIController()
  const { searchTerm } = controller
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [updateUserMutation] = useMutation(UPDATE_DRIVER, {
    client: clientMicroservice1,
  })
  const [softRemoveUserMutation] = useMutation(SOFT_REMOVE_USER, {
    client: clientMicroservice1,
  })
  const [createDriverMutation] = useMutation(CREATE_DRIVER, {
    client: clientMicroservice1,
  })
  const { currentUser } = useAuth()

  useEffect(() => {
    if (data && data.getUsersByRole) {
      setDrivers(
        data.getUsersByRole.map((driver, index) => ({
          id: index + 1,
          author: <Author image={driver.image || null} name={driver.name} email={driver.email} />,
          phone: driver.phone ? (
            <Chip
              icon={<PhoneIcon fontSize="small" />}
              label={driver.phone}
              size="small"
              color="info"
              variant="outlined"
            />
          ) : (
            "N/A"
          ),
          address: driver.address || "N/A",
          action:
            currentUser?.role === "ADMIN" || currentUser?.role === "ADMIN_ASSISTANT" ? (
              <MDBox display="flex" gap={1} justifyContent="center">
                <EditModal driver={driver} onSave={handleEdit}>
                  <IconButton size="small" color="info">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </EditModal>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete(driver)
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </MDBox>
            ) : null,
          _id: driver._id, // Store the original ID for reference
        })),
      )
    }
  }, [data, currentUser])

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.author.props.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.author.props.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (driver) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this driver?")
      if (!confirmed) return

      setIsLoading(true)
      const { data: deletedUser } = await softRemoveUserMutation({
        variables: { id: driver._id },
      })

      console.log("Driver deleted:", deletedUser)
      await refetch()
      alert("Driver deleted successfully!")
    } catch (error) {
      console.error("Error deleting driver:", error.message)
      alert("Failed to delete driver.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (updatedData) => {
    try {
      if (!updatedData._id) {
        throw new Error("Driver ID is missing.")
      }

      setIsLoading(true)
      const { data: updatedUser } = await updateUserMutation({
        variables: {
          id: updatedData._id,
          updateUserDto: {
            name: updatedData.name,
            email: updatedData.email,
            phone: updatedData.phone || null,
            address: updatedData.address || null,
            image: updatedData.image || null,
          },
        },
      })

      console.log("Driver updated:", updatedUser)
      await refetch()
      alert("Driver updated successfully!")
    } catch (error) {
      console.error("Error updating driver:", error.message)
      alert("Failed to update driver.")
    } finally {
      setIsLoading(false)
    }
  }

  if (loading)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" height="70vh">
          <CircularProgress color="warning" />
          <MDTypography variant="h5" color="text" ml={2}>
            Loading drivers...
          </MDTypography>
        </MDBox>
      </DashboardLayout>
    )

  if (error)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" height="70vh">
          <MDTypography variant="h5" color="error">
            Error: {error.message}
          </MDTypography>
        </MDBox>
      </DashboardLayout>
    )

  const columns = [
    { Header: "ID", accessor: "id", align: "center" },
    { Header: "Driver", accessor: "author", width: "45%", align: "left" },
    { Header: "Phone", accessor: "phone", align: "center" },
    { Header: "Address", accessor: "address", align: "left" },
    { Header: "Actions", accessor: "action", align: "center" },
  ]

  const unpermissionColumns = [
    { Header: "ID", accessor: "id", align: "center" },
    { Header: "Driver", accessor: "author", width: "45%", align: "left" },
    { Header: "Phone", accessor: "phone", align: "center" },
    { Header: "Address", accessor: "address", align: "left" },
  ]

  const permissionColumns =
    currentUser?.role === "ADMIN" || currentUser?.role === "ADMIN_ASSISTANT" ? columns : unpermissionColumns

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <MDBox>
           
          </MDBox>

          {(currentUser?.role === "ADMIN" || currentUser?.role === "ADMIN_ASSISTANT") && (
            <MDButton
              variant="gradient"
              color="warning"
              onClick={() => setIsAddDriverModalOpen(true)}
              startIcon={<AddCircleOutlineIcon />}
            >
              Add Driver
            </MDButton>
          )}
        </MDBox>

        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card sx={{ boxShadow: "0 4px 20px 0 rgba(0,0,0,0.1)" }}>
              <MDBox pt={3}>
                <DataTable
                  table={{
                    columns: permissionColumns,
                    rows: filteredDrivers,
                  }}
                  isSorted={false}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
                  showTotalEntries={true}
                  
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Modal for adding a driver */}
      <AddDriverModal
        open={isAddDriverModalOpen}
        onClose={() => setIsAddDriverModalOpen(false)}
        onCreate={async (formData) => {
          try {
            setIsLoading(true)
            const { data: newDriver } = await createDriverMutation({
              variables: {
                createUserDto: {
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone || null,
                  address: formData.address || null,
                  password: formData.password,
                  role: "DRIVER",
                },
              },
            })

            console.log("New driver created:", newDriver)
            alert("Driver created successfully!")
            refetch()
          } catch (error) {
            console.error("Error creating driver:", error.message)
            alert("Failed to create driver.")
          } finally {
            setIsLoading(false)
          }
        }}
      />
    </DashboardLayout>
  )
}

// Edit Modal with validation
function EditModal({ driver, onSave, children }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    _id: driver._id,
    name: driver.name,
    email: driver.email,
    phone: driver.phone || "",
    address: driver.address || "",
    image: driver.image || "",
  })

  // Form validation errors
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const validateForm = () => {
    const newErrors = {
      name: validateRequired(formData.name, "Name"),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
    }

    setErrors(newErrors)

    // Return true if no errors (all error messages are empty strings)
    return !Object.values(newErrors).some((error) => error !== "")
  }

  const handleSave = () => {
    if (!formData._id) {
      alert("Driver ID is missing. Cannot update.")
      return
    }

    if (validateForm()) {
      onSave(formData)
      setOpen(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })

    // Clear error when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
        {children}
      </span>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "10px",
            boxShadow: "0 8px 16px 0 rgba(0,0,0,0.2)",
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: "white", color: "white", display: "flex", alignItems: "center" }}>
          <EditIcon sx={{ mr: 1 }} /> Edit Driver
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box display="flex" justifyContent="center" mb={3}>
           
          </Box>

          <TextField
            label="Name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            fullWidth
            margin="normal"
            error={!!errors.name}
            helperText={errors.name}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="warning" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            fullWidth
            margin="normal"
            error={!!errors.email}
            helperText={errors.email}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="warning" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            fullWidth
            margin="normal"
            error={!!errors.phone}
            helperText={errors.phone}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon color="warning" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HomeIcon color="warning" />
                </InputAdornment>
              ),
            }}
          />
       
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <MDButton onClick={() => setOpen(false)} color="warning" variant="outlined">
            Cancel
          </MDButton>
          <MDButton onClick={handleSave} color="warning" variant="gradient">
            Save Changes
          </MDButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

EditModal.propTypes = {
  driver: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string,
    address: PropTypes.string,
    image: PropTypes.string,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  children: PropTypes.node,
}

// Modal for adding a driver with validation
function AddDriverModal({ open, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "", // Added confirm password field
  })

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form validation errors
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  const validateForm = () => {
    const newErrors = {
      name: validateRequired(formData.name, "Name"),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validatePasswordStrength(formData.password),
      confirmPassword: validatePasswordMatch(formData.password, formData.confirmPassword),
    }

    setErrors(newErrors)

    // Return true if no errors (all error messages are empty strings)
    return !Object.values(newErrors).some((error) => error !== "")
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })

    // Clear error when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }

    // Special handling for password and confirmPassword to validate match
    if (field === "password" || field === "confirmPassword") {
      if (field === "password" && formData.confirmPassword) {
        // If changing password and confirmPassword exists, check if they still match
        setErrors({
          ...errors,
          confirmPassword: validatePasswordMatch(value, formData.confirmPassword),
        })
      } else if (field === "confirmPassword") {
        // If changing confirmPassword, check if it matches password
        setErrors({
          ...errors,
          confirmPassword: validatePasswordMatch(formData.password, value),
        })
      }
    }
  }

  const handleSave = () => {
    if (validateForm()) {
      onCreate(formData)
      // Reset form data
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        confirmPassword: "",
      })
      setErrors({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "10px",
          boxShadow: "0 8px 16px 0 rgba(0,0,0,0.2)",
        },
      }}
    >
      <DialogTitle sx={{ bgcolor: "white", color: "white", display: "flex", alignItems: "center" }}>
        <DirectionsCarIcon sx={{ mr: 1 }} /> Add New Driver
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <MDBox mb={2}>
          <MDTypography variant="body2" color="text">
            Create a new driver account. All fields marked with * are required.
          </MDTypography>
        </MDBox>

        <Divider sx={{ mb: 3 }} />

        <MDTypography variant="subtitle2" fontWeight="medium" color="warning" mb={2}>
          Personal warningrmation
        </MDTypography>

        <TextField
          label="Name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          fullWidth
          margin="normal"
          error={!!errors.name}
          helperText={errors.name}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="warning" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          fullWidth
          margin="normal"
          error={!!errors.email}
          helperText={errors.email}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="warning" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Phone"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          fullWidth
          margin="normal"
          error={!!errors.phone}
          helperText={errors.phone}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon color="warning" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Address"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <HomeIcon color="warning" />
              </InputAdornment>
            ),
          }}
        />

        <Divider sx={{ my: 3 }} />

        <MDTypography variant="subtitle2" fontWeight="medium" color="warning" mb={2}>
          Account Security
        </MDTypography>

        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          fullWidth
          margin="normal"
          error={!!errors.password}
          helperText={errors.password}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="warning" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          value={formData.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          fullWidth
          margin="normal"
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="warning" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                  {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <FormHelperText sx={{ mt: 2 }}>
          Fields marked with * are required. Phone numbers must contain only digits.
        </FormHelperText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <MDButton onClick={onClose} color="warning" variant="outlined">
          Cancel
        </MDButton>
        <MDButton onClick={handleSave} color="warning" variant="gradient">
          Create Account
        </MDButton>
      </DialogActions>
    </Dialog>
  )
}

AddDriverModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
}

export default DriverTable
