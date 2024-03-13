import './css/password.css';
import React, {useState, useEffect }  from 'react'
import {useNavigate} from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { clearErrors, socio_User_Password_Update } from "../../../utils/actions/UserAction.js";
import { UPDATE_USER_PASSWORD_RESET } from "../../../utils/constants/Constants.js";

const PasswordUpdate = () => {

  const dispatch = useDispatch();
  const history = useNavigate();
  const { error, isUpdated, loading } = useSelector((state) => state.profile);

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleOnSubmit = (e) =>{
    e.preventDefault();
    if(formData.newPassword!==formData.confirmPassword){
      alert(`Confirm password not match`)
      return
    }
    dispatch(socio_User_Password_Update(formData)).then(()=>{
      alert('Password Updated.')
      history("/user/timeline");
    })
  }

  const handleOnChange = (e) =>{
    e.preventDefault();
    setFormData({...formData, 
      [e.target.name]: e.target.value})
  }

  useEffect(() => {
    if (error) {
      alert(error);
      dispatch(clearErrors());
    }
    if (isUpdated) {
      dispatch({
        type: UPDATE_USER_PASSWORD_RESET,
      });
    }
  }, [dispatch, error, isUpdated]);

  return (
    <>
      {loading ? (
        <>Loading...</>
      ) : (
        <>
        <div className='password-container'>
          <div className='password-card'>
            <h3>Password Update</h3>
            <form onSubmit={handleOnSubmit}>
              <input 
                type="password" name='oldPassword' placeholder='Your Old Password'  
                value={formData.oldPassword} onChange={handleOnChange}
                autoComplete="off" required/>
              <br/>
              <input 
                type="password" name='newPassword' placeholder='New Password' 
                value={formData.newPassword} onChange={handleOnChange}
                autoComplete="off" required/>
              <br/>
              <input 
                type="password" name='confirmPassword' placeholder='Confirm Password' 
                value={formData.confirmPassword} onChange={handleOnChange}
                autoComplete="off" required/>
              <br/>
              <button type='submit'>Submit</button><br/>
            </form>
          </div>
        </div>
      </>
      )}
    </>
  )
}

export default PasswordUpdate