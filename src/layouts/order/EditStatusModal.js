"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
} from "@mui/material"
import MDBox from "components/MDBox"
import MDButton from "components/MDButton"
import MDTypography from "components/MDTypography"
import PropTypes from "prop-types"

// This is a separate component for the Edit Status Modal
function EditStatusModal({ open, onClose, order, statuses, statusColors, onSave, isLoading = false }) {
  const [newStatus, setNewStatus] = useState("")

  // Reset status when modal opens with a different order
  useEffect(() => {
    if (order) {
      setNewStatus(order.status || "")
    }
  }, [order])

  const handleStatusChange = (event) => {
    setNewStatus(event.target.value)
  }

  const handleSave = () => {
    onSave(newStatus)
  }

  const isStatusChanged = order && newStatus !== order.status

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <MDTypography variant="h6" fontWeight="medium">
          {order ? `Modifier le statut de la commande ` : "Modifier le statut"}
        </MDTypography>
      </DialogTitle>
      <DialogContent>
        <MDBox py={2}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="status-select-label">Statut</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              value={newStatus}
              onChange={handleStatusChange}
              label="Statut"
              disabled={isLoading}
            >
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>
                  <MDBox display="flex" alignItems="center">
                    <Box
                      component="span"
                      width={12}
                      height={12}
                      borderRadius="50%"
                      bgcolor={statusColors[status] ? `${statusColors[status]}.main` : "grey.500"}
                      mr={1.5}
                    />
                    <MDTypography variant="button" fontWeight="medium" color={statusColors[status]}>
                      {status}
                    </MDTypography>
                  </MDBox>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {order && order.status !== newStatus && (
            <MDBox mt={2} p={2} bgcolor="background.neutral" borderRadius="sm">
              <MDTypography variant="caption" color="text.secondary">
                Vous allez changer le statut de{" "}
                <MDTypography component="span" variant="caption" fontWeight="bold" color={statusColors[order.status]}>
                  {order.status}
                </MDTypography>{" "}
                à{" "}
                <MDTypography component="span" variant="caption" fontWeight="bold" color={statusColors[newStatus]}>
                  {newStatus}
                </MDTypography>
              </MDTypography>
            </MDBox>
          )}
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose} color="secondary" disabled={isLoading}>
          Annuler
        </MDButton>
        <MDButton
          onClick={handleSave}
          color="success"
          disabled={isLoading || !isStatusChanged}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </MDButton>
      </DialogActions>
    </Dialog>
  )
}

EditStatusModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  order: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
  }),
  statuses: PropTypes.arrayOf(PropTypes.string).isRequired,
  statusColors: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
}

// Make sure to use a default export
export default EditStatusModal
