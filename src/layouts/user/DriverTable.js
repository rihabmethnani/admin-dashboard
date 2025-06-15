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
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar"
import SearchIcon from "@mui/icons-material/Search"

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
      createdAt
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
  return emailRegex.test(email) ? "" : "Veuillez saisir une adresse email valide"
}

const validatePhone = (phone) => {
  // Allow empty phone or phone with only digits
  return !phone || /^\d+$/.test(phone) ? "" : "Le numéro de téléphone ne doit contenir que des chiffres"
}

const validateRequired = (value, fieldName) => {
  return value ? "" : `${fieldName} est requis`
}

const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword ? "" : "Les mots de passe ne correspondent pas"
}

const validatePasswordStrength = (password) => {
  if (!password) return "Le mot de passe est requis"
  if (password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState("newest")

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
      const mappedDrivers = data.getUsersByRole.map((driver, index) => ({
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
        createdAt: driver.createdAt ? new Date(driver.createdAt) : new Date(),
        rawData: driver, // Store raw data for filtering
      }))

      setDrivers(mappedDrivers)
    }
  }, [data, currentUser])

  const filteredAndSortedDrivers = drivers
    .filter((driver) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        driver.rawData.name.toLowerCase().includes(searchLower) ||
        driver.rawData.email.toLowerCase().includes(searchLower) ||
        (driver.rawData.phone && driver.rawData.phone.toLowerCase().includes(searchLower)) ||
        (driver.rawData.address && driver.rawData.address.toLowerCase().includes(searchLower))
      )
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return b.createdAt - a.createdAt
      } else {
        return a.createdAt - b.createdAt
      }
    })

  const handleDelete = async (driver) => {
    try {
      const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer ce livreur ?")
      if (!confirmed) return

      setIsLoading(true)
      const { data: deletedUser } = await softRemoveUserMutation({
        variables: { id: driver._id },
      })

      console.log("Livreur supprimé:", deletedUser)
      await refetch()
      alert("Livreur supprimé avec succès !")
    } catch (error) {
      console.error("Erreur lors de la suppression du livreur:", error.message)
      alert("Échec de la suppression du livreur.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (updatedData) => {
    try {
      if (!updatedData._id) {
        throw new Error("L'ID du livreur est manquant.")
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

      console.log("Livreur mis à jour:", updatedUser)
      await refetch()
      alert("Livreur mis à jour avec succès !")
    } catch (error) {
      console.error("Erreur lors de la mise à jour du livreur:", error.message)
      alert("Échec de la mise à jour du livreur.")
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
            Chargement des livreurs...
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
            Erreur : {error.message}
          </MDTypography>
        </MDBox>
      </DashboardLayout>
    )

  const columns = [
    { Header: "ID", accessor: "id", align: "center" },
    { Header: "Livreur", accessor: "author", width: "45%", align: "left" },
    { Header: "Téléphone", accessor: "phone", align: "center" },
    { Header: "Adresse", accessor: "address", align: "left" },
    { Header: "Actions", accessor: "action", align: "center" },
  ]

  const unpermissionColumns = [
    { Header: "ID", accessor: "id", align: "center" },
    { Header: "Livreur", accessor: "author", width: "45%", align: "left" },
    { Header: "Téléphone", accessor: "phone", align: "center" },
    { Header: "Adresse", accessor: "address", align: "left" },
  ]

  const permissionColumns =
    currentUser?.role === "ADMIN" || currentUser?.role === "ADMIN_ASSISTANT" ? columns : unpermissionColumns

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <MDBox>
            <MDTypography variant="h4" fontWeight="medium">
              Gestion des Livreurs
            </MDTypography>
            <MDTypography variant="body2" color="text">
              Liste des livreurs de votre organisation
            </MDTypography>
          </MDBox>

          <MDBox display="flex" alignItems="center" gap={2}>
            <TextField
              label="Rechercher"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              placeholder="Nom, email, téléphone..."
            />

            <Box sx={{ minWidth: 120 }}>
              <TextField
                select
                label="Trier par"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                size="small"
                SelectProps={{
                  native: true,
                }}
              >
                <option value="newest">Plus récent</option>
                <option value="oldest">Plus ancien</option>
              </TextField>
            </Box>

            {(currentUser?.role === "ADMIN" || currentUser?.role === "ADMIN_ASSISTANT") && (
              <MDButton
                variant="gradient"
                color="warning"
                onClick={() => setIsAddDriverModalOpen(true)}
                startIcon={<AddCircleOutlineIcon />}
              >
                Ajouter un Livreur
              </MDButton>
            )}
          </MDBox>
        </MDBox>

        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card sx={{ boxShadow: "0 4px 20px 0 rgba(0,0,0,0.1)" }}>
              <MDBox pt={3}>
                <DataTable
                  table={{
                    columns: permissionColumns,
                    rows: filteredAndSortedDrivers,
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

            console.log("Nouveau livreur créé:", newDriver)
            alert("Livreur créé avec succès !")
            refetch()
          } catch (error) {
            console.error("Erreur lors de la création du livreur:", error.message)
            alert("Échec de la création du livreur.")
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
      name: validateRequired(formData.name, "Nom"),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
    }

    setErrors(newErrors)

    // Return true if no errors (all error messages are empty strings)
    return !Object.values(newErrors).some((error) => error !== "")
  }

  const handleSave = () => {
    if (!formData._id) {
      alert("L'ID du livreur est manquant. Impossible de mettre à jour.")
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
        <DialogTitle sx={{ bgcolor: "white", color: "black", display: "flex", alignItems: "center" }}>
          <EditIcon sx={{ mr: 1, color: "warning.main" }} />
          Modifier le Livreur
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box display="flex" justifyContent="center" mb={3}>
            {/* Avatar section if needed */}
          </Box>

          <TextField
            label="Nom"
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
            label="Téléphone"
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
            label="Adresse"
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
            Annuler
          </MDButton>
          <MDButton onClick={handleSave} color="warning" variant="gradient">
            Enregistrer les Modifications
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
      name: validateRequired(formData.name, "Nom"),
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
      <DialogTitle sx={{ bgcolor: "white", color: "black", display: "flex", alignItems: "center" }}>
        <DirectionsCarIcon sx={{ mr: 1, color: "warning.main" }} />
        Ajouter un Nouveau Livreur
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <MDBox mb={2}>
          <MDTypography variant="body2" color="text">
            Créer un nouveau compte livreur. Tous les champs marqués d&apos;un * sont obligatoires.
          </MDTypography>
        </MDBox>

        <Divider sx={{ mb: 3 }} />

        <MDTypography variant="subtitle2" fontWeight="medium" color="warning" mb={2}>
          Informations Personnelles
        </MDTypography>

        <TextField
          label="Nom"
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
          label="Téléphone"
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
          label="Adresse"
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
          Sécurité du Compte
        </MDTypography>

        <TextField
          label="Mot de passe"
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
          label="Confirmer le mot de passe"
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
          Les champs marqués d&apos;un * sont obligatoires. Les numéros de téléphone ne doivent contenir que des
          chiffres.
        </FormHelperText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <MDButton onClick={onClose} color="warning" variant="outlined">
          Annuler
        </MDButton>
        <MDButton onClick={handleSave} color="warning" variant="gradient">
          Créer le Compte
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
