import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

class userController {
    static userRegistration = async (req, res)=>{
        res.status(200).send({"status":"sucess", "message":"Data Saved Sucessfully: Your account will active shortly"})
        // console.log("front end connected with backend");
    }

}

export default userController