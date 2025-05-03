
import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, gql, useMutation } from '@apollo/client';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import DataTable from 'examples/Tables/DataTable';
import MDButton from 'components/MDButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMaterialUIController } from 'context';
import { clientMicroservice1 } from 'apolloClients/microservice1';
import { useAuth } from 'context/AuthContext';
import { VALIDATE_PARTNER } from 'graphql/mutations/userMutations';
import Author from './Author';
import PropTypes from 'prop-types';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

// GraphQL Queries & Mutations
const GET_PARTNERS = gql`
  query GetPartners {
    getUsersByRole(role: "PARTNER") {
      _id
      name
      email
      phone
      address
      image
      companyName
      isValid
    }
  }
`;

const UPDATE_PARTNER = gql`
  mutation UpdatePartner($id: String!, $updateUserDto: UpdateUserDto!) {
    updatePartner(id: $id, updateUserDto: $updateUserDto) {
      _id
      name
      email
      phone
      address
      image
      companyName
    }
  }
`;

const SOFT_REMOVE_USER = gql`
  mutation SoftRemoveUser($id: String!) {
    softRemoveUser(id: $id) {
      _id
    }
  }
`;

const CREATE_PARTNER = gql`
  mutation CreatePartner($createUserDto: CreateUserDto!) {
    createPartner(createUserDto: $createUserDto) {
      _id
      name
      email
      phone
      address
      role
      companyName
    }
  }
`;

function PartnerTable() {
  const { loading, error, data, refetch } = useQuery(GET_PARTNERS, { client: clientMicroservice1 });
  const [controller] = useMaterialUIController();
  const { searchTerm } = controller;
  const { currentUser } = useAuth();

  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);

  const [updateUserMutation] = useMutation(UPDATE_PARTNER, { client: clientMicroservice1 });
  const [softRemoveUserMutation] = useMutation(SOFT_REMOVE_USER, { client: clientMicroservice1 });
  const [createPartnerMutation] = useMutation(CREATE_PARTNER, { client: clientMicroservice1 });
  const [validatePartnerMutation] = useMutation(VALIDATE_PARTNER, { client: clientMicroservice1 });

  const partners = data?.getUsersByRole || [];

  const handleValidate = async (partnerId) => {
    try {
      await validatePartnerMutation({ variables: { partnerId } });
      alert('Partner validated successfully!');
      refetch();
    } catch (error) {
      console.error(error);
      alert('Failed to validate partner.');
    }
  };

  const handleDelete = async (partnerId) => {
    const confirmed = window.confirm('Are you sure you want to delete this partner?');
    if (!confirmed) return;

    try {
      await softRemoveUserMutation({ variables: { id: partnerId } });
      alert('Partner deleted successfully!');
      refetch();
    } catch (error) {
      console.error(error);
      alert('Failed to delete partner.');
    }
  };

  const handleEdit = async (updatedData) => {
    try {
      if (!updatedData._id) throw new Error('Partner ID is missing.');

      const updateUserDto = {
        name: updatedData.name,
        email: updatedData.email,
        phone: updatedData.phone || null,
        address: updatedData.address || null,
        image: updatedData.image || null,
        companyName: updatedData.companyName || null,
      };

      await updateUserMutation({
        variables: {
          id: updatedData._id,
          updateUserDto,
        },
      });

      alert('Partner updated successfully!');
      refetch();
    } catch (error) {
      console.error(error);
      alert('Failed to update partner.');
    }
  };

  const rows = useMemo(() => {
    return partners
      .filter((partner) =>
        partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email.toLowerCase().includes(searchTerm.toLowerCase())
      )    .slice() // create a shallow copy to avoid mutating the original array
      .reverse()
      .map((partner, index) => ({
        id: index + 1,
        author: <Author image={partner.image || null} name={partner.name} email={partner.email} />,
        phone: partner.phone || 'N/A',
        address: partner.address || 'N/A',
        companyName: partner.companyName || 'N/A',
        isValid: partner.isValid ? (
          <MDTypography variant="caption" color="success" fontWeight="medium">
            Validé
          </MDTypography>
        ) : (
          <MDButton
            variant="gradient"
            color="success"
            size="small"
            onClick={(e) => {
              e.preventDefault();
              handleValidate(partner._id);
            }}
          >
            Valider
          </MDButton>
        ),
        action: currentUser?.role === 'ADMIN' && (
          <MDBox display="flex" gap={1}>
            <EditModal partner={partner} onSave={handleEdit}>
              <EditIcon color="info" style={{ cursor: 'pointer' }} />
            </EditModal>
            <DeleteIcon
              color="error"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                handleDelete(partner._id);
              }}
            />
          </MDBox>
        ),
      }));
  }, [partners, searchTerm, currentUser]);

  const columns = [
    { Header: 'ID', accessor: 'id', align: 'center' },
    { Header: 'Author', accessor: 'author', width: '30%', align: 'left' },
    { Header: 'Phone', accessor: 'phone', align: 'center' },
    { Header: 'Address', accessor: 'address', align: 'left' },
    { Header: 'Company Name', accessor: 'companyName', align: 'left' },
    { Header: 'Statut', accessor: 'isValid', align: 'center' },
    ...(currentUser?.role === 'ADMIN'
      ? [{ Header: 'Action', accessor: 'action', align: 'center' }]
      : []),
  ];

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <MDTypography variant="h6" fontWeight="medium">
            Partner Users Table
          </MDTypography>
          {currentUser?.role === 'ADMIN' && (
            <MDButton variant="gradient" color="info" onClick={() => setIsAddPartnerModalOpen(true)}>
              Add Partner
            </MDButton>
          )}
        </MDBox>

        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3}>
                <DataTable
                  table={{
                    columns,
                    rows,
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

      <AddPartnerModal
        open={isAddPartnerModalOpen}
        onClose={() => setIsAddPartnerModalOpen(false)}
        onCreate={async (formData) => {
          try {
            await createPartnerMutation({
              variables: {
                createUserDto: {
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone || null,
                  address: formData.address || null,
                  companyName: formData.companyName || null,
                  password: formData.password,
                  role: 'PARTNER',
                },
              },
            });
            alert('Partner created successfully!');
            setIsAddPartnerModalOpen(false);
            refetch();
          } catch (error) {
            console.error(error);
            alert('Failed to create partner.');
          }
        }}
      />
    </DashboardLayout>
  );
}



function EditModal({ partner, onSave, children }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    _id: partner._id,
    name: partner.name,
    email: partner.email,
    phone: partner.phone || '',
    address: partner.address || '',
    image: partner.image || '',
    companyName: partner.companyName || '', // Ajoutez ce champ
  });

  const handleSave = () => {
    if (!formData._id) {
      alert("Partner ID is missing. Cannot update partner.");
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
        <DialogTitle>Edit Partner</DialogTitle>
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
          <TextField
            label="Company Name"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
  partner: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string,
    address: PropTypes.string,
    image: PropTypes.string,
    companyName: PropTypes.string,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  children: PropTypes.node,
};

function AddPartnerModal({ open, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    companyName: '', // Ajoutez ce champ
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
      <DialogTitle>Add New Partner</DialogTitle>
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
        <TextField
          label="Company Name"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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

AddPartnerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};

export default PartnerTable;