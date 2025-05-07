"use client"

import { useMemo } from "react"
import { useQuery, gql, useMutation } from "@apollo/client"
import Grid from "@mui/material/Grid"
import Card from "@mui/material/Card"
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import DashboardLayout from "examples/LayoutContainers/DashboardLayout"
import DashboardNavbar from "examples/Navbars/DashboardNavbar"
import DataTable from "examples/Tables/DataTable"
import DeleteIcon from "@mui/icons-material/Delete"
import { useMaterialUIController } from "context"
import { clientMicroservice1 } from "apolloClients/microservice1"
import { useAuth } from "context/AuthContext"
import { VALIDATE_PARTNER } from "graphql/mutations/userMutations"
import Author from "./Author"
import { Tooltip, IconButton } from "@mui/material"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser"
import BlockIcon from "@mui/icons-material/Block"

// GraphQL Queries & Mutations
const GET_PARTNERS = gql`
  query GetPartners {
    getUsersByRole(role: "PARTNER") {
      _id
      name
      email
      phone
      address
      image
      companyName
      isValid
    }
  }
`

const SOFT_REMOVE_USER = gql`
  mutation SoftRemoveUser($id: String!) {
    softRemoveUser(id: $id) {
      _id
    }
  }
`

// Added invalidate partner mutation
const INVALIDATE_PARTNER = gql`
  mutation InvalidatePartner($partnerId: String!) {
    invalidatePartner(partnerId: $partnerId) {
      _id
      isValid
    }
  }
`

function PartnerTable() {
  const { loading, error, data, refetch } = useQuery(GET_PARTNERS, { client: clientMicroservice1 })
  const [controller] = useMaterialUIController()
  const { searchTerm } = controller
  const { currentUser } = useAuth()

  const [softRemoveUserMutation] = useMutation(SOFT_REMOVE_USER, { client: clientMicroservice1 })
  const [validatePartnerMutation] = useMutation(VALIDATE_PARTNER, { client: clientMicroservice1 })
  // Added invalidate partner mutation
  const [invalidatePartnerMutation] = useMutation(INVALIDATE_PARTNER, { client: clientMicroservice1 })

  const partners = data?.getUsersByRole || []

  const handleValidate = async (partnerId) => {
    try {
      await validatePartnerMutation({ variables: { partnerId } })
      alert("Partner validated successfully!")
      refetch()
    } catch (error) {
      console.error(error)
      alert("Failed to validate partner.")
    }
  }

  // Added handler for invalidating partners
  const handleInvalidate = async (partnerId) => {
    try {
      await invalidatePartnerMutation({ variables: { partnerId } })
      alert("Partner invalidated successfully!")
      refetch()
    } catch (error) {
      console.error(error)
      alert("Failed to invalidate partner.")
    }
  }

  const handleDelete = async (partnerId) => {
    const confirmed = window.confirm("Are you sure you want to delete this partner?")
    if (!confirmed) return

    try {
      await softRemoveUserMutation({ variables: { id: partnerId } })
      alert("Partner deleted successfully!")
      refetch()
    } catch (error) {
      console.error(error)
      alert("Failed to delete partner.")
    }
  }

  const rows = useMemo(() => {
    return partners
      .filter(
        (partner) =>
          partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          partner.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .slice() // create a shallow copy to avoid mutating the original array
      .reverse()
      .map((partner, index) => ({
        id: index + 1,
        author: <Author image={partner.image || null} name={partner.name} email={partner.email} />,
        phone: partner.phone || "N/A",
        address: partner.address || "N/A",
        companyName: partner.companyName || "N/A",
        isValid: partner.isValid ? (
          <MDBox display="flex" alignItems="center" justifyContent="center">
            <VerifiedUserIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
            <MDTypography variant="caption" color="success" fontWeight="medium">
              Validé
            </MDTypography>
          </MDBox>
        ) : (
          <MDBox display="flex" alignItems="center" justifyContent="center">
            <BlockIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
            <MDTypography variant="caption" color="error" fontWeight="medium">
              Non Validé
            </MDTypography>
          </MDBox>
        ),
        validation:
          currentUser?.role === "SUPER_ADMIN" ? (
            // Read-only view for SUPER_ADMIN
            <MDTypography variant="caption" color={partner.isValid ? "success" : "error"} fontWeight="medium">
              {partner.isValid ? "Validé" : "Non Validé"}
            </MDTypography>
          ) : (
            // Interactive buttons for other roles
            <MDBox display="flex" justifyContent="center">
              {/* Validate button/icon */}
              <Tooltip title={partner.isValid ? "Déjà validé" : "Valider ce partenaire"}>
                <span>
                  <IconButton
                    color="success"
                    disabled={partner.isValid}
                    onClick={(e) => {
                      e.preventDefault()
                      handleValidate(partner._id)
                    }}
                    size="small"
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              {/* Invalidate button/icon */}
              <Tooltip title={!partner.isValid ? "Déjà invalidé" : "Invalider ce partenaire"}>
                <span>
                  <IconButton
                    color="error"
                    disabled={!partner.isValid}
                    onClick={(e) => {
                      e.preventDefault()
                      handleInvalidate(partner._id)
                    }}
                    size="small"
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </MDBox>
          ),
        action: currentUser?.role === "ADMIN" && (
          <MDBox display="flex" justifyContent="center">
            <Tooltip title="Supprimer ce partenaire">
              <IconButton
                color="error"
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete(partner._id)
                }}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </MDBox>
        ),
      }))
  }, [partners, searchTerm, currentUser])

  const columns = [
    { Header: "ID", accessor: "id", align: "center" },
    { Header: "Author", accessor: "author", width: "30%", align: "left" },
    { Header: "Phone", accessor: "phone", align: "center" },
    { Header: "Address", accessor: "address", align: "left" },
    { Header: "Company Name", accessor: "companyName", align: "left" },
    { Header: "Statut", accessor: "isValid", align: "center" },
    { Header: "Validation", accessor: "validation", align: "center" },
    ...(currentUser?.role === "ADMIN" ? [{ Header: "Action", accessor: "action", align: "center" }] : []),
  ]

  if (loading)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <MDTypography variant="h5">Chargement des partenaires...</MDTypography>
        </MDBox>
      </DashboardLayout>
    )

  if (error)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <MDTypography variant="h5" color="error">
            Erreur: {error.message}
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
           
          </MDBox>
        </MDBox>

        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card sx={{ boxShadow: "0 4px 20px 0 rgba(0,0,0,0.1)" }}>
              <MDBox pt={3}>
                <DataTable
                  table={{
                    columns,
                    rows,
                  }}
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
    </DashboardLayout>
  )
}

export default PartnerTable
