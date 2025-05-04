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
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions } from "@mui/material"
import MDButton from "components/MDButton"
import PropTypes from "prop-types"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import { useMaterialUIController } from "context"
import { clientMicroservice1 } from "apolloClients/microservice1"
import { useAuth } from "context/AuthContext"

// GraphQL Query to get assistant admins
const GET_ADMIN_ASSISTANTS = gql`
  query GetAssistantAdmins {
    getUsersByRole(role: "ADMIN_ASSISTANT") {
      _id
      name
      email
      phone
      address
      image
    }
  }
`

// Mutation to update an assistant admin
const UPDATE_ADMIN_ASSISTANT = gql`
  mutation UpdateAssistantAdminProfile($updateUserDto: UpdateUserDto!, $assistantAdminId: String) {
    updateAssistantAdminProfile(updateUserDto: $updateUserDto, assistantAdminId: $assistantAdminId) {
      _id
      email
      phone
      role
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

// Mutation to create a new assistant admin
const CREATE_ADMIN_ASSISTANT = gql`
  mutation CreateAdminAssistant($createUserDto: CreateUserDto!) {
    createAdminAssistant(createUserDto: $createUserDto) {
      _id
      name
      email
      role
    }
  }
`

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
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete(admin)
                }}
              />
            </MDBox>
          ),
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

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  const columns = [
    { Header: "ID", accessor: "id", align: "center" },
    { Header: "Author", accessor: "author", width: "45%", align: "left" },
    { Header: "Phone", accessor: "phone", align: "center" },
    { Header: "Address", accessor: "address", align: "left" },
    { Header: "Action", accessor: "action", align: "center" },
  ]

  const unpermissionColumns = [
    { Header: "ID", accessor: "id", align: "center" },
    { Header: "Author", accessor: "author", width: "45%", align: "left" },
    { Header: "Phone", accessor: "phone", align: "center" },
    { Header: "Address", accessor: "address", align: "left" },
  ]

  const permissionColumns = currentUser?.role === "ADMIN" ? columns : unpermissionColumns

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <MDTypography variant="h6" fontWeight="medium">
            Assistant Admins Table
          </MDTypography>

          { (currentUser?.role==="ADMIN" && "ADMIN_ASSISTANT") && (
            <MDButton variant="gradient" color="warning" onClick={() => setIsAddModalOpen(true)}>
              Add Assistant Admin
            </MDButton>
          )}
        </MDBox>

        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3}>
                <DataTable
                  table={{
                    columns: permissionColumns,
                    rows: filteredAssistantAdmins,
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

// Edit Modal
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

  const handleSave = () => {
    if (!formData._id) {
      alert("Assistant admin ID is missing. Cannot update.")
      return
    }
    onSave(formData)
    setOpen(false)
  }

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
        {children}
      </span>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Edit Assistant Admin</DialogTitle>
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

// Modal for adding an assistant admin
function AddAssistantAdminModal({ open, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  })

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in all required fields.")
      return
    }
    onCreate(formData)
    onClose()
    // Reset form data
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
    })
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Assistant Admin</DialogTitle>
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
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose}>Cancel</MDButton>
        <MDButton onClick={handleSave}>Save</MDButton>
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
