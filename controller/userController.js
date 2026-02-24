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
import { stringify } from "querystring";

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
        if (stu.MajorDiscipline1Paper1Obtained === "") {
          allMajorPapers.push(stu.MajorDiscipline1Paper1);
        }
        if (stu.MajorDiscipline1Paper2Obtained === "") {
          allMajorPapers.push(stu.MajorDiscipline1Paper2);
        }
        if (stu.MajorDiscipline1Paper3Obtained === "") {
          allMajorPapers.push(stu.MajorDiscipline1Paper3);
        }
      } else if (stu.MajorDiscipline2 === myobj.discp) {
        if (stu.MajorDiscipline2Paper1Obtained === "") {
          allMajorPapers.push(stu.MajorDiscipline2Paper1);
        }
        if (stu.MajorDiscipline2Paper2Obtained === "") {
          allMajorPapers.push(stu.MajorDiscipline2Paper2);
        }
        if (stu.MajorDiscipline2Paper3Obtained === "") {
          allMajorPapers.push(stu.MajorDiscipline2Paper3);
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
      if (stu.MajorDiscipline1 && stu.descipline1MajorPracticleMax !== "")
        allMajorPracticalDiscipline.push(stu.MajorDiscipline1);

      //Major Discipline 2
      if (stu.MajorDiscipline1) allMajorDiscipline.push(stu.MajorDiscipline2);

      //Major  Without Practical Discipline 2
      if (stu.MajorDiscipline2 && stu.descipline2MajorPracticleMax !== "")
        allMajorPracticalDiscipline.push(stu.MajorDiscipline2);

      //Minor  Without Practical Discipline
      if (stu.MinorDiscipline) allMinorDiscipline.push(stu.MinorDiscipline);

      //Minor  Without Practical Discipline
      if (stu.MinorDiscipline && stu.MinorDisciplinePracticalMax !== "")
        allMinorPracticalDiscipline.push(stu.MinorDiscipline);
    }

    // Remove duplicates
    const uniqueMajorDisciplines = [...new Set(allMajorDiscipline)];
    const uniqueMinorDisciplines = [...new Set(allMinorDiscipline)];
    const uniqueMajorPracticalDiscipline = [
      ...new Set(allMajorPracticalDiscipline),
    ];
    const uniqueMinorPracticalDiscipline = [
      ...new Set(allMinorPracticalDiscipline),
    ];

    if (myobj.MajMin === "Major" && myobj.EndInt === "Practical") {
      res.send({
        status: "sucess1",
        message: "OK",
        data: uniqueMajorPracticalDiscipline,
      });
    } else if (myobj.MajMin === "Major") {
      res.send({
        status: "sucess2",
        message: "OK",
        data: uniqueMajorDisciplines,
      });
    } else if (myobj.MajMin === "Minor" && myobj.EndInt === "Practical") {
      res.send({
        status: "sucess3",
        message: "OK",
        data: uniqueMinorPracticalDiscipline,
      });
    } else if (myobj.MajMin === "Minor") {
      res.send({
        status: "sucess4",
        message: "OK",
        data: uniqueMinorDisciplines,
      });
    } else {
      res.send({
        status: "sucess5",
        message: "OK",
        data: { uniqueMajorDisciplines, uniqueMinorDisciplines },
      });
    }
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
    const myobj = req.body;
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
      // const lastOfYear = String(year).slice(2);
      // const nextofYear = parseInt(lastOfYear) + 1;

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

      // -----------------------------
      // FOR BCOM
      // -----------------------------

      const CoursesDB = client.db("COURSES");
      const CodeDB = client.db("CODE");
      const discipline = client.db("NEP");
      const paper = client.db("NEP");

      if (PRG_CODE === "PRE008") {
        for (const row of data) {
          //--------------
          //Discipline
          //-----------
          const disciplineMajor1 = await discipline
            .collection("Discipline")
            .findOne({ Number_Code: row.sb11 });
          const disciplineMajor2 = await discipline
            .collection("Discipline")
            .findOne({ Number_Code: row.sb12 });
          const disciplineMajor3 = await discipline
            .collection("Discipline")
            .findOne({ Number_Code: row.sb13 });
          const disciplineMinor = await discipline
            .collection("Discipline")
            .findOne({ Number_Code: row.sb14 });

          //-------------------
          //Discipline Paper marks details
          //--------------------
          const disciplineMajor1Details = await discipline
            .collection("DiciplineDetails")
            .findOne({ DISCIPLINE: disciplineMajor1?.DISCIPLINE });
          const disciplineMajor2Details = await discipline
            .collection("DiciplineDetails")
            .findOne({ DISCIPLINE: disciplineMajor2?.DISCIPLINE });
          const disciplineMajor3Details = await discipline
            .collection("DiciplineDetails")
            .findOne({ DISCIPLINE: disciplineMajor3?.DISCIPLINE });
          const disciplineMinorDetails = await discipline
            .collection("DiciplineDetails")
            .findOne({ DISCIPLINE: disciplineMinor?.DISCIPLINE });

          //-------------
          //Major and Minor Papers of Major Minor Discipline
          //-----------

          const paperMajorDiscipline1 = await paper
            .collection("PaperDetails")
            .find({
              CBCS_CATEGORY: "MAJOR",
              DISCIPLINE: disciplineMajor1Details?.DISCIPLINE,
            })
            .toArray();

          // const paperMinorDiscipline1 = await paper.collection("PaperDetails").findOne({CBCS_CATEGORY:"MINOR", String_Code: disciplineMajor1?.String_Code})

          const paperMajorDiscipline2 = await paper
            .collection("PaperDetails")
            .find({
              CBCS_CATEGORY: "MAJOR",
              DISCIPLINE: disciplineMajor2Details?.DISCIPLINE,
            })
            .toArray();

          // const paperMinorDiscipline2 = await paper.collection("PaperDetails").findOne({CBCS_CATEGORY:"MINOR", String_Code: disciplineMajor2?.String_Code})

          const paperMajorDiscipline3 = await paper
            .collection("PaperDetails")
            .find({
              CBCS_CATEGORY: "MAJOR",
              DISCIPLINE: disciplineMajor3Details?.DISCIPLINE,
            })
            .toArray();

          const paperMinorDiscipline = await paper
            .collection("PaperDetails")
            .findOne({
              CBCS_CATEGORY: "MINOR",
              DISCIPLINE: disciplineMinorDetails?.DISCIPLINE,
            });

          program = await CoursesDB.collection("COURSES").findOne({
            PRG_CODE: row.PRG_CODE,
            CourseNameCode: parseInt(row.cc),
            TYPE: "NEP",
          });

          // WRONG PROGRAM
          if (!program || program.PRG_CODE !== PRG_CODE) {
            row.Reason = "Check Programm Code";
            wrongRows.push(row);
            continue;
          }

          const unit = await CodeDB.collection("UNITCODE").findOne({
            Unit_Code: row.uc,
          });

          if (!unit) {
            row.Reason = "Check Unit";
            wrongRows.push(row);
            continue;
          }

          //Regular or Ex
          const YearCat = row.cat === 1 ? "Regular Candidate" : "Ex-Student";

          // INSERT CLEAN DATA
          recordsToInsert.push({
            Profile: {
              Program: row?.course || "Bachelor of Commerce",
              PRG_CODE: PRG_CODE,
              Session: myobj.session,
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
              PRG_CODE: PRG_CODE,
              Session: myobj.session,
              EnrolmentNumber: row.en,
              RollNumber: row.rn,
              YearCategory: YearCat,
              //Discipline 1
              ...(disciplineMajor1?.DISCIPLINE && {
                MajorDiscipline1: disciplineMajor1.DISCIPLINE,
              }),

              ...(disciplineMajor1Details?.DISCIPLINE && {
                ...(disciplineMajor1Details?.MajorCiaMax != null && {
                  MajorDiscipline1CiaMax: disciplineMajor1Details.MajorCiaMax,
                  MajorDiscipline1CiaObtained: "",
                }),
                ...(disciplineMajor1Details?.MajorPracticleMax != null && {
                  MajorDiscipline1PracticleMax:
                    disciplineMajor1Details.MajorPracticleMax,
                  MajorDiscipline1PracticleObtained: "",
                }),

                ...(disciplineMajor1Details?.MajorPracticleCreditMax !=
                  null && {
                  MajorDiscipline1PracticleCreditMax:
                    disciplineMajor1Details.MajorPracticleCreditMax,
                  MajorDiscipline1PracticleObtained: "",
                }),
                ...(disciplineMajor1Details?.MajorTotalMax != null && {
                  MajorDiscipline1TotalMax:
                    disciplineMajor1Details.MajorTotalMax,
                  MajorDiscipline1TotalObtained: "",
                }),

                ...(disciplineMajor1Details?.MajorTotalCreditMax != null && {
                  MajorDiscipline1TotalCreditMax:
                    disciplineMajor1Details.MajorTotalCreditMax,
                  MajorDiscipline1TotalCreditObtained: "",
                }),
              }),

              //Discipline 1 Major Paper 1

              ...(paperMajorDiscipline1[0]?.COURSE_NAME != null && {
                MajorDiscipline1Paper1: paperMajorDiscipline1[0]?.COURSE_NAME,
                ...(disciplineMajor1Details?.Major1Max != null && {
                  MajorDiscipline1Paper1Max: disciplineMajor1Details?.Major1Max,
                  MajorDiscipline1Paper1Obtained: "",
                }),
                ...(disciplineMajor1Details?.Major1CreditMax != null && {
                  MajorDiscipline1Paper1CreditMax:
                    disciplineMajor1Details?.Major1CreditMax,
                  MajorDiscipline1Paper1CreditObtained: "",
                }),
              }),

              //Discipline 2
              ...(disciplineMajor2?.DISCIPLINE && {
                MajorDiscipline2: disciplineMajor2?.DISCIPLINE,
                ...(disciplineMajor2Details?.MajorCiaMax != null && {
                  MajorDiscipline2CiaMax: disciplineMajor2Details?.MajorCiaMax,
                  MajorDiscipline2CiaObtained: "",
                }),
                ...(disciplineMajor2Details?.MajorPracticleMax != null && {
                  MajorDiscipline2PracticleMax:
                    disciplineMajor2Details?.MajorPracticleMax,
                  MajorDiscipline2PracticleObtained: "",
                }),
                ...(disciplineMajor2Details?.MajorPracticleCreditMax !=
                  null && {
                  MajorDiscipline2PracticleCreditMax:
                    disciplineMajor2Details?.MajorPracticleCreditMax,
                  MajorDiscipline2PracticleCreditObtained: "",
                }),
                ...(disciplineMajor2Details?.MajorTotalMax != null && {
                  MajorDiscipline2TotalMax:
                    disciplineMajor2Details?.MajorTotalMax,
                  MajorDiscipline2TotalObtained: "",
                }),
                ...(disciplineMajor2Details?.MajorTotalCreditMax != null && {
                  MajorDiscipline2TotalCreditMax:
                    disciplineMajor2Details?.MajorTotalCreditMax,
                  MajorDiscipline2TotalCreditObtained: "",
                }),
              }),

              //Discipline 2 Major Paper 1

              ...(paperMajorDiscipline2[0]?.COURSE_NAME && {
                MajorDiscipline2Paper1: paperMajorDiscipline2[0]?.COURSE_NAME,
                ...(disciplineMajor2Details?.Major1Max != null && {
                  MajorDiscipline2Paper1Max: disciplineMajor2Details?.Major1Max,
                  MajorDiscipline2Paper1Obtained: "",
                }),
                ...(disciplineMajor2Details?.Major1CreditMax != null && {
                  MajorDiscipline2Paper1CreditMax:
                    disciplineMajor2Details?.Major1CreditMax,
                  MajorDiscipline2Paper1CreditObtained: "",
                }),
              }),

              //Discipline 3
              ...(disciplineMajor3?.DISCIPLINE && {
                MajorDiscipline3: disciplineMajor3?.DISCIPLINE,
                ...(disciplineMajor3Details?.MajorCiaMax != null && {
                  MajorDiscipline3CiaMax: disciplineMajor3Details?.MajorCiaMax,
                  MajorDiscipline3CiaObtained: "",
                }),
                ...(disciplineMajor3Details?.MajorPracticleMax != null && {
                  MajorDiscipline3PracticleMax:
                    disciplineMajor3Details?.MajorPracticleMax,
                  MajorDiscipline3PracticleObtained: "",
                }),
                ...(disciplineMajor3Details?.MajorPracticleCreditMax !=
                  null && {
                  MajorDiscipline3PracticleCreditMax:
                    disciplineMajor3Details?.MajorPracticleCreditMax,
                  MajorDiscipline3PracticleCreditObtained: "",
                }),
                ...(disciplineMajor3Details?.MajorTotalMax != null && {
                  MajorDiscipline3TotalMax:
                    disciplineMajor3Details?.MajorTotalMax,
                  MajorDiscipline3TotalObtained: "",
                }),
                ...(disciplineMajor3Details?.MajorTotalCreditMax != null && {
                  MajorDiscipline3TotalCreditMax:
                    disciplineMajor3Details?.MajorTotalCreditMax,
                  MajorDiscipline3TotalCreditObtained: "",
                }),
              }),

              //Discipline 3 Major Paper 1

              ...(paperMajorDiscipline3[0]?.COURSE_NAME && {
                MajorDiscipline3Paper1: paperMajorDiscipline3[0]?.COURSE_NAME,
                ...(disciplineMajor3Details?.Major1Max != null && {
                  MajorDiscipline3Paper1Max: disciplineMajor3Details?.Major1Max,
                  MajorDiscipline3Paper1Obtained: "",
                }),
                ...(disciplineMajor3Details?.Major1CreditMax != null && {
                  MajorDiscipline3Paper1CreditMax:
                    disciplineMajor3Details?.Major1CreditMax,
                  MajorDiscipline3Paper1CreditObtained: "",
                }),
              }),

              //Minor Discipline
              ...(disciplineMinorDetails?.DISCIPLINE && {
                MinorDiscipline: disciplineMinorDetails?.DISCIPLINE,
              }),

              //Minor  Discipline Papers
              ...(paperMinorDiscipline?.COURSE_NAME && {
                MinorDisciplinePaper: paperMinorDiscipline?.COURSE_NAME,
                ...(disciplineMinorDetails?.Minor1Max != null && {
                  MinorDisciplinePaperMax: disciplineMinorDetails?.Minor1Max,
                  MinorDisciplinePaperObtained: "",
                }),
                ...(disciplineMinorDetails?.Minor1CreditMax != null && {
                  MinorDisciplinePaperCreditMax:
                    disciplineMinorDetails?.Minor1CreditMax,
                  MinorDisciplinePaperCreditObtained: "",
                }),
                ...(disciplineMinorDetails?.Minor1CiaMax != null && {
                  MinorDisciplineCiaMax: disciplineMinorDetails?.Minor1CiaMax,
                  MinorDisciplineCiaObtained: "",
                }),
                ...(disciplineMinorDetails?.Minor1PracticalMax != null && {
                  MinorDisciplinePracticalMax:
                    disciplineMinorDetails?.Minor1PracticalMax,
                  MinorDisciplineCiaObtained: "",
                }),
                ...(disciplineMinorDetails?.Minor1PracticalCreditMax !=
                  null && {
                  MinorDisciplinePracticalCreditMax:
                    disciplineMinorDetails?.Minor1PracticalCreditMax,
                  MinorDisciplinePracticalCreditObtained: "",
                }),
                ...(disciplineMinorDetails?.MinorTotalMax != null && {
                  MinorDisciplineTotalMax:
                    disciplineMinorDetails?.MinorTotalMax,
                  MinorDisciplineTotalObtained: "",
                }),
                ...(disciplineMinorDetails?.MinorCreditMax != null && {
                  MinorDisciplineCreditMax:
                    disciplineMinorDetails?.MinorCreditMax,
                  MinorDisciplineCreditObtained: "",
                }),
              }),
              ...(row?.skil != null && {
                Skill: row?.skil,
              }),
            },

            //Transcript
            TS: {
              PRG_CODE: PRG_CODE,
              DB_CL: program.DB_CL + "1",
              Session: myobj.session,
              EnrolmentNumber: row.en,
              RollNumber: row.rn,
              ...(disciplineMajor1?.DISCIPLINE != null && {
                MajorDiscipline1: disciplineMajor1?.DISCIPLINE,
              }),
              ...(paperMajorDiscipline1[0]?.COURSE_NAME != null && {
                MajorDiscipline1Paper1: paperMajorDiscipline1[0]?.COURSE_NAME,
              }),

              ...(disciplineMajor2?.DISCIPLINE != null && {
                MajorDiscipline2: disciplineMajor2?.DISCIPLINE,
              }),
              ...(paperMajorDiscipline2[0]?.COURSE_NAME != null && {
                MajorDiscipline2Paper1: paperMajorDiscipline2[0]?.COURSE_NAME,
              }),

              ...(disciplineMajor3?.DISCIPLINE != null && {
                MajorDiscipline3: disciplineMajor3?.DISCIPLINE,
              }),
              ...(paperMajorDiscipline3[0]?.COURSE_NAME != null && {
                MajorDiscipline3Paper1: paperMajorDiscipline3[0]?.COURSE_NAME,
              }),

              ...(disciplineMinor?.DISCIPLINE != null && {
                MinorDiscipline: disciplineMinor?.DISCIPLINE,
              }),
              ...(paperMinorDiscipline?.COURSE_NAME != null && {
                MinorDisciplinePaper: paperMinorDiscipline?.COURSE_NAME,
              }),
              ...(row?.skil != null && {
                Skill: row?.skil,
              }),
            },
          });
        }
      } else {
        // -----------------------------
        // BA/BSC
        // -----------------------------

        for (const row of data) {
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

          //-------------
          //Major and Minor Papers of Major Minor Discipline
          //-----------

          const MajorDiscipline1 = await paper
            .collection("PaperDetails")
            .find({
              CBCS_CATEGORY: "MAJOR",
              String_Code: disciplineMajor1?.String_Code,
            })
            .toArray();

          const paperMajorDiscipline1 =
            MajorDiscipline1?.filter((p) => {
              return p?.TYPE === "THEORY" && p?.COURSE_NAME !== "CIA";
            }) ?? [];

          const PracticalMajorDiscipline1 =
            MajorDiscipline1.filter((p) => p?.TYPE === "PRACTICAL") ?? [];

          const MajorDiscipline2 = await paper
            .collection("PaperDetails")
            .find({
              CBCS_CATEGORY: "MAJOR",
              String_Code: disciplineMajor2?.String_Code,
            })
            .toArray();

          const paperMajorDiscipline2 =
            MajorDiscipline2?.filter((p) => {
              return p?.TYPE === "THEORY" && p?.COURSE_NAME !== "CIA";
            }) ?? [];

          const PracticalMajorDiscipline2 =
            MajorDiscipline2.filter((p) => p?.TYPE === "PRACTICAL") ?? [];

          const MinorDiscipline = await paper
            .collection("PaperDetails")
            .find({
              CBCS_CATEGORY: "MINOR",
              String_Code: disciplineMinor?.String_Code,
            })
            .toArray();

          const paperMinorDiscipline =
            MinorDiscipline?.filter((p) => {
              return p?.TYPE === "THEORY" && p?.COURSE_NAME !== "CIA";
            }) ?? [];

          const PracticalMinorDiscipline =
            MinorDiscipline.filter((p) => p?.TYPE === "PRACTICAL") ?? [];

          // console.log("Paper", paperMajorDiscipline1)

          program = await CoursesDB.collection("COURSES").findOne({
            PRG_CODE: row.PRG_CODE,
            CourseNameCode: parseInt(row.cc),
            TYPE: "NEP",
          });

          // WRONG PROGRAM
          if (!program || program.PRG_CODE !== PRG_CODE) {
            row.Reason = "Check Program Code";
            wrongRows.push(row);
            continue;
          }

          const unit = await CodeDB.collection("UNITCODE").findOne({
            Unit_Code: row.uc,
          });

          if (!unit) {
            row.Resaon = "Check Unit";
            wrongRows.push(row);
            continue;
          }

          if (!row.course) {
            row.Reason =
              "Program Name i.e. Bahcelor of Science (Math/Bio) or Bachelor of Arts should be present with heading 'course'";
            wrongRows.push(row);
            continue;
          }

          //Regular or Ex
          const YearCat = row.cat === 1 ? "Regular Candidate" : "Ex-Student";

          // INSERT CLEAN DATA
          recordsToInsert.push({
            Profile: {
              Program: row.course,
              PRG_CODE: PRG_CODE,
              Session: myobj.session,
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
              PRG_CODE: PRG_CODE,
              Session: myobj.session,
              EnrolmentNumber: row.en,
              RollNumber: row.rn,
              YearCategory: YearCat,

              //Discipline 1
              ...(disciplineMajor1?.DISCIPLINE && {
                MajorDiscipline1: disciplineMajor1.DISCIPLINE,
              }),
              ...(disciplineMajor1Details?.DISCIPLINE && {
                ...(disciplineMajor1Details?.MajorCiaMax != null && {
                  MajorDiscipline1CiaMax: disciplineMajor1Details.MajorCiaMax,
                }),
                ...(disciplineMajor1Details?.MajorPracticleMax != null && {
                  MajorDiscipline1PracticleMax:
                    disciplineMajor1Details.MajorPracticleMax,
                }),

                ...(disciplineMajor1Details?.MajorPracticleCreditMax !=
                  null && {
                  MajorDiscipline1PracticleCreditMax:
                    disciplineMajor1Details.MajorPracticleCreditMax,
                }),
                ...(disciplineMajor1Details?.MajorTotalMax != null && {
                  MajorDiscipline1TotalMax:
                    disciplineMajor1Details.MajorTotalMax,
                }),

                ...(disciplineMajor1Details?.MajorTotalCreditMax != null && {
                  MajorDiscipline1TotalCreditMax:
                    disciplineMajor1Details.MajorTotalCreditMax,
                }),
              }),

              //Discipline 1 Major Paper 1

              ...(paperMajorDiscipline1[0]?.COURSE_NAME != null && {
                MajorDiscipline1Paper1: paperMajorDiscipline1[0]?.COURSE_NAME,
                ...(disciplineMajor1Details?.Major1Max != null && {
                  MajorDiscipline1Paper1Max: disciplineMajor1Details?.Major1Max,
                }),

                ...(disciplineMajor1Details?.Major1CreditMax != null && {
                  MajorDiscipline1Paper1CreditMax:
                    disciplineMajor1Details?.Major1CreditMax,
                }),
              }),

              //Discipline 1 Major Paper 2
              ...(paperMajorDiscipline1[1]?.COURSE_NAME != null && {
                MajorDiscipline1Paper2: paperMajorDiscipline1[1]?.COURSE_NAME,

                ...(disciplineMajor1Details?.Major2Max != null && {
                  MajorDiscipline1Paper2Max: disciplineMajor1Details?.Major2Max,
                }),
                ...(disciplineMajor1Details?.Major2CreditMax != null && {
                  MajorDiscipline1Paper2CreditMax:
                    disciplineMajor1Details?.Major2CreditMax,
                }),
              }),

              //Discipline 1 Major Paper 3

              ...(paperMajorDiscipline1[2]?.COURSE_NAME != null && {
                MajorDiscipline1Paper3: paperMajorDiscipline1[2]?.COURSE_NAME,
                ...(disciplineMajor1Details?.Major3Max != null && {
                  MajorDiscipline1Paper3Max: disciplineMajor1Details?.Major3Max,
                }),
                ...(disciplineMajor1Details?.Major3CreditMax != null && {
                  MajorDiscipline1Paper3CreditMax:
                    disciplineMajor1Details?.Major3CreditMax,
                }),
              }),

              //Discipline 1 Practical

              ...(PracticalMajorDiscipline1[0]?.COURSE_NAME != null && {
                MajorDiscipline1Practical:
                  PracticalMajorDiscipline1[0]?.COURSE_NAME,
                ...(disciplineMajor1Details?.MajorPracticleMax != null && {
                  MajorDiscipline1PracticalMax:
                    disciplineMajor1Details?.MajorPracticleMax,
                }),
                ...(disciplineMajor1Details?.MajorPracticleCreditMax !=
                  null && {
                  MajorDiscipline1PracticalCreditMax:
                    disciplineMajor1Details?.MajorPracticleCreditMax,
                }),
              }),

              //Discipline 2
              ...(disciplineMajor2?.DISCIPLINE && {
                MajorDiscipline2: disciplineMajor2?.DISCIPLINE,
                ...(disciplineMajor2Details?.MajorCiaMax != null && {
                  MajorDiscipline2CiaMax: disciplineMajor2Details?.MajorCiaMax,
                }),
                ...(disciplineMajor2Details?.MajorPracticleMax != null && {
                  MajorDiscipline2PracticleMax:
                    disciplineMajor2Details?.MajorPracticleMax,
                }),
                ...(disciplineMajor2Details?.MajorPracticleCreditMax !=
                  null && {
                  MajorDiscipline2PracticleCreditMax:
                    disciplineMajor2Details?.MajorPracticleCreditMax,
                }),
                ...(disciplineMajor2Details?.MajorTotalMax != null && {
                  MajorDiscipline2TotalMax:
                    disciplineMajor2Details?.MajorTotalMax,
                }),
                ...(disciplineMajor2Details?.MajorTotalCreditMax != null && {
                  MajorDiscipline2TotalCreditMax:
                    disciplineMajor2Details?.MajorTotalCreditMax,
                }),
              }),

              //Discipline 2 Major Paper 1

              ...(paperMajorDiscipline2[0]?.COURSE_NAME && {
                MajorDiscipline2Paper1: paperMajorDiscipline2[0]?.COURSE_NAME,
                ...(disciplineMajor2Details?.Major1Max != null && {
                  MajorDiscipline2Paper1Max: disciplineMajor2Details?.Major1Max,
                }),
                ...(disciplineMajor2Details?.Major1CreditMax != null && {
                  MajorDiscipline2Paper1CreditMax:
                    disciplineMajor2Details?.Major1CreditMax,
                }),
              }),

              //Discipline 2 Major Paper 2

              ...(paperMajorDiscipline2[1]?.COURSE_NAME && {
                MajorDiscipline2Paper2: paperMajorDiscipline2[1]?.COURSE_NAME,
                ...(disciplineMajor2Details?.Major2Max != null && {
                  MajorDiscipline2Paper2Max: disciplineMajor2Details?.Major2Max,
                }),
                ...(disciplineMajor2Details?.Major2CreditMax != null && {
                  MajorDiscipline2Paper2CreditMax:
                    disciplineMajor2Details?.Major2CreditMax,
                }),
              }),

              //Discipline 2 Major Paper 3

              ...(paperMajorDiscipline2[2]?.COURSE_NAME && {
                MajorDiscipline2Paper3: paperMajorDiscipline2[2]?.COURSE_NAME,
                ...(disciplineMajor2Details?.Major3Max != null && {
                  MajorDiscipline2Paper3Max: disciplineMajor2Details?.Major3Max,
                }),
                ...(disciplineMajor2Details?.Major3CreditMax != null && {
                  MajorDiscipline2Paper3CreditMax:
                    disciplineMajor2Details?.Major3CreditMax,
                }),
              }),

              //Discipline 2 Practical

              ...(PracticalMajorDiscipline2[0]?.COURSE_NAME != null && {
                MajorDiscipline2Practical:
                  PracticalMajorDiscipline2[0]?.COURSE_NAME,
                ...(disciplineMajor2Details?.MajorPracticleMax != null && {
                  MajorDiscipline2PracticalMax:
                    disciplineMajor2Details?.MajorPracticleMax,
                }),
                ...(disciplineMajor2Details?.MajorPracticleCreditMax !=
                  null && {
                  MajorDiscipline2PracticalCreditMax:
                    disciplineMajor2Details?.MajorPracticleCreditMax,
                }),
              }),

              //Minor Discipline
              ...(disciplineMinorDetails?.DISCIPLINE && {
                MinorDiscipline: disciplineMinorDetails?.DISCIPLINE,
                ...(disciplineMinorDetails?.Minor1CiaMax != null && {
                  MinorDisciplineCiaMax: disciplineMinorDetails?.Minor1CiaMax,
                }),
                ...(disciplineMinorDetails?.Minor1PracticleMax != null && {
                  MinorDisciplinePracticleMax:
                    disciplineMinorDetails?.Minor1PracticleMax,
                }),
                ...(disciplineMinorDetails?.Minor1PracticleCreditMax !=
                  null && {
                  MinorDisciplinePracticleCreditMax:
                    disciplineMinorDetails?.Minor1PracticleCreditMax,
                }),
                ...(disciplineMinorDetails?.MinorTotalMax != null && {
                  MinorDisciplineTotalMax:
                    disciplineMinorDetails?.MinorTotalMax,
                }),

                ...(disciplineMinorDetails?.MinorCreditMax != null && {
                  MinorDisciplineTotalCreditMax:
                    disciplineMinorDetails?.MinorCreditMax,
                }),
              }),

              //Minor  Discipline Papers
              ...(paperMinorDiscipline[0]?.COURSE_NAME != null && {
                MinorDisciplinePaper: paperMinorDiscipline[0]?.COURSE_NAME,
                ...(disciplineMinorDetails?.Minor1Max != null && {
                  MinorDisciplinePaperMax: disciplineMinorDetails?.Minor1Max,
                }),
                ...(disciplineMinorDetails?.Minor1CreditMax != null && {
                  MinorDisciplinePaperCreditMax:
                    disciplineMinorDetails?.Minor1CreditMax,
                }),
              }),

              //Minor  Discipline Practical

              ...(PracticalMinorDiscipline[0]?.COURSE_NAME != null && {
                MinorDisciplinePractical:
                  PracticalMinorDiscipline[0]?.COURSE_NAME,
                ...(disciplineMinorDetails?.Minor1PracticalMax != null && {
                  MinorDisciplinePracticalMax:
                    disciplineMinorDetails?.Minor1PracticalMax,
                }),
                ...(disciplineMinorDetails?.Minor1PracticalCreditMax !=
                  null && {
                  MinorDisciplinePracticalCreditMax:
                    disciplineMinorDetails?.Minor1PracticalCreditMax,
                }),
              }),
              ...(row?.skil != null && {
                Skill: row?.skil,
              }),
            },

            //Transcript
            TS: {
              PRG_CODE: PRG_CODE,
              DB_CL: program.DB_CL + "1",
              Session: myobj.session,
              EnrolmentNumber: row.en,
              RollNumber: row.rn,
              ...(disciplineMajor1?.DISCIPLINE != null && {
                MajorDiscipline1: disciplineMajor1?.DISCIPLINE,
              }),
              ...(paperMajorDiscipline1[0]?.COURSE_NAME != null && {
                MajorDiscipline1Paper1: paperMajorDiscipline1[0]?.COURSE_NAME,
              }),
              ...(paperMajorDiscipline1[1]?.COURSE_NAME != null && {
                MajorDiscipline1Paper2: paperMajorDiscipline1[1]?.COURSE_NAME,
              }),
              ...(paperMajorDiscipline1[2]?.COURSE_NAME != null && {
                MajorDiscipline1Paper3: paperMajorDiscipline1[2]?.COURSE_NAME,
              }),
              ...(PracticalMajorDiscipline1[0]?.COURSE_NAME != null && {
                MajorDiscipline1Practical:
                  PracticalMajorDiscipline1[0]?.COURSE_NAME,
              }),

              ...(disciplineMajor2?.DISCIPLINE != null && {
                MajorDiscipline2: disciplineMajor2?.DISCIPLINE,
              }),
              ...(paperMajorDiscipline2[0]?.COURSE_NAME != null && {
                MajorDiscipline2Paper1: paperMajorDiscipline2[0]?.COURSE_NAME,
              }),
              ...(paperMajorDiscipline2[1]?.COURSE_NAME != null && {
                MajorDiscipline2Paper2: paperMajorDiscipline2[1]?.COURSE_NAME,
              }),
              ...(paperMajorDiscipline2[2]?.COURSE_NAME != null && {
                MajorDiscipline2Paper3: paperMajorDiscipline2[2]?.COURSE_NAME,
              }),
              ...(PracticalMajorDiscipline2[0]?.COURSE_NAME != null && {
                MajorDiscipline2Practical:
                  PracticalMajorDiscipline2[0]?.COURSE_NAME,
              }),
              ...(disciplineMinor?.DISCIPLINE != null && {
                MinorDiscipline: disciplineMinor?.DISCIPLINE,
              }),
              ...(paperMinorDiscipline?.COURSE_NAME != null && {
                MinorDisciplinePaper: paperMinorDiscipline?.COURSE_NAME,
              }),
              ...(PracticalMinorDiscipline[0]?.COURSE_NAME != null && {
                MinorDisciplinePractical:
                  PracticalMinorDiscipline[0]?.COURSE_NAME,
              }),
              ...(row?.skil != null && {
                Skill: row?.skil,
              }),
            },
          });
        }
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

  //============
  //Uplaod of Marks
  //==============

  static UploadMarks = async (req, res) => {
    if (!req.file) {
      return res.status(400).send({
        status: "Fail",
        message: "Excel file is required",
      });
    }

    const client = new MongoClient(URL);

    try {
      // =========================
      // READ EXCEL
      // =========================
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      if (!data.length) {
        return res.send({ status: "Fail", message: "Excel file is empty" });
      }

      // =========================
      // VALIDATE HEADERS
      // =========================
      const REQUIRED_COLUMNS = ["rn", "sb", "pa", "en", "cat", "mrk11"];
      const excelColumns = Object.keys(data[0]);

      const missingColumns = REQUIRED_COLUMNS.filter(
        (c) => !excelColumns.includes(c)
      );

      if (missingColumns.length) {
        return res.send({
          status: "Fail",
          message: "Invalid Excel format",
          missingColumns,
        });
      }

      await client.connect();

      const myobj = req.body;
      const resultCol = client.db("NepUG").collection(myobj.DB_CL + "_RESULT");
      const nepDB = client.db("NEP");

      const sessionCandidates = await resultCol
        .find({ Session: myobj.session })
        .toArray();

      const reportRows = [];
      const bulkOps = [];

      // =========================
      // HELPER
      // =========================
      const updateIfValid = (
        candidate,
        updateFields,
        report,
        match,
        obtainedField,
        maxField,
        marks
      ) => {
        if (!match) return false;

        if (
          candidate[obtainedField] !== "" &&
          candidate[obtainedField] != null
        ) {
          return false;
        }

        if (Number(marks) > candidate[maxField]) {
          report.Reason = "Marks greater than maximum";
          return false;
        }

        updateFields[obtainedField] = marks;
        return true;
      };

      // =========================
      // PROCESS EACH ROW
      // =========================

      for (const [index, dt] of data.entries()) {
        //Report

        const report = {
          row: index + 2,
          RollNumber: dt.rn,
          EnrolmentNumber: dt.en,
          Marks: dt.mrk11,
          Status: "FAILED",
          Reason: "",
        };

        //Discipline check
        const discipline = await nepDB
          .collection("DiciplineDetails")
          .findOne({ Number_Code: parseInt(dt.sb) });

        if (!discipline) {
          report.Reason = "Discipline not found";
          reportRows.push(report);
          continue;
        }
        const disciplineName = discipline.DISCIPLINE.trim();
        report.Discipline = disciplineName;

        //Candidate Check
        const candidate = sessionCandidates.find(
          (c) =>
            String(c.EnrolmentNumber).trim() === String(dt.en).trim() &&
            String(c.RollNumber).trim() === String(dt.rn).trim()
        );

        if (!candidate) {
          report.Reason = "Candidate not found";
          reportRows.push(report);
          continue;
        }

        const paCode = Number(dt.pa);

        // MAJOR
        const isMajorTheory = paCode >= 1 && paCode <= 3;
        const isMajorPractical = paCode === 6;
        const isMajorCIA = paCode === 7;

        // MINOR
        const isMinorTheory = paCode === 0;
        const isMinorPractical = paCode === 5;
        const isMinorCIA = paCode === 4;

        // =========================
        // FINAL DISCIPLINE CONFIG
        // =========================
        const disciplineConfig = [
          {
            key: "MajorDiscipline1",
            enabled: true,
            cia: {
              obt: "MajorDiscipline1CiaObtained",
              max: "MajorDiscipline1CiaMax",
            },
            papers: [
              {
                name: "MajorDiscipline1Paper1",
                obt: "MajorDiscipline1Paper1Obtained",
                max: "MajorDiscipline1Paper1Max",
              },
              {
                name: "MajorDiscipline1Paper2",
                obt: "MajorDiscipline1Paper2Obtained",
                max: "MajorDiscipline1Paper2Max",
              },
              {
                name: "MajorDiscipline1Paper3",
                obt: "MajorDiscipline1Paper3Obtained",
                max: "MajorDiscipline1Paper3Max",
              },
            ],
            practical: {
              name: "MajorDiscipline1Practical",
              obt: "MajorDiscipline1PracticalObtained",
              max: "MajorDiscipline1PracticalMax",
            },
          },
          {
            key: "MajorDiscipline2",
            enabled: true,
            cia: {
              obt: "MajorDiscipline2CiaObtained",
              max: "MajorDiscipline2CiaMax",
            },
            papers: [
              {
                name: "MajorDiscipline2Paper1",
                obt: "MajorDiscipline2Paper1Obtained",
                max: "MajorDiscipline2Paper1Max",
              },
              {
                name: "MajorDiscipline2Paper2",
                obt: "MajorDiscipline2Paper2Obtained",
                max: "MajorDiscipline2Paper2Max",
              },
              {
                name: "MajorDiscipline2Paper3",
                obt: "MajorDiscipline2Paper3Obtained",
                max: "MajorDiscipline2Paper3Max",
              },
            ],
            practical: {
              name: "MajorDiscipline2Practical",
              obt: "MajorDiscipline2PracticalObtained",
              max: "MajorDiscipline2PracticalMax",
            },
          },
          {
            key: "MajorDiscipline3",
            enabled: myobj.PRG_Code === "PRE008",
            cia: {
              obt: "MajorDiscipline3CiaObtained",
              max: "MajorDiscipline3CiaMax",
            },
            papers: [
              {
                name: "MajorDiscipline3Paper1",
                obt: "MajorDiscipline3Paper1Obtained",
                max: "MajorDiscipline3Paper1Max",
              },
              {
                name: "MajorDiscipline3Paper2",
                obt: "MajorDiscipline3Paper2Obtained",
                max: "MajorDiscipline3Paper2Max",
              },
              {
                name: "MajorDiscipline3Paper3",
                obt: "MajorDiscipline3Paper3Obtained",
                max: "MajorDiscipline3Paper3Max",
              },
            ],
          },
          {
            key: "MinorDiscipline",
            enabled: true,
            cia: {
              obt: "MinorDisciplineCiaObtained",
              max: "MinorDisciplineCiaMax",
            },
            papers: [
              {
                name: "MinorDisciplinePaper",
                obt: "MinorDisciplinePaperObtained",
                max: "MinorDisciplinePaperMax",
              },
            ],
            practical: {
              name: "MinorDisciplinePractical",
              obt: "MinorDisciplinePracticalObtained",
              max: "MinorDisciplinePracticleMax",
            },
          },
        ];

        const updateFields = {};
        let updated = false;

        for (const d of disciplineConfig) {
          // -------------------------
          // BASIC GUARDS
          // -------------------------
          if (!d.enabled) continue;
          if (candidate[d.key] !== disciplineName) continue;

          let marks = dt.mrk11;

          // blank / null / undefined → "AA"
          if (marks === "" || marks === null || marks === undefined) {
            marks = "AA";
          }

          // =========================
          // MAJOR CIA
          // =========================
          if (isMajorCIA && d.key.startsWith("Major")) {
            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              true,
              d.cia.obt,
              d.cia.max,
              marks
            );
          }

          // =========================
          // MINOR CIA
          // =========================
          else if (isMinorCIA && d.key === "MinorDiscipline") {
            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              true,
              d.cia.obt,
              d.cia.max,
              marks
            );
          }

          // =========================
          // MAJOR PRACTICAL
          // =========================
          else if (isMajorPractical && d.key.startsWith("Major")) {
            if (d.practical) {
              updated ||= updateIfValid(
                candidate,
                updateFields,
                report,
                true,
                d.practical.obt,
                d.practical.max,
                marks
              );
            }
          }

          // =========================
          // MINOR PRACTICAL
          // =========================
          else if (isMinorPractical && d.key === "MinorDiscipline") {
            if (d.practical) {
              updated ||= updateIfValid(
                candidate,
                updateFields,
                report,
                true,
                d.practical.obt,
                d.practical.max,
                marks
              );
            }
          }

          // =========================
          // MAJOR THEORY
          // =========================
          else if (
            isMajorTheory &&
            !isMajorPractical &&
            d.key.startsWith("Major")
          ) {
            const paperIndex = Number(paCode) - 1;

            if (
              Number.isInteger(paperIndex) &&
              paperIndex >= 0 &&
              paperIndex < d.papers.length
            ) {
              const paper = d.papers[paperIndex];

              updated ||= updateIfValid(
                candidate,
                updateFields,
                report,
                true,
                paper.obt,
                paper.max,
                marks
              );
            }
          }

          // =========================
          // MINOR THEORY
          // =========================
          else if (
            isMinorTheory &&
            !isMinorPractical &&
            d.key === "MinorDiscipline"
          ) {
            const paper = d.papers[0];

            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              true,
              paper.obt,
              paper.max,
              marks
            );
          }
        }

        if (isMajorCIA) report.Paper = "MAJOR CIA";
        else if (isMajorPractical) report.Paper = "MAJOR PRACTICAL";
        else if (isMajorTheory) report.Paper = `MAJOR THEORY ${paCode}`;
        else if (isMinorCIA) report.Paper = "MINOR CIA";
        else if (isMinorPractical) report.Paper = "MINOR PRACTICAL";
        else if (isMinorTheory) report.Paper = "MINOR THEORY";

        // if (!updated) {
        //   report.Reason = "Paper not linked or marks already uploaded";
        //   reportRows.push(report);
        //   continue;
        // }

        if (!updated) {
          if (!report.Reason) {
            report.Reason = "Paper not linked or marks already uploaded";
          }
          reportRows.push(report);
          continue;
        }

        bulkOps.push({
          updateOne: {
            filter: { _id: candidate._id },
            update: { $set: updateFields },
          },
        });

        report.Status = "UPDATED";
        report.Reason = "Marks uploaded successfully";
        reportRows.push(report);
      }

      // =========================
      // BULK WRITE
      // =========================
      if (bulkOps.length) {
        await resultCol.bulkWrite(bulkOps);
      }

      // =========================
      // DOWNLOAD REPORT
      // =========================
      const reportSheet = XLSX.utils.json_to_sheet(reportRows);
      const reportBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(reportBook, reportSheet, "Upload Report");

      const buffer = XLSX.write(reportBook, {
        bookType: "xlsx",
        type: "buffer",
      });

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=MarksUploadReport.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      return res.send(buffer);
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        status: "Fail",
        message: "Internal server error",
      });
    } finally {
      await client.close();
    }
  };


  
  
  static MakeResult = async (req, res) => {
    const client = new MongoClient(URL);

    try {
      const myobj = req.body;

      if (!myobj?.sem?.DB_CL || !myobj?.session) {
        return res.status(400).json({
          status: "Fail",
          message: "Invalid request data",
        });
      }

      await client.connect();

      const resultDB = client.db("NepUG");
      const masterDB = client.db("NEP");

      const collection = resultDB.collection(`${myobj.sem.DB_CL}_RESULT`);

      const gradingSystem = await masterDB
        .collection("GradeSystem")
        .find({})
        .toArray();

      const students = await collection
        .find({ Session: myobj.session })
        .toArray();

      if (!students.length) {
        return res.status(404).json({
          status: "Fail",
          message: "No students found for this session",
        });
      }

      // ======================
      // HELPER FUNCTIONS
      // ======================
      const safeInt = (v) => (v != null && !isNaN(v) ? Number(v) : 0);

      const total = (arr) => arr.map(safeInt).reduce((a, b) => a + b, 0);

      const calc40 = (max) => Math.round(safeInt(max) * 0.4);

      const isPass = (obt, max) => safeInt(obt) >= calc40(max);

      // const invalidNumber = (obt, max) => (obt>=max?"AA":obt)

      const percent = (obt, max) =>
        safeInt(max) === 0
          ? 0
          : Number(((safeInt(obt) / safeInt(max)) * 100).toFixed(2));

      const isAbsent = (arr) =>
        arr.every(
          (v) => v === "AA"
          // || safeInt(v) === 0
        );

      const isAnyAbsent = (arr) => arr.some((v) => v === "AA");

      const getGrade = (p) => {
        if (p === "A") {
          return (
            gradingSystem.find(
              (g) =>
                g.percentageMarksMin === "A" && g.percentageMarksMax === "A"
            ) || null
          );
        } else {
          return (
            gradingSystem.find(
              (g) =>
                p >= Number(g.percentageMarksMin) &&
                p < Number(g.percentageMarksMax)
            ) || null
          );
        }
      };

      const getStatus = (theoryAbsent, practicalAbsent, overallPass) =>
        theoryAbsent || practicalAbsent
          ? "Ab"
          : overallPass
          ? "PASS"
          : "FAIL";

      // ======================
      // BULK + REPORT
      // ======================
      const bulkOps = [];
      const reportRows = [];

      // ======================
      // PROCESS STUDENTS
      // ======================
      for (const s of students) {
        // const updateFields = {};

        // ======================
        // MAJOR 1
        // ======================

        const m1TheoryObt = total([
          s.MajorDiscipline1Paper1Obtained,
          s.MajorDiscipline1Paper2Obtained,
          s.MajorDiscipline1Paper3Obtained,
        ]);

        const m1TheoryMax = total([
          s.MajorDiscipline1Paper1Max,
          s.MajorDiscipline1Paper2Max,
          s.MajorDiscipline1Paper3Max,
        ]);

        const m1Cia = safeInt(s.MajorDiscipline1CiaObtained);

        const m1TotalObt = total([m1TheoryObt, m1Cia]);

        const m1TotalMax = total([m1TheoryMax, s.MajorDiscipline1CiaMax]);

        const m1hasPractical = safeInt(s.MajorDiscipline1PracticalMax) > 0;

        const m1Practical = safeInt(s.MajorDiscipline1PracticalObtained);


        const m1PracticalAbsent =
          m1hasPractical && s.MajorDiscipline1PracticalObtained === "AA";

        const m1GradeObt = total([m1TheoryObt, m1Cia, m1Practical]);

        const m1GradeMax = total([
          m1TheoryMax,
          s.MajorDiscipline1CiaMax,
          s.MajorDiscipline1PracticalMax,
        ]);

        // ---- outputs ----
        let m1OverallPass = false;
        let m1Perc = 0;
        let m1Grade = null;

        // ======================
        // STEP 1: ABSENT
        // ======================
        if (
          isAnyAbsent([
            s.MajorDiscipline1Paper1Obtained,
            s.MajorDiscipline1Paper2Obtained,
            s.MajorDiscipline1Paper3Obtained,
          ]) ||
          m1PracticalAbsent
        ) {
          m1OverallPass = false;
          m1Perc = 0;
          m1Grade = getGrade("A"); // Absent grade
        }
        // ======================
        // STEP 2: PRACTICAL FAIL
        // ======================
        else if (
          m1hasPractical &&
          !isPass(
            s.MajorDiscipline1PracticalObtained,
            s.MajorDiscipline1PracticalMax
          )
        ) {
          m1OverallPass = false;
          m1Perc = 0;
          m1Grade = getGrade(0);
        }
        // ======================
        // STEP 3: THEORY FAIL
        // ======================
        else if (!isPass(m1TotalObt, m1TotalMax)) {
          m1OverallPass = false;
          m1Perc = 0;
          m1Grade = getGrade(0);
        }
        // ======================
        // STEP 4: PASS
        // ======================
        else {
          m1OverallPass = true;
          m1Perc = percent(m1GradeObt, m1GradeMax);
          m1Grade = getGrade(m1Perc);
        }
        // ======================
        // CPS
        // ======================
        const Ci1 = safeInt(s.MajorDiscipline1TotalCreditMax);
        const Gi1 = safeInt(m1Grade?.gradePoint ?? 0);
        const Cps1 = Ci1 * Gi1;


        // ======================
        // MAJOR 2
        // ======================

        const m2TheoryObt = total([
          s.MajorDiscipline2Paper1Obtained,
          s.MajorDiscipline2Paper2Obtained,
          s.MajorDiscipline2Paper3Obtained,
        ]);

        const m2TheoryMax = total([
          s.MajorDiscipline2Paper1Max,
          s.MajorDiscipline2Paper2Max,
          s.MajorDiscipline2Paper3Max,
        ]);

        const m2Cia = safeInt(s.MajorDiscipline2CiaObtained);

        const m2TotalObt = total([m2TheoryObt, m2Cia]);

        const m2TotalMax = total([m2TheoryMax, s.MajorDiscipline2CiaMax]);

        const m2hasPractical = safeInt(s.MajorDiscipline2PracticalMax) > 0;

        const m2Practical = safeInt(s.MajorDiscipline2PracticalObtained);


        const m2PracticalAbsent =
          m2hasPractical && s.MajorDiscipline2PracticalObtained === "AA";

        const m2GradeObt = total([m2TheoryObt, m2Cia, m2Practical]);

        const m2GradeMax = total([
          m2TheoryMax,
          s.MajorDiscipline2CiaMax,
          s.MajorDiscipline2PracticalMax,
        ]);

         // ---- outputs ----
         let m2OverallPass = false;
         let m2Perc = 0;
         let m2Grade = null;
 
         // ======================
         // STEP 1: ABSENT
         // ======================
         if (
           isAnyAbsent([
             s.MajorDiscipline2Paper1Obtained,
             s.MajorDiscipline2Paper2Obtained,
             s.MajorDiscipline2Paper3Obtained,
           ]) ||
           m2PracticalAbsent
         ) {
           m2OverallPass = false;
           m2Perc = 0;
           m2Grade = getGrade("A"); // Absent grade
         }
         // ======================
         // STEP 2: PRACTICAL FAIL
         // ======================
         else if (
           m2hasPractical &&
           !isPass(
             s.MajorDiscipline2PracticalObtained,
             s.MajorDiscipline2PracticalMax
           )
         ) {
           m2OverallPass = false;
           m2Perc = 0;
           m2Grade = getGrade(0);
         }
         // ======================
         // STEP 3: THEORY FAIL
         // ======================
         else if (!isPass(m2TotalObt, m2TotalMax)) {
           m2OverallPass = false;
           m2Perc = 0;
           m2Grade = getGrade(0);
         }
         // ======================
         // STEP 4: PASS
         // ======================
         else {
           m2OverallPass = true;
           m2Perc = percent(m2GradeObt, m2GradeMax);
           m2Grade = getGrade(m2Perc);
         }
         // ======================
         // CPS
         // ======================
         const Ci2 = safeInt(s.MajorDiscipline2TotalCreditMax);
         const Gi2 = safeInt(m2Grade?.gradePoint ?? 0);
         const Cps2 = Ci2 * Gi2;
 

        // ======================
        // MINOR
        // ======================

        const minorObt = safeInt(s.MinorDisciplinePaperObtained);

        const minorMax = safeInt(s.MinorDisciplinePaperMax);

        const minorCia = safeInt(s.MinorDisciplineCiaObtained,);

        const minorTotalObt = total([minorObt, minorCia]);

        const minorTotalMax = total([minorMax, s.MinorDisciplineCiaMax,]);

        const minorHasPractical = safeInt(s.MinorDisciplinePracticleMax) > 0;

        const minorPractical = safeInt(s.MinorDisciplinePracticalObtained);


        const minorPracticalAbsent =  minorHasPractical && s.MinorDisciplinePracticalObtained === "AA";

        const minorGradeObt = total([ 
          s.MinorDisciplinePaperObtained,
          s.MinorDisciplineCiaObtained,
          s.MinorDisciplinePracticalObtained,]);

        const minorGradeMax = total([
          s.MinorDisciplinePaperMax,
          s.MinorDisciplineCiaMax,
          s.MinorDisciplinePracticleMax,
        ]);

         // ---- outputs ----
         let minorPass = false;
         let minorPerc = 0;
         let minorGrade = null;
 
         // ======================
         // STEP 1: ABSENT
         // ======================
         if (
           isAnyAbsent([s.MinorDisciplinePaperObtained]) || minorPracticalAbsent
         ) {
          minorPass = false;
          minorPerc = 0;
          minorGrade = getGrade("A"); // Absent grade
         }
         // ======================
         // STEP 2: PRACTICAL FAIL
         // ======================
         else if (
           minorHasPractical &&
           !isPass(
            minorPractical,
            s.MinorDisciplinePracticleMax
           )
         ) {
          minorPass = false;
           minorPerc = 0;
           minorGrade = getGrade(0);
         }
         // ======================
         // STEP 3: THEORY FAIL
         // ======================
         else if (!isPass(minorTotalObt, minorTotalMax)) {
          minorPass = false;
          minorPerc = 0;
          minorGrade = getGrade(0);
         }
         // ======================
         // STEP 4: PASS
         // ======================
         else {
          minorPass = true;
          minorPerc = percent(minorGradeObt, minorGradeMax);
          minorGrade = getGrade(minorPerc);
         }
         // ======================
         // CPS
         // ======================
         const CiMi = safeInt(s.MinorDisciplineTotalCreditMax);
         const GiMi = safeInt(minorGrade?.gradePoint ?? 0);
         const CpsMi = CiMi * GiMi;
 


        // ===========================
        // OVER ALL MARKS OBTAINED
        // ===========================
        const OverAllMarksObtained = total([m1GradeObt, m2GradeObt, minorGradeObt]);

        // ===========================
        // DETENTION RULES FOR RESULT
        // ===========================

        const m1TheoryAbsent = isAnyAbsent([
          s.MajorDiscipline1Paper1Obtained,
          s.MajorDiscipline1Paper2Obtained,
          s.MajorDiscipline1Paper3Obtained])

          const m2TheoryAbsent = isAnyAbsent([
            s.MajorDiscipline2Paper1Obtained,
            s.MajorDiscipline2Paper2Obtained,
            s.MajorDiscipline2Paper3Obtained,
          ])

          const minorTheoryAbsent = isAnyAbsent([s.MinorDisciplinePaperObtained])

        const m1Status = getStatus(
          m1TheoryAbsent,
          m1PracticalAbsent,
          m1OverallPass
        );
        const m2Status = getStatus(
          m2TheoryAbsent,
          m2PracticalAbsent,
          m2OverallPass
        );
        const minorStatus = getStatus(
          minorTheoryAbsent,
          minorPracticalAbsent,
          minorPass
        );


        // -------------------------
        // NORMALIZE STATUSES
        // -------------------------
        const statuses = [m1Status, m2Status, minorStatus].filter(Boolean); // handles missing Major3 safely

        // -------------------------
        // COUNTS
        // -------------------------
        const failOnlyCount = statuses.filter((s) =>
          ["FAIL", "Ab"].includes(s)
        ).length;

        const hasAbsent = statuses.includes("Ab");

        const allAbsent =
          statuses.length > 0 && statuses.every((s) => s === "Ab");

        const hasUFM =
          statuses.includes("UFM") ||
          [
            s.MajorDiscipline1Paper1Obtained,
            s.MajorDiscipline1Paper2Obtained,
            s.MajorDiscipline1Paper3Obtained,
            s.MajorDiscipline2Paper1Obtained,
            s.MajorDiscipline2Paper2Obtained,
            s.MajorDiscipline2Paper3Obtained,
            s.MajorDiscipline3Paper1Obtained,
            s.MajorDiscipline3Paper2Obtained,
            s.MajorDiscipline3Paper3Obtained,
            s.MinorDisciplinePaperObtained,
          ].some((v) => v === "UF");

        const hasDET =
          statuses.includes("DET") ||
          [
            s.MajorDiscipline1Paper1Obtained,
            s.MajorDiscipline1Paper2Obtained,
            s.MajorDiscipline1Paper3Obtained,
            s.MajorDiscipline2Paper1Obtained,
            s.MajorDiscipline2Paper2Obtained,
            s.MajorDiscipline2Paper3Obtained,
            s.MajorDiscipline3Paper1Obtained,
            s.MajorDiscipline3Paper2Obtained,
            s.MajorDiscipline3Paper3Obtained,
            s.MinorDisciplinePaperObtained,
          ].some((v) => v === "DET");

        // -------------------------
        // FINAL RESULT LOGIC
        // -------------------------
        let Result;

        if (hasUFM) {
          Result = "UFM";
        } else if (hasDET) {
          Result = "Detained";
        } else if (allAbsent) {
          Result = "ABSENT";
        } else if (failOnlyCount === 0 && !hasAbsent) {
          Result = "Promoted (P)";
        } else if (failOnlyCount <= 1) {
          Result = "Eligible for Second Examination (Provisionally Promoted)";
        } else {
          Result = "Semester Back (Provisionally Promoted)";
        }

        const Sgpa = Number(
          total([Cps1, Cps2, CpsMi]) / total([Ci1, Ci2, CiMi])
        ).toFixed(2);

        // ======================
        // FINAL RESULT OBJECT
        // ======================
        const finalResult = {
          // ======================
          // MAJOR 1
          // ======================
          MajorDiscipline1TheoryObtained: m1TheoryObt,
          MajorDiscipline1TotalObtained: m1GradeObt,
          MajorDiscipline1Percentage: m1Perc,
          MajorDiscipline1GradePoint: m1Grade?.gradePoint ?? 0,
          MajorDiscipline1LetterGrade: m1Grade?.letterGrade,
          MajorDiscipline1Classisfication: m1Grade?.classisfication,
          Major1Status: m1Status,
          Major1Cps: Cps1,
          PracticalMajor1: isAbsent([s.MajorDiscipline1PracticalObtained])
            ? "Absent"
            : "Present",

          // ======================
          // MAJOR 2
          // ======================
          MajorDiscipline2TheoryObtained: m2TheoryObt,
          MajorDiscipline2TotalObtained: m2GradeObt,
          MajorDiscipline2Percentage: m2Perc,
          MajorDiscipline2GradePoint: m2Grade?.gradePoint ?? 0,
          MajorDiscipline2LetterGrade: m2Grade?.letterGrade,
          MajorDiscipline2Classisfication: m2Grade?.classisfication,
          Major2Status: m2Status,
          Major2Cps: Cps2,

          // ======================
          // MINOR
          // ======================
          MinorDisciplineTotalObtained: minorGradeObt,
          MinorPercentage: minorPerc,
          MinorGradePoint: minorGrade?.gradePoint ?? 0,
          MinorDisciplineLetterGrade: minorGrade?.letterGrade,
          MinorDisciplineClassisfication: minorGrade?.classisfication,
          MinorStatus: minorStatus,
          MinorCps: CpsMi,

          // ======================
          // OVERALL
          // ======================
          Skill: s.Skill,
          OverAllSemMarks: OverAllMarksObtained,
          OverAllResult: Result,
          TotalCpsObtained: total([Cps1, Cps2, CpsMi]),
          TotalCi: total([Ci1, Ci2, CiMi]),
          TotalSgpa: Sgpa,
          Remarks: "GRADING SYSTEM @40%",
          PDF: "PDF",
        };

        bulkOps.push({
          updateOne: {
            filter: { _id: s._id },
            // update: { $set: { ...updateFields, ...finalResult } },
            update: { $set: { ...finalResult } },
          },
        });

        reportRows.push({
          EnrolmentNumber: s.EnrolmentNumber,
          RollNumber: s.RollNumber,
          ...finalResult,
        });
      }

      if (bulkOps.length) await collection.bulkWrite(bulkOps);

      // ======================
      // EXCEL EXPORT
      // ======================
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(reportRows);
      XLSX.utils.book_append_sheet(workbook, worksheet, "ResultReport");

      const buffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "buffer",
      });

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=ResultReport.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      return res.send(buffer);
    } catch (err) {
      console.error("MakeResult Error:", err);
      return res.status(500).json({
        status: "Error",
        message: "Internal Server Error",
      });
    } finally {
      await client.close();
    }
  };
}

export default userController;
