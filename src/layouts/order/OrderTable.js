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
import DataTable from "examples/Tables/DataTable"
import EditIcon from "@mui/icons-material/Edit"
import { clientMicroservice1 } from "apolloClients/microservice1"
import { clientMicroservice2 } from "apolloClients/microservice2"
import { GET_ORDERS, GET_ORDER_HISTORY, GET_USERS_BY_ROLE, UPDATE_ORDER_STATUS } from "graphql/queries/orderQueries"
import IconButton from "@mui/material/IconButton"
import DeleteIcon from "@mui/icons-material/Delete"
import { useSnackbar } from "notistack"
import OrderHistoryModal from "./OrderHistoryModal"
import EditStatusModal from "./EditStatusModal"
import { useAuth } from "context/AuthContext"
import ErrorIcon from "@mui/icons-material/Error"
import LocationOnIcon from "@mui/icons-material/LocationOn"
const ORDER_STATUSES = [
  "PENDING",
  "IN_CENTRAL_WAREHOUSE",
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_FAILED",
  "RETURNED",
  "CANCELED",
  "PENDING_RESOLUTION",
  "FOLLOW_UP",
  "DELAYED",
  "PARTIALLY_DELIVERED",
  "IN_WAREHOUSE",
  "AWAITING_CONFIRMATION",
  "VERIFICATION",
];


const GET_USER_BY_ID = gql`
  query GetUserById($id: String!) {
    getUserById(id: $id) {
      _id
      name
    }
  }
`

const GET_CLIENT_BY_ID = gql`
  query GetClientById($id: String!) {
    getClientById(id: $id) {
      _id
      name
      address
      phone
    }
  }
`

const ASSIGN_ORDERS_TO_DRIVER = gql`
  mutation AssignOrdersToDriver($orderIds: [String!]!, $driverId: String!) {
    assignOrdersToDriver(orderIds: $orderIds, driverId: $driverId) {
      _id
      status
      driverId
      createdAt
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
  const { currentUser } = useAuth()
  const { enqueueSnackbar } = useSnackbar()

  // State variables
  const [history, setHistory] = useState([])
  const [usersCache, setUsersCache] = useState({})
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isStatusUpdateLoading, setIsStatusUpdateLoading] = useState(false)
  const [isBulkAssignLoading, setIsBulkAssignLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [availableDrivers, setAvailableDrivers] = useState([])
  const [selectedOrders, setSelectedOrders] = useState([])
  const [selectedDriverId, setSelectedDriverId] = useState("")
  const [partners, setPartners] = useState({})
  const [drivers, setDrivers] = useState({})
  const [clients, setClients] = useState({}) // Store client data
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false)
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false)

  // Error popup states
  const [errorPopupOpen, setErrorPopupOpen] = useState(false)
  const [errorPopupMessage, setErrorPopupMessage] = useState("")
  const [errorPopupTitle, setErrorPopupTitle] = useState("Error")

  // Function to handle assignment errors based on the error message
  const handleAssignmentError = (error) => {
    console.error("Assignment error:", error)

    // Extract the error message
    const errorMsg = error.message || ""
    let popupTitle = "Assignment Error"
    let popupMessage = ""

    // Check for specific error conditions based on the backend function
    if (errorMsg.includes("Only ADMIN or AdminAssistant")) {
      popupTitle = "Permission Denied"
      popupMessage = "Only administrators can assign orders to drivers."
    } else if (errorMsg.includes("User not found")) {
      popupTitle = "Authentication Error"
      popupMessage = "User authentication error: Please log in again."
    } else if (errorMsg.includes("déjà assignés à ce livreur aujourd'hui")) {
      // Extract the order IDs if available
      const orderIdsMatch = errorMsg.match(/: (.*?)$/)
      const orderIdsStr = orderIdsMatch ? orderIdsMatch[1] : ""

      popupTitle = "Orders Already Assigned"
      popupMessage = `These orders are already assigned to this driver today${orderIdsStr ? ": " + orderIdsStr : ""}.`
    } else if (errorMsg.includes("Driver already has")) {
      // Extract the counts if available
      const existingMatch = errorMsg.match(/has (\d+) orders/)
      const remainingMatch = errorMsg.match(/up to (\d+) more/)

      const existingCount = existingMatch ? existingMatch[1] : "multiple"
      const remainingCount = remainingMatch ? remainingMatch[1] : "few"

      popupTitle = "Driver Capacity Limit"
      popupMessage = `Driver already has ${existingCount} orders assigned today. You can only assign up to ${remainingCount} more orders.`
    } else if (errorMsg.includes("One or more orders not found")) {
      popupTitle = "Orders Not Found"
      popupMessage = "One or more selected orders no longer exist in the system."
    } else {
      // Default error message for any other errors
      popupTitle = "Assignment Failed"
      popupMessage = "Failed to assign orders to driver. Please try again later."
    }

    // Set the error popup content and show it
    setErrorPopupTitle(popupTitle)
    setErrorPopupMessage(popupMessage)
    setErrorPopupOpen(true)
  }

  // Mutations
  const [assignOrdersToDriver] = useMutation(ASSIGN_ORDERS_TO_DRIVER, {
    client: clientMicroservice2,
    onError: handleAssignmentError,
  })

  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS, { client: clientMicroservice2 })

  const { data: adminsData } = useQuery(GET_USERS_BY_ROLE, {
    client: clientMicroservice1,
    variables: { role: "ADMIN" },
  })

  const { data: assistantAdminsData } = useQuery(GET_USERS_BY_ROLE, {
    client: clientMicroservice1,
    variables: { role: "ASSISTANT_ADMIN" },
  })

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

  const fetchClientData = async (clientId) => {
    if (!clientId || clients[clientId]) return clients[clientId]?.address || "N/A"

    try {
      const { data: clientData } = await clientMicroservice2.query({
        query: GET_CLIENT_BY_ID,
        variables: { id: clientId },
      })

      if (clientData?.getClientById) {
        setClients((prev) => ({
          ...prev,
          [clientId]: clientData.getClientById,
        }))
        return clientData.getClientById.address || "N/A"
      }
      return "N/A"
    } catch (err) {
      console.error("Error fetching client:", err.message)
      return "N/A"
    }
  }

  useEffect(() => {
    if (ordersData?.orders) {
      const fetchUsers = async () => {
        // First fetch all partner, driver, and client data
        const ordersWithUsers = await Promise.all(
          ordersData.orders.map(async (order) => {
            let partnerName = "N/A"
            let driverName = "N/A"
            let clientAddress = "N/A"

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

            if (order.clientId) {
              try {
                const { data: clientData } = await clientMicroservice2.query({
                  query: GET_CLIENT_BY_ID,
                  variables: { id: order.clientId },
                })
                if (clientData?.getClientById) {
                  clientAddress = clientData.getClientById.address || "N/A"
                  setClients((prev) => ({ ...prev, [order.clientId]: clientData.getClientById }))
                }
              } catch (err) {
                console.error("Error fetching client:", err.message)
              }
            }

            return {
              ...order,
              partnerName,
              driverName,
              clientAddress,
            }
          }),
        )

        // Then set the orders with the fetched names and addresses
        setOrders(
          ordersWithUsers.map((order, index) => ({
            _id: order._id,
            id: index + 1,
            status: order.status,
            partner: order.partnerName,
            driver: order.driverName,
            clientAddress: order.clientAddress,
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
      enqueueSnackbar("Missing data", { variant: "error" })
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

      enqueueSnackbar(`Status updated: ${data.updateOrderStatus.status}`, {
        variant: "success",
      })

      // Refresh the data
      await refetchOrders()

      // Close the modal
      setIsEditStatusModalOpen(false)
      setSelectedOrder(null)
    } catch (error) {
      console.error("Update error:", error)
      enqueueSnackbar(`Failed: ${error.message}`, { variant: "error" })
    } finally {
      setIsStatusUpdateLoading(false)
    }
  }

  const handleBulkAssign = async () => {
    if (!selectedDriverId) {
      enqueueSnackbar("Please select a driver", { variant: "error" })
      return
    }

    if (selectedOrders.length === 0) {
      enqueueSnackbar("Please select at least one order", { variant: "error" })
      return
    }

    setIsBulkAssignLoading(true)

    try {
      // Show a notification that we're attempting to assign orders
      enqueueSnackbar("Assigning orders...", { variant: "info" })

      const { data } = await assignOrdersToDriver({
        variables: {
          orderIds: selectedOrders,
          driverId: selectedDriverId,
        },
      })

      await refetchOrders()
      setIsBulkAssignModalOpen(false)
      setSelectedOrders([])
      enqueueSnackbar(`${selectedOrders.length} orders assigned successfully!`, {
        variant: "success",
        autoHideDuration: 5000,
        anchorOrigin: { vertical: "top", horizontal: "center" },
      })
    } catch (error) {
      // Error will be handled by the onError callback in the mutation
      console.error("Error in try/catch:", error)
    } finally {
      setIsBulkAssignLoading(false)
    }
  }

  const openBulkAssignModal = () => {
    if (!selectedOrders.length) {
      enqueueSnackbar("Select at least one order", { variant: "warning" })
      return
    }
    setIsBulkAssignModalOpen(true)
  }

  // Updated openHistoryModal function
  const openHistoryModal = async (order) => {
    try {
      if (!order || !order._id) {
        enqueueSnackbar("Invalid order data", { variant: "error" })
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
      console.error("Error loading history:", error)
      enqueueSnackbar(`Failed to load history: ${error.message}`, {
        variant: "error",
      })
    }
  }

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }

  const statusColors = {
    PENDING: "warning",
    IN_CENTRAL_WAREHOUSE: "info",
    ASSIGNED: "success",
    OUT_FOR_DELIVERY: "primary",
    DELIVERED: "success",
    DELIVERY_FAILED: "error",
    RETURNED: "error",
    CANCELED: "error",
    PENDING_RESOLUTION: "warning",
    FOLLOW_UP: "info",
    DELAYED: "warning",
    PARTIALLY_DELIVERED: "success",
    IN_WAREHOUSE: "secondary",
    AWAITING_CONFIRMATION: "warning",
    VERIFICATION: "info",
  };
  

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
    {
      Header: "Client Address",
      accessor: "clientAddress",
      Cell: ({ value }) => (
        <MDBox display="flex" alignItems="center">
          <LocationOnIcon fontSize="small" color="info" sx={{ mr: 0.5 }} />
          <MDTypography variant="caption" fontWeight="medium">
            {value}
          </MDTypography>
        </MDBox>
      ),
      align: "left",
    },
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
                {(currentUser?.role === "ADMIN" || currentUser?.role === "ADMIN_ASSISTANT") && (
                  <MDButton
                    variant="gradient"
                    color="warning"
                    onClick={openBulkAssignModal}
                    disabled={!selectedOrders.length}
                  >
                    Assign Selected Orders
                  </MDButton>
                )}
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
          <MDButton onClick={handleBulkAssign} color="info" disabled={isBulkAssignLoading}>
            {isBulkAssignLoading ? "Assigning..." : "Assign"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Error Popup Dialog */}
      <Dialog open={errorPopupOpen} onClose={() => setErrorPopupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ErrorIcon color="error" />
          {errorPopupTitle}
        </DialogTitle>
        <DialogContent>
          <MDTypography variant="body1">{errorPopupMessage}</MDTypography>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setErrorPopupOpen(false)} color="primary">
            OK
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
      
      </Menu>
    </DashboardLayout>
  )
}

export default OrderTable
