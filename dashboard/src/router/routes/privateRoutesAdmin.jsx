import { lazy } from "react"
import AdminDashboard from './../../views/admin/AdminDashboard';

export const privateRoutesAdmin = [
    {
        path: "/admin/dashboard",
        element: <AdminDashboard/>,
        role: 'admin'
    }
]