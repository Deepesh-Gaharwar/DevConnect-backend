const jwt = require("jsonwebtoken");
const { User } = require("../models/user");

const userAuth = async(req,res,next) => {

    try {
        
      // read the token from the req cookies 

      const cookies = req.cookies;
      const { token } = cookies;

      if(!token){
         throw new Error("Token is not valid!");
      }

      // validate the token

      const decodedObj = await jwt.verify(token,"DEV@Tinder$790");
      
     // Find the user

      const { _id } = decodedObj;

      const user = await User.findById(_id);

      if(!user){
        throw new Error("User not found")
      }

      req.user = user; // attaching the user with the req obj

      next();

    } catch (error) {
        res.status(400).send("Error :" + error.message);
    }
    
}

module.exports = {
    userAuth,
}