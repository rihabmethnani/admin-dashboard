// BasicLayout.js

import PropTypes from 'prop-types';

// @mui material components
import Grid from '@mui/material/Grid';

// Material Dashboard 2 React components
import MDBox from 'components/MDBox';

// Material Dashboard 2 React example components
import PageLayout from 'examples/LayoutContainers/PageLayout';

function BasicLayout({ image, children }) {
  return (
    <PageLayout>
      <MDBox
        position="absolute"
        width="100%"
        minHeight="100vh"
        sx={{
          backgroundImage: ({
            functions: { linearGradient, rgba },
            palette: { gradients },
          }) =>
            image &&
            `${linearGradient(
              rgba(gradients.light.main, 0.3), // Fond plus clair ici
              rgba(gradients.light.state, 0.3)
            )}, url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <MDBox px={1} width="100%" height="100vh" mx="auto">
        <Grid
          container
          spacing={1}
          justifyContent="flex-start"  // Aligne vers la gauche
          alignItems="center"
          height="100%"
          sx={{ ml: 90 }} 
        >
          <Grid item xs={11} sm={9} md={5} lg={4} xl={3} sx={{ ml: 10 }}> {/* Décalage vers la droite */}
            {children}
          </Grid>
        </Grid>
      </MDBox>
    </PageLayout>
  );
}

// Typechecking props for the BasicLayout
BasicLayout.propTypes = {
  image: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default BasicLayout;
