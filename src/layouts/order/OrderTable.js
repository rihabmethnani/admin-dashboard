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
import { Dialog, DialogTitle, DialogContent, DialogActions, Menu, MenuItem } from '@mui/material';
import MDButton from 'components/MDButton';
import MoreVertIcon from '@mui/icons-material/MoreVert'; // Icône pour le menu contextuel
import HistoryIcon from '@mui/icons-material/History'; // Icône pour l'historique
import { ASSIGN_DRIVER_TO_ORDER, GET_ORDER_HISTORY, GET_ORDERS } from 'graphql/queries/orderQueries';
import { clientMicroservice2 } from 'apolloClients/microservice2';
import { clientMicroservice1 } from 'apolloClients/microservice1';

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

  const [orders, setOrders] = useState([]);
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null); // Pour le menu contextuel
  const [selectedDriverId, setSelectedDriverId] = useState(''); // Pour l'ID du chauffeur

  // État local pour stocker les noms des partenaires et des chauffeurs
  const [partners, setPartners] = useState({});
  const [drivers, setDrivers] = useState({});

  // Mutation pour assigner un chauffeur
  const [assignDriverMutation] = useMutation(ASSIGN_DRIVER_TO_ORDER, {
    client: clientMicroservice2,
  });

  // Mutation pour récupérer l'historique
  const { data: historyData } = useQuery(GET_ORDER_HISTORY, {
    variables: { orderId: selectedOrder?._id },
    skip: !selectedOrder,
    client: clientMicroservice2,
  });

  // Fonction pour récupérer un partenaire par son ID
  const fetchPartnerName = async (partnerId) => {
    if (!partnerId || partners[partnerId]) return; // Ne pas recharger si déjà disponible

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

  // Fonction pour récupérer un chauffeur par son ID
  const fetchDriverName = async (driverId) => {
    if (!driverId || drivers[driverId]) return; // Ne pas recharger si déjà disponible

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
    if (data && data.orders) {
      data.orders.forEach((order) => {
        if (order.partnerId) {
          fetchPartnerName(order.partnerId); // Charger les noms des partenaires
        }
        if (order.driverId) {
          fetchDriverName(order.driverId); // Charger les noms des chauffeurs
        }
      });

      setOrders(
        data.orders.map((order, index) => ({
          id: index + 1, // ID séquentiel
          status: order.status,
          partner: partners[order.partnerId] || 'N/A', // Nom du partenaire
          driver: drivers[order.driverId] || 'N/A', // Nom du chauffeur
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

  // Gestion du menu contextuel
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

  const openAssignDriverModal = (order) => {
    setSelectedOrder(order);
    setIsAssignDriverModalOpen(true);
    handleCloseMenu();
  };

  const openHistoryModal = (order) => {
    setSelectedOrder(order);
    setIsHistoryModalOpen(true);
  };

  const handleAssignDriver = async () => {
    try {
      await assignDriverMutation({
        variables: { orderId: selectedOrder._id, driverId: selectedDriverId },
      });
      alert('Driver assigned successfully!');
      refetch();
    } catch (error) {
      console.error('Error assigning driver:', error.message);
      alert('Failed to assign driver.');
    }
    setIsAssignDriverModalOpen(false);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const statusColors = {
    NEW: 'info', // Bleu (nouveau)
    PENDING: 'warning', // Jaune (en attente)
    ASSIGNED: 'success', // Vert (assigné)
    IN_TRANSIT: 'primary', // Bleu foncé (en transit)
    DELIVERED: 'success', // Vert (livré)
    FAILED_ATTEMPT: 'error', // Rouge (tentative échouée)
    RETURNED: 'error', // Rouge (retourné)
    CANCELLED: 'error', // Rouge (annulé)
    ON_HOLD: 'warning', // Jaune (en attente)
    RELAUNCHED: 'info', // Bleu (relancé)
    DELAYED: 'warning', // Jaune (retardé)
    PARTIALLY_DELIVERED: 'success', // Vert (partiellement livré)
    IN_STORAGE: 'secondary', // Gris (en stockage)
    AWAITING_CONFIRMATION: 'warning', // Jaune (attente de confirmation)
  };

  const columns = [
    { Header: 'ID', accessor: 'id', align: 'center' },
  /* eslint-disable react/prop-types */
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
  /* eslint-enable react/prop-types */
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

      {/* Modale pour assigner un chauffeur */}
      <Dialog open={isAssignDriverModalOpen} onClose={() => setIsAssignDriverModalOpen(false)}>
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <input
            type="text"
            placeholder="Enter Driver ID"
            onChange={(e) => setSelectedDriverId(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setIsAssignDriverModalOpen(false)}>Cancel</MDButton>
          <MDButton onClick={handleAssignDriver}>Save</MDButton>
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
        <MenuItem onClick={() => handleEdit(selectedOrder)}>Edit</MenuItem>
        <MenuItem onClick={() => handleDelete(selectedOrder)}>Delete</MenuItem>
        <MenuItem onClick={() => openAssignDriverModal(selectedOrder)}>Assign Driver</MenuItem>
      </Menu>
    </DashboardLayout>
  );
}

export default OrderTable;