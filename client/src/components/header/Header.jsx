import React, {useEffect}  from 'react'
import {Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {socio_Sign_Out, clearErrors } from '../../utils/actions/UserAction.js';
import './header.css';
// import { socio_Get_All_Posts } from '../../utils/actions/PostAction.js';

import { MdArrowDropDownCircle, MdPassword, MdEditSquare } from 'react-icons/md'
import {RiLoginCircleFill,RiLogoutCircleRFill, RiUser3Fill} from 'react-icons/ri'

const Header = () => {
  const history = useNavigate();
  const dispatch = useDispatch();
  const { error, user, isAuthenticated } = useSelector(state=> state.user);

  const handleLogout =(e) =>{
    e.preventDefault();
    alert('Logout')
    dispatch(socio_Sign_Out).then(()=>history('/'))
  }


  useEffect(()=>{
    if(error){
      dispatch(clearErrors);
    }
  },[dispatch, error, isAuthenticated])
  return (
    <div className='header-container'>
      <div className='header-left-content'>
        {
         isAuthenticated? <h1><Link to="/posts">SOCIO</Link></h1>: <h1><Link to="/">SOCIO</Link></h1> 
        }
      
      </div>
      <div className='header-right-content'>
        { !isAuthenticated && 
          <>
            <h1><Link to="/">Sign Up</Link></h1> 
            <h1><Link to="/signin">Sign In</Link></h1>
          </>
        }
        { isAuthenticated ?
          <>
            <h1><Link to='/user/timeline'><>{user? <><RiUser3Fill/></>: <>-</>}</></Link></h1>
            <h1><Link to='/user/profile/update'><MdEditSquare/></Link></h1>
            <h1><Link to='/user/password/update'><MdPassword/></Link></h1>
            <h1><Link to='/' onClick={handleLogout}><RiLogoutCircleRFill/></Link></h1>
          </>
          : <></>
        }
      </div>
    </div>
  )
}

export default Header