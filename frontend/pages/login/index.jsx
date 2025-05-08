import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import toast from 'react-hot-toast'
import api from '../../src/api/api.js'
import { useRouter } from "next/router";

const title = "Login";
const btnText = "Login Now";

const Login = () => {
  const router = useRouter()

  const [state, setState] = useState({
    email: '',
    password: ''
  })

  const handleInput = (e) => {
    e.preventDefault()
    setState(
      ...state,
      setState(
        ...state,
        [e.target.name] = e.target.value
      )
    )
  }

  const handleLogin = async() => {
    try{
      const {data} = await api.post('/customer/customer-login', state, {withCredentials: true});
      toast.success(
        `Login Successfully`,
        { duration: 2500 }     
      )
      localStorage.setItem('customerToken', data.token)
      router.push('/')
    }catch(err){
      toast.error(err.response?.data?.error || 'Login failed')
      console.error(err.message)
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
                <input onChange={handleInput} type='password' name = "password" id = "password" placeholder='Password *' required/>
              </div>

              <div className='form-group'>
                <div className="d-flex justify-content-between flex-wrap pt-sm-2">
                  <div className="checkgroup">
                    <input type = "checkbox" name = "remember" id = "remember"/>
                    <label htmlFor="remember">Remember Me</label>
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
