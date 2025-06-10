import dotenv from "dotenv";
dotenv.config();
var URL = process.env.Data_URL;

// import {createRequire} from 'module';
// var require = createRequire(import.meta.url);

import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transporter from "../config/emailconfig.js";

class userController {
  static userRegistration = async (req, res) => {
    var myobj = req.body;

    // Create a new client and connect to MongoDB
    const client = new MongoClient(URL);
    run();
    async function run() {
      try {
        // Connect or create the database and access its collection/table
        const database = client.db("SMS_login");
        const check = await database.collection("users").findOne({
          email: myobj.email,
        });

        if (check) {
          res.status(201).send({
            status: "failed",
            message: "Existing user. Please check the Username",
          });
        } else {
          if (
            myobj.f_name &&
            myobj.l_name &&
            myobj.email &&
            myobj.password &&
            myobj.repass
          ) {
            if (myobj.password === myobj.repass) {
              const salt = await bcrypt.genSalt(10);
              myobj.password = await bcrypt.hash(myobj.password, salt);
              myobj.repass = await bcrypt.hash(myobj.repass, salt);
              var result = await database.collection("users").insertOne(myobj);

              var Insertid = JSON.stringify(result.insertedId);
              var verify = JSON.stringify(result.acknowledged);

              if (verify == "true") {
                res.status(200).send({
                  status: "sucess",
                  message:
                    "Data Saved Sucessfully: Your account will active shortly",
                });
              } else {
                res.status(201).send({
                  status: "failed",
                  message: "Data is not saved!!",
                });
              }
            } else {
              res.status(201).send({
                status: "failed",
                message: "Password and Confinrmation of Password must be same",
              });
            }
          } else {
            res.status(201).send({
              status: "failed",
              message: "All Fields are required.",
            });
          }
        }
        await client.close();
      } catch (error) {
        console.log("Error in Data base Connection is ", error);
      }
    }
  };

  static login = async (req, res) => {
    const client = new MongoClient(URL);
    const database = client.db("SMS_login");
    var myobj = req.body;
    myobj.username = myobj.username.toLowerCase();
    if (myobj.username === "" || myobj.password === "") {
      res.status(200).send({
        status: "sucess",
        message: "Credentails should be filled properly",
      });
    } else {
      var check = await database.collection("users").findOne({
        email: myobj.username,
      });

      if (check) {
        var isMatch = await bcrypt.compare(myobj.password, check.password);

        if (check && isMatch) {
          //Generation of User token
          const token = jwt.sign(
            {
              userID: check._id,
            },
            process.env.JWT_SECRET_KEY,
            {
              expiresIn: "1d",
            }
          );
          // res.cookie('jwt', token)
          // res.set('Authorization', 'Bearer '+ token);
          res.status(200).send({
            status: "sucess",
            message: "Swagat hai",
            token: token,
          });

          //    return res.status(200).json({token:token}).send({
          //         'status': 'sucess',
          //         'message': 'Swagat hai',
          //     })
        } else {
          res.status(201).send({
            status: "failed",
            message: "Please check your Credentials. Thanks!!",
          });
        }
      } else {
        res.status(201).send({
          status: "failed",
          message: "Please check your Credentials. Thanks!!",
        });
      }
    }
    // res.status(200).send({'status':'sucess', 'message': myobj })
  };

  static changepassword = async (req, res) => {
    const myobj = req.body;
    if (myobj.oPass !== null) {
      var isMatch = await bcrypt.compare(myobj.oPass, req.user.password);
      if (isMatch) {
        const salt = await bcrypt.genSalt(10);
        const NewHashPassword = await bcrypt.hash(myobj.npass, salt);
        const client = new MongoClient(URL);
        await client.connect();
        const database = client.db("SMS_login");
        const collection = database.collection("users");
        await collection.findOneAndUpdate(
          { _id: new ObjectId(req.user._id) },
          { $set: { password: NewHashPassword } }
        );

        res.status(200).send({
          status: "sucess",
          message: "Password is updated",
        });
      } else {
        res.status(201).send({
          status: "Failes",
          message: "Existing password and current password does not match",
        });
      }
    } else {
      res.status(201).send({
        status: "Failed",
        message: "Old Password Should not be null",
      });
    }
  };

  static getdetails = async (req, res) => {
    const myobj = req.body
    const client = new MongoClient(URL)
    await client.connect();
    const database = client.db(myobj.COURSE)
    const query={
      YR:myobj.yr,
      EN:myobj.EN,
      PDF:"PDF",
    }
   const data = await database.collection(myobj.DB_CL).findOne(query);
    res.status(200).send({
      status: "sucess",
      message: "details will get you soon",
      data:data
    });
  };

  static getsem = async (req, res) => {
    const client = new MongoClient(URL);
    const database = client.db("COURSES");
    var data = await database
      .collection("COURSE_DETAILS")
      .find({ PRG_CODE: req.body.PRG }, { projection: { sem: 1, DB_CL:1, COURSE:1} })
      .toArray(function (err, result) {
        if (err) throw err;
        return result;
      });

    res.status(200).send({
      status: "sucess",
      data,
    });
  };

  static attendance = async (req, res) => {
    const client = new MongoClient(URL);
    const database = client.db("SMS_login");
    const alldata = await database
      .collection("attend")
      .find({})
      .toArray(function (err, result) {
        if (err) throw err;
        return result;
      });
    // console.log("Sara Data hai :", alldata)
    res.status(200).send({
      status: "sucess",
      alldata,
    });
  };

  static resetpass = async (req, res) => {
    const myobj = req.body;
    if (myobj.email) {
      const client = new MongoClient(URL);
      const database = client.db("SMS_login");
      const data = await database
        .collection("users")
        .findOne({ email: myobj.email });

      if (data) {
        const secret = data._id + process.env.JWT_SECRET_KEY;
        const token = jwt.sign({ userID: data._id }, secret, {
          expiresIn: "15m",
        });
        const link = `http://192.168.1.55:3000/reset/${data._id}/${token}`;
        //Send Email
        let info = await transporter.sendMail({
          from: "vishnujaiswal.2007@gmail.com",
          to: "vishnujaiswal.2007@gmail.com",
          subject: "DACC, UoA: Password Reset Link",
          html: `<a href=${link}>Click Here</a> to Reset your password`,
        });
        res.send({
          status: "sucess",
          message:
            "Your password reset link has been send to your REGISTERED email. Thanks..",
        });
      } else {
        res.send({
          status: "Failed",
          message: "Email is Unregistered",
        });
      }

      client.close();
    } else {
      res.status(201).send({
        status: "Failed",
        message: "Enter a Valid Registered Email-Id..eg (xyz@example.com)",
      });
    }
  };

  static reset = async (req, res) => {
    // console.log("Params are", req.params)
    // console.log("Body are", req.body)
    const client = new MongoClient(URL);
    const database = client.db("SMS_login");
    const user = await database
      .collection("users")
      .findOne({ _id: new ObjectId(req.params.id) });
    const secret = user._id + process.env.JWT_SECRET_KEY;
    try {
      const myobj = req.body;
      jwt.verify(req.params.token, secret);
      if (myobj.npass && myobj.cnfpass) {
        if (myobj.npass === myobj.cnfpass) {
          const salt = await bcrypt.genSalt(10);
          const newpass = await bcrypt.hash(myobj.npass, salt);
          await database
            .collection("users")
            .findOneAndUpdate(
              { _id: new ObjectId(user._id) },
              { $set: { password: newpass } }
            );
          res.send({
            status: "Sucess",
            message: "Your Password RESET Successfully",
          });
        } else {
          res.send({
            status: "Failed",
            message: "New and Confirm Password should be same",
          });
        }
      } else {
        res.send({
          status: "Failed",
          message: "All Fields are required",
        });
      }
    } catch (error) {
      console.log(error);
      res.send({
        status: "Failed",
        message: "Session Expired....",
      });
    }
  };

  static getcourse = async (req, res) => {
    const client = new MongoClient(URL);
    const database = client.db("COURSES");
    const data = await database
      .collection("COURSES")
      .find({ COURSE: req.params.CR })
      .toArray(function (err, result) {
        if (err) throw err;
        return result;
      });
    res.send({
      status: "sucess",
      message: "UG Courses",
      data,
    });
  };

  static getVerify = async (req, res) => {
    const myobj = req.body;
    try {
          const client = new MongoClient(URL);
          const database = client.db("UG");
          const qury = {
            YR: myobj.yr,
            EN: myobj.enrol,
            RN: myobj.rol,
            GT: myobj.gt,
            NM: myobj.cNm,
            GN: myobj.fNm,
            MN: myobj.mNm,
            PDF: "PDF",
          };
          const vdata = await database.collection(`${myobj.DB_CL}`).findOne(qury);
          if (vdata === null) {
            res.send({
              status: "Failed",
              message: "Data not found",
            });
          } else {
            res.status(200).send({
              status: "Sucess",
              message: "Data Verified",
              vdata,
            });
          }
    } catch (error) {
      console.log("The error from catch", error);
    }
  };

  static getDesig = async (req, res) => {
    const client = new MongoClient(URL);
    const database = client.db("SMS_login");
    const data = await database
      .collection("Designation")
      .find({ grp: req.body.grp })
      .toArray(function (err, result) {
        if (err) throw err;
        return result;
      });
    res.status(200).send({
      status: "Sucess",
      data,
    });
  };

  static updateRecord = async (req, res)=>{

    try {
      // console.log("Data for Update", req.body.EN)
      const CC = req.body.CC;
      const lastPart = CC.split(" ").pop(); // => "I"
      const romanToInt = (roman) => {
        const map = { I: 1, II: 2, III: 3 };
        return map[roman] || null;
      };
      // console.log(romanToInt(lastPart)); // Output: I
      const client = new MongoClient(URL);
      const database = client.db("COURSES")
      const program = await database.collection("COURSES").findOne({PRG_CODE:req.body.PRG_CODE})
      const PRG = program.DB_CL+romanToInt(lastPart)
      
      const database1 = client.db(program.COURSE)
      const candidate = database1.collection(PRG)
      await candidate.updateOne(
        { EN: req.body.EN, PDF: "PDF" },
        { $set: { PDF: "---" } }
      );
      // new data without _id
const dataToInsert = { ...req.body };
delete dataToInsert._id;

// Insert the new data as a new document
await candidate.insertOne(dataToInsert);
      // console.log("The Candidate is ", candidate)

    res.status(200).send({
      status:"Sucess",
      message:"All is well"
    })
      
    } catch (error) {
      console.log("Data for Update Error", error)
      res.status(400).send({
        status:"Failes",
        message:"Their is some PRB"
      })
    }
    

  }
}

export default userController;
