import {Amplify} from "aws-amplify";
import awsExports from "../../src/aws-exports"
Amplify.configure(awsExports)

import { useEffect, useState } from "react";

import {confirmSignUp } from "aws-amplify/auth";
import { useRouter } from "next/router";

const ConfirmationCode  = () => {
    const [errorMessage, setErrorMessage] = useState("");
    const [enteredUsername, setUserName] = useState("");
    const router = useRouter();

    useEffect(() => {
        if(typeof window !== "undefined"){
            const storedUsername = localStorage.getItem("username");
            if (storedUsername){
                setUserName(storedUsername);
            }
        }
    }, [])

    const handleSignUpConfirmation = async (event) => {
        event.preventDefault();
 
        try {
        console.log(enteredUsername)
        console.log(event.target.code.value)
        const { isSignUpComplete, nextStep } = await confirmSignUp({
            username: enteredUsername,
            confirmationCode: event.target.code.value
        });

        alert("Account verified successfully! You can now log in.");
        if (typeof window !== "undefined") {
            localStorage.removeItem("username");
        }
        router.push("/login"); 
    
        } catch (error) {
        console.log(error.message)
        setErrorMessage("Error confirming sign up: " + error.message);
        }
    };
     
    return (
        <div className="padding-tb section-bg"  style={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
        <div className="container">
            <div className="account-wrapper">
            <form onSubmit={handleSignUpConfirmation}>
            <div className="form-group">
            <input type = "text" name = "code" placeholder="Enter Confirmation Code" required>
            </input>
            </div>
            <div className="form-group">
                <button className="lab-btn" type = "submit">Confirm Account</button>
            </div>
            </form>
            </div>
            </div>
            </div>
    )
}   

export default ConfirmationCode;