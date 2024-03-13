import './css/mainCardStyle.css';
// import './css/posthome.css';
import React, {useState, useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import { clearError } from '../../../utils/actions/PostAction.js';
import ShowPosts from '../posts/ShowPosts.jsx';
import CreatePosts from '../posts/CreatePosts.jsx';
import Friends from '../../user/profile/Friends.jsx';
import UserProfile from '../../user/profile/UserProfile.jsx';
// import { socio_Load_User } from '../../utils/actions/UserAction';

const UserCard = () => {
  const dispatch = useDispatch();
  const [scnWidth, setWidth] = useState({
    winWidth: window.innerWidth,
    winHeight: window.innerHeight,
  });
  const { user } = useSelector(state=> state.user);
  const { error, loading, posts } = useSelector(state=> state.posts);

  const screenSize = (e)=>{
    setWidth({
      winWidth: window.innerWidth,
      winHeight: window.innerWidth,
    })
  }

  useEffect(()=>{
    if(error){
      dispatch(clearError);
    }
    window.addEventListener('resize', screenSize)
    return() =>{
      window.removeEventListener('resize', screenSize)
    }
  },[dispatch, error])
  return (
    <>
      <div className='main-box-container'>
        <div className='main-box-left'>
         {scnWidth.winWidth<751 ?<><UserProfile/><br/><Friends/></> : <><UserProfile/></>}
        
        </div>
        <div className='main-box-mid'>
          <CreatePosts/>
          {loading ? 'Loading...': <>
            { posts && posts.map((post) => (<>{user._id.toString()===post.user._id? <ShowPosts key={post._id} data={post}/>: <>{}</>}</>          ))}
          </>}
          <br/>
        </div>
        <div className='main-box-right'>
          {scnWidth.winWidth<751 ?<></> : <><Friends/></>}
        </div>
      </div>
    </>
  )
}

export default UserCard