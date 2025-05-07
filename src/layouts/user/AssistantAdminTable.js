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
} from "@mui/material"
import MDButton from "components/MDButton"
import PropTypes from "prop-types"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import { useMaterialUIController } from "context"
import { clientMicroservice1 } from "apolloClients/microservice1"
import { useAuth } from "context/AuthContext"
import PhoneIcon from "@mui/icons-material/Phone"
import EmailIcon from "@mui/icons-material/Email"
import HomeIcon from "@mui/icons-material/Home"
import WorkIcon from "@mui/icons-material/Work"
import PersonIcon from "@mui/icons-material/Person"
import LockIcon from "@mui/icons-material/Lock"
import VisibilityIcon from "@mui/icons-material/Visibility"
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff"
import ImageIcon from "@mui/icons-material/Image"
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"

const GET_ADMIN_ASSISTANTS = gql`
  query GetAssistantAdmins {
    getUsersByRole(role: "ADMIN_ASSISTANT") {
      _id
      name
      email
      phone
      address
      image
      zoneResponsabilite
    }
  }
`

const UPDATE_ADMIN_ASSISTANT = gql`
  mutation UpdateAssistantAdminProfile($updateUserDto: UpdateUserDto!, $assistantAdminId: String) {
    updateAssistantAdminProfile(updateUserDto: $updateUserDto, assistantAdminId: $assistantAdminId) {
      _id
      email
      phone
      role
      zoneResponsabilite
      createdAt
      updatedAt
    }
  }
`

// Mutation to delete a user (soft remove)
const SOFT_REMOVE_USER = gql`
  mutation SoftRemoveUser($id: String!) {
    softRemoveUser(id: $id) {
      deletedAt
    }
  }
`

const CREATE_ADMIN_ASSISTANT = gql`
  mutation CreateAdminAssistant($createUserDto: CreateUserDto!) {
    createAdminAssistant(createUserDto: $createUserDto) {
      _id
      name
      email
      role
      zoneResponsabilite
    }
  }
`

// Form validation functions
const validatePhone = (phone) => {
  // Allow empty phone or phone with only digits
  return !phone || /^\d+$/.test(phone) ? "" : "Phone must contain only numbers"
}

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) ? "" : "Please enter a valid email address"
}

const validateRequired = (value, fieldName) => {
  return value ? "" : `${fieldName} is required`
}

const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword ? "" : "Passwords do not match"
}

function AssistantAdminTable() {
  const { loading, error, data, refetch } = useQuery(GET_ADMIN_ASSISTANTS, {
    client: clientMicroservice1,
  })
  const [assistantAdmins, setAssistantAdmins] = useState([])
  const [controller] = useMaterialUIController()
  const { searchTerm } = controller
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const [updateAssistantAdminMutation] = useMutation(UPDATE_ADMIN_ASSISTANT, {
    client: clientMicroservice1,
  })
  const [softRemoveUserMutation] = useMutation(SOFT_REMOVE_USER, {
    client: clientMicroservice1,
  })
  const [createAssistantAdminMutation] = useMutation(CREATE_ADMIN_ASSISTANT, {
    client: clientMicroservice1,
  })
  const { currentUser } = useAuth()

  useEffect(() => {
    if (data && data.getUsersByRole) {
      setAssistantAdmins(
        data.getUsersByRole.map((admin, index) => ({
          id: index + 1,
          author: <Author image={admin.image || null} name={admin.name} email={admin.email} />,
          phone: admin.phone || "N/A",
          address: admin.address || "N/A",
         
          action: (
            <MDBox display="flex" gap={1}>
              <EditModal assistantAdmin={admin} onSave={handleEdit}>
                <EditIcon color="info" style={{ cursor: "pointer" }} />
              </EditModal>
              <DeleteIcon
                color="error"
                fontSize="small"
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete(admin)
                }}
              />
            </MDBox>
          ),
          _id: admin._id, // Store the original ID for reference
        })),
      )
    }
  }, [data])

  const filteredAssistantAdmins = assistantAdmins.filter(
    (admin) =>
      admin.author.props.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.author.props.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (admin) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this assistant admin?")
      if (!confirmed) return

      const { data: deletedUser } = await softRemoveUserMutation({
        variables: { id: admin._id },
      })

      console.log("Assistant admin deleted:", deletedUser)

      await refetch()

      alert("Assistant admin deleted successfully!")
    } catch (error) {
      console.error("Error deleting assistant admin:", error.message)
      alert("Failed to delete assistant admin.")
    }
  }

  const handleEdit = async (updatedData) => {
    try {
      if (!updatedData._id) {
        throw new Error("Assistant admin ID is missing.")
      }

      const { data: updatedUser } = await updateAssistantAdminMutation({
        variables: {
          assistantAdminId: updatedData._id,
          updateUserDto: {
            name: updatedData.name,
            email: updatedData.email,
            phone: updatedData.phone || null,
            address: updatedData.address || null,
            image: updatedData.image || null,
            zoneResponsabilite: updatedData.zoneResponsabilite || null, // Added responsibility zone
          },
        },
      })

      console.log("Assistant admin updated:", updatedUser)
      await refetch()
      alert("Assistant admin updated successfully!")
    } catch (error) {
      console.error("Error updating assistant admin:", error.message)
      alert("Failed to update assistant admin.")
    }
  }

  if (loading)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" height="70vh">
          <MDTypography variant="h5" color="text">
            Loading assistant admins...
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
    { Header: "Author", accessor: "author", width: "30%", align: "left" },
    { Header: "Phone", accessor: "phone", align: "center" },
    { Header: "Address", accessor: "address", align: "left" },
    { Header: "Action", accessor: "action", align: "center" },
  ]

  const unpermissionColumns = [
    { Header: "ID", accessor: "id", align: "center" },
    { Header: "Author", accessor: "author", width: "30%", align: "left" },
    { Header: "Phone", accessor: "phone", align: "center" },
    { Header: "Address", accessor: "address", align: "left" },
  ]

  const permissionColumns = currentUser?.role === "ADMIN" ? columns : unpermissionColumns

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
              onClick={() => setIsAddModalOpen(true)}
              startIcon={<AddCircleOutlineIcon />}
            >
              Add Assistant Admin
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
                    rows: filteredAssistantAdmins,
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

      {/* Modal for adding an assistant admin */}
      <AddAssistantAdminModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreate={async (formData) => {
          try {
            const { data: newAssistantAdmin } = await createAssistantAdminMutation({
              variables: {
                createUserDto: {
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone || null,
                  address: formData.address || null,
                  password: formData.password,
                  role: "ADMIN_ASSISTANT",
                },
              },
            })

            console.log("New assistant admin created:", newAssistantAdmin)
            alert("Assistant admin created successfully!")

            refetch()
          } catch (error) {
            console.error("Error creating assistant admin:", error.message)
            alert("Failed to create assistant admin.")
          }
        }}
      />
    </DashboardLayout>
  )
}

// Edit Modal with validation
function EditModal({ assistantAdmin, onSave, children }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    _id: assistantAdmin._id,
    name: assistantAdmin.name,
    email: assistantAdmin.email,
    phone: assistantAdmin.phone || "",
    address: assistantAdmin.address || "",
    image: assistantAdmin.image || "",
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
      alert("Assistant admin ID is missing. Cannot update.")
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
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit Assistant Admin
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box display="flex" justifyContent="center" mb={3}>
            {/* <Avatar
              src={formData.image}
              alt={formData.name}
              sx={{ width: 80, height: 80, border: "3px solid #1A73E8" }}
            >
              {formData.name?.charAt(0) || "A"}
            </Avatar> */}
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
        
          {/* <TextField
            label="Image URL"
            value={formData.image}
            onChange={(e) => handleChange("image", e.target.value)}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ImageIcon color="warning" />
                </InputAdornment>
              ),
            }}
          /> */}
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
  assistantAdmin: PropTypes.shape({
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

// Modal for adding an assistant admin with validation
function AddAssistantAdminModal({ open, onClose, onCreate }) {
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
    confirmPassword: "", // Added error for confirm password
  })

  const validateForm = () => {
    const newErrors = {
      name: validateRequired(formData.name, "Name"),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validateRequired(formData.password, "Password"),
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
        <AddCircleOutlineIcon sx={{ mr: 1 }} /> Add New Assistant Admin
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <MDBox mb={2}>
          <MDTypography variant="body2" color="text">
            Create a new assistant admin account. All fields marked with * are required.
          </MDTypography>
        </MDBox>

        <Divider sx={{ mb: 3 }} />

        <MDTypography variant="subtitle2" fontWeight="medium" color="warning" mb={2}>
        Personal Information
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

AddAssistantAdminModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
}

export default AssistantAdminTable
