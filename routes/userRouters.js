import express from 'express'
const router = express.Router()
import userController from '../controller/userController.js'

//Authentication


//Public Roters
router.post('/registration', userController.userRegistration)
router.post('/login', userController.login)

//Private Routers
router.post('/chngpas', userController.changepassword)


export default router