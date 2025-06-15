"use client"

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

/** 
  All of the routes for the Material Dashboard 2 React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Material Dashboard 2 React layouts
import Dashboard from "layouts/dashboard"
import Profile from "layouts/profile"
import SignIn from "layouts/authentication/sign-in"

// @mui icons
import Icon from "@mui/material/Icon"
import PartnerTable from "layouts/user/PartnerTable"
import DriverTable from "layouts/user/DriverTable"
import OrderTable from "layouts/order/OrderTable"
import CourseTable from "layouts/user/CourseTabel"
import IncidentTable from "layouts/order/incidentTable"
// const {currentUser,setCurentUser}=useAuth()
// console.log("Curraaaaaent User:", currentUser);
const routesAssistantAdmin = [
  {
    type: "collapse",
    name: "Tableau de Bord",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
  },
  // {
  //   type: 'collapse',
  //   name: 'Admins',
  //   key: 'admins',
  //   icon: <Icon fontSize="small">supervisor_account</Icon>, // Icône pour les administrateurs
  //   route: '/admins',
  //   component: <AdminTable />, // Utilisez le composant AdminLayout
  // },

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
  {
    type: "collapse",
    name: "Commandes",
    key: "orders",
    icon: <Icon fontSize="small">shopping_cart</Icon>, // Icône pour les commandes
    route: "/orders",
    component: <OrderTable />, // Utilisez le composant OrderTable
  },
  {
    type: "collapse",
    name: "Courses",
    key: "tables",
    icon: <Icon fontSize="small">receipt_long</Icon>,
    route: "/Course",
    component: <CourseTable />,
  },

  {
    type: "collapse",
    name: "Incidents",
    key: "tables",
    icon: <Icon fontSize="small">warning</Icon>,
    route: "/Incident",
    component: <IncidentTable />,
  },
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

export default routesAssistantAdmin
