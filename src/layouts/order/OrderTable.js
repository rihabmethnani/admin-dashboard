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
  TextField,
  InputAdornment,
  Box,
} from "@mui/material"
import { useQuery, useMutation, gql } from "@apollo/client"
import HistoryIcon from "@mui/icons-material/History"
import SearchIcon from "@mui/icons-material/Search"
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDButton from "components/MDButton"
import DashboardLayout from "examples/LayoutContainers/DashboardLayout"
import DashboardNavbar from "examples/Navbars/DashboardNavbar"
import DataTable from "examples/Tables/DataTable"
import EditIcon from "@mui/icons-material/Edit"
import { clientMicroservice1 } from "apolloClients/microservice1"
import { clientMicroservice2 } from "apolloClients/microservice2"
import { GET_ORDER_HISTORY, GET_USERS_BY_ROLE, UPDATE_ORDER_STATUS } from "graphql/queries/orderQueries"
import IconButton from "@mui/material/IconButton"
import { useSnackbar } from "notistack"
import OrderHistoryModal from "./OrderHistoryModal"
import EditStatusModal from "./EditStatusModal"
import { useAuth } from "context/AuthContext"
import ErrorIcon from "@mui/icons-material/Error"
import LocationOnIcon from "@mui/icons-material/LocationOn"

// Statuts des commandes selon l'enum backend
const ORDER_STATUSES = [
  "EN_ATTENTE",
  "ATTRIBUÉ",
  "EN_LIVRAISON",
  "LIVRÉ",
  "ÉCHEC_LIVRAISON",
  "RETOURNÉ",
  "ANNULÉ",
  "EN_ATTENTE_RÉSOLUTION",
  "RETARDÉ",
  "PARTIELLEMENT_LIVRÉ",
  "EN_ENTREPOT", // Corrigé : sans accent circonflexe
  "EN_ATTENTE_CONFIRMATION",
  "EN_VÉRIFICATION",
  "RELANCE",
]

export const GET_ORDERS_BY_RESPONSIBILITY_ZONE = gql`
  query GetOrdersByResponsibilityZone {
    getOrdersByResponsibilityZone {
      _id
      status
      partnerId
      driverId
      clientId
      region
      createdAt
    }
  }
`

const GET_USER_BY_ID = gql`
  query GetUserById($id: String!) {
    getUserById(id: $id) {
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
  } = useQuery(GET_ORDERS_BY_RESPONSIBILITY_ZONE, { client: clientMicroservice2 })
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

  // Search and sort state variables
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState("newest")

  // Error popup states
  const [errorPopupOpen, setErrorPopupOpen] = useState(false)
  const [errorPopupMessage, setErrorPopupMessage] = useState("")
  const [errorPopupTitle, setErrorPopupTitle] = useState("Erreur")

  // Function to handle assignment errors based on the error message
  const handleAssignmentError = (error) => {
    console.error("Erreur d&apos;assignation:", error)

    // Extract the error message
    const errorMsg = error.message || ""
    let popupTitle = "Erreur d&apos;Assignation"
    let popupMessage = ""

    // Check for specific error conditions based on the backend function
    if (errorMsg.includes("Only ADMIN or AdminAssistant")) {
      popupTitle = "Permission Refusée"
      popupMessage = "Seuls les administrateurs peuvent assigner des commandes aux chauffeurs."
    } else if (errorMsg.includes("User not found")) {
      popupTitle = "Erreur d&apos;Authentification"
      popupMessage = "Erreur d&apos;authentification utilisateur : Veuillez vous reconnecter."
    } else if (errorMsg.includes("déjà assignés à ce livreur aujourd'hui")) {
      // Extract the order IDs if available
      const orderIdsMatch = errorMsg.match(/: (.*?)$/)
      const orderIdsStr = orderIdsMatch ? orderIdsMatch[1] : ""

      popupTitle = "Commandes Déjà Assignées"
      popupMessage = `Ces commandes sont déjà assignées à ce chauffeur aujourd&apos;hui${orderIdsStr ? ": " + orderIdsStr : ""}.`
    } else if (errorMsg.includes("Driver already has")) {
      // Extract the counts if available
      const existingMatch = errorMsg.match(/has (\d+) orders/)
      const remainingMatch = errorMsg.match(/up to (\d+) more/)

      const existingCount = existingMatch ? existingMatch[1] : "plusieurs"
      const remainingCount = remainingMatch ? remainingMatch[1] : "quelques"

      popupTitle = "Limite de Capacité du Chauffeur"
      popupMessage = `Le chauffeur a déjà ${existingCount} commandes assignées aujourd&apos;hui. Vous ne pouvez assigner que ${remainingCount} commandes supplémentaires maximum.`
    } else if (errorMsg.includes("One or more orders not found")) {
      popupTitle = "Commandes Non Trouvées"
      popupMessage = "Une ou plusieurs commandes sélectionnées n&apos;existent plus dans le système."
    } else {
      // Default error message for any other errors
      popupTitle = "Échec de l&apos;Assignation"
      popupMessage = "Échec de l&apos;assignation des commandes au chauffeur. Veuillez réessayer plus tard."
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

  // Fonction pour récupérer le nom du partenaire
  const fetchPartnerName = async (partnerId) => {
    if (!partnerId || partners[partnerId]) return partners[partnerId] || "N/A"

    try {
      const { data: partnerData } = await clientMicroservice1.query({
        query: GET_USER_BY_ID,
        variables: { id: partnerId },
      })

      const partnerName = partnerData.getUserById.name
      setPartners((prev) => ({
        ...prev,
        [partnerId]: partnerName,
      }))
      return partnerName
    } catch (err) {
      console.error("Erreur lors de la récupération du partenaire:", err.message)
      return "Erreur"
    }
  }

  // Fonction pour récupérer le nom du chauffeur
  const fetchDriverName = async (driverId) => {
    if (!driverId || drivers[driverId]) return drivers[driverId] || "N/A"

    try {
      const { data: driverData } = await clientMicroservice1.query({
        query: GET_USER_BY_ID,
        variables: { id: driverId },
      })

      const driverName = driverData.getUserById.name
      setDrivers((prev) => ({
        ...prev,
        [driverId]: driverName,
      }))
      return driverName
    } catch (err) {
      console.error("Erreur lors de la récupération du chauffeur:", err.message)
      return "Erreur"
    }
  }

  // Fonction pour récupérer l'adresse du client
  const fetchClientAddress = async (clientId) => {
    if (!clientId || clients[clientId]) return clients[clientId]?.address || "N/A"

    try {
      // Essayer d'abord avec microservice2
      const { data: clientData } = await clientMicroservice2.query({
        query: GET_USER_BY_ID,
        variables: { id: clientId },
      })

      const clientAddress = clientData.getUserById.address || "Adresse non renseignée"
      setClients((prev) => ({
        ...prev,
        [clientId]: {
          name: clientData.getUserById.name,
          address: clientAddress,
          phone: clientData.getUserById.phone
        },
      }))
      return clientAddress
    } catch (err) {
      console.error("Erreur lors de la récupération du client avec microservice2:", err.message)
      
      // Si ça échoue, essayer avec microservice1
      try {
        const { data: clientData } = await clientMicroservice1.query({
          query: GET_USER_BY_ID,
          variables: { id: clientId },
        })

        const clientAddress = clientData.getUserById.address || "Adresse non renseignée"
        setClients((prev) => ({
          ...prev,
          [clientId]: {
            name: clientData.getUserById.name,
            address: clientAddress,
            phone: clientData.getUserById.phone
          },
        }))
        return clientAddress
      } catch (err2) {
        console.error("Erreur lors de la récupération du client avec microservice1:", err2.message)
        return "Erreur de chargement"
      }
    }
  }

  useEffect(() => {
    if (ordersData?.getOrdersByResponsibilityZone) {
      const fetchUsers = async () => {
        // Récupérer toutes les données des utilisateurs
        const ordersWithUsers = await Promise.all(
          ordersData.getOrdersByResponsibilityZone.map(async (order) => {
            const [partnerName, driverName, clientAddress] = await Promise.all([
              order.partnerId ? fetchPartnerName(order.partnerId) : "N/A",
              order.driverId ? fetchDriverName(order.driverId) : "N/A",
              order.clientId ? fetchClientAddress(order.clientId) : "N/A"
            ])

            return {
              ...order,
              partnerName,
              driverName,
              clientAddress,
            }
          }),
        )

        // Créer les lignes du tableau
        setOrders(
          ordersWithUsers.map((order, index) => ({
            _id: order._id,
            id: index + 1,
            status: order.status,
            partner: order.partnerName,
            driver: order.driverName,
            clientAddress: order.clientAddress,
            createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
            rawData: order, // Store raw data for filtering
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

  // Filter and sort orders
  const filteredAndSortedOrders = orders
    .filter((order) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        order.status.toLowerCase().includes(searchLower) ||
        order.partner.toLowerCase().includes(searchLower) ||
        order.driver.toLowerCase().includes(searchLower) ||
        order.clientAddress.toLowerCase().includes(searchLower) ||
        order.id.toString().includes(searchLower)
      )
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return b.createdAt - a.createdAt
      } else {
        return a.createdAt - b.createdAt
      }
    })

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

      enqueueSnackbar(`Statut mis à jour : ${data.updateOrderStatus.status}`, {
        variant: "success",
      })

      // Refresh the data
      await refetchOrders()

      // Close the modal
      setIsEditStatusModalOpen(false)
      setSelectedOrder(null)
    } catch (error) {
      console.error("Erreur de mise à jour:", error)
      enqueueSnackbar(`Échec : ${error.message}`, { variant: "error" })
    } finally {
      setIsStatusUpdateLoading(false)
    }
  }

  const handleBulkAssign = async () => {
    if (!selectedDriverId) {
      enqueueSnackbar("Veuillez sélectionner un chauffeur", { variant: "error" })
      return
    }

    if (selectedOrders.length === 0) {
      enqueueSnackbar("Veuillez sélectionner au moins une commande", { variant: "error" })
      return
    }

    setIsBulkAssignLoading(true)

    try {
      // Show a notification that we're attempting to assign orders
      enqueueSnackbar("Assignation des commandes...", { variant: "info" })

      const { data } = await assignOrdersToDriver({
        variables: {
          orderIds: selectedOrders,
          driverId: selectedDriverId,
        },
      })

      await refetchOrders()
      setIsBulkAssignModalOpen(false)
      setSelectedOrders([])
      enqueueSnackbar(`${selectedOrders.length} commandes assignées avec succès !`, {
        variant: "success",
        autoHideDuration: 5000,
        anchorOrigin: { vertical: "top", horizontal: "center" },
      })
    } catch (error) {
      // Error will be handled by the onError callback in the mutation
      console.error("Erreur dans try/catch:", error)
    } finally {
      setIsBulkAssignLoading(false)
    }
  }

  const openBulkAssignModal = () => {
    if (!selectedOrders.length) {
      enqueueSnackbar("Sélectionnez au moins une commande", { variant: "warning" })
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
      console.error("Erreur lors du chargement de l&apos;historique:", error)
      enqueueSnackbar(`Échec du chargement de l&apos;historique : ${error.message}`, {
        variant: "error",
      })
    }
  }

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }

  // Couleurs des statuts selon l'enum backend
  const statusColors = {
    "EN_ATTENTE": "warning",
    "ATTRIBUÉ": "info",
    "EN_LIVRAISON": "primary",
    "LIVRÉ": "success",
    "ÉCHEC_LIVRAISON": "error",
    "RETOURNÉ": "error",
    "ANNULÉ": "error",
    "EN_ATTENTE_RÉSOLUTION": "warning",
    "RETARDÉ": "warning",
    "PARTIELLEMENT_LIVRÉ": "success",
    "EN_ENTREPOT": "secondary", // Corrigé : sans accent circonflexe
    "EN_ATTENTE_CONFIRMATION": "warning",
    "EN_VÉRIFICATION": "info",
    "RELANCE": "info",
  }

  const columns = [
    {
      Header: "Sélectionner",
      accessor: "_id",
      Cell: ({ value }) => (
        <Checkbox checked={selectedOrders.includes(value)} onChange={() => handleSelectOrder(value)} />
      ),
      align: "center",
    },
    { Header: "ID", accessor: "id", align: "center" },
    {
      Header: "Statut",
      accessor: "status",
      Cell: ({ value }) => (
        <MDTypography variant="caption" color={statusColors[value] || "dark"} fontWeight="medium">
          {value}
        </MDTypography>
      ),
      align: "center",
    },
    { Header: "Partenaire", accessor: "partner", align: "center" },
    { Header: "Chauffeur", accessor: "driver", align: "center" },
    {
      Header: "Adresse Client",
      accessor: "clientAddress",
      Cell: ({ value }) => (
        <MDBox display="flex" alignItems="center" maxWidth="250px">
          <LocationOnIcon fontSize="small" color="info" sx={{ mr: 0.5, flexShrink: 0 }} />
          <MDTypography 
            variant="caption" 
            fontWeight="medium"
            sx={{ 
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
            title={value} // Tooltip pour voir l'adresse complète
          >
            {value || "Adresse non disponible"}
          </MDTypography>
        </MDBox>
      ),
      align: "left",
    },
    { Header: "Action", accessor: "action", align: "center" },
    {
      Header: "Historique",
      accessor: "history",
      align: "center",
    },
  ]

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <MDBox>
            <MDTypography variant="h4" fontWeight="medium">
              Gestion des Commandes
            </MDTypography>
            <MDTypography variant="body2" color="text">
              Suivi et gestion des commandes de livraison
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
              placeholder="ID, statut, partenaire, chauffeur..."
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
                onClick={openBulkAssignModal}
                disabled={!selectedOrders.length}
              >
                Assigner les Commandes Sélectionnées
              </MDButton>
            )}
          </MDBox>
        </MDBox>
        

        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows: filteredAndSortedOrders }}
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

      {/* Bulk Assign Modal */}
      <Dialog open={isBulkAssignModalOpen} onClose={() => setIsBulkAssignModalOpen(false)}>
        <DialogTitle>Assigner les Commandes au Chauffeur</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Sélectionner un Chauffeur</InputLabel>
            <Select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              label="Sélectionner un Chauffeur"
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
            Annuler
          </MDButton>
          <MDButton onClick={handleBulkAssign} color="info" disabled={isBulkAssignLoading}>
            {isBulkAssignLoading ? "Assignation..." : "Assigner"}
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
          &nbsp; Modifier le Statut
        </MenuItem>
      </Menu>
    </DashboardLayout>
  )
}

export default OrderTable