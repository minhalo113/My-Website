import { Suspense } from "react"
import { useSelector } from "react-redux"
import { Navigate } from 'react-router-dom';
import PropTypes from "prop-types";
import { useRouter } from "next/router";

// Check if user have authorization to access certain pages

const ProtectRoute = ({route, children}) =>{
    const {role, userInfo} = useSelector(state => state.auth)
    const router = useRouter()

    if (role) {
        if (route.role) {
            if (userInfo){
                if (userInfo.role === route.role){
                    return <Suspense fallback = {null}>{children}</Suspense>
                }else{
                    router.replace('/unauthorized');
                    return null;
                }
            }else{
                router.replace('/unauthorized');
                return null;
            }
        }else{
            return <Navigate to = '/unauthorized' replace />
        }
    }else{
        return <Navigate to = '/login' replace />
    }
}

ProtectRoute.propTypes = {
    route: PropTypes.shape({
        path: PropTypes.string,
        element: PropTypes.node,
        role: PropTypes.string,
    }),
    children: PropTypes.node
}

export default ProtectRoute