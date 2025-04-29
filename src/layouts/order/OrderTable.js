import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery, gql, useMutation } from '@apollo/client';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import { Dialog, DialogTitle, DialogContent, DialogActions, Menu, MenuItem, Checkbox, FormControl, InputLabel, Select, Box } from '@mui/material';
import MDButton from 'components/MDButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { clientMicroservice2 } from 'apolloClients/microservice2';
import { clientMicroservice1 } from 'apolloClients/microservice1';
import { GET_ORDERS } from 'graphql/queries/orderQueries';
import { ASSIGN_ORDERS_TO_DRIVER } from 'graphql/queries/orderQueries';
import { GET_ORDER_HISTORY } from 'graphql/queries/orderQueries';
import { GET_USERS_BY_ROLE } from 'graphql/queries/orderQueries';

// Requête GraphQL pour récupérer un utilisateur par son ID (microservice 1)
const GET_USER_BY_ID = gql`
  query GetUserById($id: String!) {
    getUserById(id: $id) {
      _id
      name
    }
  }
`;

function OrderTable() {
  const { loading, error, data, refetch } = useQuery(GET_ORDERS, {
    client: clientMicroservice2,
  });

  const { data: driversData } = useQuery(GET_USERS_BY_ROLE, {
    client: clientMicroservice1,
    variables: { role: 'DRIVER' }
  });

  const [orders, setOrders] = useState([]);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [partners, setPartners] = useState({});
  const [drivers, setDrivers] = useState({});

  const [assignOrdersToDriverMutation] = useMutation(ASSIGN_ORDERS_TO_DRIVER, {
    client: clientMicroservice2,
  });

  const { data: historyData } = useQuery(GET_ORDER_HISTORY, {
    variables: { orderId: selectedOrder?._id },
    skip: !selectedOrder,
    client: clientMicroservice2,
  });

  const fetchPartnerName = async (partnerId) => {
    if (!partnerId || partners[partnerId]) return;

    try {
      const { data: partnerData } = await clientMicroservice1.query({
        query: GET_USER_BY_ID,
        variables: { id: partnerId },
      });

      setPartners((prevPartners) => ({
        ...prevPartners,
        [partnerId]: partnerData.getUserById.name,
      }));
    } catch (err) {
      console.error('Error fetching partner:', err.message);
    }
  };

  const fetchDriverName = async (driverId) => {
    if (!driverId || drivers[driverId]) return;

    try {
      const { data: driverData } = await clientMicroservice1.query({
        query: GET_USER_BY_ID,
        variables: { id: driverId },
      });

      setDrivers((prevDrivers) => ({
        ...prevDrivers,
        [driverId]: driverData.getUserById.name,
      }));
    } catch (err) {
      console.error('Error fetching driver:', err.message);
    }
  };

  useEffect(() => {
    if (driversData && driversData.getAllDrivers) {
      setAvailableDrivers(driversData.getAllDrivers);
    }
  }, [driversData]);

  useEffect(() => {
    if (data && data.orders) {
      data.orders.forEach((order) => {
        if (order.partnerId) {
          fetchPartnerName(order.partnerId);
        }
        if (order.driverId) {
          fetchDriverName(order.driverId);
        }
      });

      setOrders(
        data.orders.map((order, index) => ({
          _id: order._id,
          id: index + 1,
          status: order.status,
          partner: partners[order.partnerId] || 'N/A',
          driver: drivers[order.driverId] || 'N/A',
          action: (
            <MDBox display="flex" alignItems="center">
              <MoreVertIcon
                style={{ cursor: 'pointer' }}
                onClick={(event) => handleOpenMenu(event, order)}
              />
            </MDBox>
          ),
          history: (
            <HistoryIcon
              style={{ cursor: 'pointer' }}
              onClick={() => openHistoryModal(order)}
            />
          ),
        }))
      );
    }
  }, [data, partners, drivers]);

  useEffect(() => {
    if (historyData && historyData.orderHistory) {
      setOrderHistory(historyData.orderHistory);
    }
  }, [historyData]);

  const handleOpenMenu = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleEdit = (order) => {
    console.log('Edit:', order);
    handleCloseMenu();
  };

  const handleDelete = (order) => {
    console.log('Delete:', order);
    handleCloseMenu();
  };

  const openBulkAssignModal = () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order');
      return;
    }
    setIsBulkAssignModalOpen(true);
  };

  const openHistoryModal = (order) => {
    setSelectedOrder(order);
    setIsHistoryModalOpen(true);
  };

  const handleBulkAssign = async () => {
    try {
      await assignOrdersToDriverMutation({
        variables: { 
          orderIds: selectedOrders, 
          driverId: selectedDriverId
        },
      });
      alert('Orders assigned successfully!');
      setSelectedOrders([]);
      refetch();
    } catch (error) {
      console.error('Error assigning orders:', error.message);
      alert('Failed to assign orders: ' + error.message);
    }
    setIsBulkAssignModalOpen(false);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  const statusColors = {
    EN_ATTENTE: 'warning',
    ENTRE_CENTRAL: 'info',
    ASSIGNE: 'success',
    EN_COURS_LIVRAISON: 'primary',
    LIVRE: 'success',
    ECHEC_LIVRAISON: 'error',
    RETOURNE: 'error',
    ANNULE: 'error',
    EN_ATTENTE_RESOLUTION: 'warning',
    RELANCE: 'info',
    RETARDE: 'warning',
    PARTIELLEMENT_LIVRE: 'success',
    EN_ENTREPOT: 'secondary',
    EN_ATTENTE_CONFIRMATION: 'warning',
    VERIFICATION: 'info',
  };

  const columns = [
    {
      Header: 'Select',
      accessor: '_id',
      Cell: ({ value }) => (
        <Checkbox
          checked={selectedOrders.includes(value)}
          onChange={() => handleSelectOrder(value)}
        />
      ),
      align: 'center',
    },
    { Header: 'ID', accessor: 'id', align: 'center' },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }) => (
        <MDTypography variant="caption" color={statusColors[value]} fontWeight="medium">
          {value}
        </MDTypography>
      ),
      align: 'center',
    },
    { Header: 'Partner', accessor: 'partner', align: 'center' },
    { Header: 'Driver', accessor: 'driver', align: 'center' },
    { Header: 'Action', accessor: 'action', align: 'center' },
    { Header: 'History', accessor: 'history', align: 'center' },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={2} display="flex" justifyContent="flex-end">
                <MDButton 
                  variant="gradient" 
                  color="info"
                  onClick={openBulkAssignModal}
                  disabled={selectedOrders.length === 0}
                >
                  Assign Selected Orders
                </MDButton>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{
                    columns,
                    rows: orders,
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
      <Footer />

      {/* Modale pour assigner plusieurs commandes à un chauffeur */}
      <Dialog open={isBulkAssignModalOpen} onClose={() => setIsBulkAssignModalOpen(false)}>
        <DialogTitle>Assign {selectedOrders.length} Orders to Driver</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <MDTypography variant="h6">
              Selected Orders: {selectedOrders.length}
            </MDTypography>
          </Box>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Driver</InputLabel>
            <Select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              label="Select Driver"
            >
              {availableDrivers.map((driver) => (
                <MenuItem key={driver._id} value={driver._id}>
                  {driver.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setIsBulkAssignModalOpen(false)}>Cancel</MDButton>
          <MDButton 
            onClick={handleBulkAssign}
            disabled={!selectedDriverId || selectedOrders.length === 0}
          >
            Assign Orders
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Modale pour afficher l'historique */}
      <Dialog open={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)}>
        <DialogTitle>Order History</DialogTitle>
        <DialogContent>
          <ul>
            {orderHistory.map((event, index) => (
              <li key={index}>
                <strong>{event.event}</strong>: {event.details} ({new Date(event.timestamp).toLocaleString()})
              </li>
            ))}
          </ul>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setIsHistoryModalOpen(false)}>Close</MDButton>
        </DialogActions>
      </Dialog>

      {/* Menu contextuel */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={() => handleEdit(selectedOrder)}>
          <EditIcon style={{ marginRight: 8 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedOrder)}>
          <DeleteIcon style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>
    </DashboardLayout>
  );
}
OrderTable.propTypes = {
  value: PropTypes.string.isRequired, // Exemple : 'value' est une chaîne de caractères requise
};

export default OrderTable;