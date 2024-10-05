const express  = require("express")
const path = require("path")
const cors = require("cors")
const cookieParser = require("cookie-parser")

const UserRouter = require("./routes/UserRouter.js")


// dotenv configure 
const dotenv = require("dotenv")
const { globalErrorHandlingController, unHandleRoutesController } = require("./errorHandling/errorHandlingControllers.js")
const HotelRouter = require("./routes/HotelRouter.js")
const BookingRouter = require("./routes/BookingRouter.js")
dotenv.config({path: "./.env"}) 

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173/",
    methods: ['GET', 'POST', 'PUT', 'DELETE', "PATCH"], // Allowed methods
    credentials: true,  // Allow credentials (cookies, auth headers, etc.)
}))

// Parse URL-encoded bodies
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
// app.use("/namaste", naman)
// app.use(express.static("../"))
app.use(express.static(path.join(__dirname, "static")))
app.use(express.json()) // to excess body in request
app.use("/user", UserRouter)
app.use("/hotel", HotelRouter)
app.use("/book", BookingRouter )
// app.use(cors({
//     origin: 'http://localhost:5173', // Allow only this origin
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
//     credentials: true, // Allow credentials (cookies, authorization headers, etc.)
// }));
app.get("/",(req, res)=> {
    res.send("सीताराम सीताराम")
})
// ....other routes
app.all("*", unHandleRoutesController)

// error handling middleware if you give four parameter i.e err, req, res, next
// Global error handling middleware

app.use(globalErrorHandlingController)

module.exports = app