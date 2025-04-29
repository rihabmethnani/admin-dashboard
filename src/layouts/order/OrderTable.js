import React, { useEffect, useState } from 'react';
import {
  Grid, Card, Dialog, DialogTitle, DialogContent, DialogActions, Menu, MenuItem,
  Checkbox, FormControl, InputLabel, Select, Box, TextField
} from '@mui/material';
import { useQuery, useMutation, gql } from '@apollo/client';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HistoryIcon from '@mui/icons-material/History';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import MDButton from 'components/MDButton';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import EditIcon from '@mui/icons-material/Edit';
import { clientMicroservice1 } from 'apolloClients/microservice1';
import { clientMicroservice2 } from 'apolloClients/microservice2';
import { GET_ORDERS, ASSIGN_ORDERS_TO_DRIVER, GET_ORDER_HISTORY, GET_USERS_BY_ROLE, UPDATE_ORDER_STATUS } from 'graphql/queries/orderQueries';

import DeleteIcon from '@mui/icons-material/Delete';
import PropTypes from 'prop-types';
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
  const { loading: ordersLoading, data: ordersData, refetch: refetchOrders } = useQuery(GET_ORDERS, { client: clientMicroservice2 });
  const { data: driversData } = useQuery(GET_USERS_BY_ROLE, { client: clientMicroservice1, variables: { role: 'DRIVER' } });

  const [assignOrdersToDriver] = useMutation(ASSIGN_ORDERS_TO_DRIVER, { client: clientMicroservice2 });
  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS, { client: clientMicroservice2 });

  const [orders, setOrders] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [partners, setPartners] = useState({});
  const [drivers, setDrivers] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  console.log('orders',orders)
  console.log('availableDrivers',availableDrivers)
  useEffect(() => {
    if (driversData?.getUsersByRole) {
      setAvailableDrivers(driversData.getUsersByRole);
    }
  }, [driversData]);

  // useEffect(() => {
    
  //   if (ordersData?.orders) {
  //     fetchUsersAndSetOrders(ordersData.orders);
  //   }
  // }, [ordersData]);

  const fetchDriverName = async (driverId) => {
    if (!driverId || drivers[driverId]) return;
  
    try {
      const { data: driverData } = await clientMicroservice1.query({
        query: GET_USER_BY_ID,
        variables: { id: driverId },
      });
  
      setDrivers((prev) => ({
        ...prev,
        [driverId]: driverData.getUserById.name,
      }));
    } catch (err) {
      console.error('Error fetching driver:', err.message);
    }
  };
  
  const fetchPartnerName = async (partnerId) => {
    if (!partnerId || partners[partnerId]) return;
  
    try {
      const { data: partnerData } = await clientMicroservice1.query({
        query: GET_USER_BY_ID,
        variables: { id: partnerId },
      });
  
      setPartners((prev) => ({
        ...prev,
        [partnerId]: partnerData.getUserById.name,
      }));
    } catch (err) {
      console.error('Error fetching partner:', err.message);
    }
  };
  
  useEffect(() => {
    if (ordersData?.orders) {
      const fetchUsers = async () => {
        await Promise.all(
          ordersData.orders.map(async (order) => {
            if (order.partnerId) {
              await fetchPartnerName(order.partnerId);
            }
            if (order.driverId) {
              await fetchDriverName(order.driverId);
            }
          })
        );
  
        setOrders(
          ordersData.orders.map((order, index) => ({
            _id: order._id,
            id: index + 1,
            status: order.status,
            partner: partners[order.partnerId] || 'N/A',
            driver: drivers[order.driverId] || 'N/A',
            action: (
              <MDBox display="flex" alignItems="center">
                <EditIcon
                  color="info"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => handleOpenMenu(e, order)}
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
      };
  
      fetchUsers();
    }
  }, [ordersData, partners, drivers]);
  
  const handleOpenMenu = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };
  

  const handleCloseMenu = () => setAnchorEl(null);

  const openEditStatusModal = () => {
    setIsEditStatusModalOpen(true);
    setNewStatus(selectedOrder.status);
    handleCloseMenu();
  };

  const handleEditStatus = async () => {
    try {
      await updateOrderStatus({
        variables: { orderId: selectedOrder._id, newStatus },
      });
      await refetchOrders();
      setIsEditStatusModalOpen(false);
      alert('Order status updated successfully.');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  };

  const handleBulkAssign = async () => {
    try {
      await assignOrdersToDriver({
        variables: { orderIds: selectedOrders, driverId: selectedDriverId },
      });
      await refetchOrders();
      setIsBulkAssignModalOpen(false);
      setSelectedOrders([]);
      alert('Orders assigned successfully!');
    } catch (error) {
      console.error('Error assigning orders:', error);
      alert('Failed to assign orders.');
    }
  };

  const openBulkAssignModal = () => {
    if (!selectedOrders.length) {
      alert('Select at least one order.');
      return;
    }
    setIsBulkAssignModalOpen(true);
  };

  const openHistoryModal = (order) => {
    setSelectedOrder(order);
    // You can load history modal data if needed
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
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
      // eslint-disable-next-line react/prop-types
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
      // eslint-disable-next-line react/prop-types
      Cell: ({ value }) => (
        <MDTypography variant="caption" color={statusColors[value]}  fontWeight="medium">
          {value}
        </MDTypography>
      ),
      
      align: 'center',
    },
    { Header: 'Partner',accessor: 'partner', align: 'center' },
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
                  disabled={!selectedOrders.length}
                >
                  Assign Selected Orders
                </MDButton>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows: orders }}
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

      {/* Bulk Assign Modal */}
      <Dialog open={isBulkAssignModalOpen} onClose={() => setIsBulkAssignModalOpen(false)}>
        <DialogTitle>Assign Orders to Driver</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
          
            <Select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
            >
              {availableDrivers.map(driver => (
                <MenuItem key={driver._id} value={driver._id}>{driver.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setIsBulkAssignModalOpen(false)} color="secondary">Cancel</MDButton>
          <MDButton onClick={handleBulkAssign} color="info">Assign</MDButton>
        </DialogActions>
      </Dialog>

      {/* Edit Status Modal */}
      <Dialog open={isEditStatusModalOpen} onClose={() => setIsEditStatusModalOpen(false)}>
        <DialogTitle>Edit Order Status</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setIsEditStatusModalOpen(false)} color="secondary">Cancel</MDButton>
          <MDButton onClick={handleEditStatus} color="success">Save</MDButton>
        </DialogActions>
      </Dialog>

      {/* Menu (Edit, Delete) */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={openEditStatusModal}>
          <EditIcon fontSize="small" />&nbsp; Edit Status
        </MenuItem>
        <MenuItem onClick={() => { console.log('Delete', selectedOrder); handleCloseMenu(); }}>
          <DeleteIcon fontSize="small" />&nbsp; Delete
        </MenuItem>
      </Menu>
    </DashboardLayout>
  );
}

export default OrderTable;
