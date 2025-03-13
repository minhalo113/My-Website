import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Link from "next/link";

import {Amplify} from "aws-amplify";
import awsExports from "../../src/aws-exports"
Amplify.configure(awsExports)

import {signIn} from "aws-amplify/auth";
import { useRouter } from "next/router";
import { useDispatch } from 'react-redux';

const title = "Login";
const btnText = "Login Now";

const Login = () => {
  const [errorMessage, seterrorMessage] = useState("");
  
  const dispatch = useDispatch()

  const router = useRouter();

  const handleLogin = async (event) => {
    event.preventDefault();
    const form = event.target;
    const username = form.username.value;
    const password = form.password.value;

    try{
      const {isSignedIn, nextStep} = await signIn({
        username, password
      })
      
      router.push("/")
    }catch(error){
      seterrorMessage(error.message);
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
                <input type='username' name = "username" id = "username" placeholder='Username *' required/>
              </div>
              <div className='form-group'>
                <input type='password' name = "password" id = "password" placeholder='Password *' required/>
              </div>

              <div>
                {
                  errorMessage && (
                    <div className="error-message text-danger mb-1">
                      {errorMessage}
                    </div>
                  )
                }
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
