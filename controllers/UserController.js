const appError = require("../errorHandling/appError");
const { CatchAsync } = require("../errorHandling/utils");
const UserModel = require("../Models/UserModel");
const jwt = require("jsonwebtoken")
const util = require("util");
const sendEmail = require("../utils/email_utility");
const crypto = require("crypto")

async function signJWT(userId){
    return jwt.sign(
        { id: userId},
        process.env.JWT_SECRET,
        {  
            // expiresIn: Math.floor(Date.now()/1000),
            expiresIn: "90d",
        }

    )
}

exports.authorize = CatchAsync(async function(req, res, next){
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
        return  next(new appError("You are not logged in!", 401));
    }
    // promisify is library convert Synchronous code into Asynchrounous
    // instead write jwt.verify(token, process,env.JWT_SECRET) because time consumeing i.e. 20 millisecond approx so write like below
    const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET)
    // User might have changed their password after this token was issued
    // We validating if the token was issued after password was changed
    const currentUser = await UserModel.findById(decoded.id).select("+passwordChangedAt")
    if(await currentUser.changePasswordAfter(decoded.iat)){
        return next(new appError("Password has been changed. Please login again!", 401));
    }
    req.userId = decoded.id;
    next()
})
exports.UserSignupController = CatchAsync(async function(req, res, next) {
    const {firstName, username, email, password, passwordConfirm, role, lastName, dob, image, googleId, email_verified} = req.body;
    console.log(googleId, email_verified)
    if(googleId){
        const user = await UserModel.findOne({googleId});
        if(user){
            return next(new appError("Unable to create account. Please try again or contact support.", 400));
        }
        const newUser = await UserModel.create({
            firstName,
            email,
            username,
            lastName,
            image,
            googleId,
            email_verified
        });
        const authToken = await signJWT(newUser._id)

        res.cookie("authToken", authToken, {
            httpOnly:true,
            expires: new Date(Date.now() + 15*60*1000),

        })
        return res.status(200).json({
            status: "success",
        })
    }

    if (!email || !password) {
        return next(new appError("Please provide email and password!", 400));
    }

    if (password !== passwordConfirm) {
        return next(new appError("Passwords does not match!", 400));
    }
    const user = await UserModel.findOne({email});
    if(user){
        console.log("here", "harharmahadev")
        console.log("user", user)
        return next(new appError("Unable to create account. Please try again or contact support.", 400));
    }
    const newUser = await UserModel.create({
        firstName,
        email,
        password,
        passwordConfirm,
        role,
        username,
        lastName,
        dob,
        image

    });
    const token = await signJWT(newUser._id)

    res.cookie("authToken", token, {
        httpOnly:true,
        expires: new Date(Date.now() + 15*60*1000),

    })
    res.status(201).json({
        status: "success",
        // user: user,
    })
})

exports.updateUserRoleToHostController = CatchAsync(async function(req, res, next){
    const authToken = req.cookies.authToken
    if(!authToken){
        return next(new appError("NOT_LOGGED_IN", 401))
    }
    const decoded = await util.promisify(jwt.verify)(authToken, process.env.JWT_SECRET)
    if(!decoded){
        return next(new appError("NOT_LOGGED_IN", 401))
    }

    const user = await UserModel.findById(decoded.id)
    if(!user){
        return next(new appError("User does not exist. Please log in again.", 404));
    }
    
    user.role = "host"
    await user.save();
    res.status(200).json({
        status: "success",
        user
    })
}) 

exports.UserLoginController = CatchAsync(async function(req, res, next) {
    // 1: Extract email and password from the request
    console.log(req.cookies)
    const { email, password, googleId, email_verified } = req.body;

    if(googleId && email_verified){
        const user = await UserModel.findOne({googleId});
        if(user){
            const authToken = await signJWT(user._id)
            res.cookie("authToken", authToken, {
                httpOnly:true,
                expires: new Date(Date.now() + 15*60*1000)
            })
            return res.status(200).json({
                status: "success",
            })
        }
    }

    // 2: Verify if an account exist with that email
    if (!email || !password){
        return next(new appError("Please provide email and password!", 400))
    }
    // 3: Check if the raw password provided is correct or not
    const user = await UserModel.findOne({email}).select("+password"); // + means: Provide password along with other information; - means: other than password, give everything; no + - means: give only password
    if(!user || !(await user.isCorrectPassword(password))){
        next(new appError("Invalid email or password!", 401));
        return;
    }
    // 4: Generate a JWT token for the client
    const token = await signJWT(user._id)

    // 5: Respond
    res.cookie("authToken",token, {
        httpOnly:true,
        expires: new Date(Date.now() + 15*60*1000)
    })
    res.status(201).json({
        status: "success",
    })
})

exports.isLogin = CatchAsync(async function(req, res, next){
    const authToken = req.cookies.authToken
    if(!authToken){
        return next(new appError("NOT_LOGGED_IN", 401))
    }
    const decoded = await util.promisify(jwt.verify)(authToken, process.env.JWT_SECRET)
    if(!decoded){
        return next(new appError("NOT_LOGGED_IN", 401))
    }
    

    const user = await UserModel.findById(decoded.id)
    if(!user){
        return next(new appError("User does not exist. Please log in again.", 404));
    }

    res.status(200).json({
        status: "success",
        user
    })
    
})
exports.Logout = CatchAsync(async function(req, res , next){
    res.clearCookie("authToken")
    res.status(200).json({
        status: "success"
    })
})

exports.GetUserController = CatchAsync(async function(req, res, next){
    const { userId } = req;
    const user = await UserModel.findById(userId).select("-password -__v -_id");
    if(!user) {
        return next(new appError("User not found!", 404));
    }
    res.status(201).json({
        status: "success",
        user, 
    })
})


exports.forgotPasswordController = CatchAsync(async function(req, res, next){
    const {email} = req.body;
    if(!email) {
        return next(new appError("Please provide your email", 400))
    }
    const user = await UserModel.findOne({email});
    if(!user){
        return next(new appError("Please check your email", 404))
    }
    const resetToken = await user.createPasswordResetToken();

    await user.save({validateBeforeSave: false}); // this is required if you use "=" to update values
    
    const emailOptions = {
        email: email,
        subject: "Reset Your Password!",
        message: `Please find below your Password reset button.Thanks for using our application`,
        resetToken: resetToken
    }
    await sendEmail(emailOptions)
    res.status(200).json({
        status: "success",
        message: "Please check your inbox, we have sent an email for reset password!"
    })
})
exports.updatePasswordController = CatchAsync(async function (req, res, next) {
    const {password, passwordConfirm, token} = req.body;

    if(!password || !passwordConfirm || !token){
        return next(new appError("Please provide all fields", 400))
    }
    if(password !== passwordConfirm){
        return next(new appError("Passwords do not match", 400))
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    // Step 1: Verify the token
    const user = await UserModel.findOne({passwordResetToken: hashedToken});
    if(!user){
        return next(new appError("Invalid or expired token.", 404))
    }
    // Step 1.1: has the token expired?
    if(Date.now() > user.passwordResetExpires){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false})
        return next(new appError("Your token has expired! Please generate a new one!"))
    }
    // Step 1.2: Hash token provided by user and then compare with the one in DB
    // const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    // if (hashedToken != user.passwordResetToken){
    //     return next(new appError("Invalid token! Please try again!", 401));
    // }

    // Step 2: update the password
    user.password = password;
    // Step 3: Reset the passwordResetToken in DB. Why? So that passwordResetToken is only use 1  time by user
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save()
    // Step 4: Generate a JWT token for the client
    const JWTtoken = await signJWT(user._id)
    // Step  5: Respond

    res.cookie("authToken", JWTtoken, {
        httpOnly:true,
        expires: new Date(Date.now() + 15*60*1000),

    })
    res.status(200).json({
        status: "success",
        message: "Password has been reset successfully!",
    });
})