const {
  username_Existence_Check,
  is_Email_Existence_Check
} = require('./UserService');

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

  socket.on('disconnect', () => { console.log('user disconnected'); });
}

module.exports = socketConnection;