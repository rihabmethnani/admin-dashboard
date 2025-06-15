"use client"
import Divider from "@mui/material/Divider"

// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook"
import TwitterIcon from "@mui/icons-material/Twitter"
import InstagramIcon from "@mui/icons-material/Instagram"

// Material Dashboard 2 React components
import MDBox from "components/MDBox"

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout"
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard"

// Overview page components
import Header from "layouts/profile/components/Header"
import { useAuth } from "context/AuthContext"

function Overview() {
  const { currentUser, setCurrentUser } = useAuth()
  console.log("Utilisateur actuel :", currentUser)

  return (
    <DashboardLayout>
      {/* <DashboardNavbar /> */}
      {/* <MDBox mb={2} /> */}
      <Header>
        <MDBox mt={5} mb={3}>
          {/* <Grid item xs={12} md={6} xl={4}>
              <PlatformSettings />
            </Grid> */}

          <Divider orientation="vertical" sx={{ ml: -2, mr: 1 }} />
          <ProfileInfoCard
            title="Informations du Profil"
            info={{
              Nom: `${currentUser?.name || "Non renseigné"}`,
              Téléphone: `${currentUser?.phone ? currentUser.phone : "Non renseigné"}`,
              Email: `${currentUser?.email || "Non renseigné"}`,
              Adresse: `${currentUser?.address ? currentUser.address : "Non renseigné"}`,
            }}
            social={[
              {
                link: "https://www.facebook.com/CreativeTim/",
                icon: <FacebookIcon />,
                color: "facebook",
              },
              {
                link: "https://twitter.com/creativetim",
                icon: <TwitterIcon />,
                color: "twitter",
              },
              {
                link: "https://www.instagram.com/creativetimofficial/",
                icon: <InstagramIcon />,
                color: "instagram",
              },
            ]}
            action={{ route: "", tooltip: "Modifier le Profil" }}
            shadow={false}
          />
          <Divider orientation="vertical" sx={{ mx: 0 }} />

          {/* <Grid item xs={12} xl={4}>
              <ProfilesList
                title="conversations"
                profiles={profilesListData}
                shadow={false}
              />
            </Grid> */}
        </MDBox>
        {/* Section Projets commentée - peut être activée plus tard
        <MDBox pt={2} px={2} lineHeight={1.25}>
          <MDTypography variant="h6" fontWeight="medium">
            Projets
          </MDTypography>
          <MDBox mb={1}>
            <MDTypography variant="button" color="text">
              Les architectes conçoivent des maisons
            </MDTypography>
          </MDBox>
        </MDBox>
        <MDBox p={2}>
          <Grid container spacing={6}>
            <Grid item xs={12} md={6} xl={3}>
              <DefaultProjectCard
                image={homeDecor1}
                label="projet #2"
                title="moderne"
                description="Alors qu'Uber traverse une énorme quantité de troubles de gestion interne."
                action={{
                  type: 'internal',
                  route: '/pages/profile/profile-overview',
                  color: 'info',
                  label: 'voir le projet',
                }}
                authors={[
                  { image: team1, name: 'Elena Morison' },
                  { image: team2, name: 'Ryan Milly' },
                  { image: team3, name: 'Nick Daniel' },
                  { image: team4, name: 'Peterson' },
                ]}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <DefaultProjectCard
                image={homeDecor2}
                label="projet #1"
                title="scandinave"
                description="La musique est quelque chose sur laquelle chacun a sa propre opinion spécifique."
                action={{
                  type: 'internal',
                  route: '/pages/profile/profile-overview',
                  color: 'info',
                  label: 'voir le projet',
                }}
                authors={[
                  { image: team3, name: 'Nick Daniel' },
                  { image: team4, name: 'Peterson' },
                  { image: team1, name: 'Elena Morison' },
                  { image: team2, name: 'Ryan Milly' },
                ]}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <DefaultProjectCard
                image={homeDecor3}
                label="projet #3"
                title="minimaliste"
                description="Différentes personnes ont des goûts différents, et divers types de musique."
                action={{
                  type: 'internal',
                  route: '/pages/profile/profile-overview',
                  color: 'info',
                  label: 'voir le projet',
                }}
                authors={[
                  { image: team4, name: 'Peterson' },
                  { image: team3, name: 'Nick Daniel' },
                  { image: team2, name: 'Ryan Milly' },
                  { image: team1, name: 'Elena Morison' },
                ]}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <DefaultProjectCard
                image={homeDecor4}
                label="projet #4"
                title="gothique"
                description="Pourquoi quelqu'un choisirait-il le bleu plutôt que le rose ? Le rose est évidemment une meilleure couleur."
                action={{
                  type: 'internal',
                  route: '/pages/profile/profile-overview',
                  color: 'info',
                  label: 'voir le projet',
                }}
                authors={[
                  { image: team4, name: 'Peterson' },
                  { image: team3, name: 'Nick Daniel' },
                  { image: team2, name: 'Ryan Milly' },
                  { image: team1, name: 'Elena Morison' },
                ]}
              />
            </Grid>
          </Grid>
        </MDBox> */}
      </Header>
      {/* <Footer /> */}
    </DashboardLayout>
  )
}

export default Overview
