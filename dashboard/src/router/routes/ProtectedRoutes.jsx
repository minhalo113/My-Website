import { Suspense, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

// Check if user have authorization to access certain pages

const ProtectRoute = ({route, children}) =>{
    const {role, userInfo} = useSelector(state => state.auth)

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, [])

    useEffect(() => {
        if (isMounted) {
            if(role){
                if(route.role){
                    if (userInfo){
                        if(userInfo.role !== route.role){
                            return <Navigate to = '/unauthorized' replace/>
                        }
                    }else{
                        return <Navigate to = 'admin/login' replace/>
                    }
                }else{
                    return <Navigate to = '/unauthorized' replace/>
                }
            }else{
                return <Navigate to = 'admin/login' replace/>
            }
        }
    }, [role, userInfo, route, isMounted])

    if (!isMounted) return null;

    return <Suspense fallback = {null}>{children}</Suspense>
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