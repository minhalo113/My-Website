import { privateRoutesAdmin } from './privateRoutesAdmin';
import MainLayout from '../../layout/MainLayout';
import ProtectRoute from './ProtectedRoutes';

export const getRoutes = () => {
    privateRoutesAdmin.map(r => {
        r.element = <ProtectRoute route = {r}>{r.element}</ProtectRoute>
    })

    return {
        path: '/',
        element: <MainLayout/>,
        children: privateRoutesAdmin
    }
}