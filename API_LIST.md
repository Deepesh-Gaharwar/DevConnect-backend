# DevConnect APIs

 ## authRouter
- POST /signup
- POST /login
- POST /logout


 ## profileRouter
- GET /profile/view
- PATCH /profile/edit
- PATCH /profile/forgot-password

 
 ##  connectionRequestRouter   
- POST /request/send/interested/:userId
- POST /request/send/ignored/:userId

    - Make status dynamic to work for interested and ignored
- POST /request/send/:status/:userId 

- POST /request/review/accepted/:requestId
- POST /request/review/rejected/:requestId

    - Make status dynamic to work for interested and ignored
- POST /request/review/:status/:requestId    

  
 ##  userRouter
- GET /user/connections
- GET /user/requests/received
- GET /user/feed - Gets you the profiles of other users on platform

 ## Status: ignore, interested, accepted, rejected
