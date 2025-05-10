import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import toast from 'react-hot-toast'
import api from '../../src/api/api.js'
import { useRouter } from "next/router";
import { AuthContext } from "../../context/AuthContext.jsx";

const title = "Login";
const btnText = "Login Now";

const Login = () => {
  const router = useRouter()
  const {user, setUser} = useContext(AuthContext)
  const [showPassword, setShowPassword] = useState(false);

  const [state, setState] = useState({
    email: '',
    password: ''
  })

  const handleInput = (e) => {
    const {name, value} = e.target;
    setState((prev) => ({...prev, [name]: value}))
  }

  const handleLogin = async(e) => {
    e.preventDefault()
    try{
      const {data} = await api.post('/customer/customer-login', state, {withCredentials: true});

      const res = await api.get("/customer/me",  {withCredentials: true})
      setUser(res.data.user);

      toast.success(
        `Login Successfully`,
        { duration: 2500 }     
      )

      router.push('/')
    }catch(err){
      toast.error(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div>
      <div className='login-section padding-tb section-bg' style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <div className="container">
          <div className="account-wrapper">
            <h3 className='title'>{title}</h3>
            <form className='account-form' onSubmit={handleLogin}>
              <div className='form-group'>
                <input onChange={handleInput} type='email' name = "email" id = "email" placeholder='Email *' required/>
              </div>
              <div className='form-group'>
                <input onChange={handleInput} type={showPassword ? "text" : "password"} name = "password" id = "password" placeholder='Password *' required/>
              </div>

              <div className='form-group'>
                <div className="d-flex justify-content-between flex-wrap pt-sm-2">
                  <div className="checkgroup">
                    <input type = "checkbox" name = "remember" id = "remember" onChange={() => setShowPassword(prev => !prev)}/>
                    <label htmlFor="remember">Show Password</label>
                  </div>
                  <Link href = "/forgetpass">Forget Password?</Link>
                </div>
              </div>
              
              <div className="form-group">
                <button type="submit" className="d-block lab-btn">
                  <span>{btnText}</span>
                </button>
              </div>
            </form>

            {/* account button */}
            <div className="account-bottom">
              <span className="d-block cate pt-10">
                Don&apos;t have an account? <Link href = "/sign-up">Sign Up</Link>
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
