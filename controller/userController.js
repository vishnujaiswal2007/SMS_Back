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

        //Regular or Ex
        const YearCat = row.cat === 1?"Regular Candidate": "Ex-Student"

        // INSERT CLEAN DATA
        recordsToInsert.push({
          Profile: {
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

              ...(disciplineMajor1Details?.MajorPracticleCreditMax != null && {
                MajorDiscipline1PracticleCreditMax:
                  disciplineMajor1Details.MajorPracticleCreditMax,
                MajorDiscipline1PracticleObtained: "",
              }),
              ...(disciplineMajor1Details?.MajorTotalMax != null && {
                MajorDiscipline1TotalMax: disciplineMajor1Details.MajorTotalMax,
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

            //Discipline 1 Major Paper 2

            ...(paperMajorDiscipline1[1]?.COURSE_NAME != null && {
              MajorDiscipline1Paper2: paperMajorDiscipline1[1]?.COURSE_NAME,

              ...(disciplineMajor1Details?.Major2Max != null && {
                MajorDiscipline1Paper2Max: disciplineMajor1Details?.Major2Max,
                MajorDiscipline1Paper2Obtained: "",
              }),
              ...(disciplineMajor1Details?.Major2CreditMax != null && {
                MajorDiscipline1Paper2CreditMax:
                  disciplineMajor1Details?.Major2CreditMax,
                MajorDiscipline1Paper2CreditObtained: "",
              }),
            }),

            //Discipline 1 Major Paper 3

            ...(paperMajorDiscipline1[2]?.COURSE_NAME && {
              MajorDiscipline1Paper3: paperMajorDiscipline1[2]?.COURSE_NAME,
              ...(disciplineMajor1Details?.Major3Max != null && {
                MajorDiscipline1Paper3Max: disciplineMajor1Details?.Major3Max,
                MajorDiscipline1Paper3Obtained: "",
              }),
              ...(disciplineMajor1Details?.Major3CreditMax != null && {
                MajorDiscipline1Paper3CreditMax:
                  disciplineMajor1Details?.Major3CreditMax,
                MajorDiscipline1Paper3CreditObtained: "",
              }),
            }),

            //Discipline 1 Minor

            //  ...(paperMinorDiscipline1?.COURSE_NAME && {
            //   MajorDiscipline1Minor: paperMinorDiscipline1.COURSE_NAME,
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
              ...(disciplineMajor2Details?.MajorPracticleCreditMax != null && {
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

            //Discipline 2 Major Paper 2

            ...(paperMajorDiscipline2[1]?.COURSE_NAME && {
              MajorDiscipline2Paper2: paperMajorDiscipline2[1]?.COURSE_NAME,
              ...(disciplineMajor2Details?.Major2Max != null && {
                MajorDiscipline2Paper2Max: disciplineMajor2Details?.Major2Max,
                MajorDiscipline2Paper2Obtained: "",
              }),
              ...(disciplineMajor2Details?.Major2CreditMax != null && {
                MajorDiscipline2Paper2CreditMax:
                  disciplineMajor2Details?.Major2CreditMax,
                MajorDiscipline2Paper2CreditObtained: "",
              }),
            }),

            //Discipline 2 Major Paper 3

            ...(paperMajorDiscipline2[2]?.COURSE_NAME && {
              MajorDiscipline2Paper3: paperMajorDiscipline2[2]?.COURSE_NAME,
              ...(disciplineMajor2Details?.Major3Max != null && {
                MajorDiscipline2Paper3Max: disciplineMajor2Details?.Major3Max,
                MajorDiscipline2Paper3Obtained: "",
              }),
              ...(disciplineMajor2Details?.Major3CreditMax != null && {
                MajorDiscipline2Paper3CreditMax:
                  disciplineMajor2Details?.Major3CreditMax,
                MajorDiscipline2Paper3CreditObtained: "",
              }),
            }),

            //Discipline 2 Minor

            //  ...(paperMinorDiscipline2?.COURSE_NAME && {
            //   MajorDiscipline2Minor: paperMinorDiscipline2.COURSE_NAME,
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
              ...(disciplineMinorDetails?.Minor1PracticalCreditMax != null && {
                MinorDisciplinePracticalCreditMax:
                  disciplineMinorDetails?.Minor1PracticalCreditMax,
                MinorDisciplinePracticalCreditObtained: "",
              }),
              ...(disciplineMinorDetails?.MinorTotalMax != null && {
                MinorDisciplineTotalMax: disciplineMinorDetails?.MinorTotalMax,
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

      const sessionCandidates = await resultCol
        .find({ Session: myobj.session })
        .toArray();

      const nepDB = client.db("NEP");

      const reportRows = [];
      const bulkOps = [];

      // =========================
      // HELPER FUNCTION
      // =========================
      const updateIfValid = (
        candidate,
        updateFields,
        report,
        paperMatch,
        obtainedField,
        maxField,
        marks
      ) => {
        if (
          paperMatch &&
          (candidate[obtainedField] === "" || candidate[obtainedField] == null)
        ) {
          if (marks > candidate[maxField]) {
            report.Reason = "Marks greater than maximum";
            return false;
          }
          updateFields[obtainedField] = marks;
          return true;
        }
        return null;
      };

      // =========================
      // PROCESS EACH ROW
      // =========================
      for (const [index, dt] of data.entries()) {
        const excelRow = index + 2;
        const isCIA = Number(dt.pa) === 7;

        const report = {
          row: excelRow,
          RollNumber: dt.rn,
          EnrolmentNumber: dt.en,
          Discipline: "",
          Paper: isCIA ? "CIA" : "",
          Marks: dt.mrk11,
          Status: "FAILED",
          Reason: "",
        };

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

        const discipline = await nepDB
          .collection("DiciplineDetails")
          .findOne({ Number_Code: parseInt(dt.sb) });

        const paper = !isCIA
          ? await nepDB.collection("PaperDetails").findOne({
              DISCIPLINE: discipline?.DISCIPLINE?.trim(),
              PaperCode: parseInt(dt.pa),
            })
          : null;

        if (!discipline || (!paper && !isCIA)) {
          report.Reason = "Discipline / Paper not found";
          reportRows.push(report);
          continue;
        }

        const disciplineName = discipline.DISCIPLINE.trim();
        const paperName = paper?.COURSE_NAME?.trim();

        report.Discipline = disciplineName;
        if (!isCIA) report.Paper = paperName;

        const isMajor1 = candidate.MajorDiscipline1 === disciplineName;
        const isMajor2 = candidate.MajorDiscipline2 === disciplineName;
        const isMinor = candidate.MinorDiscipline === disciplineName;

        if (!isMajor1 && !isMajor2 && !isMinor) {
          report.Reason = "Discipline not linked to candidate";
          reportRows.push(report);
          continue;
        }

        const updateFields = {};
        let updated = false;

        // =========================
        // MAJOR 1
        // =========================
        if (isMajor1) {
          if (isCIA) {
            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              true,
              "MajorDiscipline1CiaObtained",
              "MajorDiscipline1CiaMax",
              dt.mrk11
            );
          } else {
            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              candidate.MajorDiscipline1Paper1 === paperName,
              "MajorDiscipline1Paper1Obtained",
              "MajorDiscipline1Paper1Max",
              dt.mrk11
            );
            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              candidate.MajorDiscipline1Paper2 === paperName,
              "MajorDiscipline1Paper2Obtained",
              "MajorDiscipline1Paper2Max",
              dt.mrk11
            );
            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              candidate.MajorDiscipline1Paper3 === paperName,
              "MajorDiscipline1Paper3Obtained",
              "MajorDiscipline1Paper3Max",
              dt.mrk11
            );
          }
        }

        // =========================
        // MAJOR 2
        // =========================
        if (isMajor2) {
          if (isCIA) {
            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              true,
              "MajorDiscipline2CiaObtained",
              "MajorDiscipline2CiaMax",
              dt.mrk11
            );
          } else {
            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              candidate.MajorDiscipline2Paper1 === paperName,
              "MajorDiscipline2Paper1Obtained",
              "MajorDiscipline2Paper1Max",
              dt.mrk11
            );
            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              candidate.MajorDiscipline2Paper2 === paperName,
              "MajorDiscipline2Paper2Obtained",
              "MajorDiscipline2Paper2Max",
              dt.mrk11
            );
            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              candidate.MajorDiscipline2Paper3 === paperName,
              "MajorDiscipline2Paper3Obtained",
              "MajorDiscipline2Paper3Max",
              dt.mrk11
            );
          }
        }

        // =========================
        // MINOR
        // =========================
        if (isMinor) {
          if (isCIA) {
            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              true,
              "MinorDisciplineCiaObtained",
              "MinorDisciplineCiaMax",
              dt.mrk11
            );
          } else {
            updated ||= updateIfValid(
              candidate,
              updateFields,
              report,
              candidate.MinorDisciplinePaper === paperName,
              "MinorDisciplinePaperObtained",
              "MinorDisciplinePaperMax",
              dt.mrk11
            );
          }
        }

        if (!updated) {
          report.Reason = "Paper not linked or marks already uploaded";
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
  
      const collection = resultDB.collection(
        `${myobj.sem.DB_CL}_RESULT`
      );
  
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
  
      const total = (arr) =>
        arr.map(safeInt).reduce((a, b) => a + b, 0);
  
      const calc40 = (max) => Math.round(safeInt(max) * 0.4);
  
      const isPass = (obt, max) =>
        safeInt(obt) >= calc40(max);
  
      const percent = (obt, max) =>
        safeInt(max) === 0 ? 0 : Math.round((safeInt(obt) / safeInt(max)) * 100);
  
      const isAbsent = (arr) =>
        arr.map(safeInt).every((v) => v === 0);
  
      const getGrade = (p) =>
        gradingSystem.find(
          (g) =>
            p >= Number(g.percentageMarksMin) &&
            p < Number(g.percentageMarksMax)
        ) || null;
  
      // ======================
      // BULK + REPORT
      // ======================
      const bulkOps = [];
      const reportRows = [];
  
      // ======================
      // PROCESS STUDENTS
      // ======================
      for (const s of students) {
        const updateFields = {};
  
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
        const m1Practical = safeInt(s.MajorDiscipline1PracticalObtained);
  
        const m1TotalObt = m1TheoryObt + m1Cia + m1Practical;
  
        const m1GradeObt = m1TheoryObt + m1Cia;
        const m1GradeMax = m1TheoryMax + safeInt(s.MajorDiscipline1CiaMax);
  
        const m1Perc = percent(m1GradeObt, m1GradeMax);
        const m1Grade = getGrade(m1Perc);
  
        const m1TheoryPass = isPass(m1TheoryObt, m1TheoryMax);
        const m1OverallPass =
          m1TheoryPass && isPass(m1TotalObt, s.MajorDiscipline1TotalMax);
  
        if (
          isAbsent([
            s.MajorDiscipline1Paper1Obtained,
            s.MajorDiscipline1Paper2Obtained,
            s.MajorDiscipline1Paper3Obtained,
          ])
        )
          updateFields.MajorDiscipline1TheoryStatus = "ABSENT";
  
        if (isAbsent([s.MajorDiscipline1CiaObtained]))
          updateFields.MajorDiscipline1CiaStatus = "ABSENT";
  
        if (isAbsent([s.MajorDiscipline1PracticalObtained]))
          updateFields.MajorDiscipline1PracticalStatus = "ABSENT";
  
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
        const m2Practical = safeInt(s.MajorDiscipline2PracticalObtained);
  
        const m2TotalObt = m2TheoryObt + m2Cia + m2Practical;
  
        const m2GradeObt = m2TheoryObt + m2Cia;
        const m2GradeMax = m2TheoryMax + safeInt(s.MajorDiscipline2CiaMax);
  
        const m2Perc = percent(m2GradeObt, m2GradeMax);
        const m2Grade = getGrade(m2Perc);
  
        const m2TheoryPass = isPass(m2TheoryObt, m2TheoryMax);
        const m2OverallPass =
          m2TheoryPass && isPass(m2TotalObt, s.MajorDiscipline2TotalMax);

          if (
            isAbsent([
              s.MajorDiscipline2Paper1Obtained,
              s.MajorDiscipline2Paper2Obtained,
              s.MajorDiscipline2Paper3Obtained,
            ])
          )
            updateFields.MajorDiscipline2TheoryStatus = "ABSENT";
    
          if (isAbsent([s.MajorDiscipline2CiaObtained]))
            updateFields.MajorDiscipline2CiaStatus = "ABSENT";
    
          if (isAbsent([s.MajorDiscipline2PracticalObtained]))
            updateFields.MajorDiscipline2PracticalStatus = "ABSENT";
  
        // ======================
        // MINOR
        // ======================
        const minorObt = total([
          s.MinorDisciplinePaperObtained,
          s.MinorDisciplineCiaObtained,
          s.MinorDisciplinePracticalObtained,
        ]);
  
        const minorMax = total([
          s.MinorDisciplinePaperMax,
          s.MinorDisciplineCiaMax,
          s.MinorDisciplinePracticalMax,
        ]);
  
        const minorPerc = percent(minorObt, minorMax);
        const minorGrade = getGrade(minorPerc);
  
        const minorPass =
          isPass(s.MinorDisciplinePaperObtained, s.MinorDisciplinePaperMax) &&
          isPass(minorObt, minorMax);

          if (
            isAbsent([
              s.MinorDisciplinePaperObtained
            ])
          )
            updateFields.MinorDisciplineTheoryStatus = "ABSENT";
    
          if (isAbsent([s.MinorDisciplineCiaObtained]))
            updateFields.MinorDisciplineCiaStatus = "ABSENT";
    
          if (isAbsent([s.MinorDisciplinePracticalObtained]))
            updateFields.MinorDisciplinePracticalStatus = "ABSENT";

        // ===========================
        // DETENTION RULES FOR RESULT
        // ===========================







  
        // ======================
        // FINAL RESULT OBJECT
        // ======================
        const finalResult = {
          MajorDiscipline1TotalObtained: m1TotalObt,
          MajorDiscipline1Percentage: m1Perc,
          MajorDiscipline1GradePoint: m1Grade?.gradePoint || 0,
          MajorDiscipline1LetterGrade:
            m1OverallPass ? m1Grade?.letterGrade || "F" : "F",
          MajorDiscipline1Classisfication:
            m1OverallPass ? m1Grade?.classisfication || "FAIL" : "FAIL",
  
          MajorDiscipline2TotalObtained: m2TotalObt,
          MajorDiscipline2Percentage: m2Perc,
          MajorDiscipline2GradePoint: m2Grade?.gradePoint || 0,
          MajorDiscipline2LetterGrade:
            m2OverallPass ? m2Grade?.letterGrade || "F" : "F",
          MajorDiscipline2Classisfication:
            m2OverallPass ? m2Grade?.classisfication || "FAIL" : "FAIL",
  
          MinorDisciplineTotalObtained: minorObt,
          MinorPercentage: minorPerc,
          MinorGradePoint: minorGrade?.gradePoint || 0,
          MinorDisciplineLetterGrade:
            minorPass ? minorGrade?.letterGrade || "F" : "F",
          MinorDisciplineClassisfication:
            minorPass ? minorGrade?.classisfication || "FAIL" : "FAIL",
        };
  
        bulkOps.push({
          updateOne: {
            filter: { _id: s._id },
            update: { $set: { ...updateFields, ...finalResult } },
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
