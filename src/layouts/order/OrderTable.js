"use client"

/* eslint-disable react/prop-types */
import { useEffect, useState } from "react"
import {
  Grid,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material"
import { useQuery, useMutation, gql } from "@apollo/client"
import HistoryIcon from "@mui/icons-material/History"
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDButton from "components/MDButton"
import DashboardLayout from "examples/LayoutContainers/DashboardLayout"
import DashboardNavbar from "examples/Navbars/DashboardNavbar"
import Footer from "examples/Footer"
import DataTable from "examples/Tables/DataTable"
import EditIcon from "@mui/icons-material/Edit"
import { clientMicroservice1 } from "apolloClients/microservice1"
import { clientMicroservice2 } from "apolloClients/microservice2"
import {
  GET_ORDERS,
  ASSIGN_ORDERS_TO_DRIVER,
  GET_ORDER_HISTORY,
  GET_USERS_BY_ROLE,
  UPDATE_ORDER_STATUS,
} from "graphql/queries/orderQueries"
import IconButton from "@mui/material/IconButton"
import DeleteIcon from "@mui/icons-material/Delete"
import { useSnackbar } from "notistack"
import OrderHistoryModal from "./OrderHistoryModal"
import EditStatusModal from "./EditStatusModal"
import { useAuth } from "context/AuthContext"
const ORDER_STATUSES = [
  "EN_ATTENTE",
  "ENTRE_CENTRAL",
  "ASSIGNE",
  "EN_COURS_LIVRAISON",
  "LIVRE",
  "ECHEC_LIVRAISON",
  "RETOURNE",
  "ANNULE",
  "EN_ATTENTE_RESOLUTION",
  "RELANCE",
  "RETARDE",
  "PARTIELLEMENT_LIVRE",
  "EN_ENTREPOT",
  "EN_ATTENTE_CONFIRMATION",
  "VERIFICATION",
]

const GET_USER_BY_ID = gql`
  query GetUserById($id: String!) {
    getUserById(id: $id) {
      _id
      name
    }
  }
`

function OrderTable() {
  const {
    loading: ordersLoading,
    data: ordersData,
    refetch: refetchOrders,
  } = useQuery(GET_ORDERS, { client: clientMicroservice2 })
  const { data: driversData } = useQuery(GET_USERS_BY_ROLE, {
    client: clientMicroservice1,
    variables: { role: "DRIVER" },
  })
const {currentUser}=useAuth()
  const [assignOrdersToDriver] = useMutation(ASSIGN_ORDERS_TO_DRIVER, { client: clientMicroservice2 })
  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS, { client: clientMicroservice2 })
  const [history, setHistory] = useState([])
  const [usersCache, setUsersCache] = useState({})
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isStatusUpdateLoading, setIsStatusUpdateLoading] = useState(false)

  const { data: adminsData } = useQuery(GET_USERS_BY_ROLE, {
    client: clientMicroservice1,
    variables: { role: "ADMIN" },
  })

  const { data: assistantAdminsData } = useQuery(GET_USERS_BY_ROLE, {
    client: clientMicroservice1,
    variables: { role: "ASSISTANT_ADMIN" },
  })
  const [orders, setOrders] = useState([])
  const [availableDrivers, setAvailableDrivers] = useState([])
  const [selectedOrders, setSelectedOrders] = useState([])
  const [selectedDriverId, setSelectedDriverId] = useState("")
  const [partners, setPartners] = useState({})
  const [drivers, setDrivers] = useState({})
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false)
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    if (driversData?.getUsersByRole) {
      setAvailableDrivers(driversData.getUsersByRole)
    }
  }, [driversData])

  const fetchDriverName = async (driverId) => {
    if (!driverId || drivers[driverId]) return

    try {
      const { data: driverData } = await clientMicroservice1.query({
        query: GET_USER_BY_ID,
        variables: { id: driverId },
      })

      setDrivers((prev) => ({
        ...prev,
        [driverId]: driverData.getUserById.name,
      }))
    } catch (err) {
      console.error("Error fetching driver:", err.message)
    }
  }

  const fetchPartnerName = async (partnerId) => {
    if (!partnerId || partners[partnerId]) return

    try {
      const { data: partnerData } = await clientMicroservice1.query({
        query: GET_USER_BY_ID,
        variables: { id: partnerId },
      })

      setPartners((prev) => ({
        ...prev,
        [partnerId]: partnerData.getUserById.name,
      }))
    } catch (err) {
      console.error("Error fetching partner:", err.message)
    }
  }

  useEffect(() => {
    if (ordersData?.orders) {
      const fetchUsers = async () => {
        // First fetch all partner and driver names
        const ordersWithUsers = await Promise.all(
          ordersData.orders.map(async (order) => {
            let partnerName = "N/A"
            let driverName = "N/A"

            if (order.partnerId) {
              try {
                const { data: partnerData } = await clientMicroservice1.query({
                  query: GET_USER_BY_ID,
                  variables: { id: order.partnerId },
                })
                partnerName = partnerData.getUserById.name
                setPartners((prev) => ({ ...prev, [order.partnerId]: partnerName }))
              } catch (err) {
                console.error("Error fetching partner:", err.message)
              }
            }

            if (order.driverId) {
              try {
                const { data: driverData } = await clientMicroservice1.query({
                  query: GET_USER_BY_ID,
                  variables: { id: order.driverId },
                })
                driverName = driverData.getUserById.name
                setDrivers((prev) => ({ ...prev, [order.driverId]: driverName }))
              } catch (err) {
                console.error("Error fetching driver:", err.message)
              }
            }

            return {
              ...order,
              partnerName,
              driverName,
            }
          }),
        )

        // Then set the orders with the fetched names
        setOrders(
          ordersWithUsers.map((order, index) => ({
            _id: order._id,
            id: index + 1,
            status: order.status,
            partner: order.partnerName,
            driver: order.driverName,
            action: (
              <MDBox display="flex" alignItems="center">
                <EditIcon color="info" style={{ cursor: "pointer" }} onClick={(e) => handleOpenMenu(e, order)} />
              </MDBox>
            ),
            history: (
              <IconButton onClick={() => openHistoryModal(order)}>
                <HistoryIcon />
              </IconButton>
            ),
          })),
        )
      }

      fetchUsers()
    }
  }, [ordersData])

  const handleOpenMenu = (event, order) => {
    setAnchorEl(event.currentTarget)
    setSelectedOrder(order)
  }

  const handleCloseMenu = () => setAnchorEl(null)

  const openEditStatusModal = (order) => {
    if (!order) return
    setSelectedOrder(order)
    setIsEditStatusModalOpen(true)
  }

  const handleEditStatus = async (newStatus) => {
    if (!selectedOrder || !newStatus) {
      enqueueSnackbar("Données manquantes", { variant: "error" })
      return
    }

    setIsStatusUpdateLoading(true)

    try {
      const { data } = await updateOrderStatus({
        variables: {
          orderId: selectedOrder._id,
          status: newStatus,
        },
      })

      enqueueSnackbar(`Statut mis à jour: ${data.updateOrderStatus.status}`, {
        variant: "success",
      })

      // Refresh the data
      await refetchOrders()

      // Close the modal
      setIsEditStatusModalOpen(false)
      setSelectedOrder(null)
    } catch (error) {
      console.error("Erreur de mise à jour:", error)
      enqueueSnackbar(`Échec: ${error.message}`, { variant: "error" })
    } finally {
      setIsStatusUpdateLoading(false)
    }
  }

  const handleBulkAssign = async () => {
    try {
      await assignOrdersToDriver({
        variables: { orderIds: selectedOrders, driverId: selectedDriverId },
      })
      await refetchOrders()
      setIsBulkAssignModalOpen(false)
      setSelectedOrders([])
      alert("Orders assigned successfully!")
    } catch (error) {
      console.error("Error assigning orders:", error)
      alert("Failed to assign orders.")
    }
  }

  const openBulkAssignModal = () => {
    if (!selectedOrders.length) {
      alert("Select at least one order.")
      return
    }
    setIsBulkAssignModalOpen(true)
  }

  // Updated openHistoryModal function
  const openHistoryModal = async (order) => {
    try {
      if (!order || !order._id) {
        enqueueSnackbar("Données de commande invalides", { variant: "error" })
        return
      }

      const { data } = await clientMicroservice2.query({
        query: GET_ORDER_HISTORY,
        variables: { orderId: order._id },
      })

      // Make sure we're accessing the correct property based on your GraphQL schema
      const historyData = data?.orderHistory || []

      // Sort by date (newest first)
      const sortedHistory = [...historyData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      setHistory(sortedHistory)
      setSelectedOrder(order)
      setIsHistoryModalOpen(true)
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error)
      enqueueSnackbar(`Échec du chargement de l'historique: ${error.message}`, {
        variant: "error",
      })
    }
  }

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }

  const statusColors = {
    EN_ATTENTE: "warning",
    ENTRE_CENTRAL: "info",
    ASSIGNE: "success",
    EN_COURS_LIVRAISON: "primary",
    LIVRE: "success",
    ECHEC_LIVRAISON: "error",
    RETOURNE: "error",
    ANNULE: "error",
    EN_ATTENTE_RESOLUTION: "warning",
    RELANCE: "info",
    RETARDE: "warning",
    PARTIELLEMENT_LIVRE: "success",
    EN_ENTREPOT: "secondary",
    EN_ATTENTE_CONFIRMATION: "warning",
    VERIFICATION: "info",
  }

  const columns = [
    {
      Header: "Select",
      accessor: "_id",
      Cell: ({ value }) => (
        <Checkbox checked={selectedOrders.includes(value)} onChange={() => handleSelectOrder(value)} />
      ),
      align: "center",
    },
    { Header: "ID", accessor: "id", align: "center" },
    {
      Header: "Status",
      accessor: "status",
      Cell: ({ value }) => (
        <MDTypography variant="caption" color={statusColors[value]} fontWeight="medium">
          {value}
        </MDTypography>
      ),
      align: "center",
    },
    { Header: "Partner", accessor: "partner", align: "center" },
    { Header: "Driver", accessor: "driver", align: "center" },
    { Header: "Action", accessor: "action", align: "center" },
    {
      Header: "History",
      accessor: "history",
      align: "center",
    },
  ]

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={2} display="flex" justifyContent="flex-end">
                {(currentUser?.role==="ADMIN" || currentUser?.role=== "ADMIN_ASSISTANT") && 
                <MDButton
                  variant="gradient"
                  color="warning"
                  onClick={openBulkAssignModal}
                  disabled={!selectedOrders.length}
                >
                  Assign Selected Orders
                </MDButton>

                }
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
      {/* <Footer /> */}

      {/* Bulk Assign Modal */}
      <Dialog open={isBulkAssignModalOpen} onClose={() => setIsBulkAssignModalOpen(false)}>
        <DialogTitle>Assign Orders to Driver</DialogTitle>
        <DialogContent>
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
          <MDButton onClick={() => setIsBulkAssignModalOpen(false)} color="secondary">
            Cancel
          </MDButton>
          <MDButton onClick={handleBulkAssign} color="info">
            Assign
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Edit Status Modal */}
      <EditStatusModal
        open={isEditStatusModalOpen}
        onClose={() => setIsEditStatusModalOpen(false)}
        order={selectedOrder}
        statuses={ORDER_STATUSES}
        statusColors={statusColors}
        onSave={handleEditStatus}
        isLoading={isStatusUpdateLoading}
      />

      {/* History Modal */}
      <OrderHistoryModal
        open={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        orderId={selectedOrder?._id}
        orderNumber={selectedOrder?.id}
        historyData={history}
      />

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem
          onClick={() => {
            if (selectedOrder) {
              openEditStatusModal(selectedOrder)
            }
            handleCloseMenu()
          }}
        >
          <EditIcon fontSize="small" />
          &nbsp; Edit Status
        </MenuItem>
        <MenuItem
          onClick={() => {
            console.log("Delete", selectedOrder)
            handleCloseMenu()
          }}
        >
          <DeleteIcon fontSize="small" />
          &nbsp; Delete
        </MenuItem>
      </Menu>
    </DashboardLayout>
  )
}

export default OrderTable
