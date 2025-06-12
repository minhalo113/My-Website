import React, {useState} from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '../../src/api/api.js'

const ForgetPass = () => {
    const [email, setEmail] = useState('');

    const handleSubmit = async(e) => {
        e.preventDefault();
        try{
            const {data} = await api.post('/customer/forgot-password', {email});
            toast.success(data.message);
        }catch(err){
            toast.error(err.response?.data?.error || "Failed to reset password");
        }
    }

    return (
        <div className='login-section padding-tb section-bg' style={{height:'100vh',display:'flex',justifyContent:'center',alignItems:'center'}}>
        <div className='container'>
          <div className='account-wrapper'>
            <h3 className='title'>Forgot Password</h3>
            <form className='account-form' onSubmit={handleSubmit}>
              <div className='form-group'>
                <input type='email' name='email' placeholder='Enter your email' required onChange={(e)=>setEmail(e.target.value)} />
              </div>
              <div className='form-group'>
                <button type='submit' className='d-block lab-btn'><span>Send</span></button>
              </div>
            </form>
            <div className='account-bottom'>
              <span className='d-block cate pt-10'>
                <Link href='/login'>Back to Login</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    )
}

export default ForgetPass;