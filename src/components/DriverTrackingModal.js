"use client"

import { useEffect, useState, useCallback } from "react"

// Material UI components
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import Grid from "@mui/material/Grid"
import Card from "@mui/material/Card"
import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import CircularProgress from "@mui/material/CircularProgress"
import Alert from "@mui/material/Alert"
import AlertTitle from "@mui/material/AlertTitle"
import LinearProgress from "@mui/material/LinearProgress"

// Material Dashboard 2 React components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDButton from "components/MDButton"
import { adminTrackingClient } from "util/socket-client"

export default function DriverTrackingModal({ open, onClose, driverId, driverName, courseId }) {
  const [driverLocation, setDriverLocation] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [connectionError, setConnectionError] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [trackingError, setTrackingError] = useState(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)

  // Fonction pour initialiser le tracking
  const initializeTracking = useCallback(() => {
    if (!driverId) return

    setIsConnecting(true)
    setConnectionError(null)
    setTrackingError(null)
    setConnectionAttempts((prev) => prev + 1)

    console.log(`Initializing tracking for driver ${driverId}`)

    // Vérifier si le client est déjà connecté
    const status = adminTrackingClient.getConnectionStatus()
    console.log("Current connection status:", status)

    if (!status.isConnected) {
      console.log("Socket not connected, connecting...")
      adminTrackingClient.connect()
    } else {
      console.log("Socket already connected, starting tracking immediately")
      startTracking()
    }
  }, [driverId])

  // Modifier la fonction startTracking pour être plus agressive
  const startTracking = useCallback(() => {
    if (!driverId) return

    console.log(`Starting tracking for driver ${driverId}`)
    setIsTracking(true)
    setTrackingError(null)

    // S'identifier comme admin
    adminTrackingClient.identifyAsAdmin("admin-web")

    // Démarrer le tracking du driver
    const success = adminTrackingClient.trackDriver(driverId, courseId)
    if (!success) {
      setTrackingError("Impossible de démarrer le suivi du livreur")
      setIsTracking(false)
    } else {
      // Demander la position actuelle immédiatement
      adminTrackingClient.requestCurrentLocation(driverId)

      // Redemander toutes les 10 secondes si pas de position
      const intervalId = setInterval(() => {
        if (!driverLocation) {
          console.log("No location received, requesting again...")
          adminTrackingClient.requestCurrentLocation(driverId)
        } else {
          clearInterval(intervalId)
        }
      }, 10000)

      // Nettoyer l'intervalle après 1 minute
      setTimeout(() => clearInterval(intervalId), 60000)
    }
  }, [driverId, courseId])

  // Gérer les changements de connexion
  useEffect(() => {
    const handleConnectionChange = ({ connected }) => {
      console.log("Connection status changed:", connected)
      setIsConnected(connected)
      setIsConnecting(false)

      if (connected && driverId && open) {
        // Attendre un peu avant de démarrer le tracking
        setTimeout(() => {
          startTracking()
        }, 500)
      } else if (!connected) {
        setIsTracking(false)
        setDriverLocation(null)
      }
    }

    const handleConnectionError = ({ error }) => {
      console.error("Connection error:", error)
      setConnectionError(`Erreur de connexion: ${error}`)
      setIsConnecting(false)
      setIsTracking(false)
    }

    // S'abonner aux événements
    const unsubscribeChange = adminTrackingClient.onConnectionChange(handleConnectionChange)
    const unsubscribeError = adminTrackingClient.onConnectionError(handleConnectionError)

    return () => {
      unsubscribeChange()
      unsubscribeError()
    }
  }, [driverId, open, startTracking])

  // Gérer les mises à jour de position
  useEffect(() => {
    if (!driverId) return

    const handleLocationUpdate = (location) => {
      console.log("Location update received:", location)
      if (location.driverId === driverId) {
        setDriverLocation(location)
        setLastUpdate(new Date())
        setTrackingError(null)
      }
    }

    const handleCurrentLocation = (location) => {
      console.log("Current location received:", location)
      if (location.driverId === driverId) {
        setDriverLocation(location)
        setLastUpdate(new Date())
        setTrackingError(null)
      }
    }

    const handleNoLocation = (data) => {
      console.log("No location available:", data)
      if (data.driverId === driverId) {
        setTrackingError("Aucune position disponible pour ce livreur")
      }
    }

    const handleLocationError = (data) => {
      console.error("Location error:", data)
      if (data.driverId === driverId) {
        setTrackingError(`Erreur de localisation: ${data.error}`)
      }
    }

    const handleDriverStatus = (data) => {
      console.log("Driver connection status:", data)
      if (data.driverId === driverId && !data.connected) {
        setTrackingError("Le livreur n'est pas connecté à l'application mobile")
      }
    }

    // S'abonner aux événements
    const unsubscribeUpdate = adminTrackingClient.onLocationUpdate(driverId, handleLocationUpdate)
    const unsubscribeCurrent = adminTrackingClient.onCurrentLocation(handleCurrentLocation)
    const unsubscribeNoLocation = adminTrackingClient.onNoLocation(handleNoLocation)
    const unsubscribeLocationError = adminTrackingClient.onLocationError(handleLocationError)
    const unsubscribeDriverStatus = adminTrackingClient.onDriverStatus(handleDriverStatus)

    return () => {
      unsubscribeUpdate()
      unsubscribeCurrent()
      unsubscribeNoLocation()
      unsubscribeLocationError()
      unsubscribeDriverStatus()
    }
  }, [driverId])

  // Initialiser le tracking quand la modal s'ouvre
  useEffect(() => {
    if (open && driverId) {
      console.log("Modal opened, initializing tracking for driver:", driverId)
      initializeTracking()
    }

    return () => {
      if (driverId && isTracking) {
        console.log("Modal closing, stopping tracking for driver:", driverId)
        adminTrackingClient.untrackDriver(driverId)
        setIsTracking(false)
        setDriverLocation(null)
        setLastUpdate(null)
      }
    }
  }, [open, driverId, initializeTracking])

  // Fonction pour rafraîchir la connexion
  const handleRefresh = () => {
    if (driverId) {
      console.log("Refreshing connection...")
      adminTrackingClient.untrackDriver(driverId)
      setIsTracking(false)
      setDriverLocation(null)
      setLastUpdate(null)
      setTrackingError(null)

      setTimeout(() => {
        initializeTracking()
      }, 1000)
    }
  }

  // Fonction pour tester la connexion
  const handleTestConnection = async () => {
    try {
      setIsConnecting(true)
      console.log("Testing connection...")
      const result = await adminTrackingClient.testConnection()
      console.log("Connection test result:", result)
      setConnectionError(null)
    } catch (error) {
      console.error("Connection test failed:", error)
      setConnectionError(`Test de connexion échoué: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const formatLastUpdate = () => {
    if (!lastUpdate) return "Jamais"

    const now = new Date()
    const diffMs = now.getTime() - lastUpdate.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)

    if (diffSeconds < 60) {
      return `Il y a ${diffSeconds}s`
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes}min`
    } else {
      return lastUpdate.toLocaleTimeString("fr-FR")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "delivering":
        return "success"
      case "active":
        return "info"
      case "inactive":
        return "warning"
      default:
        return "default"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "delivering":
        return "En livraison"
      case "active":
        return "Actif"
      case "inactive":
        return "Inactif"
      default:
        return "Inconnu"
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <MDBox display="flex" justifyContent="space-between" alignItems="center">
          <MDBox>
            <MDTypography variant="h5" fontWeight="medium">
              Suivi en temps réel - {driverName}
            </MDTypography>
            <MDTypography variant="body2" color="text">
              Course #{courseId?.slice(-6) || "N/A"} • Driver ID: {driverId}
            </MDTypography>
          </MDBox>
          <MDBox display="flex" alignItems="center" gap={1}>
            <Chip
              label={isConnected ? "Connecté" : "Déconnecté"}
              color={isConnected ? "success" : "error"}
              size="small"
              variant="outlined"
            />
            {isTracking && <Chip label="Suivi actif" color="info" size="small" variant="outlined" />}
          </MDBox>
        </MDBox>
      </DialogTitle>

      <DialogContent>
        <MDBox>
          {/* État de la connexion */}
          {isConnecting && (
            <MDBox mb={2}>
              <LinearProgress color="info" />
              <MDTypography variant="caption" color="text" textAlign="center" display="block" mt={1}>
                Connexion en cours... Tentative {connectionAttempts}
              </MDTypography>
            </MDBox>
          )}

          {/* Informations de connexion et erreurs */}
          {connectionError && (
            <MDBox mb={2}>
              <Alert severity="error">
                <AlertTitle>Erreur de connexion</AlertTitle>
                {connectionError}
                <MDBox mt={1} display="flex" gap={1}>
                  <MDButton size="small" color="error" variant="outlined" onClick={handleTestConnection}>
                    Tester la connexion
                  </MDButton>
                  <MDButton size="small" color="warning" variant="outlined" onClick={handleRefresh}>
                    Reconnecter
                  </MDButton>
                </MDBox>
              </Alert>
            </MDBox>
          )}

          {/* Erreur de tracking */}
          {trackingError && !connectionError && (
            <MDBox mb={2}>
              <Alert severity="warning">
                <AlertTitle>Problème de suivi</AlertTitle>
                {trackingError}
                <MDBox mt={1}>
                  <MDButton size="small" color="warning" variant="outlined" onClick={handleRefresh}>
                    Réessayer
                  </MDButton>
                </MDBox>
              </Alert>
            </MDBox>
          )}

          {/* Informations de connexion */}
          <MDBox mb={2}>
            <Card>
              <MDBox p={2} bgcolor="info.main" color="white">
                <MDTypography variant="subtitle2" fontWeight="medium">
                  Configuration WebSocket
                </MDTypography>
                <MDTypography variant="caption">
                  URL: {adminTrackingClient.getConnectionStatus().serverUrl}
                </MDTypography>
                <br />
                <MDTypography variant="caption">Namespace: /tracking</MDTypography>
                <br />
                <MDTypography variant="caption">
                  Transport: {adminTrackingClient.getConnectionStatus().transport || "N/A"}
                </MDTypography>
              </MDBox>
            </Card>
          </MDBox>

          {/* Informations de localisation */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <MDBox p={3}>
                  <MDTypography variant="h6" mb={2}>
                    Informations de Position
                  </MDTypography>

                  {driverLocation ? (
                    <MDBox>
                      <MDBox display="flex" justifyContent="space-between" mb={1}>
                        <MDTypography variant="body2" fontWeight="medium">
                          Latitude:
                        </MDTypography>
                        <MDTypography variant="body2">{driverLocation.latitude.toFixed(6)}</MDTypography>
                      </MDBox>

                      <MDBox display="flex" justifyContent="space-between" mb={1}>
                        <MDTypography variant="body2" fontWeight="medium">
                          Longitude:
                        </MDTypography>
                        <MDTypography variant="body2">{driverLocation.longitude.toFixed(6)}</MDTypography>
                      </MDBox>

                      <MDBox display="flex" justifyContent="space-between" mb={1}>
                        <MDTypography variant="body2" fontWeight="medium">
                          Statut:
                        </MDTypography>
                        <Chip
                          label={getStatusText(driverLocation.status)}
                          color={getStatusColor(driverLocation.status)}
                          size="small"
                        />
                      </MDBox>

                      {driverLocation.speed !== undefined && driverLocation.speed > 0 && (
                        <MDBox display="flex" justifyContent="space-between" mb={1}>
                          <MDTypography variant="body2" fontWeight="medium">
                            Vitesse:
                          </MDTypography>
                          <MDTypography variant="body2">{Math.round(driverLocation.speed * 3.6)} km/h</MDTypography>
                        </MDBox>
                      )}

                      {driverLocation.accuracy && (
                        <MDBox display="flex" justifyContent="space-between" mb={1}>
                          <MDTypography variant="body2" fontWeight="medium">
                            Précision:
                          </MDTypography>
                          <MDTypography variant="body2">±{Math.round(driverLocation.accuracy)}m</MDTypography>
                        </MDBox>
                      )}

                      <MDBox display="flex" justifyContent="space-between">
                        <MDTypography variant="body2" fontWeight="medium">
                          Dernière mise à jour:
                        </MDTypography>
                        <MDTypography variant="body2" color="info">
                          {formatLastUpdate()}
                        </MDTypography>
                      </MDBox>

                      {driverLocation.source && (
                        <MDBox display="flex" justifyContent="flex-end" mt={1}>
                          <Chip
                            label={driverLocation.source === "cache" ? "Cache" : "Base de données"}
                            size="small"
                            variant="outlined"
                            color="default"
                          />
                        </MDBox>
                      )}
                    </MDBox>
                  ) : (
                    <MDBox display="flex" flexDirection="column" alignItems="center" py={3}>
                      {isConnected && isTracking ? (
                        <>
                          <CircularProgress size={40} color="info" />
                          <MDTypography variant="body2" mt={2} textAlign="center">
                            En attente de la position du livreur...
                          </MDTypography>
                          <MDTypography variant="caption" color="text" textAlign="center">
                            WebSocket connecté, tracking actif
                          </MDTypography>
                        </>
                      ) : (
                        <MDTypography variant="body2" color="error" textAlign="center">
                          {!isConnected ? "Connexion WebSocket en cours..." : "Tracking non démarré"}
                        </MDTypography>
                      )}
                    </MDBox>
                  )}
                </MDBox>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <MDBox p={3}>
                  <MDTypography variant="h6" mb={2}>
                    Carte en Temps Réel
                  </MDTypography>

                  {driverLocation ? (
                    <MDBox>
                      <Box
                        component="iframe"
                        width="100%"
                        height="300px"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight="0"
                        marginWidth="0"
                        src={`https://maps.google.com/maps?q=${driverLocation.latitude},${driverLocation.longitude}&z=16&output=embed&markers=color:red%7C${driverLocation.latitude},${driverLocation.longitude}`}
                        title="Position du livreur en temps réel"
                        sx={{
                          borderRadius: 1,
                          border: "1px solid #e0e0e0",
                        }}
                      />
                      <MDBox mt={2} display="flex" justifyContent="center">
                        <MDButton
                          variant="outlined"
                          color="info"
                          size="small"
                          onClick={() => {
                            const url = `https://www.google.com/maps?q=${driverLocation.latitude},${driverLocation.longitude}&z=16`
                            window.open(url, "_blank")
                          }}
                        >
                          Ouvrir dans Google Maps
                        </MDButton>
                      </MDBox>
                    </MDBox>
                  ) : (
                    <MDBox
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      height="300px"
                      bgcolor="grey.100"
                      borderRadius={1}
                    >
                      <MDTypography variant="body2" color="text">
                        Carte non disponible
                      </MDTypography>
                    </MDBox>
                  )}
                </MDBox>
              </Card>
            </Grid>
          </Grid>

          {/* État de la connexion */}
          <MDBox mt={3}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={2}>
                  État du Service de Tracking
                </MDTypography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <MDBox textAlign="center">
                      <MDTypography variant="h4" color={isConnected ? "success" : "error"}>
                        {isConnected ? "●" : "●"}
                      </MDTypography>
                      <MDTypography variant="body2">WebSocket</MDTypography>
                      <MDTypography variant="caption" color="text">
                        Connexion
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MDBox textAlign="center">
                      <MDTypography variant="h4" color={isTracking ? "info" : "default"}>
                        {isTracking ? "🎯" : "⏸️"}
                      </MDTypography>
                      <MDTypography variant="body2">Tracking</MDTypography>
                      <MDTypography variant="caption" color="text">
                        Suivi actif
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MDBox textAlign="center">
                      <MDTypography variant="h4" color={driverLocation ? "success" : "warning"}>
                        {driverLocation ? "📍" : "❓"}
                      </MDTypography>
                      <MDTypography variant="body2">Position</MDTypography>
                      <MDTypography variant="caption" color="text">
                        GPS
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MDBox textAlign="center">
                      <MDTypography variant="h4" color={lastUpdate ? "primary" : "default"}>
                        {lastUpdate ? "⏱️" : "⌛"}
                      </MDTypography>
                      <MDTypography variant="body2">Mise à jour</MDTypography>
                      <MDTypography variant="caption" color="text">
                        {formatLastUpdate()}
                      </MDTypography>
                    </MDBox>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </MDBox>
        </MDBox>
      </DialogContent>

      <DialogActions>
        <MDButton onClick={handleTestConnection} color="warning" variant="outlined" disabled={isConnecting}>
          Tester Connexion
        </MDButton>
        <MDButton onClick={handleRefresh} color="info" variant="outlined" disabled={isConnecting}>
          Actualiser
        </MDButton>
        <MDButton onClick={onClose} color="secondary">
          Fermer
        </MDButton>
      </DialogActions>
    </Dialog>
  )
}
