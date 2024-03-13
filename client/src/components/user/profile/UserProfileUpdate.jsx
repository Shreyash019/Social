import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { clearErrors, socio_User_Profile_Update, socio_Get_All_Users } from "../../../utils/actions/UserAction.js";
import { UPDATE_USER_PROFILE_RESET } from "../../../utils/constants/Constants.js";

import './css/user.css';
import userpro from '../../img/user1.png';

import {BsPersonFill} from 'react-icons/bs';
import {MdOutlineWork, MdLocationOn, MdContactPage } from 'react-icons/md';
import { socio_Get_All_Posts } from '../../../utils/actions/PostAction';

const UserProfileUpdate = () => {
  const dispatch = useDispatch();
  const history = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { error, isUpdated, loading } = useSelector((state) => state.profile);

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    contact: user.contact,
    occupation: user.occupation,
    location: user.location,
  })


  const handleOnSubmit = (e) =>{
    e.preventDefault();
    dispatch(socio_User_Profile_Update(formData)).then(()=>{
      dispatch(socio_Get_All_Posts)
      dispatch(socio_Get_All_Users)
      history("/user/timeline")
    })
    
  }

  const handleOnChange = (e) =>{
    e.preventDefault();
    setFormData({...formData, 
      [e.target.name]: e.target.value})
  }

  useEffect(() => {
    if (error) {
      // alert(error);
      dispatch(clearErrors());
    }

    if (isUpdated) {
      dispatch({
        type: UPDATE_USER_PROFILE_RESET,
      });
    }
  }, [dispatch, error, isUpdated, loading ]);

  return (
    <>
      {loading ? (
        <>Loading...</>
      ) : (
        <>
      <div className='user-container'>
      <div className='user-left'>
        <div className='user-left-top'>
          <img src={userpro} alt="User_Profile" />
          <hr/>
        </div>
        <div className='user-left-bottom'>
        </div>
      </div>
      <div className='user-right'>
        <div className='user-details'>
        <h1>{user.firstName +' '+ user.lastName}</h1><br/><br/>
          <form onSubmit={handleOnSubmit}>
            <label htmlFor="firstName"><BsPersonFill/>&ensp;&ensp;</label>
            <input 
              type='text' name='firstName' placeholder='First Name'
              value={formData.firstName} onChange={handleOnChange}
            /><br/>
            
            <label htmlFor="lastName"><BsPersonFill/>&ensp;&ensp;</label>
            <input 
              type='text' name='lastName' placeholder='Last Name'
              value={formData.lastName} onChange={handleOnChange}
            /><br/>

            <label htmlFor="contact"><MdContactPage/>&ensp;&ensp;</label>
            <input 
              type='text' name='contact' placeholder='Contact'
              value={formData.contact} onChange={handleOnChange}
            /><br/>
            <label htmlFor="lastName"><MdOutlineWork/>&ensp;&ensp;</label>
            <input 
              type='text' name='occupation' placeholder='Occupation' 
              value={formData.occupation} onChange={handleOnChange}
            /><br/>
            <label htmlFor="location"><MdLocationOn/>&ensp;&ensp;</label>
            <input 
              type='text' name='location' placeholder='Location' 
              value={formData.location} onChange={handleOnChange}
            /><br/>
            <button>Update</button>
          </form>
        </div>
      </div>
    </div>
    </>
      )}
    </>
  )
}

export default UserProfileUpdate