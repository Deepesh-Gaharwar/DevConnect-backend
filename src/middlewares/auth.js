const jwt = require("jsonwebtoken");
const { User } = require("../models/user");
require("dotenv").config();

const userAuth = async(req,res,next) => {

  const JWT_SECRET = process.env.JWT_SECRET;

    try {
        
      // read the token from the req cookies 

      const cookies = req.cookies;
      const { token } = cookies;

      if(!token){
        return res.status(401).send("Please Login!");
      }

      // validate the token

      const decodedObj = await jwt.verify(token,JWT_SECRET);
      
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