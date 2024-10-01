const express = require("express")
const { UserSignupController, UserLoginController, GetUserController, authorize, updatePasswordController, forgotPasswordController, isLogin, Logout, updateUserRoleToHostController, VerifyEmailController } = require("../controllers/UserController")
const UserRouter = express.Router()

UserRouter.post("/signup", UserSignupController)
UserRouter.post("/verify_email", VerifyEmailController)
UserRouter.post("/login_signin", UserLoginController)
UserRouter.get("/", authorize, GetUserController)
UserRouter.post("/change_password", updatePasswordController)
UserRouter.post("/forgot_password", forgotPasswordController)
UserRouter.get("/isLogin", isLogin)
UserRouter.get("/logout", Logout)
UserRouter.get("/hostRole", updateUserRoleToHostController)
module.exports = UserRouter