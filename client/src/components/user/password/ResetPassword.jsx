import React from 'react';
import './css/password.css';
import '../../auth/auth.css';

const ResetPassword = () => {
  return (
    <div className='password-container'>
        <div className='password-card'>
        <h3>Reset Password</h3>
        <form>
            <input type="password" name="new_password" placeholder="New Password" autoComplete="off" required/><br/>
            <input type="password" name="confirm_password" placeholder="Confirm Password" autoComplete="off" required/><br/>
            <button type='submit'>Submit</button>
        </form>
        </div>
    </div>
  )
}

export default ResetPassword