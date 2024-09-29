class appError extends Error{
    constructor(msg, statusCode){
        super(msg);
        this.statusCode = statusCode
        this.status = statusCode === 500? "error": "fail"

        Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = appError
