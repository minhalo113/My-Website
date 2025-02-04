// import React, { createContext } from 'react'
// import app from "../firebase/firebase.config"
// import { GoogleAuthProvider , createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut} from "firebase/auth"
// import { useState, useEffect } from 'react';
// import { Navigate, useNavigate } from 'react-router-dom';

// export const AuthContext = createContext();
// const auth = getAuth();
// const googleProvider = new GoogleAuthProvider();

// const AuthProvider = ({children}) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);

//     const createUser = (email, password) => {
//         setLoading(true)
//         return createUserWithEmailAndPassword(auth, email, password);
//     }

//     // create user using gmail
//     const signUpWithGmail = () => {
//         setLoading(true);
//         return signInWithPopup(auth, googleProvider);
//     }

//     const login = (email, password) => {
//         setLoading(true);
//         return signInWithEmailAndPassword(auth, email, password);
//     }

//     const logOut = async() => {
//         try {
//             await signOut(auth);
//             Navigate("/")
//         }catch(error){
//             console.error("Logout err:", error);
//         }
//     } 

//     //user is available or not
//     useEffect(() => {
//         const unsubcribe = onAuthStateChanged(auth, currentuser => {
//             setUser(currentuser);
//             setLoading(false);
//         });
//         return () => {
//             return unsubcribe();
//         }
//     })

//     const authInfo = {
//         user, loading, createUser, signUpWithGmail, login, logOut,
//     }
//   return (
//     <AuthContext.Provider value={authInfo}>
//         {children}
//     </AuthContext.Provider>
//   )
// }

// export default AuthProvider;