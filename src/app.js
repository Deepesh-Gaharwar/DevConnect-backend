const express = require("express");

const app = express();

app.get("/getUserData", (req,res) => {
 
 // always use try-catch block 

    try {
       // logic of DB call and get User Data
       throw new Error("dsjccbdj");
       res.send("User Data Send");
        
    } catch (error) {
        res.status(500).send("Some Error contact support team");

        // 2nd method 
       // res.status(500).send(error.message);
    }


    
});

// some applications use this method of handling the errors

app.use("/", (err,req,res,next) => {
    if(err){

        // log your error message 
        res.status(500).send("Something went wrong");
    }
})


app.listen(3000, () => {
    console.log("Server is successfully listening on port 3000...")
});