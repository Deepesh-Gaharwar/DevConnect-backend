const express = require("express");
const {connectDB} = require("./DB/db.js");
const app = express();
// requiring models
const {User} = require("./models/user.js");
const {validateSignUpData} = require("./utils/validation.js");
const bcrypt = require("bcrypt");
const validator = require("validator");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { userAuth } = require("./middlewares/auth.js")



app.use(express.json()); // to read the json data coming from the request to body

app.use(cookieParser()); // to read the cokkies 


// /signup -> route

app.post("/signup",async (req,res) => {
  
    try{ 

     // validation of the data
       validateSignUpData(req);


     //encrypt the password

     const {firstName, lastName, emailId, password} = req.body;

      const passwordHash = await bcrypt.hash(password,10);
      

 
     // creating a new instance of the user Model 
       const user = new User ({
         firstName,
         lastName,
         emailId,
         password : passwordHash,
       });

        await user.save();

        res.status(200).send("User added successfully");

        console.log("User added successfully");
        
    }catch(err){
       res.status(400).send("Error :"+ err.message) ; 
    }
   
    

});


// login route handler 
app.post("/login", async (req,res) => {

    try {

       const {emailId, password} = req.body;
     
       // is emailId valid 
       if(!validator.isEmail(emailId)){
       
               throw new Error("Email is not valid!");
       
        }

       // whether the user is in the DB , then check for the password compare i.e.,correct or not

       const user = await User.findOne({emailId : emailId});

       if(!user){
         throw new Error("Invalid credentials!")

        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(isPasswordValid){
            
            // create a JWT token

            const token = await jwt.sign({ _id : user._id} , "DEV@Tinder$790", { expiresIn : "1d",});


            // add the token to cookie and send the response back to the user

            res.cookie("token",token, { expires : new Date(Date.now() + 8 * 3600000) });

            res.status(200).send("Login successfull!");
        }else{
            throw new Error("Invalid credentials!");
        }
        
    } catch (error) {
        res.status(400).send("Error :" +error.message);
        
    }
})

// profile route handler
app.get("/profile", userAuth, async (req,res) => {

    try{

        const user = req.user; // coming from the userAuth middleware req obj

        res.status(200).send(user);

    } catch(error){
         
        res.status(400).send("Error :" + error.message);
    }
})


// post - send connection request

app.post("/sendConnectionRequest",userAuth, async (req,res) => {

    // we can read the user who is sending the request beacause userAuth middleware attach the user with the request obj

    const user = req.user;

    // sending a connection request
    console.log("Sending a connection request");

    res.status(200).send(user.firstName +" sent the connection request!") 
})

// Database connection

connectDB().then( () => {
    console.log("Databse connection established successfully !!!");

    app.listen(3000, () => {
    console.log("Server is successfully listening on port 3000...")

    });

}).catch(err => {
    console.log("Databse cannot be connected !!!",err.message);
})