const Users = require('../models/User/Users');


const username_Existence_Check = async (username) => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = {};
      query['username'] = { $regex: new RegExp(`^${username.toLowerCase().trim(' ')}`) };
      let isUserName = await Users.findOne(query);
      if (isUserName) resolve(true);
      else resolve(false)
    } catch (err) {
      return reject(err);
    }
  });
};

const is_Email_Existence_Check = async (email) => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = {};
      query['email'] = { $regex: new RegExp(`^${email.toLowerCase().trim(' ')}`) };
      let isEmail = await Users.findOne(query);
      if (isEmail) resolve(true);
      else resolve(false)
    } catch (err) {
      return reject(err);
    }
  });
};

module.exports = {
  username_Existence_Check,
  is_Email_Existence_Check
}