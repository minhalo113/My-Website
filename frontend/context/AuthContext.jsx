import { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from '../src/api/api.js'

export const AuthContext = createContext()

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/customer/me', {withCredentials: true})
        .then(res => setUser(res.data.user))
        .catch(() => setUser(null))
        .finally(() => setLoading(false))
    }, [])

    return (
        <AuthContext.Provider value = {{user, setUser, loading}}>
            {children}
        </AuthContext.Provider>
    )
}

AuthProvider.propTypes = {
    children: PropTypes.node,
}