import authToken from '../utils/authToken';

const {
  username_Existence_Check,
  is_Email_Existence_Check
} = require('./UserService');

const {
  follow_UnFollow_A_User,
  followers_Followings_Count
} = require('../controllers/commonSocketService');

function socketConnection(io, socket) {

  // Checking for username uniqueness
  socket.on('is_Username_Exist', async (username) => {
    let msg;
    let isUsername = await username_Existence_Check(username)
    if (!isUsername) {
      msg = {
        success: true,
        message: 'Username available'
      }
    } else {
      msg = {
        success: false,
        message: 'Username not available'
      }
    }
    io.to(socket.id).emit('is_Username_Exist', msg);
  })

  // Checking for email uniqueness
  socket.on('is_Email_Exist', async (email) => {
    let msg;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailTest = emailRegex.test(email);
    if(emailTest){
      let user = await is_Email_Existence_Check(email)
      if (!user) {
        msg = {
          success: true,
          message: 'Email available'
        }
      } else {
        msg = {
          success: false,
          message: 'Email not available'
        }
      }
    } else {
      msg = {
        success: false,
        message: 'Not an Email Address!'
      }
    }
    const user = await is_Email_Existence_Check(email)

    io.to(socket.id).emit('is_Email_Exist', msg);
  })

  // following/Unfollowing a user
  socket.on('follow_unfollow', async (receiveData) => {
    let msg;
    if (!socket.handshake.headers.authorization) {
      msg = {
        success: false,
        message: 'Unauthorized Access.'
      }
    } else {
      const token = socket.handshake.headers.authorization.split(' ')[1];
      const authorization = await authToken.verifyAuthenticatedUser(token);
      if (authorization.verified) {
        if (authorization.user_Id) {
          let dtType = typeof (receiveData) === 'string' ? true : false;
          if (!dtType) {
            msg = {
              success: false,
              message: 'Bad request type.'
            }
          } else {
            const isResponse = await follow_UnFollow_A_User(authorization.user_Id, receiveData);
            if (isResponse.success) {
              msg = {
                success: true,
                message: `You ${isResponse.msgType}`,
              }
            } else {
              msg = {
                success: false,
                message: 'Internal server error.'
              }
            }
          }
        } else {
          msg = {
            success: false,
            message: 'Bad request type.'
          }
        }
      } else {
        msg = {
          success: false,
          message: 'Bad request type.'
        }
      }
    }
    io.to(socket.id).emit('follow_unfollow', msg)
  })

  // followers/followings count
  socket.on('follow_unfollow_Count', async (user_Id) => {
    let dtType = typeof (user_Id) === 'string' ? true : false;
    let msg;
    if (!dtType) {
      msg = {
        status: false,
        message: 'Bad request type.'
      }
    } else {
      const isResponse = await followers_Followings_Count(user_Id);
      if (isResponse.success) {
        msg = {
          status: true,
          message: `Your followers and following counts`,
          data: isResponse.data
        }
      } else {
        msg = {
          status: false,
          message: 'Internal server error.'
        }
      }
    }
    io.to(socket.id).emit('follow_unfollow_Count', msg)
  })


  socket.on('disconnect', () => { console.log('user disconnected'); });
}

export default socketConnection;