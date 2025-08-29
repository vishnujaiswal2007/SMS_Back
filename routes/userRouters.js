import express from 'express'
const router = express.Router()
import userController from '../controller/userController.js'
import checkUserAuth from '../Middleware/user_auth.js'
import multer from 'multer'


const upload = multer({ storage: multer.memoryStorage() });


//Authentication
router.use('/chngpas', checkUserAuth)
router.use('/getverify', checkUserAuth)
router.use('/getdetails', checkUserAuth)
router.use('/updateRecord', checkUserAuth)
router.use('CbcsUgProfile', checkUserAuth)


//Public Roters
router.post('/registration', userController.userRegistration)
router.post('/login', userController.login)
router.post('/UG_details', userController.getdetails)
router.post('/getsem', userController.getsem)
router.post('/attend', userController.attendance)
router.post('/resetpass', userController.resetpass)
router.post(`/reset/:id/:token`, userController.reset)
router.get(`/getcourse/:CR/:type`, userController.getcourse)
router.post('/desig',userController.getDesig)

//Private Routers
router.post('/chngpas', userController.changepassword)
router.post('/getverify', userController.getVerify)
router.post('/getdetails', userController.getdetails)
router.post('/updateRecord', userController.updateRecord)
router.post('/CbcsUgProfile', upload.single("file"), userController.CbcsUgProfile)


export default router