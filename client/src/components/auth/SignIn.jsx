import React, {useEffect, useState}  from 'react'
import {Link, useNavigate} from 'react-router-dom';
import { useDispatch, useSelector} from 'react-redux';
import {socio_Sign_In, socio_Get_All_Users, clearErrors} from '../../utils/actions/UserAction.js';
import './auth.css';
import { socio_Get_All_Posts } from '../../utils/actions/PostAction.js';


const SignIn = () => {

  const dispatch = useDispatch();
  const history = useNavigate();
  const {error, loading, isAuthenticated } =  useSelector((state)=> state.user)
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleOnSubmit = async (e) =>{
    e.preventDefault();
    dispatch(socio_Sign_In(loginEmail, loginPassword))
      .then(()=> dispatch(socio_Get_All_Posts))
      .then(()=> dispatch(socio_Get_All_Users()))
      .then(()=> history('/posts'))
  }
  
  useEffect(()=>{
    if(error){
      dispatch(clearErrors)
    }
  },[dispatch, error, isAuthenticated, loading])

  return (
    <>
    {/* { loading ? 
      'Loading...': 
      <> */}
        <div className='auth-container'>
          <div className='auth-left'>
            <h1>Welcome</h1>
          </div>
          <div className='auth-right'>
            <h2>Sign In</h2><br/>  
            <form onSubmit={handleOnSubmit}>
              <input type="email" name='email' value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}  placeholder='Email' autoComplete="off"/><br/>
              <input type="password" name='password' value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder='Password' autoComplete="off"/><br/><br/>        
              <button type='submit'>Sign In</button>      
            </form>
            <p><Link to='/user/password/forgot'>Forgot Password</Link></p>
            <p>Don't have a account! <Link to='/signup'>Signup</Link></p>
          </div>
        </div>
      </>
    // }
    // </>
  )
}

export default SignIn