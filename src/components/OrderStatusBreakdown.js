"use client"

import { Card } from "@mui/material"
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import PropTypes from "prop-types"
import "react-circular-progressbar/dist/styles.css"

function OrderStatusBreakdown({ title, data, colors }) {
  // Calculate total orders
  const totalOrders = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <MDBox p={3}>
        <MDTypography variant="h6" fontWeight="medium">
          {title}
        </MDTypography>
        <MDBox mt={3}>
          {data.map((status, index) => {
            const percentage = totalOrders > 0 ? Math.round((status.count / totalOrders) * 100) : 0

            return (
              <MDBox key={status.name} display="flex" alignItems="center" mb={2}>
                <MDBox
                  width="1.5rem"
                  height="1.5rem"
                  bgColor={colors[index % colors.length]}
                  borderRadius="sm"
                  mr={2}
                />
                <MDBox width="100%" display="flex" alignItems="center" justifyContent="space-between">
                  <MDTypography variant="button" fontWeight="regular" color="text">
                    {status.name}
                  </MDTypography>
                  <MDBox display="flex" alignItems="center">
                    <MDTypography variant="button" fontWeight="bold">
                      {status.count}
                    </MDTypography>
                    <MDTypography variant="button" fontWeight="regular" color="secondary" ml={1}>
                      ({percentage}%)
                    </MDTypography>
                  </MDBox>
                </MDBox>
              </MDBox>
            )
          })}
        </MDBox>
      </MDBox>
    </Card>
  )
}

OrderStatusBreakdown.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    }),
  ).isRequired,
  colors: PropTypes.arrayOf(PropTypes.string).isRequired,
}

export default OrderStatusBreakdown
