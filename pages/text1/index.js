import Banner from '../home/Banner'
const text1 = () => {
    return (
        <div>
            <Banner/>
            <h3>
                Welcome to my Website
            </h3>
            <p><a href = 'https://us-east-1zjbgfg7tm.auth.us-east-1.amazoncognito.com/login?client_id=5k1uk7jbp55fkbfmq1kdjatglj&response_type=code&scope=email+openid+phone&redirect_uri=https%3A%2F%2Fmain.d2rwr6ixqr9l2i.amplifyapp.com'>Register or Login</a></p>
        </div>
    )
}

export default text1