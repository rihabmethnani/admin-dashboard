"use client"

import PropTypes from "prop-types"
import { Card, Icon } from "@mui/material"
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"

function OrderStatusCard({ title, count, icon, color, description, percentage }) {
  return (
    <Card sx={{ height: "100%" }}>
      <MDBox p={3} display="flex" flexDirection="column" height="100%">
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDBox
            variant="gradient"
            bgColor={color}
            color="white"
            width="4rem"
            height="4rem"
            borderRadius="xl"
            display="flex"
            justifyContent="center"
            alignItems="center"
            shadow="md"
          >
            <Icon fontSize="medium">{icon}</Icon>
          </MDBox>
          <MDBox textAlign="right">
            <MDTypography variant="button" color="text" fontWeight="light">
              {title}
            </MDTypography>
            <MDTypography variant="h4">{count}</MDTypography>
          </MDBox>
        </MDBox>
        <MDTypography variant="caption" color="text">
          {description}
        </MDTypography>
        <MDBox mt="auto" pt={2}>
          <MDTypography
            variant="button"
            color={percentage.color}
            fontWeight="bold"
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
          >
            {percentage.amount}
            <MDTypography variant="button" color="text" fontWeight="regular" ml={0.5}>
              {percentage.label}
            </MDTypography>
          </MDTypography>
        </MDBox>
      </MDBox>
    </Card>
  )
}

OrderStatusCard.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  percentage: PropTypes.shape({
    color: PropTypes.string.isRequired,
    amount: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
}

export default OrderStatusCard
