// import React from 'react'

// const PrivateRoute = ({children}) => {
//     const {user, loading} = useContext(AuthContext);
//     const location = useLocation();

//     if(loading){
//         return (
//             <div>Loading......</div>
//         )
//     }

//     if(user){
//         return children;
//     }

//   return (
//     <Navigate to = "/login" state = {{from: location}} replace></Navigate>
//   )
// }

// export default PrivateRoute