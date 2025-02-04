import React from 'react'
const subTitle = "🎉 Discover the Magic of Play!"

const title = (
    <h2 className='title'>Join us for a fun-filled day of exciting toys at unbeatable prices. <b><span> Explore, play, and find your next favorite toy!</span></b></h2>
)

const desc = "No time limit—just endless fun! 🚀🎁🧸";
const Register = () => {
  return (
    <section className='register-section padding-tb pb-0'>
        <div className='container'>
            <div className='row g-4 row-cols-lg-2 row-cols-1 align-items-center'>
                <div className='col'>
                    <div className='section-header'>
                        <span className='subtitle'>{subTitle}</span>
                        {title}
                        <p>{desc}</p>
                    </div>
                </div>

                <div className='col'>
                    <div className='section-wrapper'>
                        <h4>Register Now</h4>
                        <form className='register-form'>
                            <input type = "text" name = "name" placeholder='Username' className='reg-input'/>
                            <input type = "email" name = "email" placeholder='Email' className='reg-input'/>
                            <input type = "number" name = "number" placeholder='Phone' className='reg-input'/>
                            <button onClick={login} type='submit' className='lab-btn' style={{background : "#DCA54A"}}>
                                Register Now
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>
  )
}

export default Register