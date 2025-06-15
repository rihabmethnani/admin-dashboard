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
  Chip,
  Box,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from "@mui/material"
import MDButton from "components/MDButton"
import PropTypes from "prop-types"
import EditIcon from "@mui/icons-material/Edit"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import ErrorIcon from "@mui/icons-material/Error"
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty"
import DoneAllIcon from "@mui/icons-material/DoneAll"
import { useMaterialUIController } from "context"
import { clientMicroservice1 } from "apolloClients/microservice1"
import LocalShippingIcon from "@mui/icons-material/LocalShipping"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { clientMicroservice2 } from "apolloClients/microservice2"
import { useNavigate } from "react-router-dom"
import { getStatusKey,getPriorityKey,  getStatusValue, getPriorityValue, getIncidentTypeValue } from "util/enum-utils"

// Requêtes GraphQL
const GET_ALL_INCIDENTS = gql`
  query GetAllIncidents($filters: FilterIncidentInput) {
    getAllIncidents(filters: $filters) {
      _id
      orderId
      description
      status
      incidentType
      priority
      reportedBy
      createdAt
      updatedAt
    }
  }
`

const GET_ORDER_BY_ID = gql`
  query GetOrderById($id: String!) {
    order(id: $id) {
      _id
      clientId
      amount
      description
      status
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

const GET_INCIDENT_STATS = gql`
  query GetIncidentStats {
    getIncidentStats {
      totalIncidents
      openIncidents
      inProgressIncidents
      resolvedIncidents
    }
  }
`

const UPDATE_INCIDENT = gql`
  mutation UpdateIncident($input: UpdateIncidentInput!) {
    updateIncident(input: $input) {
      _id
      status
      priority
      updatedAt
    }
  }
`

function IncidentInfo({ orderId, incidentType, description }) {
  const [orderInfo, setOrderInfo] = useState({ clientId: null, status: "Chargement..." })
  const [clientInfo, setClientInfo] = useState({ name: "Chargement...", address: "Chargement..." })
  const [loadingState, setLoadingState] = useState("loading")

  const {
    loading: orderLoading,
    error: orderError,
    data: orderData,
  } = useQuery(GET_ORDER_BY_ID, {
    variables: { id: orderId },
    client: clientMicroservice1,
    skip: !orderId,
    onError: (err) => {
      console.error("Erreur lors du chargement de la commande:", err)
      setLoadingState("order_error")
    },
  })

  const {
    loading: clientLoading,
    error: clientError,
    data: clientData,
  } = useQuery(GET_USER_BY_ID, {
    variables: { id: orderInfo.clientId },
    client: clientMicroservice1,
    skip: !orderInfo.clientId,
    onError: (err) => {
      console.error("Erreur lors du chargement du client:", err)
      setLoadingState("client_error")
    },
  })

  useEffect(() => {
    if (orderData?.order) {
      setOrderInfo({
        clientId: orderData.order.clientId,
        status: orderData.order.status,
      })
      setLoadingState("loading_client")
    }
  }, [orderData])

  useEffect(() => {
    if (clientData?.getUserById) {
      setClientInfo({
        name: clientData.getUserById.name || "Client inconnu",
        address: clientData.getUserById.address || "Aucune adresse disponible",
      })
      setLoadingState("loaded")
    }
  }, [clientData])

  // Gestion des états de chargement et d'erreur
  if (orderLoading) {
    return (
      <MDBox display="flex" flexDirection="column">
        <MDBox display="flex" alignItems="center">
          <LocalShippingIcon fontSize="small" color="info" sx={{ mr: 0.5 }} />
          <MDTypography variant="button" fontWeight="medium">
            Chargement de la commande...
          </MDTypography>
        </MDBox>
        <MDTypography variant="caption" fontWeight="bold" color="dark">
          {getIncidentTypeValue(incidentType) || description || "N/A"}
        </MDTypography>
      </MDBox>
    )
  }

  if (orderError) {
    return (
      <MDBox display="flex" flexDirection="column">
        <MDBox display="flex" alignItems="center">
          <LocalShippingIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
          <MDTypography variant="button" fontWeight="medium" color="error">
            Commande introuvable
          </MDTypography>
        </MDBox>
        <MDTypography variant="caption" fontWeight="bold" color="dark">
          {getIncidentTypeValue(incidentType) || description || "N/A"}
        </MDTypography>
      </MDBox>
    )
  }

  if (clientLoading && orderInfo.clientId) {
    return (
      <MDBox display="flex" flexDirection="column">
        <MDBox display="flex" alignItems="center">
          <LocalShippingIcon fontSize="small" color="info" sx={{ mr: 0.5 }} />
          <MDTypography variant="button" fontWeight="medium">
            Chargement du client...
          </MDTypography>
        </MDBox>
        <MDTypography variant="caption" fontWeight="bold" color="dark">
          {getIncidentTypeValue(incidentType) || description || "N/A"}
        </MDTypography>
      </MDBox>
    )
  }

  if (clientError) {
    return (
      <MDBox display="flex" flexDirection="column">
        <MDBox display="flex" alignItems="center">
          <LocalShippingIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
          <MDTypography variant="button" fontWeight="medium" color="error">
            Client introuvable
          </MDTypography>
        </MDBox>
        <MDTypography variant="caption" fontWeight="bold" color="dark">
          {getIncidentTypeValue(incidentType) || description || "N/A"}
        </MDTypography>
      </MDBox>
    )
  }

  return (
    <MDBox display="flex" flexDirection="column">
      <MDBox display="flex" alignItems="center">
        <LocalShippingIcon fontSize="small" color="info" sx={{ mr: 0.5 }} />
        <MDTypography variant="button" fontWeight="medium">
          {clientInfo.address}
        </MDTypography>
      </MDBox>
      <MDTypography variant="caption" fontWeight="bold" color="dark">
        {getIncidentTypeValue(incidentType) || description || "N/A"}
      </MDTypography>
    </MDBox>
  )
}

IncidentInfo.propTypes = {
  orderId: PropTypes.string,
  incidentType: PropTypes.string,
  description: PropTypes.string,
}

function StatusChip({ status }) {
  let color = "default"
  let icon = null

  // Convertir le statut du backend en français pour l'affichage
  const frenchStatus = getStatusValue(status)

  // Comparaison avec les valeurs françaises
  switch (frenchStatus) {
    case "Ouvert":
      color = "error"
      icon = <ErrorIcon fontSize="small" />
      break
    case "En Cours":
      color = "warning"
      icon = <HourglassEmptyIcon fontSize="small" />
      break
    case "Résolu":
      color = "success"
      icon = <DoneAllIcon fontSize="small" />
      break
    case "Annulé":
      color = "default"
      icon = <CheckCircleIcon fontSize="small" />
      break
    default:
      color = "default"
  }

  return <Chip icon={icon} label={frenchStatus} color={color} size="small" sx={{ fontWeight: "bold" }} />
}

StatusChip.propTypes = {
  status: PropTypes.string.isRequired,
}

function PriorityChip({ priority }) {
  let color = "default"

  // Convertir la priorité du backend en français pour l'affichage
  const frenchPriority = getPriorityValue(priority)

  // Comparaison avec les valeurs françaises
  switch (frenchPriority) {
    case "Faible":
      color = "info"
      break
    case "Moyenne":
      color = "warning"
      break
    case "Élevée":
      color = "error"
      break
    case "Critique":
      color = "error"
      break
    default:
      color = "default"
  }

  return (
    <Chip
      label={frenchPriority}
      color={color}
      size="small"
      variant={frenchPriority === "Critique" ? "filled" : "outlined"}
      sx={{ fontWeight: frenchPriority === "Critique" ? "bold" : "medium" }}
    />
  )
}

PriorityChip.propTypes = {
  priority: PropTypes.string.isRequired,
}

// Modale d'édition d'incident
function EditIncidentModal({ open, onClose, incident, onSave }) {
  const [formData, setFormData] = useState({
    status: "",
    priority: "",
  })

  useEffect(() => {
    if (incident) {
      setFormData({
        status: getStatusValue(incident.status) || "",
        priority: getPriorityValue(incident.priority) || "",
      })
    }
  }, [incident])

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Modifier l&apos;Incident</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel id="status-label">Statut</InputLabel>
          <Select
            labelId="status-label"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            label="Statut"
          >
            <MenuItem value="Ouvert">Ouvert</MenuItem>
            <MenuItem value="En Cours">En Cours</MenuItem>
            <MenuItem value="Résolu">Résolu</MenuItem>
            <MenuItem value="Annulé">Annulé</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel id="priority-label">Priorité</InputLabel>
          <Select
            labelId="priority-label"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            label="Priorité"
          >
            <MenuItem value="Faible">Faible</MenuItem>
            <MenuItem value="Moyenne">Moyenne</MenuItem>
            <MenuItem value="Élevée">Élevée</MenuItem>
            <MenuItem value="Critique">Critique</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose}>Annuler</MDButton>
        <MDButton onClick={handleSave} color="info">
          Enregistrer
        </MDButton>
      </DialogActions>
    </Dialog>
  )
}

EditIncidentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  incident: PropTypes.object,
  onSave: PropTypes.func.isRequired,
}

// Modale de résolution
function ResolveIncidentModal({ open, onClose, incident, onResolve }) {
  const [notes, setNotes] = useState("")

  const handleResolve = () => {
    onResolve(notes)
    setNotes("")
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Résoudre l&apos;Incident</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Notes de Résolution"
          fullWidth
          multiline
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose}>Annuler</MDButton>
        <MDButton onClick={handleResolve} color="success">
          Résoudre
        </MDButton>
      </DialogActions>
    </Dialog>
  )
}

ResolveIncidentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  incident: PropTypes.object,
  onResolve: PropTypes.func.isRequired,
}

// Composant principal
function IncidentTable() {
  const navigate = useNavigate()
  const [controller] = useMaterialUIController()
  const { searchTerm } = controller
  const [incidents, setIncidents] = useState([])
  const [stats, setStats] = useState({
    totalIncidents: 0,
    openIncidents: 0,
    inProgressIncidents: 0,
    resolvedIncidents: 0,
  })
  const [tabValue, setTabValue] = useState(0)
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    status: "",
    priority: "",
    incidentType: "",
    reportedBy: "",
    searchTerm: "",
    createdAfter: "",
    createdBefore: "",
  })
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  // Requêtes
  const { loading, error, data, refetch } = useQuery(GET_ALL_INCIDENTS, {
    client: clientMicroservice2,
    fetchPolicy: "network-only",
    variables: {
      filters: Object.keys(advancedFilters).reduce((acc, key) => {
        if (advancedFilters[key] && advancedFilters[key] !== "") {
          acc[key] = advancedFilters[key]
        }
        return acc
      }, {}),
    },
  })

  const { data: statsData } = useQuery(GET_INCIDENT_STATS, {
    client: clientMicroservice2,
    fetchPolicy: "network-only",
  })

  const [updateIncident] = useMutation(UPDATE_INCIDENT, {
    client: clientMicroservice2,
    onCompleted: () => {
      refetch()
    },
  })

  // Effets
  useEffect(() => {
    if (data?.getAllIncidents) {
      const allIncidents = data.getAllIncidents

      // Appliquer le filtrage en JavaScript avec les valeurs du backend
      const filteredIncidents = statusFilter
        ? allIncidents.filter((incident) => {
            // Convertir le statut français en clé d'énumération pour la comparaison
            const statusKey = getStatusKey(statusFilter)
            return incident.status === statusKey
          })
        : allIncidents

      const transformedData = filteredIncidents.map((incident, index) => ({
        id: index + 1,
        incidentInfo: (
          <IncidentInfo
            orderId={incident.orderId}
            incidentType={incident.incidentType}
            description={incident.description}
          />
        ),
        status: <StatusChip status={incident.status} />,
        priority: <PriorityChip priority={incident.priority} />,
        description: incident.description,
        createdAt: format(new Date(incident.createdAt), "dd/MM/yyyy HH:mm", { locale: fr }),
        action: (
          <MDBox display="flex" gap={1}>
            <Tooltip title="Modifier">
              <IconButton color="warning" size="small" onClick={() => handleEdit(incident)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {getStatusValue(incident.status) !== "Résolu" && (
              <Tooltip title="Marquer comme Résolu">
                <IconButton color="success" size="small" onClick={() => handleResolveClick(incident)}>
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </MDBox>
        ),
        _id: incident._id,
        rawData: incident,
      }))
      setIncidents(transformedData)
    }
  }, [data, statusFilter])

  useEffect(() => {
    if (statsData?.getIncidentStats) {
      setStats(statsData.getIncidentStats)
    }
  }, [statsData])

  // Gestionnaires d'événements
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    switch (newValue) {
      case 0:
        setStatusFilter("")
        break
      case 1:
        setStatusFilter("Ouvert") // Valeur française pour le filtrage
        break
      case 2:
        setStatusFilter("En Cours") // Valeur française pour le filtrage
        break
      case 3:
        setStatusFilter("Résolu") // Valeur française pour le filtrage
        break
      default:
        setStatusFilter("")
    }
  }

  const handleEdit = (incident) => {
    setSelectedIncident(incident)
    setIsEditModalOpen(true)
  }

  const handleResolveClick = (incident) => {
    setSelectedIncident(incident)
    setIsResolveModalOpen(true)
  }

  const handleApplyFilters = () => {
    refetch()
    setIsFilterModalOpen(false)
  }

  const handleResetFilters = () => {
    setAdvancedFilters({
      status: "",
      priority: "",
      incidentType: "",
      reportedBy: "",
      searchTerm: "",
      createdAfter: "",
      createdBefore: "",
    })
    setTabValue(0)
    setStatusFilter("")
    refetch()
  }

  const handleSaveEdit = async (formData) => {
    try {
      await updateIncident({
        variables: {
          input: {
            incidentId: selectedIncident._id,
            status: getStatusKey(formData.status), // Convertir en clé d'énumération
            priority: getPriorityKey(formData.priority), // Convertir en clé d'énumération
          },
        },
      })
      refetch()
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'incident:", err)
      alert("Échec de la mise à jour de l'incident: " + err.message)
    }
  }

  const handleResolve = async (notes) => {
    try {
      await updateIncident({
        variables: {
          input: {
            incidentId: selectedIncident._id,
            status: "RESOLVED", // Utiliser directement la clé d'énumération
            resolutionNotes: notes,
          },
        },
      })
      refetch()
    } catch (err) {
      console.error("Erreur lors de la résolution de l'incident:", err)
      alert("Échec de la résolution de l'incident: " + err.message)
    }
  }

  // Colonnes du tableau
  const columns = [
    { Header: "ID", accessor: "id", align: "center" },
    { Header: "Adresse Client / Incident", accessor: "incidentInfo", width: "25%", align: "left" },
    { Header: "Statut", accessor: "status", align: "center" },
    { Header: "Priorité", accessor: "priority", align: "center" },
    { Header: "Description", accessor: "description", align: "left" },
    { Header: "Date", accessor: "createdAt", align: "center" },
    { Header: "Actions", accessor: "action", align: "center" },
  ]

  if (loading)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <MDTypography variant="h5">Chargement des incidents...</MDTypography>
        </MDBox>
      </DashboardLayout>
    )

  if (error)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <MDTypography variant="h5" color="error">
            Erreur : {error.message}
          </MDTypography>
        </MDBox>
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <MDBox>
            <MDTypography variant="h4" fontWeight="medium">
              Gestion des Incidents
            </MDTypography>
            <MDTypography variant="body2" color="text">
              Suivi et résolution des incidents de livraison
            </MDTypography>
          </MDBox>
        </MDBox>

        {/* Cartes de statistiques */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={2} textAlign="center">
                <MDTypography variant="h6">Total des Incidents</MDTypography>
                <MDTypography variant="h3">{stats.totalIncidents}</MDTypography>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={2} textAlign="center" bgcolor="rgba(255,0,0,0.05)">
                <MDTypography variant="h6" color="error">
                  Ouverts
                </MDTypography>
                <MDTypography variant="h3" color="error">
                  {stats.openIncidents}
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={2} textAlign="center" bgcolor="rgba(255,152,0,0.05)">
                <MDTypography variant="h6" color="warning">
                  En Cours
                </MDTypography>
                <MDTypography variant="h3" color="warning">
                  {stats.inProgressIncidents}
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={2} textAlign="center" bgcolor="rgba(76,175,80,0.05)">
                <MDTypography variant="h6" color="success">
                  Résolus
                </MDTypography>
                <MDTypography variant="h3" color="success">
                  {stats.resolvedIncidents}
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
             
            </MDBox>
          </Grid>
        </Grid>

        <Card>
          <MDBox p={3}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable">
              <Tab label="Tous" />
              <Tab
                label={
                  <Box display="flex" alignItems="center">
                    <ErrorIcon sx={{ mr: 0.5 }} /> Ouverts
                  </Box>
                }
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center">
                    <HourglassEmptyIcon sx={{ mr: 0.5 }} /> En Cours
                  </Box>
                }
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center">
                    <DoneAllIcon sx={{ mr: 0.5 }} /> Résolus
                  </Box>
                }
              />
            </Tabs>

            <DataTable
              table={{ columns, rows: incidents }}
              isSorted={false}
              entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
              showTotalEntries
              noEndBorder
            />
          </MDBox>
        </Card>
      </MDBox>

      {/* Modale de filtres avancés */}
      <Dialog open={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Filtres Avancés</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={advancedFilters.status}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}
                  label="Statut"
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="Ouvert">Ouvert</MenuItem>
                  <MenuItem value="En Cours">En Cours</MenuItem>
                  <MenuItem value="Résolu">Résolu</MenuItem>
                  <MenuItem value="Annulé">Annulé</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priorité</InputLabel>
                <Select
                  value={advancedFilters.priority}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, priority: e.target.value })}
                  label="Priorité"
                >
                  <MenuItem value="">Toutes</MenuItem>
                  <MenuItem value="Faible">Faible</MenuItem>
                  <MenuItem value="Moyenne">Moyenne</MenuItem>
                  <MenuItem value="Élevée">Élevée</MenuItem>
                  <MenuItem value="Critique">Critique</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type d&apos;Incident</InputLabel>
                <Select
                  value={advancedFilters.incidentType}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, incidentType: e.target.value })}
                  label="Type d'Incident"
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="Colis Endommagé">Colis Endommagé</MenuItem>
                  <MenuItem value="Adresse Incorrecte">Adresse Incorrecte</MenuItem>
                  <MenuItem value="Client Introuvable">Client Introuvable</MenuItem>
                  <MenuItem value="Colis Perdu">Colis Perdu</MenuItem>
                  <MenuItem value="Retard Météorologique">Retard Météorologique</MenuItem>
                  <MenuItem value="Retard de Circulation">Retard de Circulation</MenuItem>
                  <MenuItem value="Colis Refusé">Colis Refusé</MenuItem>
                  <MenuItem value="Autre">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Signalé par"
                value={advancedFilters.reportedBy}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, reportedBy: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Recherche dans la description"
                value={advancedFilters.searchTerm}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, searchTerm: e.target.value })}
                placeholder="Rechercher dans les descriptions d'incidents..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Créé après"
                type="date"
                value={advancedFilters.createdAfter}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, createdAfter: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Créé avant"
                type="date"
                value={advancedFilters.createdBefore}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, createdBefore: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setIsFilterModalOpen(false)}>Annuler</MDButton>
          <MDButton onClick={handleResetFilters} color="secondary">
            Réinitialiser
          </MDButton>
          <MDButton onClick={handleApplyFilters} color="info">
            Appliquer les Filtres
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Modale d'édition */}
      <EditIncidentModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        incident={selectedIncident}
        onSave={handleSaveEdit}
      />

      {/* Modale de résolution */}
      <ResolveIncidentModal
        open={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        incident={selectedIncident}
        onResolve={handleResolve}
      />
    </DashboardLayout>
  )
}

export default IncidentTable
