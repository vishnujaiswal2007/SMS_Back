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

    static login = async (req, res) => {
        const client = new MongoClient(URL)
        const database = client.db("SMS_login")
        var myobj = req.body

        if (myobj.username === '' || myobj.password === '') {
            res.status(200).send({
                'status': 'sucess',
                'message': 'Credentails should be filled properly'
            })
        } else {
            var check = await database.collection('users').findOne({
                email: myobj.username,
            })

            if (check) {
                var isMatch = await bcrypt.compare(myobj.password, check.password)

                if (check && isMatch) {
                    //Generation of User token
                    const token = jwt.sign({
                        userID: check._id
                    }, process.env.JWT_SECRET_KEY, {
                        expiresIn: '1d'
                    })
                    // res.cookie('jwt', token)
                    // res.set('Authorization', 'Bearer '+ token);
                    res.status(200).send({
                        'status': 'sucess',
                        'message': 'Swagat hai',
                        'token': token
                    })

                    //    return res.status(200).json({token:token}).send({
                    //         'status': 'sucess',
                    //         'message': 'Swagat hai',
                    //     })
                } else {
                    res.status(201).send({
                        'status': 'failed',
                        'message': 'Please check the credentials'
                    })
                }

            } else {
                res.status(201).send({
                    'status': 'failed',
                    'message': 'Please Sing UP'
                })
            }


        }
        // res.status(200).send({'status':'sucess', 'message': myobj })
    }

    static changepassword = async (req, res) => {
        var htok = req.headers
        console.log("token is ", htok)
        res.status(200).send({
            'status': 'sucess',
            'message': 'All is well',
        })
    }

    static getdetails = async (req, res) => {
        console.log(req.body);
        res.status(200).send({
            'status': 'sucess',
            'message': 'details will get you soon'
        })
    }

    static getcourse = async (req, res) => {
            const client = new MongoClient(URL)
            const database = client.db("COURSES")
           var check = await database.collection('TRY').find({}).toArray(function(err,result){
                if (err) throw err;
                    return result
            })
            res.status(200).send({
                'status':'sucess',
                check})

    }

}

export default userController