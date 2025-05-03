/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// react-routers components
import { Link } from 'react-router-dom';

// prop-types is library for typechecking of props
import PropTypes from 'prop-types';

// @mui material components
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Icon from '@mui/material/Icon';

// Material Dashboard 2 React components
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useMutation } from '@apollo/client';

// Material Dashboard 2 React base styles
import colors from 'assets/theme/base/colors';
import typography from 'assets/theme/base/typography';
import { useAuth } from 'context/AuthContext';
import { gql } from '@apollo/client';



export const UPDATE_PROFILE = gql`
  mutation updateSuperAdminProfile($updateUserDto: UpdateUserDto!) {
    updateSuperAdminProfile(updateUserDto: $updateUserDto) {
      _id
      name
      email
      phone
      address
      image
    }
  }
`;
function ProfileInfoCard({ title, description, info, social, action, shadow }) {

  const [open, setOpen] = useState(false);


  const {currentUser,setCurentUser}=useAuth()

  const labels = [];
  const values = [];


  // Convert this form `objectKey` of the object key in to this `object key`
  Object.keys(info).forEach((el) => {
    if (el.match(/[A-Z\s]+/)) {
      const uppercaseLetter = Array.from(el).find((i) => i.match(/[A-Z]+/));
      const newElement = el.replace(
        uppercaseLetter,
        ` ${uppercaseLetter.toLowerCase()}`
      );

      labels.push(newElement);
    } else {
      labels.push(el);
    }
  });

  // Push the object values into the values array
  Object.values(info).forEach((el) => values.push(el));

  // Render the card info items
  const renderItems = labels.map((label, key) => (
    <MDBox key={label} display="flex" py={1} pr={2}>
      <MDTypography
        variant="button"
        fontWeight="bold"
        textTransform="capitalize"
      >
        {label}: &nbsp;
      </MDTypography>
      <MDTypography variant="button" fontWeight="regular" color="text">
        &nbsp;{values[key]}
      </MDTypography>
    </MDBox>
  ));

  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    image: '',
  });

  const [updateProfile, { loading, error, data }] = useMutation(UPDATE_PROFILE);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ variables: { updateUserDto: formValues } });

      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Update failed', err);
    }
  };


  return (
    <Card sx={{ height: '100%', boxShadow: !shadow && 'none' }}>
      <MDBox
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        pt={2}
        px={2}
      >
      
        <MDTypography
          component={Link}
          to={action.route}
          variant="body2"
          color="secondary"
        >
         <Tooltip title={action.tooltip} placement="top">
  <Icon onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>edit</Icon>
</Tooltip>

        </MDTypography>
      </MDBox>
      <MDBox p={2}>
        <MDBox mb={2} lineHeight={1}>
          <MDTypography variant="button" color="text" fontWeight="light">
            {description}
          </MDTypography>
        </MDBox>
        <MDBox opacity={0.3}>
          <Divider />
        </MDBox>
        <MDBox>
          {renderItems}
       
        </MDBox>
      </MDBox>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
  <DialogTitle>Edit Profile</DialogTitle>
  <DialogContent>
    <TextField
      margin="dense"
      label="Name"
      name="name"
      value={formValues.name}
      onChange={handleChange}
      fullWidth
    />
    <TextField
      margin="dense"
      label="Email"
      name="email"
      value={formValues.email}
      onChange={handleChange}
      fullWidth
    />
    <TextField
      margin="dense"
      label="Phone"
      name="phone"
      value={formValues.phone}
      onChange={handleChange}
      fullWidth
    />
    <TextField
      margin="dense"
      label="Address"
      name="address"
      value={formValues.address}
      onChange={handleChange}
      fullWidth
    />
    <TextField
      margin="dense"
      label="Image URL"
      name="image"
      value={formValues.image}
      onChange={handleChange}
      fullWidth
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpen(false)} color="secondary">Cancel</Button>
    <Button onClick={handleSubmit} color="primary">Save</Button>
  </DialogActions>
</Dialog>

    </Card>
  );
}

// Setting default props for the ProfileInfoCard
ProfileInfoCard.defaultProps = {
  shadow: true,
};

// Typechecking props for the ProfileInfoCard
ProfileInfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  info: PropTypes.objectOf(PropTypes.string).isRequired,
  social: PropTypes.arrayOf(PropTypes.object).isRequired,
  action: PropTypes.shape({
    route: PropTypes.string.isRequired,
    tooltip: PropTypes.string.isRequired,
  }).isRequired,
  shadow: PropTypes.bool,
};

export default ProfileInfoCard;
