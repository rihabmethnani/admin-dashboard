"use client"

import React from "react"
import { Menu, MenuItem, Typography, Box, IconButton, Divider, Button } from "@mui/material"
import { Person as PersonIcon, Check as CheckIcon, Close as CloseIcon } from "@mui/icons-material"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { useNavigate } from "react-router-dom" // Import nécessaire

const NotificationMenu = ({ anchorEl, open, onClose, notifications, unreadCount, onMarkAsRead, onMarkAllAsRead }) => {
  const navigate = useNavigate() // Hook pour la navigation

  const formatDate = (dateString) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: fr,
    })
  }

  // Fonction pour gérer la redirection vers la table des partenaires
  const handlePartnerValidation = (partnerId) => {
    // Fermer le menu de notification
    onClose()

    // Naviguer vers la page des partenaires
    navigate("/partners", {
      state: {
        highlightPartnerId: partnerId,
        scrollToPartner: true,
      },
    })
  }

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        elevation: 3,
        sx: {
          width: 450,
          maxHeight: 500,
          overflow: "hidden",
          borderRadius: 2,
          border: "2px solid #ffa726", // Bordure orange
          boxShadow: "0 8px 32px rgba(255, 167, 38, 0.15)", // Ombre orange subtile
        },
      }}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      {/* Header avec thème orange */}
      <Box
        sx={{
          p: 2.5,
          background: "white", // Dégradé orange
          borderBottom: "1px solid #ff9800",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: "white", fontSize: "1.1rem" }}>
          Notifications
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={onMarkAllAsRead}
              sx={{
                textTransform: "none",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: 500,
                minWidth: "auto",
                p: 0,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 1,
                px: 1.5,
                py: 0.5,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                },
              }}
            >
              Tout marquer comme lu
            </Button>
          )}
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: "white",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Liste des notifications */}
      <Box sx={{ maxHeight: 420, overflow: "auto" }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="textSecondary" variant="body2">
              Aucune notification
            </Typography>
          </Box>
        ) : (
          notifications.slice(0, 10).map((notification, index) => (
            <React.Fragment key={notification._id}>
              <MenuItem
                sx={{
                  p: 2.5,
                  backgroundColor: notification.read ? "transparent" : "#fff3e0", // Orange très clair pour non lues
                  "&:hover": {
                    backgroundColor: notification.read ? "#f5f5f5" : "#ffe0b2", // Orange clair au hover
                  },
                  alignItems: "flex-start",
                  minHeight: "auto",
                  borderLeft: notification.read ? "none" : "4px solid #ffa726", // Barre orange pour non lues
                }}
                disableRipple
              >
                <Box display="flex" width="100%" gap={2.5}>
                  {/* Icône avec thème orange */}
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #ffa726 0%, #ff9800 100%)", // Dégradé orange
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: 0.5,
                      boxShadow: "0 2px 8px rgba(255, 167, 38, 0.3)", // Ombre orange
                    }}
                  >
                    <PersonIcon sx={{ color: "white", fontSize: 22 }} />
                  </Box>

                  {/* Contenu */}
                  <Box flex={1} sx={{ minWidth: 0 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: notification.read ? 500 : 600,
                          color: "#333",
                          fontSize: "0.95rem",
                          lineHeight: 1.3,
                          flex: 1,
                          mr: 2,
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#999",
                            fontSize: "0.75rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(notification.createdAt)}
                        </Typography>
                        {!notification.read && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              onMarkAsRead(notification._id)
                            }}
                            sx={{
                              width: 22,
                              height: 22,
                              color: "#ffa726", // Orange pour l'icône check
                              backgroundColor: "#fff3e0",
                              "&:hover": {
                                backgroundColor: "#ffe0b2",
                                transform: "scale(1.1)",
                              },
                              transition: "all 0.2s ease",
                            }}
                          >
                            <CheckIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "#666",
                        fontSize: "0.85rem",
                        lineHeight: 1.5,
                        mb: 1.5,
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {notification.message}
                    </Typography>

                    {/* Bouton d'action avec thème orange */}
                    {notification.payload?.eventType === "PARTNER_CREATED" && (
                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          background: "linear-gradient(135deg, #ffa726 0%, #ff9800 100%)", // Dégradé orange
                          color: "white",
                          textTransform: "none",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          borderRadius: 2,
                          px: 2.5,
                          py: 0.75,
                          boxShadow: "0 2px 8px rgba(255, 167, 38, 0.3)",
                          "&:hover": {
                            background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)", // Dégradé orange plus foncé
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 12px rgba(255, 167, 38, 0.4)",
                          },
                          transition: "all 0.2s ease",
                        }}
                        onClick={() => handlePartnerValidation(notification.payload.partnerId)}
                      >
                        Valider le partenaire
                      </Button>
                    )}
                  </Box>
                </Box>
              </MenuItem>
              {index < notifications.length - 1 && (
                <Divider sx={{ mx: 2.5, borderColor: "#ffe0b2" }} /> // Divider orange clair
              )}
            </React.Fragment>
          ))
        )}
      </Box>

      {/* Footer avec thème orange */}
      {notifications.length > 10 && (
        <>
          <Divider sx={{ borderColor: "#ffe0b2" }} />
          <MenuItem
            onClick={onClose}
            sx={{
              justifyContent: "center",
              py: 2,
              backgroundColor: "#fff8f0", // Fond orange très clair
              "&:hover": {
                backgroundColor: "#fff3e0",
              },
            }}
          >
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: "0.875rem",
                color: "#ffa726", // Texte orange
              }}
            >
              Voir toutes les notifications ({notifications.length})
            </Typography>
          </MenuItem>
        </>
      )}
    </Menu>
  )
}

export default NotificationMenu
