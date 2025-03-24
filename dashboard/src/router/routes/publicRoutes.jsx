import { lazy } from "react"
const AdminLogin = lazy(() => import('../../views/auth/AdminLogin'))
const UnAuthorized = lazy(() => import('./../../views/UnAuthorized'))


const publicRoutes = [
  {
    path: '/admin/login',
    element: <AdminLogin/>
  },
  {
    path: '/unathorized',
    element: <UnAuthorized/>
  }
]

export default publicRoutes