import './css/user-friend.css';
import React, {useEffect} from 'react';
// import './css/left-right.css';
import { useDispatch, useSelector} from 'react-redux';
import { socio_Get_All_Users, socio_Send_Cancel_Friend_Request, socio_User_Friend_Accept, socio_User_Friend_Remove, clearErrors } from '../../../utils/actions/UserAction.js';
import { FaUserMinus, FaUserCheck, FaUserPlus, FaUserTimes } from 'react-icons/fa';

const Friends = () => {
  const dispatch = useDispatch();
  const { users, usera, error } = useSelector(state=> state.friends);

  const handleSendCancelFriendRequest = (ops, uid) => {
    dispatch(socio_Send_Cancel_Friend_Request(ops, uid))
    alert(`Friend request ${ops}`)
  }

  const handleFriendRequestAccept = (uid) => {
    dispatch(socio_User_Friend_Accept(uid))
    alert(`Friend request accepted.`)
  }

  const handleUserFriendRemove = (uid) => {
    dispatch(socio_User_Friend_Remove(uid))
    alert(`Friend remove.`)
  }

  useEffect(()=>{
    if(error){
      dispatch(clearErrors)
    }
    if(!users){
      dispatch(socio_Get_All_Users)
    }
  },[dispatch, error, users])

  return (
    <>
      <div className='left-right-container'>
        <div className='left-right-box-card'>
          <div className='friend-card-details'>
          <h3>Friends</h3>
            {
              users && usera? 
                <>
                  { users.map((usr)=>{
                    return <>{usera.friends.includes(usr.id)? 
                      <p key={usr.id} ><button  className='card-user-friend friend-button-Style' 
                        onClick={()=>handleUserFriendRemove(usr.id)}><FaUserMinus/></button>
                        &ensp;&ensp;{usr.firstName+" "+usr.lastName} 
                      </p>
                    :<></>}</>
                  })}
                </>
                :<></>
            }

          <h3>Pending Request</h3>
          {
              users && usera? 
                <>
                  { users.map((usr)=>{
                    return <>{usera.pendingFriends.includes(usr.id)? 
                      <p key={usr.id} >
                        <button onClick={()=>handleFriendRequestAccept(usr.id)} className='card-user-friend pending-button-Style'><FaUserCheck/></button>&ensp;
                        <button onClick={()=>handleSendCancelFriendRequest('cancel', usr.id)} className='card-user-friend pending-button-Style' style={{backgroundColor: 'rgb(255, 168, 168)'}}><FaUserTimes/></button>
                        &ensp;&ensp;{usr.firstName+" "+usr.lastName} 
                    </p>
                    :<></>}</>
                  })}
                </>
                :<></>
            }

          <h3>Users</h3>
            {
              users && usera? 
                <>
                  { users.map((usr)=>{
                    return  (
                      <p key={usr.id}>
                        {usera.friends.includes(usr.id)? 
                          <>
                            <button  className='card-user-friend friend-button-Style' onClick={()=>handleUserFriendRemove(usr.id)}><FaUserMinus/></button>&ensp;&ensp;{usr.firstName+" "+usr.lastName}
                          </>
                          :<>
                            {usera.sentFriend.includes(usr.id)?
                              <>
                                <button onClick={()=>handleSendCancelFriendRequest('undo', usr.id)} className='card-user-friend pending-button-Style' style={{backgroundColor: 'rgb(255, 168, 168)'}}><FaUserTimes/></button>&ensp;&ensp;{usr.firstName+" "+usr.lastName}
                              </>
                              :<>
                                {usera.pendingFriends.includes(usr.id)?
                                  <>
                                    <button onClick={()=>handleSendCancelFriendRequest('cancel', usr.id)} className='card-user-friend pending-button-Style' style={{backgroundColor: 'rgb(255, 168, 168)'}}><FaUserTimes/></button>&ensp;&ensp;{usr.firstName+" "+usr.lastName}
                                  </>
                                  :<>
                                    <button onClick={()=>handleSendCancelFriendRequest('add', usr.id)} className='card-user-friend user-button-Style'><FaUserPlus/></button>&ensp;&ensp;{usr.firstName+" "+usr.lastName}
                                  </>
                                }
                              </>
                            }
                          </>
                        }
                      </p>
                    )}
                  )}
                </>
                :<></>
            }
          </div>
        </div>
    </div>
    </>

  )
}

export default Friends;