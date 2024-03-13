import './css/user-friend.css';
import React, {useEffect} from 'react';
// import '../main/css/left-right.css';
// import '../main/css/user-card.css';
import { useDispatch, useSelector} from 'react-redux';
import { socio_Load_User, clearErrors} from '../../../utils/actions/UserAction.js';
import userpro from '../../img/user1.png';

import { MdEmail, MdLocationOn, MdContactPage, MdWork } from 'react-icons/md';
import { FaUserFriends } from 'react-icons/fa';

const UserProfile = () => {
  const dispatch = useDispatch();
  const { error, user, loading } = useSelector(state=> state.user);
  const { usera } = useSelector(state=> state.friends);

  useEffect(()=>{
    if(error){
      dispatch(clearErrors)
    }
    if(!user){
      dispatch(socio_Load_User)
    }
  },[dispatch, error, loading, user])

  return (
    <>
      <div className='left-right-container'>
        <div className='left-right-box-card'>
          <div className='user-card-details'>
            <img src={userpro} alt="User_Profile"/>
            <h3>{user? <>{user.firstName+' '+user.lastName}</>: <>-</>}</h3>
            <hr/><br/>
            <p><b><MdEmail/></b>&ensp;&ensp;{user? <>{user.email}</>: <>--</>}</p>
            <p><b><MdContactPage/></b>&ensp;&ensp;{user ?<>{user.contact}</>: <>--</>}</p>
            <p><b><MdWork/></b>&ensp;&ensp;{user?<>{user.occupation}</>: <>-</>}</p>
            <p><b><MdLocationOn/></b>&ensp;&ensp;{user?<>{user.location}</>: <>-</>}</p>
            <hr/><br/>
            <p><b><FaUserFriends/></b>&ensp;&ensp;{user?<>{usera.friends.length}</>: <>-</>}</p>
            <br/>
          </div>
        </div>
      </div>
    </>
    // }
    // </>
  )
}

export default UserProfile;