import express from 'express'
const router = express.Router()
import userController from '../controller/userController.js'

//Public Roters
router.post('/registration', userController.userRegistration)

//Private Routers


export default router