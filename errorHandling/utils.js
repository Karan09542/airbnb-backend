const appError = require("./appError");

exports.CatchAsync = (fn) => {
    return async (req, res, next) => {
        // try{
        // await fn(req, res, next)
        // } catch(err){
        //     next(err)
        // }

        // OR
        await fn(req, res, next).catch(err => {
            next(err); // this will always handle programetic errors/ Internal server error
            return;
        })
    }
}

exports.sendErrDev = (err, res)=> {

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack, // developer have to know that in which line err came, so stack give line number of error
    })
}

exports.sendErrProd = (err, res) => {
    if(err.statusCode == 500){ // Programatic error = we want to hide information
        res.status(500).json({
            status: err.status,
            message: "Oh something bad happend!",
        });
        return;
    } else {    // Operation Error => we want to show the user what bad happened
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    }
}

// prod -> operation, programming
// Dev -> operation, prograamming

exports.handleJWTError = () =>
    new appError(`Invalid Token, Please log in again`, 401);
exports.handleJWTExpiredError = () =>
    new appError("Your token has been expired Please log in again", 401)

exports.handleMongoServerError = () =>
    new appError("Please provide valid Email Id", 401)

exports.handleMongoValidationError = ()=>
    new appError("Please provide required fields", 403 )