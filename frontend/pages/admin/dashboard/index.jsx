import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"

const AdminDashboard = () => {
    const dispatch = useDispatch()

    const {userInfo} = useSelector(state => state.auth)

    useEffect(() => {
        console.log("get_dashboard_Data here")
    }, [])

    return(
        <div>
            Hello
        </div>
    )
}

export default AdminDashboard