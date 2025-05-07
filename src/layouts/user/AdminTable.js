"use client"

import { useEffect, useMemo, useState } from "react"
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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material"
import MDButton from "components/MDButton"
import PropTypes from "prop-types"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import { useMaterialUIController } from "context" // Importez le contexte
import { clientMicroservice1 } from "apolloClients/microservice1"
import FileUploadField from "components/fileuploader"
import LocationOnIcon from "@mui/icons-material/LocationOn"

// Tunisian Regions Enum
const TunisianRegion = {
  ARIANA: "Ariana",
  BEJA: "Béja",
  BEN_AROUS: "Ben Arous",
  BIZERTE: "Bizerte",
  GABES: "Gabès",
  GAFSA: "Gafsa",
  JENDOUBA: "Jendouba",
  KAIROUAN: "Kairouan",
  KASSERINE: "Kasserine",
  KEBILI: "Kébili",
  KEF: "Le Kef",
  MAHDIA: "Mahdia",
  MANOUBA: "La Manouba",
  MEDENINE: "Médenine",
  MONASTIR: "Monastir",
  NABEUL: "Nabeul",
  SFAX: "Sfax",
  SIDI_BOUZID: "Sidi Bouzid",
  SILIANA: "Siliana",
  SOUSSE: "Sousse",
  TATAOUINE: "Tataouine",
  TOZEUR: "Tozeur",
  TUNIS: "Tunis",
  ZAGHOUAN: "Zaghouan",
}

// GraphQL Query pour récupérer les administrateurs
const GET_ADMINS = gql`
  query GetAdmins {
    getUsersByRole(role: "ADMIN") {
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

// Mutation pour mettre à jour un utilisateur
const UPDATE_USER = gql`
  mutation UpdateUser($id: String!, $updateUserDto: UpdateUserDto!) {
    updateUser(id: $id, updateUserDto: $updateUserDto) {
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

// Mutation pour supprimer un utilisateur (soft remove)
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

// Mutation pour créer un nouvel administrateur
const CREATE_ADMIN = gql`
  mutation CreateAdmin($createUserDto: CreateUserDto!) {
    createAdmin(createUserDto: $createUserDto) {
      _id
      name
      email
      phone
      address
      role
      zoneResponsabilite
    }
  }
`

function AdminTable() {
  const { loading, error, data, refetch } = useQuery(GET_ADMINS, {
    client: clientMicroservice1, // Utilisez le client du microservice 1
  })
  const [admins, setAdmins] = useState([])
  const [controller] = useMaterialUIController() // Récupérez le contexte
  const { searchTerm } = controller // Récupérez le terme de recherche
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false) // État pour la modale

  // Mutations GraphQL
  const [updateUserMutation] = useMutation(UPDATE_USER, {
    client: clientMicroservice1, // Utilisez le client du microservice 1
  })
  const [softRemoveUserMutation] = useMutation(SOFT_REMOVE_USER, {
    client: clientMicroservice1, // Utilisez le client du microservice 1
  })
  const [createAdminMutation] = useMutation(CREATE_ADMIN, {
    client: clientMicroservice1, // Utilisez le client du microservice 1
  })

  useEffect(() => {
    if (data && data.getUsersByRole) {
      const transformedData = data.getUsersByRole
        .slice() // create a shallow copy to avoid mutating the original array
        .reverse()
        .map((admin, index) => ({
          id: index + 1,
          author: <Author image={admin.image || null} name={admin.name} email={admin.email} />,
          phone: admin.phone || "N/A",
          address: admin.address || "N/A",
          zoneResponsabilite: (
            <MDBox display="flex" alignItems="center">
              <LocationOnIcon fontSize="small" color="info" sx={{ mr: 0.5 }} />
              <MDTypography variant="caption" fontWeight="medium">
                {admin.zoneResponsabilite || "N/A"}
              </MDTypography>
            </MDBox>
          ),
          action: (
            <MDBox display="flex" gap={1}>
              <EditModal admin={admin} onSave={handleEdit}>
                <EditIcon color="info" style={{ cursor: "pointer" }} />
              </EditModal>
              <DeleteIcon
                color="error"
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete(admin)
                }}
              />
            </MDBox>
          ),
          _id: admin._id, // Store the original ID for reference
        }))
      setAdmins(transformedData)
    }
  }, [data])

  // Filtrer les données en fonction du terme de recherche
  const filteredAdmins = useMemo(() => {
    return admins.filter(
      (admin) =>
        admin.author.props.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.author.props.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [admins, searchTerm])

  // Fonction pour gérer la suppression
  const handleDelete = async (admin) => {
    try {
      const { data: deletedUser } = await softRemoveUserMutation({
        variables: { id: admin._id },
      })

      console.log("User deleted:", deletedUser)

      setAdmins((prevAdmins) => prevAdmins.filter((user) => user._id !== admin._id))

      alert("User deleted successfully!")
    } catch (error) {
      console.error("Error deleting user:", error.message)
      alert("Failed to delete user.")
    }
  }

  // Fonction pour gérer la mise à jour
  const handleEdit = async (updatedData) => {
    try {
      if (!updatedData._id) {
        throw new Error("User ID is missing.")
      }

      const { data: updatedUser } = await updateUserMutation({
        variables: {
          id: updatedData._id,
          updateUserDto: {
            name: updatedData.name,
            email: updatedData.email,
            phone: updatedData.phone || null,
            address: updatedData.address || null,
            image: updatedData.image || null,
            zoneResponsabilite: updatedData.zoneResponsabilite || null,
          },
        },
      })

      console.log("User updated:", updatedUser)
      alert("User updated successfully!")

      refetch()
    } catch (error) {
      console.error("Error updating user:", error.message)
      alert("Failed to update user.")
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  const columns = [
    { Header: "ID", accessor: "id", align: "center" },
    { Header: "Author", accessor: "author", width: "35%", align: "left" },
    { Header: "Phone", accessor: "phone", align: "center" },
    { Header: "Address", accessor: "address", align: "left" },
    { Header: "Responsibility Zone", accessor: "zoneResponsabilite", align: "left" },
    { Header: "Action", accessor: "action", align: "center" },
  ]

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        {/* Conteneur flexible pour le titre et le bouton */}
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          {/* Titre du tableau */}
          <MDTypography variant="h6" fontWeight="medium">
            Admin Users Table
          </MDTypography>

          {/* Bouton pour ajouter un administrateur */}
          <MDButton variant="gradient" color="warning" onClick={() => setIsAddAdminModalOpen(true)}>
            Add Admin
          </MDButton>
        </MDBox>

        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3}>
                <DataTable
                  table={{
                    columns,
                    rows: filteredAdmins, // Utilisez les données filtrées
                  }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Modale pour ajouter un administrateur */}
      <AddAdminModal
        open={isAddAdminModalOpen}
        onClose={() => setIsAddAdminModalOpen(false)}
        onCreate={async (formData) => {
          try {
            const { data: newAdmin } = await createAdminMutation({
              variables: {
                createUserDto: {
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone || null,
                  address: formData.address || null,
                  password: formData.password,
                  zoneResponsabilite: formData.zoneResponsabilite || null,
                  ...(formData.file && { image: formData.file }), // Optional
                },
              },
            })

            console.log("New admin created:", newAdmin)
            alert("Admin created successfully!")

            // Rafraîchir les données après la création
            refetch()
          } catch (error) {
            console.error("Error creating admin:", error.message)
            alert("Failed to create admin.")
          }
        }}
      />
    </DashboardLayout>
  )
}

// Modale pour l'édition
function EditModal({ admin, onSave, children }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    _id: admin?._id || "",
    name: admin?.name || "",
    email: admin?.email || "",
    phone: admin?.phone || "",
    address: admin?.address || "",
    image: admin?.image || "",
    zoneResponsabilite: admin?.zoneResponsabilite || "",
    file: null, // Add this line for file upload
  })

  const handleSave = () => {
    if (!formData._id) {
      alert("User ID is missing. Cannot update user.")
      return
    }

    // Here you would typically upload the file to your server
    // and get back a URL to store in the database
    // For now, we'll just pass the formData to the parent component

    onSave(formData)
    setOpen(false)
  }

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
        {children}
      </span>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Image URL"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="responsibility-zone-label">Responsibility Zone</InputLabel>
            <Select
              labelId="responsibility-zone-label"
              value={formData.zoneResponsabilite || ""}
              onChange={(e) => setFormData({ ...formData, zoneResponsabilite: e.target.value })}
              label="Responsibility Zone"
            >
              <MenuItem value="">None</MenuItem>
              {Object.entries(TunisianRegion).map(([key, value]) => (
                <MenuItem key={key} value={key}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FileUploadField label="Upload Image (optional)" onChange={(file) => setFormData({ ...formData, file })} />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setOpen(false)}>Cancel</MDButton>
          <MDButton onClick={handleSave}>Save</MDButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

EditModal.propTypes = {
  admin: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string,
    address: PropTypes.string,
    image: PropTypes.string,
    zoneResponsabilite: PropTypes.string,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  children: PropTypes.node,
}

// Modale pour ajouter un administrateur
function AddAdminModal({ open, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    zoneResponsabilite: "",
  })

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in all required fields.")
      return
    }

    // Here you would typically upload the file to your server
    // and get back a URL to store in the database

    onCreate(formData)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Admin</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          fullWidth
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="responsibility-zone-label">Responsibility Zone</InputLabel>
          <Select
            labelId="responsibility-zone-label"
            value={formData.zoneResponsabilite}
            onChange={(e) => setFormData({ ...formData, zoneResponsabilite: e.target.value })}
            label="Responsibility Zone"
          >
            <MenuItem value="">None</MenuItem>
            {Object.entries(TunisianRegion).map(([key, value]) => (
              <MenuItem key={key} value={key}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* <FileUploadField label="Upload Image (optional)" onChange={(file) => setFormData({ ...formData, file })} /> */}
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose}>Cancel</MDButton>
        <MDButton onClick={handleSave}>Save</MDButton>
      </DialogActions>
    </Dialog>
  )
}

AddAdminModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
}

export default AdminTable
