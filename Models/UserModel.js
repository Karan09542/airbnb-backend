const mongoose = require("mongoose")
const email_validator = require("email-validator")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const { type } = require("os")

const UserSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    image:{
        type:String
    },
    favorites: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "hotel",
        default: []
    },
    username: {
        type: String,
        required: [false, "उपयोगकर्ता का नाम अनिवार्य हैं"]
    },
    active: { // Active mean account is Open OR Closed
        type: Boolean,
        default: true,
    },
    firstName: {
        type: String,
        required: [true, "Please provide a valid firstname!"]
    },
    lastName: {
        type: String,
        required: [true, "Please provide a valid lastname!"]
    },
    email: {
        type: String,
        required: [true, "Please provide a valid email-id!"],
        unique: true,
        lowercase: true,
        validate: {
            validator: (validate_email)=> {
                email_validator.validate(validate_email)
            },
            message: "Please provide a valid email"
        }
    },
    role: {
        type: String,
        enum: ["user", "host", "admin"],
        default: "user"
    },
    password: {
        type: String,
        minlength: [8, "Password must be at least 8 characters long!,but got {VALUE}"],
        select: false,
    },
    passwordConfirm: {
        type: String,
        select: false,
        validate: {
            validator: function(confirm_password) {
                return this.password == confirm_password
            },
            message: "Provided passwords does not match!"
        }
    },
    passwordChangedAt:{
        type: Date,
        default: Date.now(),
        select: false,
    },
    passwordResetToken: {
        type: String,
        unique: true
    },
    passwordResetExpires: Date,
    dob: {
        type: Date,
        // required: [true, "Please provide date of birth"]
    },
    // auth by google
    emailVerified: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        unique: true,
    }

})

UserSchema.pre("save", async function(next){

    if(this.googleId){
        // Set the username as first and last name fro Google login
        if(this.isModified("firstName") || this.isModified("lastName")){
            this.username = `${this.firstName} ${this.lastName}`
        }

        return next()
    }

    // For non-Google login 
    if(this.isModified("firstName") || this.isModified("lastName")){
        this.username = `${this.firstName} ${this.lastName}`
    }

    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 11);
    this.passwordConfirm = undefined;
    next()
})
// 
// Agar aapke hook mein next() function ko call kiye bina bhi kaam ho raha hai, toh iska matlab hai ki aap asynchronous function mein promise ka sahi tareeke se handle kar rahe hain. Jab aap async/await ka use karte hain, aur function properly resolve ho jata hai, toh Mongoose ko manually next() call karne ki zarurat nahi hoti.

// Samajhne ke liye:
// next() ka use: next() function ko manually call karne ki zarurat tab hoti hai jab aap synchronous code ya callbacks use kar rahe hote hain. Isse Mongoose ko pata chalta hai ki pre-hook process complete ho gaya hai.
// async/await mein: Agar aap await ka use karte hain aur function resolve ho jata hai, toh Mongoose automatically samajh leta hai ki hook complete ho gaya hai, aur next() call ki zarurat nahi hoti.

// Instance methods
UserSchema.methods.changePasswordAfter = async function(JwtIssuedAt){
    const timeStampInMilliSeconds = this.passwordChangedAt.getTime();
    // getTime is builtin method so you don't worry about it
    const changedTimestamp = parseInt(
        //  here we are converting ms to s
        timeStampInMilliSeconds / 1000,
        10 // base 10
    )
    return JwtIssuedAt < changedTimestamp
}

UserSchema.methods.createPasswordResetToken = async function() {
    // this funtion does the following
    // 1. generates password token
    // 2. stores the hashed form of this in the DB
    // 3. Returns raw token in response
    const resetToken = crypto.randomBytes(32).toString("hex")
    this.passwordResetToken = await crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 10*60*1000;
    return resetToken
}

UserSchema.methods.isCorrectPassword = async function(rawPassword){
    return bcrypt.compare(rawPassword, this.password)
}

const UserModel = mongoose.model("User_Authenticate", UserSchema)
module.exports = UserModel