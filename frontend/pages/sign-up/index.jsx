import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Link from "next/link";
import { useRouter } from "next/router";

import {Amplify} from "aws-amplify";
import awsExports from "../../src/aws-exports"
Amplify.configure(awsExports)

import { signUp } from "aws-amplify/auth";

const title = "Register Now";
const socialTitle = "Register With Social Media";
const btnText = "Get Started Now";

const Signup = () => {
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  // login with email password
  const handleSignup = async (event) => {
    event.preventDefault();
    const form = event.target;
    const username = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
      setErrorMessage("Passwords doesn't match! Please provide correct password");
    } else {
      setErrorMessage(""); 
      try{
        console.log(username, password, email)
        const {isSignUpComplete, userId, nextStep} = await signUp({
          username, password,
          options: {
            userAttributes: {email: email}
          }
        })
        alert("Signup Successful! Please enter the confirmation code sent to your email.");
        if (typeof window !== "undefined") {
          localStorage.setItem("username", username)
        }

        router.push("/confirmation-code");
      }
      catch(error){
        setErrorMessage("Error signing up: " + error.message);
      }
    }
  };



  return (
    <div>
      <div className="login-section padding-tb section-bg">
        <div className="container">
          <div className="account-wrapper">
            <h3 className="title">{title}</h3>
            <form className="account-form" onSubmit={handleSignup}>
              <div className="form-group">
                <input type="text" name="name" placeholder="User Name" />
              </div>
              <div className="form-group">
                <input type="email" name="email" placeholder="Email" />
              </div>
              <div className="form-group">
                <input type="password" name="password" placeholder="Password" />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                />
              </div>
              {/* showing error message */}
              <div>
                {errorMessage && (
                  <div className="error-message text-danger">
                    {errorMessage}
                  </div>
                )}
              </div>
              <div className="form-group">
                <button className="lab-btn">
                  <span>{btnText}</span>
                </button>
              </div>
            </form>
            <div className="account-bottom">
              <span className="d-block cate pt-10">
                Are you a member? <Link href="/login">Login</Link>
              </span>
 
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;