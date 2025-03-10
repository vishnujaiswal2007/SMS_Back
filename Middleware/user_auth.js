import jwt from 'jsonwebtoken'
import { MongoClient, ObjectId } from 'mongodb';
var URL = process.env.Data_URL;

var checkUserAuth = async (req, res, next )=> {
// console.log("the Headers is ", req.headers.authorization)
// console.log("the body parameters", req.body)
const { authorization } = req.headers
if(authorization && authorization.startsWith('Bearer')){
try {
    //get token from headers
    let token = authorization.split(' ')[1]
    //veify token
    const { userID } = jwt.verify(token, process.env.JWT_SECRET_KEY)
    const client = new MongoClient(URL)
    await client.connect()
    const database = client.db("SMS_login")
    const collection = database.collection('users');
//Data Without Password  
    // req.user = await collection.findOne({ _id:new ObjectId(userID)}, { projection: { password: 0 , repass:0} })
//Data With Password
req.user = await collection.findOne({ _id:new ObjectId(userID)})
    next()
} catch (error) {
    console.log(error)
}
}else{
    res.status(401).send({
        status: 'Failed',
        message:'Kindly re-login. Session Expired!!'
    })
}
}
export default checkUserAuth
