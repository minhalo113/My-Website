import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Outlet } from "react-router-dom"

export const MainLayout = () => {
    const dispatch = useDispatch()
    const {userInfo} = useSelector(state => state.auth)

    const [showSidebar, setShowSidebar] = useState(false)

    return (
        <div className="bg-[#cdcae9] w-full min-h-screen">
            <div className="ml-0 lg:ml-[260px] pt-[95px] transition-all">
                <Outlet/>
            </div>
        </div>
    )
}

export default MainLayout;