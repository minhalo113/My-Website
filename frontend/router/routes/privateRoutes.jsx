import AdminDashboard from "../../pages/admin/dashboard"

export const privateRoutes = [
    {
        path: "/admin/dashboard",
        element: <AdminDashboard/>,
        role: 'admin'
    }
]