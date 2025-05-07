"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, gql, useMutation } from "@apollo/client"
import {
  Card,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Chip,
} from "@mui/material"
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDButton from "components/MDButton"
import DashboardLayout from "examples/LayoutContainers/DashboardLayout"
import DashboardNavbar from "examples/Navbars/DashboardNavbar"
import Footer from "examples/Footer"
import { clientMicroservice2 } from "apolloClients/microservice2"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import LocalShippingIcon from "@mui/icons-material/LocalShipping"
import PersonIcon from "@mui/icons-material/Person"
import CommentIcon from "@mui/icons-material/Comment"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import ErrorIcon from "@mui/icons-material/Error"
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty"
import DoneAllIcon from "@mui/icons-material/DoneAll"
import { format } from "date-fns"

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

// GraphQL Queries and Mutations
const GET_INCIDENT_BY_ID = gql`
  query GetIncidentById($incidentId: String!) {
    getIncidentById(incidentId: $incidentId) {
      _id
      orderId {
        _id
        orderNumber
        clientId
        deliveryAddress
        status
      }
      reportedBy
      incidentType
      customDescription
      description
      status
      priority
      images
      comments {
        comment
        userId
        createdAt
      }
      resolvedBy
      resolvedAt
      resolutionNotes
      createdAt
      updatedAt
    }
  }
`

// Query to get client address by ID
const GET_CLIENT_ADDRESS = gql`
  query GetClientById($id: String!) {
    getClientById(id: $id) {
      _id
      address
      name
    }
  }
`

const UPDATE_INCIDENT = gql`
  mutation UpdateIncident($input: UpdateIncidentInput!) {
    updateIncident(input: $input) {
      _id
      status
      priority
      comments {
        comment
        userId
        createdAt
      }
      resolvedBy
      resolvedAt
      resolutionNotes
      updatedAt
    }
  }
`

function IncidentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isAddCommentModalOpen, setIsAddCommentModalOpen] = useState(false)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [newPriority, setNewPriority] = useState("")
  const [clientInfo, setClientInfo] = useState({ address: "Loading...", name: "Loading..." })

  // Query to get incident details
  const { loading, error, data, refetch } = useQuery(GET_INCIDENT_BY_ID, {
    variables: { incidentId: id },
    client: clientMicroservice2,
    fetchPolicy: "network-only", // Don't use cache
  })

  // Mutation to update incident
  const [updateIncidentMutation] = useMutation(UPDATE_INCIDENT, {
    client: clientMicroservice2,
    onCompleted: () => {
      refetch()
    },
  })

  // Update states when data is loaded
  useEffect(() => {
    if (data && data.getIncidentById) {
      const incident = data.getIncidentById
      setNewStatus(incident.status)
      setNewPriority(incident.priority)

      // Fetch client info if clientId is available
      if (incident.orderId?.clientId) {
        fetchClientInfo(incident.orderId.clientId)
      }
    }
  }, [data])

  // Function to fetch client info
  const fetchClientInfo = async (clientId) => {
    try {
      const { data } = await clientMicroservice2.query({
        query: GET_CLIENT_ADDRESS,
        variables: { id: clientId },
      })

      if (data?.getClientById) {
        setClientInfo({
          address: data.getClientById.address || "No address available",
          name: data.getClientById.name || "Unknown client",
        })
      }
    } catch (error) {
      console.error("Error fetching client info:", error)
      setClientInfo({ address: "Error loading address", name: "Error loading name" })
    }
  }

  // Event handlers
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert("Please enter a comment.")
      return
    }

    try {
      await updateIncidentMutation({
        variables: {
          input: {
            incidentId: id,
            comment: newComment,
          },
        },
      })

      setNewComment("")
      setIsAddCommentModalOpen(false)
      refetch()
      alert("Comment added successfully!")
    } catch (error) {
      console.error("Error adding comment:", error.message)
      alert("Failed to add comment.")
    }
  }

  const handleResolveIncident = async () => {
    if (!resolutionNotes.trim()) {
      alert("Please enter resolution notes.")
      return
    }

    try {
      await updateIncidentMutation({
        variables: {
          input: {
            incidentId: id,
            status: "RESOLVED",
            resolutionNotes: resolutionNotes,
          },
        },
      })

      setResolutionNotes("")
      setIsResolveModalOpen(false)
      refetch()
      alert("Incident resolved successfully!")
    } catch (error) {
      console.error("Error resolving incident:", error.message)
      alert("Failed to resolve incident.")
    }
  }

  const handleUpdateStatus = async () => {
    try {
      await updateIncidentMutation({
        variables: {
          input: {
            incidentId: id,
            status: newStatus,
            priority: newPriority,
          },
        },
      })

      setIsUpdateStatusModalOpen(false)
      refetch()
      alert("Status and priority updated successfully!")
    } catch (error) {
      console.error("Error updating status:", error.message)
      alert("Failed to update status.")
    }
  }

  const handleBack = () => {
    navigate("/incidents")
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  if (!data || !data.getIncidentById) return <p>Incident not found</p>

  const incident = data.getIncidentById

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return "error"
      case "IN_PROGRESS":
        return "warning"
      case "RESOLVED":
        return "success"
      case "CANCELLED":
        return "default"
      default:
        return "default"
    }
  }

  // Function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "OPEN":
        return <ErrorIcon />
      case "IN_PROGRESS":
        return <HourglassEmptyIcon />
      case "RESOLVED":
        return <DoneAllIcon />
      case "CANCELLED":
        return <CheckCircleIcon />
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MDBox mb={3} display="flex" alignItems="center">
              <MDButton color="info" variant="text" onClick={handleBack}>
                <ArrowBackIcon /> Back to list
              </MDButton>
            </MDBox>

            <Card>
              <MDBox p={3}>
                <Grid container spacing={3}>
                  {/* Header with main information */}
                  <Grid item xs={12}>
                    <MDBox display="flex" justifyContent="space-between" alignItems="center">
                      <MDBox>
                        <MDTypography variant="h5" fontWeight="medium">
                          Incident #{incident._id}
                        </MDTypography>
                        <MDTypography variant="body2" color="text">
                          Created on {format(new Date(incident.createdAt), "MM/dd/yyyy 'at' HH:mm")}
                        </MDTypography>
                      </MDBox>
                      <MDBox display="flex" gap={1}>
                        <Chip
                          icon={getStatusIcon(incident.status)}
                          label={IncidentStatus[incident.status]}
                          color={getStatusColor(incident.status)}
                          sx={{ fontWeight: "bold" }}
                        />
                        <Chip
                          label={IncidentPriority[incident.priority]}
                          color={incident.priority === "CRITICAL" ? "error" : "default"}
                          variant={incident.priority === "CRITICAL" ? "filled" : "outlined"}
                        />
                      </MDBox>
                    </MDBox>
                  </Grid>

                  {/* Order information */}
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <MDBox display="flex" alignItems="center" mb={2}>
                        <LocalShippingIcon color="info" sx={{ mr: 1 }} />
                        <MDTypography variant="h6">Order Information</MDTypography>
                      </MDBox>
                      <MDBox pl={4}>
                        <MDTypography variant="body2">
                          <strong>Order Number:</strong> {incident.orderId?.orderNumber}
                        </MDTypography>
                        <MDTypography variant="body2">
                          <strong>Client:</strong> {clientInfo.name}
                        </MDTypography>
                        <MDTypography variant="body2">
                          <strong>Address:</strong> {clientInfo.address}
                        </MDTypography>
                        <MDTypography variant="body2">
                          <strong>Order Status:</strong> {incident.orderId?.status}
                        </MDTypography>
                      </MDBox>
                    </Paper>
                  </Grid>

                  {/* Incident information */}
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <MDBox display="flex" alignItems="center" mb={2}>
                        <ErrorIcon color="warning" sx={{ mr: 1 }} />
                        <MDTypography variant="h6">Incident Details</MDTypography>
                      </MDBox>
                      <MDBox pl={4}>
                        <MDTypography variant="body2">
                          <strong>Type:</strong>{" "}
                          {incident.incidentType ? IncidentType[incident.incidentType] : incident.customDescription}
                        </MDTypography>
                        <MDTypography variant="body2">
                          <strong>Reported by:</strong> {incident.reportedBy}
                        </MDTypography>
                        {incident.resolvedBy && (
                          <>
                            <MDTypography variant="body2">
                              <strong>Resolved by:</strong> {incident.resolvedBy}
                            </MDTypography>
                            <MDTypography variant="body2">
                              <strong>Resolution date:</strong>{" "}
                              {format(new Date(incident.resolvedAt), "MM/dd/yyyy 'at' HH:mm")}
                            </MDTypography>
                          </>
                        )}
                      </MDBox>
                    </Paper>
                  </Grid>

                  {/* Incident description */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <MDTypography variant="h6" mb={2}>
                        Description
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {incident.description}
                      </MDTypography>
                    </Paper>
                  </Grid>

                  {/* Resolution notes (if resolved) */}
                  {incident.status === "RESOLVED" && incident.resolutionNotes && (
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: "rgba(76, 175, 80, 0.05)" }}>
                        <MDTypography variant="h6" mb={2} color="success">
                          Resolution Notes
                        </MDTypography>
                        <MDTypography variant="body2" color="text">
                          {incident.resolutionNotes}
                        </MDTypography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Images (if available) */}
                  {incident.images && incident.images.length > 0 && (
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <MDTypography variant="h6" mb={2}>
                          Images ({incident.images.length})
                        </MDTypography>
                        <Grid container spacing={2}>
                          {incident.images.map((image, index) => (
                            <Grid item xs={6} md={3} key={index}>
                              <img
                                src={image || "/placeholder.svg"}
                                alt={`Image ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "150px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    </Grid>
                  )}

                  {/* Comments */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <MDBox display="flex" alignItems="center">
                          <CommentIcon color="info" sx={{ mr: 1 }} />
                          <MDTypography variant="h6">Comments ({incident.comments?.length || 0})</MDTypography>
                        </MDBox>
                        {incident.status !== "RESOLVED" && (
                          <MDButton
                            variant="outlined"
                            color="info"
                            size="small"
                            onClick={() => setIsAddCommentModalOpen(true)}
                          >
                            Add Comment
                          </MDButton>
                        )}
                      </MDBox>

                      {incident.comments && incident.comments.length > 0 ? (
                        <List>
                          {incident.comments.map((comment, index) => (
                            <ListItem
                              key={index}
                              alignItems="flex-start"
                              sx={{
                                bgcolor: index % 2 === 0 ? "rgba(0, 0, 0, 0.02)" : "transparent",
                                borderRadius: "8px",
                                mb: 1,
                              }}
                            >
                              <ListItemAvatar>
                                <Avatar>
                                  <PersonIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <MDTypography variant="body2" fontWeight="bold">
                                    {comment.userId}
                                  </MDTypography>
                                }
                                secondary={
                                  <>
                                    <MDTypography variant="caption" color="text">
                                      {format(new Date(comment.createdAt), "MM/dd/yyyy 'at' HH:mm")}
                                    </MDTypography>
                                    <MDTypography variant="body2" color="text" component="div" mt={1}>
                                      {comment.comment}
                                    </MDTypography>
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <MDBox textAlign="center" py={2}>
                          <MDTypography variant="body2" color="text">
                            No comments yet.
                          </MDTypography>
                        </MDBox>
                      )}
                    </Paper>
                  </Grid>

                  {/* Actions */}
                  <Grid item xs={12}>
                    <MDBox display="flex" justifyContent="flex-end" gap={2}>
                      {incident.status !== "RESOLVED" && (
                        <>
                          <MDButton variant="outlined" color="info" onClick={() => setIsUpdateStatusModalOpen(true)}>
                            Update Status
                          </MDButton>
                          <MDButton variant="contained" color="success" onClick={() => setIsResolveModalOpen(true)}>
                            Mark as Resolved
                          </MDButton>
                        </>
                      )}
                    </MDBox>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Add Comment Modal */}
      <Dialog open={isAddCommentModalOpen} onClose={() => setIsAddCommentModalOpen(false)}>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comment"
            fullWidth
            multiline
            rows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setIsAddCommentModalOpen(false)}>Cancel</MDButton>
          <MDButton onClick={handleAddComment} color="info">
            Add
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Resolve Incident Modal */}
      <Dialog open={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)}>
        <DialogTitle>Resolve Incident</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Resolution Notes"
            fullWidth
            multiline
            rows={4}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setIsResolveModalOpen(false)}>Cancel</MDButton>
          <MDButton onClick={handleResolveIncident} color="success">
            Resolve
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog open={isUpdateStatusModalOpen} onClose={() => setIsUpdateStatusModalOpen(false)}>
        <DialogTitle>Update Status and Priority</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="OPEN">{IncidentStatus.OPEN}</MenuItem>
              <MenuItem value="IN_PROGRESS">{IncidentStatus.IN_PROGRESS}</MenuItem>
              <MenuItem value="CANCELLED">{IncidentStatus.CANCELLED}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="priority-label">Priority</InputLabel>
            <Select
              labelId="priority-label"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
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
          <MDButton onClick={() => setIsUpdateStatusModalOpen(false)}>Cancel</MDButton>
          <MDButton onClick={handleUpdateStatus} color="warning">
            Update
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  )
}

export default IncidentDetails
