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
import VisibilityIcon from "@mui/icons-material/Visibility"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import ErrorIcon from "@mui/icons-material/Error"
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty"
import DoneAllIcon from "@mui/icons-material/DoneAll"
import { useMaterialUIController } from "context"
import { clientMicroservice1 } from "apolloClients/microservice1"
import LocalShippingIcon from "@mui/icons-material/LocalShipping"
import { format } from "date-fns"
import { clientMicroservice2 } from "apolloClients/microservice2"
import { useNavigate } from "react-router-dom"

// Enums for incidents
const IncidentStatus = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CANCELLED: "Cancelled",
}

const IncidentPriority = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
}

const IncidentType = {
  DAMAGED_PACKAGE: "Damaged Package",
  INCORRECT_ADDRESS: "Incorrect Address",
  CUSTOMER_NOT_FOUND: "Customer Not Found",
  LOST_PACKAGE: "Lost Package",
  WEATHER_DELAY: "Weather Delay",
  TRAFFIC_DELAY: "Traffic Delay",
  REFUSED_PACKAGE: "Refused Package",
  OTHER: "Other",
}

// GraphQL Queries
const GET_ALL_INCIDENTS = gql`
  query GetAll {
    getAll {
      _id
      orderId {
        _id
        clientId
      }
      description
      status
      incidentType
      priority
      createdAt
    }
  }
`

const GET_CLIENT_ADDRESS = gql`
  query GetUserById($id: String!) {
    getUserById(id: $id) {
      _id
      address
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
      resolvedAt
    }
  }
`

function IncidentInfo({ clientId, incidentType, description }) {
    const [address, setAddress] = useState("Loading address...")
    const { loading, error, data } = useQuery(GET_CLIENT_ADDRESS, {
      variables: { id: clientId },
      client: clientMicroservice1, // Utilisez le bon client
      skip: !clientId,
    })
  
    useEffect(() => {
      if (data?.GetUserById) {
        setAddress(data.GetUserById.address || "No address available")
      }
    }, [data])

    if (loading) return "Loading address..."
    if (error) return "Error loading address"
  
    return (
      <MDBox display="flex" flexDirection="column">
        <MDBox display="flex" alignItems="center">
          <LocalShippingIcon fontSize="small" color="info" sx={{ mr: 0.5 }} />
          <MDTypography variant="button" fontWeight="medium">
            {address}
          </MDTypography>
        </MDBox>
        <MDTypography variant="caption" fontWeight="bold" color="dark">
          {IncidentType[incidentType] || description || "N/A"}
        </MDTypography>
      </MDBox>
    )
  }

IncidentInfo.propTypes = {
  clientId: PropTypes.string,
  incidentType: PropTypes.string,
  description: PropTypes.string,
}

function StatusChip({ status }) {
  let color = "default"
  let icon = null

  switch (status) {
    case "OPEN":
      color = "error"
      icon = <ErrorIcon fontSize="small" />
      break
    case "IN_PROGRESS":
      color = "warning"
      icon = <HourglassEmptyIcon fontSize="small" />
      break
    case "RESOLVED":
      color = "success"
      icon = <DoneAllIcon fontSize="small" />
      break
    case "CANCELLED":
      color = "default"
      icon = <CheckCircleIcon fontSize="small" />
      break
    default:
      color = "default"
  }

  return (
    <Chip icon={icon} label={IncidentStatus[status] || status} color={color} size="small" sx={{ fontWeight: "bold" }} />
  )
}

StatusChip.propTypes = {
  status: PropTypes.string.isRequired,
}

function PriorityChip({ priority }) {
  let color = "default"

  switch (priority) {
    case "LOW":
      color = "info"
      break
    case "MEDIUM":
      color = "warning"
      break
    case "HIGH":
      color = "error"
      break
    case "CRITICAL":
      color = "error"
      break
    default:
      color = "default"
  }

  return (
    <Chip
      label={IncidentPriority[priority] || priority}
      color={color}
      size="small"
      variant={priority === "CRITICAL" ? "filled" : "outlined"}
      sx={{ fontWeight: priority === "CRITICAL" ? "bold" : "medium" }}
    />
  )
}

PriorityChip.propTypes = {
  priority: PropTypes.string.isRequired,
}

// Edit Incident Modal
function EditIncidentModal({ open, onClose, incident, onSave }) {
  const [formData, setFormData] = useState({
    status: "",
    priority: "",
  })

  useEffect(() => {
    if (incident) {
      setFormData({
        status: incident.status || "",
        priority: incident.priority || "",
      })
    }
  }, [incident])

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Incident</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            label="Status"
          >
            <MenuItem value="OPEN">{IncidentStatus.OPEN}</MenuItem>
            <MenuItem value="IN_PROGRESS">{IncidentStatus.IN_PROGRESS}</MenuItem>
            <MenuItem value="RESOLVED">{IncidentStatus.RESOLVED}</MenuItem>
            <MenuItem value="CANCELLED">{IncidentStatus.CANCELLED}</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel id="priority-label">Priority</InputLabel>
          <Select
            labelId="priority-label"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            label="Priority"
          >
            <MenuItem value="LOW">{IncidentPriority.LOW}</MenuItem>
            <MenuItem value="MEDIUM">{IncidentPriority.MEDIUM}</MenuItem>
            <MenuItem value="HIGH">{IncidentPriority.HIGH}</MenuItem>
            <MenuItem value="CRITICAL">{IncidentPriority.CRITICAL}</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose}>Cancel</MDButton>
        <MDButton onClick={handleSave} color="info">
          Save
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

// Resolution Modal
function ResolveIncidentModal({ open, onClose, incident, onResolve }) {
  const [notes, setNotes] = useState("")

  const handleResolve = () => {
    onResolve(notes)
    setNotes("")
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Resolve Incident</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Resolution Notes"
          fullWidth
          multiline
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose}>Cancel</MDButton>
        <MDButton onClick={handleResolve} color="success">
          Resolve
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

// Main Component
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

  // Queries
  const { loading, error, data, refetch } = useQuery(GET_ALL_INCIDENTS, {
    client: clientMicroservice2,
    fetchPolicy: "network-only", // Don't use cache
  })

  const { data: statsData } = useQuery(GET_INCIDENT_STATS, {
    client: clientMicroservice2,
    fetchPolicy: "network-only", // Don't use cache
  })

  const [updateIncident] = useMutation(UPDATE_INCIDENT, {
    client: clientMicroservice2,
    onCompleted: () => {
      refetch()
    },
  })

  // Effects
  useEffect(() => {
    if (data?.getAll) {
      const allIncidents = data.getAll

      // Apply filtering in JavaScript instead of GraphQL
      const filteredIncidents = statusFilter
        ? allIncidents.filter((incident) => incident.status === statusFilter)
        : allIncidents

      const transformedData = filteredIncidents.map((incident, index) => ({
        id: index + 1,
        incidentInfo: (
          <IncidentInfo
            clientId={incident.orderId?.clientId}
            incidentType={incident.incidentType}
            description={incident.description}
          />
        ),
        status: <StatusChip status={incident.status} />,
        priority: <PriorityChip priority={incident.priority} />,
        description: incident.description,
        createdAt: format(new Date(incident.createdAt), "dd/MM/yyyy HH:mm"),
        action: (
          <MDBox display="flex" gap={1}>
           
            <Tooltip title="Edit">
              <IconButton color="warning" size="small" onClick={() => handleEdit(incident)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {incident.status !== "RESOLVED" && (
              <Tooltip title="Mark as Resolved">
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
  }, [data, statusFilter]) // Add statusFilter as a dependency

  useEffect(() => {
    if (statsData?.getIncidentStats) {
      setStats(statsData.getIncidentStats)
    }
  }, [statsData])

  // Handlers
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    switch (newValue) {
      case 0:
        setStatusFilter("")
        break
      case 1:
        setStatusFilter("OPEN")
        break
      case 2:
        setStatusFilter("IN_PROGRESS")
        break
      case 3:
        setStatusFilter("RESOLVED")
        break
      default:
        setStatusFilter("")
    }
    refetch()
  }


  const handleEdit = (incident) => {
    setSelectedIncident(incident)
    setIsEditModalOpen(true)
  }

  const handleResolveClick = (incident) => {
    setSelectedIncident(incident)
    setIsResolveModalOpen(true)
  }

  const handleSaveEdit = async (formData) => {
    try {
      await updateIncident({
        variables: {
          input: {
            incidentId: selectedIncident._id,
            status: formData.status,
            priority: formData.priority,
          },
        },
      })
      refetch()
    } catch (err) {
      console.error("Error updating incident:", err)
      alert("Failed to update incident")
    }
  }

  const handleResolve = async (notes) => {
    try {
      await updateIncident({
        variables: {
          input: {
            incidentId: selectedIncident._id,
            status: "RESOLVED",
            resolutionNotes: notes,
          },
        },
      })
      refetch()
    } catch (err) {
      console.error("Error resolving incident:", err)
      alert("Failed to resolve incident")
    }
  }

  // Table columns
  const columns = [
    { Header: "ID", accessor: "id", align: "center" },
    { Header: "Client Address / Incident", accessor: "incidentInfo", width: "25%", align: "left" },
    { Header: "Status", accessor: "status", align: "center" },
    { Header: "Priority", accessor: "priority", align: "center" },
    { Header: "Description", accessor: "description", align: "left" },
    { Header: "Date", accessor: "createdAt", align: "center" },
    { Header: "Actions", accessor: "action", align: "center" },
  ]

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        {/* Stats Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={2} textAlign="center">
                <MDTypography variant="h6">Total Incidents</MDTypography>
                <MDTypography variant="h3">{stats.totalIncidents}</MDTypography>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={2} textAlign="center" bgcolor="rgba(255,0,0,0.05)">
                <MDTypography variant="h6" color="error">
                  Open
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
                  In Progress
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
                  Resolved
                </MDTypography>
                <MDTypography variant="h3" color="success">
                  {stats.resolvedIncidents}
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <MDBox p={3}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable">
              <Tab label="All" />
              <Tab
                label={
                  <Box display="flex" alignItems="center">
                    <ErrorIcon sx={{ mr: 0.5 }} /> Open
                  </Box>
                }
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center">
                    <HourglassEmptyIcon sx={{ mr: 0.5 }} /> In Progress
                  </Box>
                }
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center">
                    <DoneAllIcon sx={{ mr: 0.5 }} /> Resolved
                  </Box>
                }
              />
            </Tabs>

            <DataTable
              table={{ columns, rows: incidents }}
              isSorted={false}
              entriesPerPage={{ defaultValue: 10 }}
              showTotalEntries
              noEndBorder
            />
          </MDBox>
        </Card>
      </MDBox>

      {/* Edit Modal */}
      <EditIncidentModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        incident={selectedIncident}
        onSave={handleSaveEdit}
      />

      {/* Resolve Modal */}
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
