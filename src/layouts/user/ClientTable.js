import React, { useEffect, useState } from 'react';
import { useQuery, gql, useMutation } from '@apollo/client';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import Author from './Author';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import MDButton from 'components/MDButton';
import PropTypes from 'prop-types';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMaterialUIController } from 'context';
import { clientMicroservice1 } from 'apolloClients/microservice1';

// GraphQL Query pour récupérer les clients
const GET_CLIENTS = gql`
  query GetClients {
    getUsersByRole(role: "CLIENT") {
      _id
      name
      email
      phone
      address
      image
    }
  }
`;

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
    }
  }
`;

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
`;

// Mutation pour créer un nouveau client
const CREATE_CLIENT = gql`
  mutation CreateClient($createUserDto: CreateUserDto!) {
    createClient(createUserDto: $createUserDto) {
      _id
      name
      email
      phone
      address
      role
    }
  }
`;

function ClientTable() {
  const { loading, error, data, refetch } = useQuery(GET_CLIENTS, {
      client: clientMicroservice1, // Utilisez le client du microservice 1
    });
  const [clients, setClients] = useState([]);
  const [controller] = useMaterialUIController();
  const { searchTerm } = controller;
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const [updateUserMutation] = useMutation(UPDATE_USER, {
      client: clientMicroservice1, // Utilisez le client du microservice 1
    });
  const [softRemoveUserMutation] = useMutation(SOFT_REMOVE_USER, {
      client: clientMicroservice1, // Utilisez le client du microservice 1
    });
  const [createClientMutation] = useMutation(CREATE_CLIENT, {
      client: clientMicroservice1, // Utilisez le client du microservice 1
    });

  useEffect(() => {
    if (data && data.getUsersByRole) {
      setClients(
        data.getUsersByRole.map((client, index) => ({
          id: index + 1,
          author: (
            <Author
              image={client.image || null}
              name={client.name}
              email={client.email}
            />
          ),
          phone: client.phone || 'N/A',
          address: client.address || 'N/A',
          action: (
            <MDBox display="flex" gap={1}>
              <EditModal client={client} onSave={handleEdit}>
                <EditIcon color="info" style={{ cursor: 'pointer' }} />
              </EditModal>
              <DeleteIcon
                color="error"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(client);
                }}
              />
            </MDBox>
          ),
        }))
      );
    }
  }, [data]);

  const filteredClients = clients.filter((client) =>
    client.author.props.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.author.props.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (client) => {
    try {
      const { data: deletedUser } = await softRemoveUserMutation({
        variables: { id: client._id },
      });

      console.log("Client deleted:", deletedUser);

      setClients((prevClients) =>
        prevClients.filter((user) => user._id !== client._id)
      );

      alert("Client deleted successfully!");
    } catch (error) {
      console.error("Error deleting client:", error.message);
      alert("Failed to delete client.");
    }
  };

  const handleEdit = async (updatedData) => {
    try {
      if (!updatedData._id) {
        throw new Error("Client ID is missing.");
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
          },
        },
      });

      console.log("Client updated:", updatedUser);
      alert("Client updated successfully!");
    } catch (error) {
      console.error("Error updating client:", error.message);
      alert("Failed to update client.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const columns = [
    { Header: 'ID', accessor: 'id', align: 'center' },
    { Header: 'Author', accessor: 'author', width: '45%', align: 'left' },
    { Header: 'Phone', accessor: 'phone', align: 'center' },
    { Header: 'Address', accessor: 'address', align: 'left' },
    { Header: 'Action', accessor: 'action', align: 'center' },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        {/* Conteneur flexible pour le titre et le bouton */}
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          {/* Titre du tableau */}
          <MDTypography variant="h6" fontWeight="medium">
            Client Users Table
          </MDTypography>

          {/* Bouton pour ajouter un client */}
          <MDButton
            variant="gradient"
            color="info"
            onClick={() => setIsAddClientModalOpen(true)}
          >
            Add Client
          </MDButton>
        </MDBox>

        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3}>
                <DataTable
                  table={{
                    columns,
                    rows: filteredClients, // Utilisez les données filtrées
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
      {/* <Footer /> */}

      {/* Modale pour ajouter un client */}
      <AddClientModal
        open={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onCreate={async (formData) => {
          try {
            const { data: newClient } = await createClientMutation({
              variables: {
                createUserDto: {
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone || null,
                  address: formData.address || null,
                  password: formData.password,
                  role: 'CLIENT',
                },
              },
            });

            console.log("New client created:", newClient);
            alert("Client created successfully!");

            refetch();
          } catch (error) {
            console.error("Error creating client:", error.message);
            alert("Failed to create client.");
          }
        }}
      />
    </DashboardLayout>
  );
}

// Modale pour l'édition
function EditModal({ client, onSave, children }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    _id: client._id,
    name: client.name,
    email: client.email,
    phone: client.phone || '',
    address: client.address || '',
    image: client.image || '',
  });

  const handleSave = () => {
    if (!formData._id) {
      alert("Client ID is missing. Cannot update client.");
      return;
    }
    onSave(formData);
    setOpen(false);
  };

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
        {children}
      </span>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Edit Client</DialogTitle>
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
  );
}

EditModal.propTypes = {
  client: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string,
    address: PropTypes.string,
    image: PropTypes.string,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  children: PropTypes.node,
};

// Modale pour ajouter un client
function AddClientModal({ open, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '', // Mot de passe requis pour créer un utilisateur
  });

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in all required fields.");
      return;
    }
    onCreate(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Client</DialogTitle>
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
  );
}

AddClientModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};

export default ClientTable;