import './css/postStyle.css';
import React, {useState, useEffect} from 'react';
// import './css/createpost.css';
// import './css/showpost.css';
import {useNavigate} from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { socio_Create_Post, socio_Get_All_Posts, clearError } from '../../../utils/actions/PostAction.js'
import { socio_Load_User } from '../../../utils/actions/UserAction.js';
import { BsGlobeCentralSouthAsia } from 'react-icons/bs';

const CreatePosts = () => {
  const dispatch = useDispatch();
  const history = useNavigate();
  const { error } = useSelector((state) => state.posts);
  const { user } = useSelector(state=> state.user);

  const [formData, setFormData] = useState({      
    description: '',
    picturePath: ''
  })

  const handleUploadPost = (e)=>{
    e.preventDefault();
    if(formData.description==='' && formData.picturePath===''){
      console.log('Data required')
    } else {
      dispatch(socio_Create_Post(formData)).then(()=>{
        dispatch(socio_Get_All_Posts).then(()=>{
          setFormData({ 
            description: '',
            picturePath: ''
          })
        }).then(()=>history("/posts"))      
      })
    }

  }

  const handleOnChange = (e) =>{
    e.preventDefault();
    setFormData({...formData, 
      [e.target.name]: e.target.value})
  }

  useEffect(() => {
    if (error) {
      alert(error);
      dispatch(clearError());
    }
  }, [dispatch, error]);

  return (
    <>
      <div className='post-card-container'>
        <div className='post-card-user-details'>
          {/* Left */}
          <div className='post-card-user-details-image'>
            <img src={user? user.picturePath: <></>} alt='user_profile'/>
          </div>
          {/* Mid */}
          <div className='post-card-user-details-name'>
            <h3>{user ?<>{user.firstName}{' '}{user.lastName}</>: <></>}</h3>
            <h6><BsGlobeCentralSouthAsia/>&ensp;<i>{user ?<>{user.location}</>: <></>}</i></h6>
          </div>
        </div>
        <form className='create-form-box'>
          <p>What's In Your Mind</p>
          <textarea type='text' name='description' placeholder='Express Yourself...' required
            value={formData.description} onChange={handleOnChange}>
          </textarea>
          <br/>
          <input type='file'/><br/>
          <button onClick={handleUploadPost}>Post</button>
        </form>
      </div>
    </>
  )
}

export default CreatePosts