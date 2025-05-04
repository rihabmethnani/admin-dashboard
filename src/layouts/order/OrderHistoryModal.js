"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material"
import MDBox from "components/MDBox"
import MDButton from "components/MDButton"
import MDTypography from "components/MDTypography"
import DataTable from "examples/Tables/DataTable"
import { gql } from "@apollo/client"
import { clientMicroservice1 } from "apolloClients/microservice1"
import PropTypes from "prop-types"

// Query to get user details
const GET_USER_BY_ID = gql`
  query GetUserById($id: String!) {
    getUserById(id: $id) {
      _id
      name
    }
  }
`

function OrderHistoryModal({ open, onClose, orderId, orderNumber, historyData }) {
  const [processedHistory, setProcessedHistory] = useState([])
  const [usersCache, setUsersCache] = useState({})

  // Fetch user names for all IDs in history
  useEffect(() => {
    if (!historyData || historyData.length === 0) return

    const fetchUserNames = async () => {
      // Collect all unique user IDs from history
      const userIds = new Set()
      historyData.forEach((item) => {
        if (item.adminId) userIds.add(item.adminId)
        if (item.assisatnAdminId) userIds.add(item.assisatnAdminId)
        if (item.partnerId) userIds.add(item.partnerId)
        if (item.driverId) userIds.add(item.driverId)
      })

      // Fetch user names for IDs not in cache
      const newUserIds = Array.from(userIds).filter((id) => !usersCache[id])

      if (newUserIds.length > 0) {
        const userPromises = newUserIds.map(async (userId) => {
          try {
            const { data } = await clientMicroservice1.query({
              query: GET_USER_BY_ID,
              variables: { id: userId },
            })
            return { id: userId, name: data.getUserById.name }
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error)
            return { id: userId, name: "Unknown User" }
          }
        })

        const userResults = await Promise.all(userPromises)
        const newUsersCache = {}
        userResults.forEach((user) => {
          newUsersCache[user.id] = user.name
        })

        setUsersCache((prev) => ({ ...prev, ...newUsersCache }))
      }
    }

    fetchUserNames()
  }, [historyData, usersCache])

  // Process history data with user names
  useEffect(() => {
    if (!historyData) return

    const processed = historyData.map((item) => {
      // Determine responsible user
      let responsibleName = "System"
      let responsibleRole = ""

      if (item.adminId && usersCache[item.adminId]) {
        responsibleName = usersCache[item.adminId]
        responsibleRole = "Admin"
      } else if (item.assisatnAdminId && usersCache[item.assisatnAdminId]) {
        responsibleName = usersCache[item.assisatnAdminId]
        responsibleRole = "Assistant"
      } else if (item.partnerId && usersCache[item.partnerId]) {
        responsibleName = usersCache[item.partnerId]
        responsibleRole = "Partner"
      } else if (item.driverId && usersCache[item.driverId]) {
        responsibleName = usersCache[item.driverId]
        responsibleRole = "Driver"
      }

      // Format date and time
      const date = new Date(item.timestamp)
      const formattedDate = date.toLocaleDateString()
      const formattedTime = date.toLocaleTimeString()

      return {
        ...item,
        formattedDate,
        formattedTime,
        responsibleName,
        responsibleRole,
      }
    })

    setProcessedHistory(processed)
  }, [historyData, usersCache])

  const columns = [
    {
      Header: "Date",
      accessor: "formattedDate",
      width: "100px",
    },
    {
      Header: "Heure",
      accessor: "formattedTime",
      width: "100px",
    },
    {
      Header: "Événement",
      accessor: "event",
    },
    {
      Header: "Ancien statut",
      accessor: "etatPrecedent",
      // eslint-disable-next-line react/prop-types
      Cell: ({ value }) =>
        value ? (
          <MDTypography variant="caption" fontWeight="medium">
            {value}
          </MDTypography>
        ) : (
          <MDTypography variant="caption" color="text" fontWeight="light" fontStyle="italic">
            N/A
          </MDTypography>
        ),
    },
    {
      Header: "Responsable",
      accessor: "responsibleName",
      // eslint-disable-next-line react/prop-types
      Cell: ({ row }) => (
        <MDTypography variant="caption" fontWeight="medium">
          {row.original.responsibleName}
          {row.original.responsibleRole && (
            <MDTypography variant="caption" color="text" fontWeight="light" component="span">
              {` (${row.original.responsibleRole})`}
            </MDTypography>
          )}
        </MDTypography>
      ),
    },
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <MDTypography variant="h6" fontWeight="medium">
          Historique de la commande #{orderNumber}
        </MDTypography>
      </DialogTitle>
      <DialogContent>
        <MDBox py={2}>
          {processedHistory.length > 0 ? (
            <DataTable
              table={{
                columns,
                rows: processedHistory,
              }}
              noEndBorder
              entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
              canSearch
            />
          ) : (
            <MDBox textAlign="center" py={3}>
              <MDTypography variant="body2" color="text">
                Aucun historique disponible pour cette commande
              </MDTypography>
            </MDBox>
          )}
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose} color="secondary">
          Fermer
        </MDButton>
      </DialogActions>
    </Dialog>
  )
}

// Add PropTypes validation
OrderHistoryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  orderId: PropTypes.string,
  orderNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  historyData: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      event: PropTypes.string,
      etatPrecedent: PropTypes.string,
      timestamp: PropTypes.string,
      adminId: PropTypes.string,
      assisatnAdminId: PropTypes.string,
      driverId: PropTypes.string,
      partnerId: PropTypes.string,
    }),
  ),
}

// Add default props
OrderHistoryModal.defaultProps = {
  orderId: "",
  orderNumber: "",
  historyData: [],
}

export default OrderHistoryModal
