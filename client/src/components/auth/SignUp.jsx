import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { useDispatch, useSelector} from 'react-redux';
import {socio_Sign_Up, clearErrors} from '../../utils/actions/UserAction.js';
import './auth.css';

const SignUp = () => {
  const history = useNavigate();
  const dispatch = useDispatch();
  const { error, loading, isAuthenticated } = useSelector(state=>state.user);
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email:'',
    password: ''
  })
  const handleOnChange = (e)=>{
    setUser(prev=>({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleOnSubmit = (e) =>{
    e.preventDefault();
    dispatch(socio_Sign_Up(user.firstName, user.lastName, user.email, user.password))
      .then(()=> {
        console.log('signup page')
        history('/signin')
      })
  }

  useEffect(()=>{
    if(error){
      dispatch(clearErrors);
    }
  },[dispatch, error, isAuthenticated, loading])
  return (
    <>
        <div className='auth-container'>
          <div className='auth-left'>
            <h1>Welcome</h1>
          </div>
          <div className='auth-right'>
          <h2>Sign Up</h2>
            <form onSubmit={handleOnSubmit}>
            <input type="text" name='firstName' value={user.firstName} onChange={handleOnChange} placeholder='First Name' autoComplete="off"/><br/>
                <input type="text" name='lastName' value={user.lastName} onChange={handleOnChange} placeholder='Last Name' autoComplete="off"/><br/>
                <input type="email" name='email' value={user.email} onChange={handleOnChange} placeholder='Email' autoComplete="off"/><br/>
                <input type="password" name='password' value={user.password} onChange={handleOnChange} placeholder='Password' autoComplete="off"/><br/>     
                <input type="text" name="confirm_password" placeholder='Confirm Password' required/>  <br/>
                <button type='submit'>Sign Up</button>      
            </form>
            <p>Already have a account! <Link to='/signin'>Signin</Link></p>
          </div>
        </div>
      </>
  )
}

export default SignUp