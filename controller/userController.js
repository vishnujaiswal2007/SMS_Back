import dotenv from 'dotenv'
dotenv.config()
var URL = process.env.Data_URL;

// import {createRequire} from 'module';
// var require = createRequire(import.meta.url);

import {
    MongoClient
} from 'mongodb'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'



class userController {
    static userRegistration = async (req, res) => {
        var myobj = req.body

        // Create a new client and connect to MongoDB
        const client = new MongoClient(URL);
        run();
        async function run() {
            try {
                // Connect or create the database and access its collection/table
                const database = client.db('SMS_login')
                const check = await database.collection("users").findOne({
                    email: myobj.email
                })

                if (check) {

                    res.status(201).send({
                        "status": "failed",
                        "message": "Existing user. Please check the Username"
                    })
                } else {
                    if (myobj.f_name && myobj.l_name && myobj.email && myobj.password && myobj.repass) {
                        if (myobj.password === myobj.repass) {
                            const salt = await bcrypt.genSalt(10)
                            myobj.password = await bcrypt.hash(myobj.password, salt)
                            myobj.repass = await bcrypt.hash(myobj.repass, salt)
                            var result = await database.collection("users").insertOne(myobj);

                            var Insertid = JSON.stringify(result.insertedId)
                            var verify = JSON.stringify(result.acknowledged)

                            if (verify == "true") {
                                res.status(200).send({
                                    "status": "sucess",
                                    "message": "Data Saved Sucessfully: Your account will active shortly"
                                })
                            } else {
                                res.status(201).send({
                                    "status": "failed",
                                    "message": "Data is not saved!!"
                                })
                            }
                        } else {
                            res.status(201).send({
                                "status": "failed",
                                "message": "Password and Confinrmation of Password must be same"
                            })
                        }
                    } else {
                        res.status(201).send({
                            "status": "failed",
                            "message": "All Fields are required."
                        })
                    }

                }
                await client.close();

            } catch (error) {
                console.log("Error in Data base Connection is ", error);
            }

        }
    }

}

export default userController