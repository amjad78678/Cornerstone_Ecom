const User = require('../models/userModel');





const isLogin=async(req,res,next)=>{
      try {
        if (req.session.userId){
 const userData = await User.findById({_id:req.session.userId})


           if(userData && userData.is_Blocked==true){
            req.session.destroy()
            res.redirect('/userSignIn')
           }else{
            next();
           }
       
        }else{
          res.redirect('/userSignIn')
        }
        
    
      } catch (error) {
        console.log(error.message)
      }
}
//------------------------------------------------------------------------------------------
const isLogout = async (req, res, next) => {
    try {
        if (req.session.userId) {
            res.redirect('/home');
        } else {
            next();
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports={
    isLogin,
    isLogout
}