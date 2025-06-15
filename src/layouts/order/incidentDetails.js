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
import { fr } from "date-fns/locale"
import { clientMicroservice1 } from "apolloClients/microservice1"
import { getStatusKey, getPriorityKey, IncidentStatus, IncidentPriority } from "./enum-utils"

// Requêtes et mutations GraphQL
const GET_INCIDENT_BY_ID = gql`
  query GetIncidentById($incidentId: String!) {
    getIncidentById(incidentId: $incidentId) {
      _id
      orderId
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
  const [orderInfo, setOrderInfo] = useState({
    clientId: null,
    status: "Chargement...",
    amount: 0,
    description: "Chargement...",
  })
  const [clientInfo, setClientInfo] = useState({
    address: "Chargement...",
    name: "Chargement...",
    phone: "Chargement...",
  })

  // Requête pour obtenir les détails de l'incident
  const { loading, error, data, refetch } = useQuery(GET_INCIDENT_BY_ID, {
    variables: { incidentId: id },
    client: clientMicroservice2,
    fetchPolicy: "network-only",
  })

  const { loading: orderLoading, data: orderData } = useQuery(GET_ORDER_BY_ID, {
    variables: { id: data?.getIncidentById?.orderId },
    client: clientMicroservice1,
    skip: !data?.getIncidentById?.orderId,
  })

  const { loading: clientLoading, data: clientData } = useQuery(GET_USER_BY_ID, {
    variables: { id: orderInfo.clientId },
    client: clientMicroservice1,
    skip: !orderInfo.clientId,
  })

  // Mutation pour mettre à jour l'incident
  const [updateIncidentMutation] = useMutation(UPDATE_INCIDENT, {
    client: clientMicroservice2,
    onCompleted: () => {
      refetch()
    },
  })

  // Mettre à jour les états lorsque les données sont chargées
  useEffect(() => {
    if (data && data.getIncidentById) {
      const incident = data.getIncidentById
      setNewStatus(incident.status)
      setNewPriority(incident.priority)
    }
  }, [data])

  useEffect(() => {
    if (orderData?.order) {
      setOrderInfo({
        clientId: orderData.order.clientId,
        status: orderData.order.status,
        amount: orderData.order.amount,
        description: orderData.order.description,
      })
    }
  }, [orderData])

  useEffect(() => {
    if (clientData?.getUserById) {
      setClientInfo({
        address: clientData.getUserById.address || "Aucune adresse disponible",
        name: clientData.getUserById.name || "Client inconnu",
        phone: clientData.getUserById.phone || "Aucun téléphone",
      })
    }
  }, [clientData])

  // Gestionnaires d'événements
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert("Veuillez saisir un commentaire.")
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
      alert("Commentaire ajouté avec succès !")
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error.message)
      alert("Échec de l'ajout du commentaire: " + error.message)
    }
  }

  const handleResolveIncident = async () => {
    if (!resolutionNotes.trim()) {
      alert("Veuillez saisir des notes de résolution.")
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
      alert("Incident résolu avec succès !")
    } catch (error) {
      console.error("Erreur lors de la résolution de l'incident:", error.message)
      alert("Échec de la résolution de l'incident: " + error.message)
    }
  }

  const handleUpdateStatus = async () => {
    try {
      await updateIncidentMutation({
        variables: {
          input: {
            incidentId: id,
            status: getStatusKey(newStatus),
            priority: getPriorityKey(newPriority),
          },
        },
      })

      setIsUpdateStatusModalOpen(false)
      refetch()
      alert("Statut et priorité mis à jour avec succès !")
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error.message)
      alert("Échec de la mise à jour du statut: " + error.message)
    }
  }

  const handleBack = () => {
    navigate("/incidents")
  }

  if (loading)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <MDTypography variant="h5">Chargement...</MDTypography>
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

  if (!data || !data.getIncidentById)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <MDTypography variant="h5">Incident non trouvé</MDTypography>
        </MDBox>
      </DashboardLayout>
    )

  const incident = data.getIncidentById

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case IncidentStatus.OPEN:
        return "error"
      case IncidentStatus.IN_PROGRESS:
        return "warning"
      case IncidentStatus.RESOLVED:
        return "success"
      case IncidentStatus.CANCELLED:
        return "default"
      default:
        return "default"
    }
  }

  // Fonction pour obtenir l'icône du statut
  const getStatusIcon = (status) => {
    switch (status) {
      case IncidentStatus.OPEN:
        return <ErrorIcon />
      case IncidentStatus.IN_PROGRESS:
        return <HourglassEmptyIcon />
      case IncidentStatus.RESOLVED:
        return <DoneAllIcon />
      case IncidentStatus.CANCELLED:
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
                <ArrowBackIcon /> Retour à la liste
              </MDButton>
            </MDBox>

            <Card>
              <MDBox p={3}>
                <Grid container spacing={3}>
                  {/* En-tête avec les informations principales */}
                  <Grid item xs={12}>
                    <MDBox display="flex" justifyContent="space-between" alignItems="center">
                      <MDBox>
                        <MDTypography variant="h5" fontWeight="medium">
                          Incident #{incident._id}
                        </MDTypography>
                        <MDTypography variant="body2" color="text">
                          Créé le {format(new Date(incident.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                        </MDTypography>
                      </MDBox>
                      <MDBox display="flex" gap={1}>
                        <Chip
                          icon={getStatusIcon(incident.status)}
                          label={incident.status}
                          color={getStatusColor(incident.status)}
                          sx={{ fontWeight: "bold" }}
                        />
                        <Chip
                          label={incident.priority}
                          color={incident.priority === IncidentPriority.CRITICAL ? "error" : "default"}
                          variant={incident.priority === IncidentPriority.CRITICAL ? "filled" : "outlined"}
                        />
                      </MDBox>
                    </MDBox>
                  </Grid>

                  {/* Informations de la commande */}
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <MDBox display="flex" alignItems="center" mb={2}>
                        <LocalShippingIcon color="info" sx={{ mr: 1 }} />
                        <MDTypography variant="h6">Informations de la Commande</MDTypography>
                      </MDBox>
                      <MDBox pl={4}>
                        <MDTypography variant="body2">
                          <strong>ID de Commande :</strong> {incident.orderId}
                        </MDTypography>
                        <MDTypography variant="body2">
                          <strong>Client :</strong> {clientInfo.name}
                        </MDTypography>
                        <MDTypography variant="body2">
                          <strong>Téléphone :</strong> {clientInfo.phone}
                        </MDTypography>
                        <MDTypography variant="body2">
                          <strong>Adresse :</strong> {clientInfo.address}
                        </MDTypography>
                        <MDTypography variant="body2">
                          <strong>Montant :</strong> {orderInfo.amount} €
                        </MDTypography>
                        <MDTypography variant="body2">
                          <strong>Statut de la Commande :</strong> {orderInfo.status}
                        </MDTypography>
                      </MDBox>
                    </Paper>
                  </Grid>

                  {/* Informations de l'incident */}
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <MDBox display="flex" alignItems="center" mb={2}>
                        <ErrorIcon color="warning" sx={{ mr: 1 }} />
                        <MDTypography variant="h6">Détails de l&apos;Incident</MDTypography>
                      </MDBox>
                      <MDBox pl={4}>
                        <MDTypography variant="body2">
                          <strong>Type :</strong> {incident.incidentType || incident.customDescription}
                        </MDTypography>
                        <MDTypography variant="body2">
                          <strong>Signalé par :</strong> {incident.reportedBy}
                        </MDTypography>
                        {incident.resolvedBy && (
                          <>
                            <MDTypography variant="body2">
                              <strong>Résolu par :</strong> {incident.resolvedBy}
                            </MDTypography>
                            <MDTypography variant="body2">
                              <strong>Date de résolution :</strong>{" "}
                              {format(new Date(incident.resolvedAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                            </MDTypography>
                          </>
                        )}
                      </MDBox>
                    </Paper>
                  </Grid>

                  {/* Description de l'incident */}
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

                  {/* Notes de résolution (si résolu) */}
                  {incident.status === IncidentStatus.RESOLVED && incident.resolutionNotes && (
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: "rgba(76, 175, 80, 0.05)" }}>
                        <MDTypography variant="h6" mb={2} color="success">
                          Notes de Résolution
                        </MDTypography>
                        <MDTypography variant="body2" color="text">
                          {incident.resolutionNotes}
                        </MDTypography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Images (si disponibles) */}
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
                                src={image || "/placeholder.svg?height=150&width=200"}
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

                  {/* Commentaires */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <MDBox display="flex" alignItems="center">
                          <CommentIcon color="info" sx={{ mr: 1 }} />
                          <MDTypography variant="h6">Commentaires ({incident.comments?.length || 0})</MDTypography>
                        </MDBox>
                        {incident.status !== IncidentStatus.RESOLVED && (
                          <MDButton
                            variant="outlined"
                            color="info"
                            size="small"
                            onClick={() => setIsAddCommentModalOpen(true)}
                          >
                            Ajouter un Commentaire
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
                                      {format(new Date(comment.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
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
                            Aucun commentaire pour le moment.
                          </MDTypography>
                        </MDBox>
                      )}
                    </Paper>
                  </Grid>

                  {/* Actions */}
                  <Grid item xs={12}>
                    <MDBox display="flex" justifyContent="flex-end" gap={2}>
                      {incident.status !== IncidentStatus.RESOLVED && (
                        <>
                          <MDButton variant="outlined" color="info" onClick={() => setIsUpdateStatusModalOpen(true)}>
                            Mettre à Jour le Statut
                          </MDButton>
                          <MDButton variant="contained" color="success" onClick={() => setIsResolveModalOpen(true)}>
                            Marquer comme Résolu
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

      {/* Modale d'ajout de commentaire */}
      <Dialog open={isAddCommentModalOpen} onClose={() => setIsAddCommentModalOpen(false)}>
        <DialogTitle>Ajouter un Commentaire</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Commentaire"
            fullWidth
            multiline
            rows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setIsAddCommentModalOpen(false)}>Annuler</MDButton>
          <MDButton onClick={handleAddComment} color="info">
            Ajouter
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Modale de résolution d'incident */}
      <Dialog open={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)}>
        <DialogTitle>Résoudre l&apos;Incident</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notes de Résolution"
            fullWidth
            multiline
            rows={4}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setIsResolveModalOpen(false)}>Annuler</MDButton>
          <MDButton onClick={handleResolveIncident} color="success">
            Résoudre
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Modale de mise à jour du statut */}
      <Dialog open={isUpdateStatusModalOpen} onClose={() => setIsUpdateStatusModalOpen(false)}>
        <DialogTitle>Mettre à Jour le Statut et la Priorité</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Statut</InputLabel>
            <Select
              labelId="status-label"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Statut"
            >
              <MenuItem value={IncidentStatus.OPEN}>Ouvert</MenuItem>
              <MenuItem value={IncidentStatus.IN_PROGRESS}>En Cours</MenuItem>
              <MenuItem value={IncidentStatus.CANCELLED}>Annulé</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="priority-label">Priorité</InputLabel>
            <Select
              labelId="priority-label"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              label="Priorité"
            >
              <MenuItem value={IncidentPriority.LOW}>Faible</MenuItem>
              <MenuItem value={IncidentPriority.MEDIUM}>Moyenne</MenuItem>
              <MenuItem value={IncidentPriority.HIGH}>Élevée</MenuItem>
              <MenuItem value={IncidentPriority.CRITICAL}>Critique</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setIsUpdateStatusModalOpen(false)}>Annuler</MDButton>
          <MDButton onClick={handleUpdateStatus} color="warning">
            Mettre à Jour
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  )
}

export default IncidentDetails
