import './App.css';
import React, {useEffect} from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Header
import Header from './components/header/Header';
// Home page
import PostsHome from './components/main/maincard/PostsHome';
import UserCard from './components/main/maincard/UserCard';
// Authentication
import SignUp from './components/auth/SignUp';
import SignIn from './components/auth/SignIn';
// User Profile and routes
import UserProfile from './components/user/profile/UserProfile';
import UserProfileUpdate from './components/user/profile/UserProfileUpdate';
import PasswordUpdate from './components/user/password/PasswordUpdate';
import ForgotPassword from './components/user/password/ForgotPassword';
import ResetPassword from './components/user/password/ResetPassword';

//
import { useSelector } from 'react-redux';


function App() {
  const history = useNavigate()
  const { isAuthenticated } = useSelector(state=> state.user);

  useEffect(()=>{
    if(!isAuthenticated){
      history('/')
    }
  }, [isAuthenticated])

  return (
    <>
      <Header/>
      <Routes>
        {isAuthenticated ?
          <>
            <Route exact path='/posts' element={<PostsHome/>} />
            <Route exact path='/user/timeline' element={<UserCard/>} />
            <Route exact path='/user/profile' element={<UserProfile/>} />
            <Route exact path='/user/profile/update' element={<UserProfileUpdate/>} />
            <Route exact path='/user/password/update' element={<PasswordUpdate/>} />
          </>  
          : <>     
            <Route exact path='/' element={<SignUp/>} />
            <Route exact path='/signin' element={<SignIn/>} />
            <Route exact path='/user/password/forgot' element={<ForgotPassword/>} />
            <Route exact path='/user/password/reset' element={<ResetPassword/>} />
          </>
        }
      </Routes>
    </>

  );
}

export default App;
