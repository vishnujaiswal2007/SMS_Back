import dotenv from "dotenv";
dotenv.config();
var URL = process.env.Data_URL;

// import {createRequire} from 'module';
// var require = createRequire(import.meta.url);

import { Int32, MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transporter from "../config/emailconfig.js";
import fs from "fs";
import * as XLSX from "xlsx";
import { url } from "inspector";

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
            message: "Existing user! This email is already registered",
          });
        } else {
          if (
            myobj.fname &&
            myobj.lname &&
            myobj.email &&
            myobj.password &&
            myobj.repassword
          ) {
            if (myobj.password === myobj.repassword) {
              const salt = await bcrypt.genSalt(10);
              myobj.password = await bcrypt.hash(myobj.password, salt);
              myobj.repassword = await bcrypt.hash(myobj.repassword, salt);

              const { repassword, ...rest } = myobj;
              const remain = { ...rest };

              var result = await database.collection("users").insertOne(remain);

              var Insertid = JSON.stringify(result.insertedId);
              var verify = JSON.stringify(result.acknowledged);

              if (verify == "true") {
                res.status(200).send({
                  status: "sucess",
                  message:
                    "Data Saved Sucessfully: Your email is your User Name",
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
    const myobj = req.body;
    const client = new MongoClient(URL);
    await client.connect();
    const database = client.db(myobj.COURSE);
    const query = {
      YR: myobj.yr,
      EN: myobj.EN,
      PDF: "PDF",
    };
    const data = await database.collection(myobj.DB_CL).findOne(query);
    res.status(200).send({
      status: "sucess",
      message: "details will get you soon",
      data: data,
    });
  };

  static getsem = async (req, res) => {
    const client = new MongoClient(URL);
    if (req.body?.TYPE === "NEP") {
      const database = client.db("NEP");
      var data = await database
        .collection("CourseDetails")
        .find({ PRG_CODE: req.body.PRG })
        .toArray();
    } else {
      const database = client.db("COURSES");
      var data = await database
        .collection("COURSE_DETAILS")
        .find(
          { PRG_CODE: req.body.PRG },
          { projection: { sem: 1, DB_CL: 1, COURSE: 1 } }
        )
        .toArray(function (err, result) {
          if (err) throw err;
          return result;
        });
    }
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
        const link = `http://192.168.1.55:4000/reset/${data._id}/${token}`;
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
    if (req.params.type === "NEP") {
      const database = client.db("NEP");
      const data = await database
        .collection("CourseName")
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
    } else {
      const database = client.db("COURSES");
      const data = await database
        .collection("COURSES")
        .find({ COURSE: req.params.CR, TYPE: req.params.type })
        .toArray(function (err, result) {
          if (err) throw err;
          return result;
        });
      res.send({
        status: "sucess",
        message: "UG Courses",
        data,
      });
    }
  };

  static getPapers = async (req, res) => {
    const myobj = req.body;
    const client = new MongoClient(URL);
    const database = client.db("NepUG");

    const students = await database
      .collection(myobj.DB_CL + "_RESULT")
      .find({
        Session: myobj.session,
        $or: [
          { MajorDiscipline1: myobj.discp },
          { MajorDiscipline2: myobj.discp },
          { MinorDiscipline: myobj.discp },
        ],
      })
      .toArray();

    let allMajorPapers = [];
    let allMinorPapers = [];

    for (const stu of students) {
      if (stu.MajorDiscipline1 === myobj.discp) {
        if (stu.MajorDspcipline1Paper1Obtained === "") {
          allMajorPapers.push(stu.MajorDspcipline1Paper1);
        }
        if (stu.MajorDspcipline1Paper2Obtained === "") {
          allMajorPapers.push(stu.MajorDspcipline1Paper2);
        }
        if (stu.MajorDspcipline1Paper3Obtained === "") {
          allMajorPapers.push(stu.MajorDspcipline1Paper3);
        }
      } else if (stu.MajorDiscipline2 === myobj.discp) {
        if (stu.MajorDspcipline2Paper1Obtained === "") {
          allMajorPapers.push(stu.MajorDspcipline2Paper1);
        }
        if (stu.MajorDspcipline2Paper2Obtained === "") {
          allMajorPapers.push(stu.MajorDspcipline2Paper2);
        }
        if (stu.MajorDspcipline2Paper3Obtained === "") {
          allMajorPapers.push(stu.MajorDspcipline2Paper3);
        }
      } else if (stu.MinorDiscipline === myobj.discp) {
        if (stu.MinorDisciplinePaperObtained === "")
          allMinorPapers.push(stu.MinorDisciplinePaper);
      }
    }

    // Remove duplicates
    const uniqueMajorPapers = [...new Set(allMajorPapers)];
    const uniqueMinorPapers = [...new Set(allMinorPapers)];

    //  console.log("Papers are", uniquePapers);

    if (myobj.MajMin === "Major") {
      res.send({
        status: "sucess",
        message: "OK",
        data: uniqueMajorPapers,
      });
    } else if (myobj.MajMin === "Minor") {
      res.send({
        status: "sucess",
        message: "OK",
        data: uniqueMinorPapers,
      });
    } else {
      res.send({
        status: "sucess",
        message: "OK",
        data: { uniqueMajorPapers, uniqueMinorPapers },
      });
    }
  };

  static getDiscipline = async (req, res) => {
    const myobj = req.body;

    // console.log("Body", myobj)

    const client = new MongoClient(URL);
    const database = client.db("NepUG");
    const students = await database
      .collection(myobj.DB_CL + "_RESULT")
      .find({ Session: myobj.session })
      .toArray();

    // console.log("Discipline", students [3]);

    let allMajorDiscipline = [];
    let allMajorPracticalDiscipline = [];
    let allMinorDiscipline = [];
    let allMinorPracticalDiscipline = [];

    // let allMajorPapers = [];
    // let allMinorPapers = [];

    for (const stu of students) {

      //Major Discipline 1
      if (stu.MajorDiscipline1) allMajorDiscipline.push(stu.MajorDiscipline1);

      //Major Without Practical Discipline 1
      if (stu.MajorDiscipline1 && stu.descipline1MajorPracticleMax!=="") allMajorPracticalDiscipline.push(stu.MajorDiscipline1);
      
      
      //Major Discipline 2
      if (stu.MajorDiscipline1) allMajorDiscipline.push(stu.MajorDiscipline2);

      //Major  Without Practical Discipline 2
      if (stu.MajorDiscipline2 && stu.descipline2MajorPracticleMax!=="") allMajorPracticalDiscipline.push(stu.MajorDiscipline2);

      //Minor  Without Practical Discipline
      if (stu.MinorDiscipline ) allMinorDiscipline.push(stu.MinorDiscipline);
    
      //Minor  Without Practical Discipline
      if (stu.MinorDiscipline && 
        stu.MinorDisciplinePracticalMax!=="") allMinorPracticalDiscipline.push(stu.MinorDiscipline);

    }

    
    // Remove duplicates
    const uniqueMajorDisciplines = [...new Set(allMajorDiscipline)];
    const uniqueMinorDisciplines = [...new Set(allMinorDiscipline)];
    const uniqueMajorPracticalDiscipline = [...new Set(allMajorPracticalDiscipline)]
    const uniqueMinorPracticalDiscipline = [...new Set(allMinorPracticalDiscipline)]

    // console.log("Desicipline are", uniqueDisciplines);



    if (myobj.MajMin === "Major" && myobj.EndInt==="Practical") {
      res.send({
        status: "sucess",
        message: "OK",
        data: uniqueMajorPracticalDiscipline,
      });
    } else  if (myobj.MajMin === "Major") {
      res.send({
        status: "sucess",
        message: "OK",
        data: uniqueMajorDisciplines,
      });
    } else if (myobj.MajMin === "Minor" && myobj.EndInt==="Practical") {
      res.send({
        status: "sucess",
        message: "OK",
        data: uniqueMinorPracticalDiscipline,
      });
    } else if (myobj.MajMin === "Minor") {
      res.send({
        status: "sucess",
        message: "OK",
        data: uniqueMinorDisciplines,
      });
    } else {
      res.send({
        status: "sucess",
        message: "OK",
        data: { uniqueMajorDisciplines, uniqueMinorDisciplines },
      });
    }



    // if (myobj.MajMin === "Major") {
    //   res.send({
    //     status: "sucess",
    //     message: "OK",
    //     data: uniqueMajorDisciplines,
    //   });
    // } else if (myobj.MajMin === "Minor") {
    //   res.send({
    //     status: "sucess",
    //     message: "OK",
    //     data: uniqueMinorDisciplines,
    //   });
    // } else {
    //   res.send({
    //     status: "sucess",
    //     message: "OK",
    //     data: { uniqueMajorDisciplines, uniqueMinorDisciplines },
    //   });
    // }
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

  static updateRecord = async (req, res) => {
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
      const database = client.db("COURSES");
      const program = await database
        .collection("COURSES")
        .findOne({ PRG_CODE: req.body.PRG_CODE });
      const PRG = program.DB_CL + romanToInt(lastPart);
      const database1 = client.db(program.COURSE);
      const candidate = database1.collection(PRG);
      await candidate.updateOne(
        { EN: req.body.EN, PDF: "PDF" },
        { $set: { PDF: "---" } }
      );
      // new data without _id
      const dataToInsert = { ...req.body };
      delete dataToInsert._id;

      // Insert the new data as a new document
      const ack = await candidate.insertOne(dataToInsert);
      // console.log("The Acknowledge is ", ack)

      if (ack.acknowledged === true) {
        res.status(200).send({
          status: "Sucess",
          message: "Profile Updated Succesfully",
        });
      } else {
        res.status(400).send({
          status: "Failed",
          message: "Unable to update profile",
        });
      }
    } catch (error) {
      console.log("Data for Update Error", error);
      res.status(400).send({
        status: "Failes",
        message: "Contact System Manager",
      });
    }
  };

  static CbcsUgProfile = async (req, res) => {
    try {
      console.log("File size (bytes):", req.file);

      res.status(200).send({
        status: "Sucess",
        message: "All is well",
      });
    } catch (error) {
      res.status(400).send({
        status: "Failes",
        message: "Their is some PRB",
      });
    }
  };

  static GenerateRollNumberNEP = async (req, res) => {
    try {
      // getting year
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);

      // getting Course Code and Unit
      const client = new MongoClient(URL);
      const database = client.db("CODE");
      const courseCode = await database
        .collection("PRGCODE")
        .findOne({ CPRG: req.body.PRG });
      const unit = await database
        .collection("UNITCODE")
        .findOne({ Unit_Name: req.body.unit });
      await client.close();

      // semester
      const semester = JSON.parse(req.body.sem);

      const romanToNumber = {
        I: 1,
        II: 2,
        III: 3,
        IV: 4,
        V: 5,
        VI: 6,
        VII: 7,
        VIII: 8,
        IX: 9,
        X: "X",
      };
      const roman = [semester.sem];
      const result = roman.map((r) => romanToNumber[r]);

      // Roll Number Prefix
      const PreRN = year + unit.NEP_CODE + courseCode.PRG_CODE + result[0];

      //get starting number
      database = client.db("ROLL_LIMIT");
      // const sRN = database.collection()

      // console.log("Unit Data ", unit)
      // console.log("Course Code", courseCode)
      // console.log("Request body", req.body)

      // const fileBuffer = req.file.buffer
      // const workbook = XLSX.read(fileBuffer, {type: "buffer"})
      // const sheetName = workbook.SheetNames[0]
      // const sheet = workbook.Sheets[sheetName]
      // const data = XLSX.utils.sheet_to_json(sheet);

      // console.log("Excel data loaded:", data.length, "rows");

      // -----------------------------
      // LGIC To Generate ROLL-NUMBER
      // -----------------------------
      //take the year number eg. 2025=> 25
      // const lastOfYear = String(year).slice(2);

      // -----------------------------
      // HELPER FUNCTION – GENERATE NEXT CE
      // -----------------------------
      // function generateNextCE(currentCE) {
      //   const yearPart = currentCE.slice(2, 4);
      //   let numberPart = parseInt(currentCE.slice(4));
      //   numberPart++;
      //   return `CE${yearPart}${String(numberPart).padStart(6, "0")}`;
      // }

      // -----------------------------
      // FETCH LAST CE SAFELY
      // -----------------------------
      // const CeDB = client.db("CENUMBER");
      // const lastRow = await CeDB.collection(`CE${lastOfYear}`)
      //   .find({})
      //   .sort({ _id: -1 })
      //   .limit(1)
      //   .toArray();

      // let currentCE;

      // if (lastRow.length > 0) {
      //   let lastCE = String(lastRow[0]._id).trim();

      //   const validCEPattern = /^CE\d{8}$/;

      //   if (validCEPattern.test(lastCE)) {
      //     let nextNum = parseInt(lastCE.slice(4)) + 1;
      //     currentCE = `CE${lastOfYear}${String(nextNum).padStart(6, "0")}`;
      //   } else {
      //     console.log("INVALID CE FOUND IN DB:", lastCE);
      //     console.log("Resetting and starting fresh.");
      //     currentCE = `CE${lastOfYear}000001`;
      //   }
      // } else {
      //   currentCE = `CE${lastOfYear}000001`;
      // }
      // GENERATE NEXT CE FOR NEXT ROW
      // currentCE = generateNextCE(currentCE);

      // -----------------------------
      // SAVE LAST CE USED IN DB
      // -----------------------------
      // await CeDB.collection(`CE${lastOfYear}`).insertOne({
      //   _id: currentCE,
      //   createdAt: formattedDate,
      // });

      res.status(200).send({
        status: "Sucess",
        message: "All is well",
      });
    } catch (error) {
      res.status(400).send({
        status: "Failes",
        message: "Their is some PRB",
      });
    }
  };

  static AdmissionNepUG = async (req, res) => {
    let client;

    try {
      client = new MongoClient(URL);
      await client.connect();

      // -----------------------------
      // BASIC DATE INFO
      // -----------------------------
      const date = new Date();
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      const lastOfYear = String(year).slice(2);
      const nextofYear = parseInt(lastOfYear) + 1;

      const PRG_CODE = req.body.PRG;

      // -----------------------------
      // READ EXCEL
      // -----------------------------
      const fileBuffer = req.file.buffer;
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      let wrongRows = [];
      let recordsToInsert = [];

      // -----------------------------
      // PROCESS EACH ROW
      // -----------------------------
      let program;
      for (const row of data) {
        const CoursesDB = client.db("COURSES");
        const CodeDB = client.db("CODE");
        const discipline = client.db("NEP");
        const paper = client.db("NEP");

        //--------------
        //Discipline
        //-----------
        const disciplineMajor1 = await discipline
          .collection("Discipline")
          .findOne({ Number_Code: row.sb11 });
        const disciplineMajor2 = await discipline
          .collection("Discipline")
          .findOne({ Number_Code: row.sb12 });
        const disciplineMinor = await discipline
          .collection("Discipline")
          .findOne({ Number_Code: row.sb13 });

        // console.log("Discp1", disciplineMajor1)

        //-------------------
        //Discipline Paper marks details
        //--------------------
        const disciplineMajor1Details = await discipline
          .collection("DiciplineDetails")
          .findOne({ DISCIPLINE: disciplineMajor1?.DISCIPLINE });
        const disciplineMajor2Details = await discipline
          .collection("DiciplineDetails")
          .findOne({ DISCIPLINE: disciplineMajor2?.DISCIPLINE });
        const disciplineMinorDetails = await discipline
          .collection("DiciplineDetails")
          .findOne({ DISCIPLINE: disciplineMinor?.DISCIPLINE });

        // console.log("Discp1MinorDetails", disciplineMinorDetails)
        // console.log("Discp2Details", disciplineMajor2Details)
        // console.log("Discp3Details", disciplineMinorDetails)

        //-------------
        //Major and Minor Papers of Major Minor Discipline
        //-----------
        const paperMajorDiscipline1 = await paper
          .collection("PaperDetails")
          .find({
            CBCS_CATEGORY: "MAJOR",
            String_Code: disciplineMajor1?.String_Code,
          })
          .toArray();
        // const paperMinorDiscipline1 = await paper.collection("PaperDetails").findOne({CBCS_CATEGORY:"MINOR", String_Code: disciplineMajor1?.String_Code})

        const paperMajorDiscipline2 = await paper
          .collection("PaperDetails")
          .find({
            CBCS_CATEGORY: "MAJOR",
            String_Code: disciplineMajor2?.String_Code,
          })
          .toArray();
        // const paperMinorDiscipline2 = await paper.collection("PaperDetails").findOne({CBCS_CATEGORY:"MINOR", String_Code: disciplineMajor2?.String_Code})

        const paperMinorDiscipline = await paper
          .collection("PaperDetails")
          .findOne({
            CBCS_CATEGORY: "MINOR",
            String_Code: disciplineMinor?.String_Code,
          });

        // console.log("Paper", paperMajorDiscipline1)

        program = await CoursesDB.collection("COURSES").findOne({
          CourseNameCode: row.cc,
          TYPE: "NEP",
        });

        // WRONG PROGRAM
        if (!program || program.PRG_CODE !== PRG_CODE) {
          wrongRows.push(row);
          continue;
        }

        const unit = await CodeDB.collection("UNITCODE").findOne({
          Unit_Code: row.uc,
        });

        if (!unit) {
          wrongRows.push(row);
          continue;
        }

        // INSERT CLEAN DATA
        recordsToInsert.push({
          Profile: {
            Session: year + "-" + nextofYear,
            FormNumber: row.fn,
            CuetRollNumber: row.trn,
            ProgrameName: program.Full_Form,
            Unit: unit ? unit.Unit_Name : null,
            EnrolmentNumber: row.en,
            Name: row.nm,
            FatherName: row.gn,
            MotherName: row.mn,
            ABCIdNumber: row.abc,
            Gender: row.gen,
            SocialCategory: row.scat,
            AdharNumber: row.adhar,
            DateofBirth: row.dob,
            YearOfAdmission: year,
            DateOfModification: "",
            DateofCreation: formattedDate,
            PDF: "PDF",
          },

          Result: {
            Session: year + "-" + nextofYear,
            EnrolmentNumber: row.en,
            RollNumber: row.rn,
            YearCategory: "Regular",
            //Discipline 1
            ...(disciplineMajor1?.DISCIPLINE && {
              MajorDiscipline1: disciplineMajor1.DISCIPLINE,
            }),

            ...(disciplineMajor1Details?.DISCIPLINE && {
              descipline1MajorCiaMax:
                disciplineMajor1Details?.MajorCiaMax || "",
              descipline1MajorCiaObtained: "",
              descipline1MajorPracticleMax:
                disciplineMajor1Details?.MajorPracticleMax || "",
              descipline1MajorPracticleObtained: "",
              descipline1MajorPracticleCreditMax:
                disciplineMajor1Details?.MajorPracticleCreditMax || "",
              descipline1MajorPracticleCreditObtained: "",
              descipline1MajorTotalMax:
                disciplineMajor1Details?.MajorTotalMax || "",
              descipline1MajorTotalObtained: "",
              descipline1MajorTotalCreditMax:
                disciplineMajor1Details?.MajorTotalCreditMax || "",
              descipline1MajorTotalCreditObtained: "",
            }),

            //Discipline 1 Major Paper 1

            ...(paperMajorDiscipline1[0]?.COURSE_NAME && {
              MajorDspcipline1Paper1: paperMajorDiscipline1[0].COURSE_NAME,
              MajorDspcipline1Paper1Max:
                disciplineMajor1Details?.Major1Max || "",
              MajorDspcipline1Paper1Obtained: "",
              MajorDspcipline1Paper1CreditMax:
                disciplineMajor1Details?.Major1CreditMax || "",
              MajorDspcipline1Paper1CreditObtained: "",
            }),

            //Discipline 1 Major Paper 2

            ...(paperMajorDiscipline1[1]?.COURSE_NAME && {
              MajorDspcipline1Paper2: paperMajorDiscipline1[1].COURSE_NAME,
              MajorDspcipline1Paper2Max:
                disciplineMajor1Details?.Major2Max || "",
              MajorDspcipline1Paper2Obtained: "",
              MajorDspcipline1Paper2CreditMax:
                disciplineMajor1Details?.Major2CreditMax || "",
              MajorDspcipline1Paper2CreditObtained: "",
            }),

            //Discipline 1 Major Paper 3

            ...(paperMajorDiscipline1[2]?.COURSE_NAME && {
              MajorDspcipline1Paper3: paperMajorDiscipline1[2].COURSE_NAME,
              MajorDspcipline1Paper3Max:
                disciplineMajor1Details?.Major3Max || "",
              MajorDspcipline1Paper3Obtained: "",
              MajorDspcipline1Paper3CreditMax:
                disciplineMajor1Details?.Major3CreditMax || "",
              MajorDspcipline1Paper3CreditObtained: "",
            }),

            //Discipline 1 Minor

            //  ...(paperMinorDiscipline1?.COURSE_NAME && {
            //   MajorDspcipline1Minor: paperMinorDiscipline1.COURSE_NAME,
            //   descipline1Minor1Max: disciplineMajor1Details?.Minor1Max||"",
            //   descipline1Minor1CreditMax: disciplineMajor1Details?.Minor1CreditMax||"",
            //   descipline1Minor1CiaMax: disciplineMajor1Details?.Minor1CiaMax||"",
            //   descipline1Minor1PracticalMax:disciplineMajor1Details?.Minor1PracticalMax||"",
            //   descipline1Minor1PracticalCreditMax:disciplineMajor1Details?.Minor1PracticalCreditMax||"",
            //   descipline1MinorTotalMax: disciplineMajor1Details?.MinorTotalMax||"",
            //   descipline1MinorCreditMax: disciplineMajor1Details?.MinorCreditMax||"",
            //  }),

            //Discipline 2
            ...(disciplineMajor2?.DISCIPLINE && {
              MajorDiscipline2: disciplineMajor2.DISCIPLINE,
            }),

            ...(disciplineMajor2Details?.DISCIPLINE && {
              descipline2MajorCiaMax:
                disciplineMajor2Details?.MajorCiaMax || "",
              descipline2MajorCiaObtained: "",
              descipline2MajorPracticleMax:
                disciplineMajor2Details?.MajorPracticleMax || "",
              descipline2MajorPracticleObtained: "",
              descipline2MajorPracticleCreditMax:
                disciplineMajor2Details?.MajorPracticleCreditMax || "",
              descipline2MajorPracticleCreditObtained: "",
              descipline2MajorTotalMax:
                disciplineMajor2Details?.MajorTotalMax || "",
              descipline2MajorTotalObtained: "",
              descipline2MajorTotalCreditMax:
                disciplineMajor2Details?.MajorTotalCreditMax || "",
              descipline2MajorTotalCreditObtained: "",
            }),

            //Discipline 2 Major Paper 1

            ...(paperMajorDiscipline2[0]?.COURSE_NAME && {
              MajorDspcipline2Paper1: paperMajorDiscipline2[0].COURSE_NAME,
              MajorDspcipline2Paper1Max:
                disciplineMajor2Details?.Major1Max || "",
              MajorDspcipline2Paper1Obtained: "",
              MajorDspcipline2Paper1CreditMax:
                disciplineMajor2Details?.Major1CreditMax || "",
              MajorDspcipline2Paper1CreditObtained: "",
            }),

            //Discipline 2 Major Paper 2

            ...(paperMajorDiscipline2[1]?.COURSE_NAME && {
              MajorDspcipline2Paper2: paperMajorDiscipline2[1].COURSE_NAME,
              MajorDspcipline2Paper2Max:
                disciplineMajor2Details?.Major2Max || "",
              MajorDspcipline2Paper2Obtained: "",
              MajorDspcipline2Paper2CreditMax:
                disciplineMajor2Details?.Major2CreditMax || "",
              MajorDspcipline2Paper2CreditObtained: "",
            }),

            //Discipline 2 Major Paper 3

            ...(paperMajorDiscipline2[2]?.COURSE_NAME && {
              MajorDspcipline2Paper3: paperMajorDiscipline2[2].COURSE_NAME,
              MajorDspcipline2Paper3Max:
                disciplineMajor2Details?.Major3Max || "",
              MajorDspcipline2Paper3Obtained: "",
              MajorDspcipline2Paper3CreditMax:
                disciplineMajor2Details?.Major3CreditMax || "",
              MajorDspcipline2Paper3CreditObtained: "",
            }),

            //Discipline 2 Minor

            //  ...(paperMinorDiscipline2?.COURSE_NAME && {
            //   MajorDspcipline2Minor: paperMinorDiscipline2.COURSE_NAME,
            //   descipline2Minor1Max: disciplineMajor2Details?.Minor1Max||"",
            //   descipline2Minor1CreditMax: disciplineMajor2Details?.Minor1CreditMax||"",
            //   descipline2Minor1CiaMax: disciplineMajor2Details?.Minor1CiaMax||"",
            //   descipline2Minor1PracticalMax:disciplineMajor2Details?.Minor1PracticalMax||"",
            //   descipline2Minor1PracticalCreditMax:disciplineMajor2Details?.Minor1PracticalCreditMax||"",
            //   descipline2MinorTotalMax: disciplineMajor2Details?.MinorTotalMax||"",
            //   descipline2MinorCreditMax: disciplineMajor2Details?.MinorCreditMax||"",
            //  }),

            //Minor Discipline
            ...(disciplineMinorDetails?.DISCIPLINE && {
              MinorDiscipline: disciplineMinorDetails.DISCIPLINE,
            }),

            //Minor  Discipline Papers
            ...(paperMinorDiscipline?.COURSE_NAME && {
              MinorDisciplinePaper: paperMinorDiscipline.COURSE_NAME,
              MinorDisciplinePaperMax: disciplineMinorDetails?.Minor1Max || "",
              MinorDisciplinePaperObtained: "",
              MinorDisciplinePaperCreditMax:
                disciplineMinorDetails?.Minor1CreditMax || "",
              MinorDisciplinePaperCreditObtained: "",
              MinorDisciplineCiaMax: disciplineMinorDetails?.Minor1CiaMax || "",
              MinorDisciplineCiaObtained: "",
              MinorDisciplinePracticalMax:
                disciplineMinorDetails?.Minor1PracticalMax || "",
              MinorDisciplinePracticalObtained: "",
              MinorDisciplinePracticalCreditMax:
                disciplineMinorDetails?.Minor1PracticalCreditMax || "",
              MinorDisciplinePracticalCreditObtained: "",
              MinorDisciplineTotalMax:
                disciplineMinorDetails?.MinorTotalMax || "",
              MinorDisciplineTotalObtained: "",
              MinorDisciplineCreditMax:
                disciplineMinorDetails?.MinorCreditMax || "",
              MinorDisciplineCreditObtained: "",
            }),

            Skill: row?.skil || "",
          },
          TS: {
            DB_CL: program.DB_CL + "1",
            Session: year + "-" + nextofYear,
            EnrolmentNumber: row.en,
            RollNumber: row.rn,
            MajorDiscipline1: disciplineMajor1?.DISCIPLINE || "",
            MajorDspcipline1Paper1: paperMajorDiscipline1[0]?.COURSE_NAME || "",
            MajorDspcipline1Paper2: paperMajorDiscipline1[1]?.COURSE_NAME || "",
            MajorDspcipline1Paper3: paperMajorDiscipline1[2]?.COURSE_NAME || "",
            MajorDiscipline2: disciplineMajor2?.DISCIPLINE || "",
            MajorDspcipline2Paper1: paperMajorDiscipline2[0]?.COURSE_NAME || "",
            MajorDspcipline2Paper2: paperMajorDiscipline2[1]?.COURSE_NAME || "",
            MajorDspcipline2Paper3: paperMajorDiscipline2[2]?.COURSE_NAME || "",
            MinorDiscipline: disciplineMinor?.DISCIPLINE || "",
            MinorDisciplinePaper: paperMinorDiscipline?.COURSE_NAME || "",
            Skill: row?.skil || "",
          },
        });
      }

      // -----------------------------
      // SEPARATE INTO 3 COLLECTION ARRAYS
      // -----------------------------
      let profileData = [];
      let resultData = [];
      let tsData = [];

      for (const rec of recordsToInsert) {
        profileData.push(rec.Profile);
        resultData.push(rec.Result);
        tsData.push(rec.TS);
      }

      // -----------------------------
      // INSERT INTO 3 COLLECTIONS
      // -----------------------------
      const AdmissionDB = client.db("NepUG");

      if (profileData.length > 0) {
        await AdmissionDB.collection(`${program.DB_CL}_PROFILE`).insertMany(
          profileData
        );
      }

      if (resultData.length > 0) {
        await AdmissionDB.collection(`${program.DB_CL}1_RESULT`).insertMany(
          resultData
        );
      }

      if (tsData.length > 0) {
        await AdmissionDB.collection(`${program.DB_CL}_TS`).insertMany(tsData);
      }

      // -----------------------------
      // HANDLE WRONG PROGRAM ROWS
      // -----------------------------
      if (wrongRows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(wrongRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Wrong_Data");

        const exportBuffer = XLSX.write(wb, {
          type: "buffer",
          bookType: "xlsx",
        });

        res.setHeader(
          "Content-Disposition",
          "attachment; filename=wrong_Data_codes.xlsx"
        );
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "X-Message",
          `Total ${recordsToInsert.length} valid candidates`
        );

        return res.send(exportBuffer);
      }

      // -----------------------------
      // FINAL SUCCESS RESPONSE
      // -----------------------------
      res.status(200).send({
        status: "Success",
        message: `Total ${recordsToInsert.length} candidates of ${program.Full_Form}`,
      });
    } catch (error) {
      console.log(error);
      res.status(400).send({
        status: "Failed",
        message: "There is some problem",
      });
    } finally {
      await client.close();
    }
  };

  static getUnit = async (req, res) => {
    const client = new MongoClient(URL);

    try {
      await client.connect();
      const database = client.db("CODE");
      const data = await database.collection("UNITCODE").find().toArray();

      res.send({
        status: "success",
        message: "UG Courses",
        data: data,
      });
    } catch (error) {
      console.error("Error fetching UNITCODE:", error);
      res.status(500).send({
        status: "error",
        message: "Failed to fetch data",
      });
    } finally {
      await client.close();
    }
  };
}

export default userController;
