import { Suspense, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import PropTypes from "prop-types";
import { useRouter } from "next/router";

// Check if user have authorization to access certain pages

const ProtectRoute = ({route, children}) =>{
    const {role, userInfo} = useSelector(state => state.auth)
    const router = useRouter()

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
                            router.replace("/unauthorized")
                        }
                    }else{
                        router.replace("/login")
                    }
                }else{
                    router.replace("/unauthorized")
                }
            }else{
                router.replace("/login")
            }
        }
    }, [role, userInfo, route, isMounted, router])

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