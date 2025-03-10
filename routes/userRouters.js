import express from 'express'
const router = express.Router()
import userController from '../controller/userController.js'
import checkUserAuth from '../Middleware/user_auth.js'

//Authentication
router.use('/chngpas', checkUserAuth)

//Public Roters
router.post('/registration', userController.userRegistration)
router.post('/login', userController.login)
router.post('/UG_details', userController.getdetails)
router.post('/getcourse', userController.getcourse)
router.post('/attend', userController.attendance)

//Private Routers
router.post('/chngpas', userController.changepassword)


export default router