import React, { useContext, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";
import api from "../../src/api/api";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const title = "Register Now";
const socialTitle = "Register With Social Media";
const btnText = "Get Started Now";

const Signup = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const {user, setUser} = useContext(AuthContext)
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  // signup with email password
  const handleSignup = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
      setErrorMessage("Passwords doesn't match! Please provide correct password");
    } else {
      setErrorMessage(""); 
      try{
        const {data} = await api.post('/customer/customer-register', {name, email, password}, {withCredentials: true} )

        const res = await api.get('/customer/me', {withCredentials: true})
        setUser(res.data.user)

        toast.success(data.message);
        router.push("/");
      }
      catch(error){
        const msg = error?.response?.data?.error || "Unexpected error occurred.";
        setErrorMessage("Error signing up: " + msg);
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
                <input type="text" name="name" placeholder="Full Name" />
              </div>
              <div className="form-group">
                <input type="email" name="email" placeholder="Email" />
              </div>
              <div className="form-group">
                <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" />
              </div>
              <div className="form-group">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
              />
              </div>

              <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  onChange={() => setShowPassword(prev => !prev)}
                />
                Show Password
              </label>
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