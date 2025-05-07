"use client"

import { useEffect, useState } from "react"
import { useQuery, gql } from "@apollo/client"

// @mui material components
import Grid from "@mui/material/Grid"
import Card from "@mui/material/Card"
import Icon from "@mui/material/Icon"
import Divider from "@mui/material/Divider"

// Material Dashboard 2 React components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout"
import DashboardNavbar from "examples/Navbars/DashboardNavbar"
import Footer from "examples/Footer"

// Custom components
import OrderStatusCard from "components/OrderStatusCard"

// Dashboard components
import { clientMicroservice1 } from "apolloClients/microservice1"
import { clientMicroservice2 } from "apolloClients/microservice2"

// GraphQL queries
const GET_USER_COUNTS = gql`
  query GetUserCounts {
    getUserCounts {
      drivers
      adminAssistants
    }
  }
`

const GET_PARTNER_COUNTS = gql`
  query GetPartnerCounts {
    getPartnerCounts {
      total
      active
      inactive
    }
  }
`

// Fixed query to use 'count' instead of 'counts'
const GET_ORDERS_COUNT_BY_STATUS = gql`
  query GetOrdersCountByStatus {
    getOrdersCountByStatus {
      status
      count
    }
  }
`

// Status card configurations with icons and colors
const statusCardConfigs = {
  EN_ATTENTE: {
    icon: "hourglass_empty",
    color: "warning",
    title: "Pending Orders",
    description: "Orders waiting to be processed",
  },
  ASSIGNE: {
    icon: "assignment_ind",
    color: "info",
    title: "Assigned Orders",
    description: "Orders assigned to drivers",
  },
  ECHEC_LIVRAISON: {
    icon: "error_outline",
    color: "error",
    title: "Failed Deliveries",
    description: "Orders that failed to be delivered",
  },
  RETOURNE: {
    icon: "assignment_return",
    color: "dark",
    title: "Returned Orders",
    description: "Orders returned by customers",
  },
  RELANCE: {
    icon: "replay",
    color: "primary",
    title: "Relaunch Orders",
    description: "Orders that need to be relaunched",
  },
  LIVRE: {
    icon: "check_circle",
    color: "success",
    title: "Delivered Orders",
    description: "Successfully delivered orders",
  },
}

function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTime, setRefreshTime] = useState(new Date())

  // Fetch user counts from microservice1
  const { data: userCountsData, loading: userLoading } = useQuery(GET_USER_COUNTS, {
    client: clientMicroservice1,
    fetchPolicy: "network-only",
  })

  // Fetch partner counts from microservice1
  const { data: partnerCountsData, loading: partnerLoading } = useQuery(GET_PARTNER_COUNTS, {
    client: clientMicroservice1,
    fetchPolicy: "network-only",
  })

  // Fetch order counts by status from microservice2
  const { data: orderCountsData, loading: orderLoading } = useQuery(GET_ORDERS_COUNT_BY_STATUS, {
    client: clientMicroservice2,
    fetchPolicy: "network-only",
  })

  // Update loading state
  useEffect(() => {
    if (!userLoading && !partnerLoading && !orderLoading) {
      setIsLoading(false)
      setRefreshTime(new Date())
    }
  }, [userLoading, partnerLoading, orderLoading])

  // Get non-zero order statuses
  const getNonZeroOrderStatuses = () => {
    if (!orderCountsData?.getOrdersCountByStatus) return []
    return orderCountsData.getOrdersCountByStatus
      .filter((item) => item.count > 0 && statusCardConfigs[item.status])
      .sort((a, b) => b.count - a.count) // Sort by count in descending order
  }

  // Calculate total orders
  const getTotalOrders = () => {
    if (!orderCountsData?.getOrdersCountByStatus) return 0
    return orderCountsData.getOrdersCountByStatus.reduce((sum, item) => sum + item.count, 0)
  }

  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true)
    // Refetch all queries
    window.location.reload()
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* Header with refresh button */}
        <MDBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          
          <MDBox display="flex" alignItems="center">
            <MDTypography variant="body2" color="text" mr={2}>
              Last updated: {refreshTime.toLocaleTimeString()}
            </MDTypography>
            <MDBox
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="2rem"
              height="2rem"
              bgColor="info"
              color="white"
              borderRadius="50%"
              shadow="md"
              sx={{ cursor: "pointer" }}
              onClick={handleRefresh}
            >
              <Icon fontSize="small">refresh</Icon>
            </MDBox>
          </MDBox>
        </MDBox>

        {/* Summary Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: "100%" }}>
              <MDBox p={3} display="flex" flexDirection="column" height="100%">
                <MDBox display="flex" justifyContent="space-between" alignItems="center">
                  <MDBox
                    variant="gradient"
                    bgColor="primary"
                    color="white"
                    width="4rem"
                    height="4rem"
                    borderRadius="xl"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    shadow="md"
                  >
                    <Icon fontSize="medium">support_agent</Icon>
                  </MDBox>
                  <MDBox textAlign="right">
                    <MDTypography variant="button" color="text" fontWeight="light">
                      Admin Assistants
                    </MDTypography>
                    <MDTypography variant="h4">{userCountsData?.getUserCounts?.adminAssistants || 0}</MDTypography>
                  </MDBox>
                </MDBox>
                <Divider sx={{ my: 2 }} />
                <MDBox display="flex" alignItems="center">
                  <MDTypography variant="button" color="text" lineHeight="1.5">
                    Team members with administrative privileges
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: "100%" }}>
              <MDBox p={3} display="flex" flexDirection="column" height="100%">
                <MDBox display="flex" justifyContent="space-between" alignItems="center">
                  <MDBox
                    variant="gradient"
                    bgColor="info"
                    color="white"
                    width="4rem"
                    height="4rem"
                    borderRadius="xl"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    shadow="md"
                  >
                    <Icon fontSize="medium">delivery_dining</Icon>
                  </MDBox>
                  <MDBox textAlign="right">
                    <MDTypography variant="button" color="text" fontWeight="light">
                      Drivers
                    </MDTypography>
                    <MDTypography variant="h4">{userCountsData?.getUserCounts?.drivers || 0}</MDTypography>
                  </MDBox>
                </MDBox>
                <Divider sx={{ my: 2 }} />
                <MDBox display="flex" alignItems="center">
                  <MDTypography variant="button" color="text" lineHeight="1.5">
                    Delivery personnel available for order fulfillment
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: "100%" }}>
              <MDBox p={3} display="flex" flexDirection="column" height="100%">
                <MDBox display="flex" justifyContent="space-between" alignItems="center">
                  <MDBox
                    variant="gradient"
                    bgColor="success"
                    color="white"
                    width="4rem"
                    height="4rem"
                    borderRadius="xl"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    shadow="md"
                  >
                    <Icon fontSize="medium">verified_user</Icon>
                  </MDBox>
                  <MDBox textAlign="right">
                    <MDTypography variant="button" color="text" fontWeight="light">
                      Active Partners
                    </MDTypography>
                    <MDTypography variant="h4">{partnerCountsData?.getPartnerCounts?.active || 0}</MDTypography>
                  </MDBox>
                </MDBox>
                <Divider sx={{ my: 2 }} />
                <MDBox display="flex" alignItems="center" justifyContent="space-between">
                  <MDTypography variant="button" color="text" lineHeight="1.5">
                    Verified business partners
                  </MDTypography>
                  <MDTypography variant="button" color="success" fontWeight="bold">
                    {partnerCountsData?.getPartnerCounts?.total
                      ? `${Math.round((partnerCountsData.getPartnerCounts.active / partnerCountsData.getPartnerCounts.total) * 100)}%`
                      : "0%"}
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: "100%" }}>
              <MDBox p={3} display="flex" flexDirection="column" height="100%">
                <MDBox display="flex" justifyContent="space-between" alignItems="center">
                  <MDBox
                    variant="gradient"
                    bgColor="warning"
                    color="white"
                    width="4rem"
                    height="4rem"
                    borderRadius="xl"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    shadow="md"
                  >
                    <Icon fontSize="medium">gpp_maybe</Icon>
                  </MDBox>
                  <MDBox textAlign="right">
                    <MDTypography variant="button" color="text" fontWeight="light">
                      Inactive Partners
                    </MDTypography>
                    <MDTypography variant="h4">{partnerCountsData?.getPartnerCounts?.inactive || 0}</MDTypography>
                  </MDBox>
                </MDBox>
                <Divider sx={{ my: 2 }} />
                <MDBox display="flex" alignItems="center" justifyContent="space-between">
                  <MDTypography variant="button" color="text" lineHeight="1.5">
                    Partners pending verification
                  </MDTypography>
                  <MDTypography variant="button" color="warning" fontWeight="bold">
                    {partnerCountsData?.getPartnerCounts?.total
                      ? `${Math.round((partnerCountsData.getPartnerCounts.inactive / partnerCountsData.getPartnerCounts.total) * 100)}%`
                      : "0%"}
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        {/* Order Statistics */}
        <Card sx={{ overflow: "visible" }}>
          <MDBox p={3}>
            <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <MDTypography variant="h5" fontWeight="medium">
                Order Statistics
              </MDTypography>
              <MDBox
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="5rem"
                height="2rem"
                bgColor="light"
                color="dark"
                borderRadius="lg"
                shadow="sm"
              >
                <MDTypography variant="button" fontWeight="bold">
                  Total: {getTotalOrders()}
                </MDTypography>
              </MDBox>
            </MDBox>

            <Grid container spacing={3}>
              {getNonZeroOrderStatuses().map((item) => {
                const config = statusCardConfigs[item.status]
                return (
                  <Grid item xs={12} md={6} lg={4} key={item.status}>
                    <OrderStatusCard
                      title={config.title}
                      count={item.count}
                      icon={config.icon}
                      color={config.color}
                      description={config.description}
                      percentage={{
                        color: config.color,
                        amount: `${Math.round((item.count / getTotalOrders()) * 100)}%`,
                        label: "of total orders",
                      }}
                    />
                  </Grid>
                )
              })}
            </Grid>
          </MDBox>
        </Card>

        {/* Order Status Breakdown */}
        <Card sx={{ mt: 3 }}>
          <MDBox p={3}>
            <MDTypography variant="h5" fontWeight="medium" mb={3}>
              Complete Order Status Breakdown
            </MDTypography>
            <Grid container spacing={2}>
              {orderCountsData?.getOrdersCountByStatus?.map((item) => (
                <Grid item xs={6} md={4} lg={3} key={item.status}>
                  <MDBox
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    p={2}
                    sx={{
                      borderRadius: "lg",
                      backgroundColor: item.count > 0 ? "rgba(0,0,0,0.05)" : "transparent",
                      border: item.count > 0 ? "1px solid rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    <MDTypography
                      variant="button"
                      fontWeight={item.count > 0 ? "medium" : "regular"}
                      color={item.count > 0 ? "dark" : "text"}
                    >
                      {item.status}
                    </MDTypography>
                    <MDBox
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      width="1.5rem"
                      height="1.5rem"
                      bgColor={item.count > 0 ? "dark" : "light"}
                      color="white"
                      borderRadius="md"
                    >
                      <MDTypography variant="caption" fontWeight="medium" color={item.count > 0 ? "white" : "text"}>
                        {item.count}
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </Grid>
              ))}
            </Grid>
          </MDBox>
        </Card>
      </MDBox>
      
    </DashboardLayout>
  )
}

export default Dashboard
