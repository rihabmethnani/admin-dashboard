"use client"

import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@apollo/client"
import { gql } from "@apollo/client"
import { clientMicroservice2 } from "apolloClients/microservice2"
import { clientMicroservice1 } from "apolloClients/microservice1"
import { useMaterialUIController } from "context"
import { useAuth } from "context/AuthContext"

// Material UI components
import Grid from "@mui/material/Grid"
import Card from "@mui/material/Card"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"

// Material Dashboard 2 React components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDButton from "components/MDButton"

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout"
import DashboardNavbar from "examples/Navbars/DashboardNavbar"
import DataTable from "examples/Tables/DataTable"

// GraphQL Queries & Mutations
const GET_COURSES = gql`
  query GetCourses {
    courses {
      orderIds
      driverId
      createdAt
      updatedAt
    }
  }
`

const GET_USER_BY_ID = gql`
  query GetUserById($id: String!) {
    getUserById(id: $id) {
      _id
      name
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

function CourseTable() {
  const { loading, error, data, refetch } = useQuery(GET_COURSES, { client: clientMicroservice2 })
  const [controller] = useMaterialUIController()
  const { searchTerm } = controller
  const { currentUser } = useAuth()
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [orderDetails, setOrderDetails] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [driverNames, setDriverNames] = useState({})

  const courses = data?.courses || []

  // Function to fetch driver name
  const { data: driverData } = useQuery(GET_USER_BY_ID, {
    variables: { id: selectedCourse?.driverId || "" },
    skip: !selectedCourse?.driverId,
    client: clientMicroservice1,
  })

  useEffect(() => {
    const fetchDriverNames = async () => {
      const names = {}
      for (const course of courses) {
        if (course.driverId && !names[course.driverId]) {
          try {
            const { data } = await clientMicroservice1.query({
              query: GET_USER_BY_ID,
              variables: { id: course.driverId },
            })
            names[course.driverId] = data?.getUserById?.name || "Unknown Driver"
          } catch (error) {
            console.error("Error fetching driver name:", error)
            names[course.driverId] = "Unknown Driver"
          }
        }
      }
      setDriverNames(names)
    }

    if (courses.length > 0) {
      fetchDriverNames()
    }
  }, [courses])

  // Function to fetch order details when modal opens
  const fetchOrderDetails = async (orderIds) => {
    if (!orderIds || orderIds.length === 0) return

    setLoadingOrders(true)
    try {
      const orderDetailsPromises = orderIds.map(async (orderId) => {
        const { data } = await clientMicroservice2.query({
          query: GET_ORDER_BY_ID,
          variables: { id: orderId },
        })
        return data.order
      })

      const details = await Promise.all(orderDetailsPromises)
      setOrderDetails(details.filter((order) => order)) // Filter out any null results
    } catch (error) {
      console.error("Error fetching order details:", error)
    } finally {
      setLoadingOrders(false)
    }
  }

  // Update rows to include driver name and remove updatedAt
  const rows = useMemo(() => {
    return courses
      .filter((course) => course.driverId?.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice() // create a shallow copy to avoid mutating the original array
      .reverse()
      .map((course, index) => {
        const driverName = driverNames[course.driverId] || "Loading..."

        return {
          id: index + 1,
          driver: (
            <MDBox>
              <MDTypography variant="subtitle2">{driverName}</MDTypography>
              
            </MDBox>
          ),
          createdAt: new Date(course.createdAt).toLocaleString() || "N/A",
          ordersCount: course.orderIds?.length || 0,
          action: (
            <MDBox display="flex" gap={1}>
              <MDButton
                variant="text"
                color="info"
                size="small"
                onClick={() => {
                  setSelectedCourse(course)
                  setIsModalOpen(true)
                  fetchOrderDetails(course.orderIds)
                }}
              >
                View Orders
              </MDButton>
            </MDBox>
          ),
        }
      })
  }, [courses, searchTerm, driverNames])

  // Update columns to remove updatedAt
  const columns = [
    { Header: "ID", accessor: "id", align: "center" },
    { Header: "Driver", accessor: "driver", width: "30%", align: "left" },
    { Header: "Created At", accessor: "createdAt", align: "center" },
    { Header: "Orders Count", accessor: "ordersCount", align: "center" },
    { Header: "Actions", accessor: "action", align: "center" },
  ]

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCourse(null)
    setOrderDetails([])
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <MDTypography variant="h6" fontWeight="medium">
            Courses Table
          </MDTypography>
        </MDBox>

        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3}>
                <DataTable
                  table={{
                    columns,
                    rows,
                  }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Orders Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <MDTypography variant="h6">
            Orders for Driver: {driverData?.getUserById?.name || selectedCourse?.driverId}
          </MDTypography>
        </DialogTitle>
        <DialogContent>
          {selectedCourse && (
            <MDBox>
              <MDTypography variant="subtitle2" mb={2}>
                Total Orders: {selectedCourse.orderIds?.length || 0}
              </MDTypography>

              {loadingOrders ? (
                <MDBox display="flex" justifyContent="center" p={3}>
                  <MDTypography>Loading order details...</MDTypography>
                </MDBox>
              ) : (
                <Grid container spacing={2}>
                  {orderDetails.length > 0 ? (
                    orderDetails.map((order, index) => (
                      <Grid item xs={12} key={index}>
                        <Card>
                          <MDBox p={2}>
                            <Grid container spacing={2}>
                              
                              
                              <Grid item xs={12} md={6}>
                                <MDTypography variant="body2" fontWeight="bold">
                                  Amount:
                                </MDTypography>
                                <MDTypography variant="body2">{order.amount}</MDTypography>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <MDTypography variant="body2" fontWeight="bold">
                                  Status:
                                </MDTypography>
                                <MDTypography
                                  variant="body2"
                                  color={
                                    order.status === "COMPLETED"
                                      ? "success"
                                      : order.status === "PENDING"
                                        ? "warning"
                                        : order.status === "CANCELLED"
                                          ? "error"
                                          : "info"
                                  }
                                >
                                  {order.status}
                                </MDTypography>
                              </Grid>
                              {order.description && (
                                <Grid item xs={12}>
                                  <MDTypography variant="body2" fontWeight="bold">
                                    Description:
                                  </MDTypography>
                                  <MDTypography variant="body2">{order.description}</MDTypography>
                                </Grid>
                              )}
                            </Grid>
                          </MDBox>
                        </Card>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <MDBox p={3} textAlign="center">
                        <MDTypography>No order details available</MDTypography>
                      </MDBox>
                    </Grid>
                  )}
                </Grid>
              )}
            </MDBox>
          )}
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseModal} color="secondary">
            Close
          </MDButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  )
}

export default CourseTable
