"use client"



// Material Dashboard 2 React layouts
import Dashboard from "layouts/dashboard"
import Profile from "layouts/profile"
import SignIn from "layouts/authentication/sign-in"

// @mui icons
import Icon from "@mui/material/Icon"
import PartnerTable from "layouts/user/PartnerTable"
import DriverTable from "layouts/user/DriverTable"
import AdminTable from "layouts/user/AdminTable"
import AssistantAdminTable from "layouts/user/AssistantAdminTable"
// const {currentUser,setCurentUser}=useAuth()
// console.log("Curraaaaaent User:", currentUser);
const routesSuperadmin = [
  {
    type: "collapse",
    name: "Tableau de Bord",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Admins Assistants",
    key: "admins",
    icon: <Icon fontSize="small">supervisor_account</Icon>, // Icône pour les administrateurs
    route: "/assistant-admins",
    component: <AssistantAdminTable />, // Utilisez le composant AdminLayout
  },
  {
    type: "collapse",
    name: "Administrateurs",
    key: "admins",
    icon: <Icon fontSize="small">supervisor_account</Icon>, // Icône pour les administrateurs
    route: "/admins",
    component: <AdminTable />, // Utilisez le composant AdminLayout
  },

  {
    type: "collapse",
    name: "Partenaires",
    key: "partners",
    icon: <Icon fontSize="small">groups</Icon>, // Icône pour les partenaires
    route: "/partners",
    component: <PartnerTable />, // Utilisez le composant PartnerTable
  },
  // {
  //   type: 'collapse',
  //   name: 'Clients',
  //   key: 'clients',
  //   icon: <Icon fontSize="small">people</Icon>, // Icône pour les clients
  //   route: '/clients',
  //   component: <ClientTable />, // Utilisez le composant ClientTable
  // },
  {
    type: "collapse",
    name: "Chauffeurs",
    key: "drivers",
    icon: <Icon fontSize="small">directions_car</Icon>, // Icône pour les chauffeurs
    route: "/drivers",
    component: <DriverTable />, // Utilisez le composant DriverTable
  },
  // {
  //   type: 'collapse',
  //   name: 'Commandes',
  //   key: 'orders',
  //   icon: <Icon fontSize="small">shopping_cart</Icon>, // Icône pour les commandes
  //   route: '/orders',
  //   component: <OrderTable />, // Utilisez le composant OrderTable
  // },
  // {
  //   type: 'collapse',
  //   name: 'Tableaux',
  //   key: 'tables',
  //   icon: <Icon fontSize="small">table_view</Icon>,
  //   route: '/tables',
  //   component: <Tables />,
  // },
  // {
  //   type: 'collapse',
  //   name: 'Facturation',
  //   key: 'billing',
  //   icon: <Icon fontSize="small">receipt_long</Icon>,
  //   route: '/billing',
  //   component: <Billing />,
  // },
  // {
  //   type: 'collapse',
  //   name: 'RTL',
  //   key: 'rtl',
  //   icon: <Icon fontSize="small">format_textdirection_r_to_l</Icon>,
  //   route: '/rtl',
  //   component: <RTL />,
  // },
  // {
  //   type: 'collapse',
  //   name: 'Notifications',
  //   key: 'notifications',
  //   icon: <Icon fontSize="small">notifications</Icon>,
  //   route: '/notifications',
  //   component: <Notifications />,
  // },
  {
    type: "collapse",
    name: "Profil",
    key: "profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "/profile",
    component: <Profile />,
  },
  {
    type: "divider",
    name: "Se Déconnecter",
    key: "sign-in",
    icon: <Icon fontSize="small">login</Icon>,
    route: "/authentication/sign-in",
    component: <SignIn />,
  },
  // {
  //   type: 'collapse',
  //   name: 'S\'Inscrire',
  //   key: 'sign-up',
  //   icon: <Icon fontSize="small">assignment</Icon>,
  //   route: '/authentication/sign-up',
  //   component: <SignUp />,
  // },
]

export default routesSuperadmin
