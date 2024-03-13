import './css/postStyle.css';
// import './css/showpost.css';
import React, {useEffect} from 'react';
import { BsGlobeCentralSouthAsia } from 'react-icons/bs';
import { AiFillLike } from 'react-icons/ai';
import { MdDeleteForever } from 'react-icons/md';
// import { FaUserPlus, FaUserMinus } from 'react-icons/fa';

import {useSelector, useDispatch} from 'react-redux';
import { clearError, socio_Deleting_User_Post, socio_Get_All_Posts, socio_Like_Dislike_User_Post } from '../../../utils/actions/PostAction.js';
// import { socio_Load_User } from '../../utils/actions/UserAction';

//  

const ShowPosts = ({data}) => {
  const dispatch = useDispatch();
  const { error, loading } = useSelector(state=> state.posts);
  const { user } = useSelector(state=> state.user);

  const handleOnClickLike = (e) => {
    e.preventDefault();
    dispatch(socio_Like_Dislike_User_Post(data._id))
  }

  const handleOnClickDeletePost = (e) => {
    e.preventDefault();
    dispatch(socio_Deleting_User_Post(data._id)).then(()=> dispatch(socio_Get_All_Posts))
  }

  // const handleOnClickFollow = (e)=>{
  //   e.preventDefault()
  //   alert(`You followed this user`)
  // }

  useEffect(()=>{
    if(error){
      dispatch(clearError);
    }
  },[dispatch, error, loading])

  return (
    <>
      <div className='post-card-container'>
        <div className='post-card-user-details'>

          {/* Left */}
          <div className='post-card-user-details-image'>
            <img src={data.user.picturePath} alt='user_profile'/>
          </div>
          {/* Mid */}
          <div className='post-card-user-details-name'>
            <h3>{data.user.firstName}{' '}{data.user.lastName}</h3>
            <h6><BsGlobeCentralSouthAsia/>&ensp;<i>{data.user.location}</i></h6>
            <hr style={{width: '100%', margin: '2% 0% 0%'}}/>
          </div>
          {/* Right */}
          <div className='post-card-user-options'>
            { user && data && data.user._id === user._id.toString() 
              ? 
                <>
                  &ensp;
                  <button onClick={handleOnClickDeletePost}
                    style={{backgroundColor: 'white', color: 'red', border: 'none', fontSize:'1.5em'}}>
                    <MdDeleteForever/>
                  </button> 
                </>
              : <></>
            } 
          </div>
        </div>
        <div className='user-post-desImage-details'>
          <p>{data.description}</p>
          <img src={data.picturePath} alt={data.picturePath}/>
        </div>
        <div className='card-user-post-activity'>
          <hr/>
          <button 
            style={ user && data && data['likes'].includes(user._id) ? { backgroundColor:'blue', color: 'white'} : {}}
            onClick={handleOnClickLike}><AiFillLike/> {data.likes.length}
          </button>
        </div>
      </div>
      <br/>
    </>

  )
}

export default ShowPosts