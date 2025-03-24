import React from 'react';
import PropTypes from 'prop-types';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import MDAvatar from 'components/MDAvatar';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Icône par défaut

// Composant personnalisé pour l'auteur
const Author = ({ image, name, email }) => (
  <MDBox display="flex" alignItems="center" lineHeight={1}>
    {image ? (
      <MDAvatar src={image} alt={name} size="sm" />
    ) : (
      <AccountCircleIcon fontSize="large" style={{ color: '#bdbdbd' }} />
    )}
    <MDBox ml={2} lineHeight={1}>
      <MDTypography display="block" variant="button" fontWeight="medium">
        {name}
      </MDTypography>
      <MDTypography variant="caption">{email}</MDTypography>
    </MDBox>
  </MDBox>
);

// Validation des props
Author.propTypes = {
  image: PropTypes.string, // image est une chaîne de caractères (URL ou chemin d'image)
  name: PropTypes.string.isRequired, // name est une chaîne de caractères obligatoire
  email: PropTypes.string.isRequired, // email est une chaîne de caractères obligatoire
};

export default Author;