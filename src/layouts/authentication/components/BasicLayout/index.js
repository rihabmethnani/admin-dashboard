import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import MDBox from 'components/MDBox';
import PageLayout from 'examples/LayoutContainers/PageLayout';

function BasicLayout({ image, children }) {
  return (
    <PageLayout>
      <MDBox
        display="flex"
        width="100%"
        minHeight="100vh"
        alignItems="center"
        justifyContent="center"
        px={2}
      >
        <Grid container spacing={6} justifyContent="center" alignItems="center">
          {/* Colonne pour l'image (visible seulement sur les écrans moyens et grands) */}
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
            <MDBox
              component="img"
              src={image}
              alt="Login Image"
              sx={{
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '70vh',
                borderRadius: 'lg',
                boxShadow: 3
              }}
            />
          </Grid>
          
          {/* Colonne pour la carte */}
          <Grid item xs={12} md={5} lg={4}>
            {children}
          </Grid>
        </Grid>
      </MDBox>
    </PageLayout>
  );
}

BasicLayout.propTypes = {
  image: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default BasicLayout;