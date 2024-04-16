import express from 'express'
const router = express.Router()
import userController from '../controller/userController.js'

//Public Roters
router.post('/registration', userController.userRegistration)
router.post('/login', userController.login)

//Private Routers


export default router