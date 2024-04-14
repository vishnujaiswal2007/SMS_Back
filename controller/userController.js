import dotenv from 'dotenv'
dotenv.config()
var URL = process.env.Data_URL;

import {MongoClient} from 'mongodb'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


class userController {
    static userRegistration = async (req, res) => {
        var myobj = req.body;
        // Create a new client and connect to MongoDB
        const client = new MongoClient(URL);
        run();
        async function run(){
            try {
                // Connect or create the database and access its collection/table
                const database = client.db("SMS_login");

                // Insert the defined document into the collection/table
                const result = await database.collection("users").insertOne(myobj);
                await client.close();

            } catch (error) {
                console.log("Error in Data base Connection is ", error);
            }
        }



        // var MongoClient = require('mongodb').MongoClient;
        // MongoClient.connect(URL, function (err,db){
        //   if(err) throw err
        //   var dbo = db.db("User_login")
        //   dbo.collection("users").in
        //   dbo.collection("users").insertOne(myobj, function(err, res){
        //     if(err) throw err
        //     db.close();
        //   })

        // })

        res.status(200).send({
            "status": "sucess",
            "message": "Data Saved Sucessfully: Your account will active shortly"
        })
        // console.log("front end connected with backend");
    }

}

export default userController