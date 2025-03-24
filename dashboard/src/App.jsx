import logo from './logo.svg';
import './App.css';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import Router from './router/Router';
import publicRoutes from './router/routes/publicRoutes';
import {getRoutes} from './router/routes'

function App() {
  const dispatch = useDispatch()
  const {token} = useSelector(state => state.auth)

  const [allRoutes, setAllRoutes] = useState([...publicRoutes])

  useEffect(() => {
    const routes = getRoutes()
    setAllRoutes([...allRoutes, routes])
  }, [])

  // useEffect(() => {
  //   if(token){
  //     dispatch(get_user_info())
  //   }
  // }, [token])

  return <Router allRoutes = {allRoutes}/>
}

export default App;
