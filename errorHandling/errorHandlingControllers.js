const { sendErrProd, sendErrDev, handleJWTError, handleJWTExpiredError, handleMongoServerError, handleMongoValidationError } = require("./utils");

exports.globalErrorHandlingController = (err,req, res,next)=>{ 
    if (err.name === "JsonWebTokenError") err =  handleJWTError();
    if (err.name === "TokenExpiredError") err = handleJWTExpiredError();
    if (err.name === "MongoServerError") err = handleMongoServerError();
    if(err.name === "ValidationError") err = handleMongoValidationError();
    console.log(err)

    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal server error";
    err.status = err.status || "error";

    // res.status(err.statusCode).json({
    //     status: err.status,
    //     message: err.message
    // });
    // return;

    // OR

    if(process.env.NODE_ENV === "production"){
        // logic
        sendErrProd(err, res)
    } else {
        // developer
        sendErrDev(err,res)
    }
}

exports.unHandleRoutesController = (req,res)=>{
    res.status(400).json({
        status: "fail",
        msg: `Page Not Found? cannot find ${req.originalUrl} on this Server `
    })
}