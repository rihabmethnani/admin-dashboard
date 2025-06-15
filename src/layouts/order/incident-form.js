"use client"

import { useState } from "react"
import { useMutation, gql } from "@apollo/client"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material"
import MDButton from "components/MDButton"
import MDBox from "components/MDBox"
import { IncidentPriority, IncidentType, validateEnumValue } from "./enum-utils"
import { clientMicroservice2 } from "apolloClients/microservice2"

const CREATE_INCIDENT = gql`
  mutation CreateIncident($input: CreateIncidentInput!) {
    createIncident(input: $input) {
      _id
      status
      priority
      incidentType
      description
      reportedBy
      createdAt
    }
  }
`

function IncidentForm({ open, onClose, orderId, onSuccess }) {
  const [formData, setFormData] = useState({
    orderId: orderId || "",
    reportedBy: "",
    incidentType: IncidentType.OTHER,
    description: "",
    customDescription: "",
    priority: IncidentPriority.MEDIUM,
  })

  const [createIncident, { loading }] = useMutation(CREATE_INCIDENT, {
    client: clientMicroservice2,
    onCompleted: (data) => {
      onSuccess && onSuccess(data.createIncident)
      onClose()
    },
    onError: (error) => {
      console.error("Erreur lors de la création de l'incident:", error)
      alert(`Erreur: ${error.message}`)
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    // Validation des données
    if (!formData.reportedBy.trim()) {
      alert("Veuillez indiquer qui signale l'incident")
      return
    }

    if (!formData.description.trim()) {
      alert("Veuillez fournir une description de l'incident")
      return
    }

    if (!formData.orderId) {
      alert("L'ID de la commande est requis")
      return
    }

    // Validation des énumérations avant envoi
    const validatedInput = {
      orderId: formData.orderId,
      reportedBy: formData.reportedBy.trim(),
      incidentType: validateEnumValue(IncidentType, formData.incidentType),
      description: formData.description.trim(),
      customDescription: formData.customDescription?.trim() || undefined,
      priority: validateEnumValue(IncidentPriority, formData.priority),
      images: formData.images || [],
    }

    createIncident({
      variables: {
        input: validatedInput,
      },
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Signaler un nouvel incident</DialogTitle>
      <DialogContent>
        <MDBox p={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="reportedBy"
                label="Signalé par"
                value={formData.reportedBy}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="priority-label">Priorité</InputLabel>
                <Select
                  labelId="priority-label"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Priorité"
                >
                  {Object.entries(IncidentPriority).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="incident-type-label">Type d'incident</InputLabel>
                <Select
                  labelId="incident-type-label"
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={handleChange}
                  label="Type d'incident"
                >
                  {Object.entries(IncidentType).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {formData.incidentType === IncidentType.OTHER && (
              <Grid item xs={12}>
                <TextField
                  name="customDescription"
                  label="Description personnalisée du type d'incident"
                  value={formData.customDescription}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description détaillée"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                margin="normal"
                required
              />
            </Grid>
          </Grid>
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose}>Annuler</MDButton>
        <MDButton onClick={handleSubmit} color="info" disabled={loading}>
          {loading ? "Création en cours..." : "Créer l'incident"}
        </MDButton>
      </DialogActions>
    </Dialog>
  )
}

export default IncidentForm
