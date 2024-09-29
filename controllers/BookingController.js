const { CatchAsync } = require("../errorHandling/utils");
const jwt = require("jsonwebtoken")
const util = require("util");
const appError = require("../errorHandling/appError");
const UserModel = require("../Models/UserModel");
const BookingModel = require("../Models/booking_model");
const HotelModel = require("../Models/hotels_model");

exports.authorizeBooking = CatchAsync(async function(req, res, next){
    const token = req.cookies.authToken

    if(!token){
        return next(new appError("NOT_LOGGED_IN, Please log in again", 401))
    }
    const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET)
    if(!decoded){
        return next(new appError("NOT_LOGGED_IN, Please log in again", 401))
    }
    const currentUser = await UserModel.findById(decoded.id)
    if(!currentUser){
        return next(new appError("User does not exist. Please log in again.", 404));
    }
    req.userId = currentUser._id
    next()
})
exports.Booking = CatchAsync(async function(req, res,next){
    const {hotel, checkInDate, checkOutDate, paymentStatus, roomType} = req.body
    
    const existingBooking = await BookingModel.findOne({
        user: req.userId,
        hotel: hotel,
        $or: [
            {
                checkInDate: {$lte: new Date(checkOutDate)},
                checkOutDate: {$gte: new Date(checkInDate)}
            }
        ]
    })
    if(existingBooking){
        res.status(409).json({
            status: 409,
            message:"You already have a booking for this hotel on these dates"
        })
        return; // 409 means resubmit things
    }
    await BookingModel.create({hotel, checkInDate, checkOutDate, paymentStatus, roomType, user:req.userId})
    res.status(200).json({
        status: "success"
    })

})

exports.ReservationDetail = CatchAsync(async function(req, res, next){
    const reservations = await BookingModel.find({user: req.userId, reservationStatus: "accepted"})
    .populate("hotel")
    console.log(reservations)

    if(!reservations){
        return res.status(404).json({
            status: "fail",
            message: "No reservations found for the user."
        });
    }

        res.status(200).json({
            status: "success",
            reservations
        })
    
})
exports.TripsDetail = CatchAsync(async function(req, res, next){
    const trips = await BookingModel.find({user: req.userId})
    .populate("hotel")
    res.status(200).json({
        status: "success",
        trips
    })
})

exports.BookingUserDetail =  CatchAsync(async function(req, res, next){
    const status = req.query.status
    const hotels = await HotelModel.find({user: req.user._id}).select("_id")
    const bookings = await BookingModel.find({hotel: {$in: hotels}, reservationStatus: status??"pending"}).populate("hotel").populate("user")
    // reservationStatus: "accepted"
    res.status(200).json({
        status: "success",
        bookings
    })
})

const checkReservationStatus = (status) => {
    return CatchAsync(async function(req, res, next){

        const {bookingId} = req.body
    
        if(!bookingId){
            return res.status(400).json({
                status: "fail",
                message: "Booking ID is required"
            })
        }

        const booking = await BookingModel.findById(bookingId)

        if(!booking){
            return res.status(404).json({
                status: "fail",
                message: "Booking not found"
            })
        }

        if(!status.includes(booking.reservationStatus)){
            return res.status(400).json({
                status: "fail",
                message: "booking cancellation not allowed"
            })
        } 
        req.booking = booking
    })
}

exports.deleteCancelledBooking = CatchAsync(async function(req, res, next){
    await checkReservationStatus(["cancelled"])(req,res,next)
    console.log("bookingId",req.bookingId)
    await BookingModel.findByIdAndDelete(req.body.bookingId)
    
    return res.status(200).json({
        status: "success",
        message: "Booking removed successfully"
    })
})
    
exports.cancelBooking = CatchAsync(async function(req, res, next){
    await checkReservationStatus(["pending", "cancelled"])(req,res,next);
    const booking = req.booking

    if(booking.reservationStatus === "cancelled"){
        return res.status(400).json({
            status: "fail",
            message: "Booking already cancelled"
        })
    }
    booking.reservationStatus = "cancelled"
    booking.save({validateBeforeSave: false})

    res.status(200).json({
        status: "success",
        message: "Booking cancelled successfully"
    })
})
exports.updateReservationStatus = CatchAsync(async function(req, res, next){
    const {bookingId, reservationStatus} = req.body

    if(!bookingId || !reservationStatus){
        return res.status(400).json({
            status: "fail",
            message: "Booking ID and reservation status are required"
        })
    }

    if(!["accepted", "rejected"].includes(reservationStatus)){
        return res.status(400).json({
            status: "fail",
            message: "Invalid reservation status"
        })
    }
    const booking = await BookingModel.findById(bookingId)

    if(!booking){
        return res.status(404).json({
            status: "fail",
            message: "Booking not found"
        })
    }
    booking.reservationStatus = reservationStatus
    booking.save({validateBeforeSave: false})

    
    res.status(200).json({
        status: "success",
        message: `Booking ${reservationStatus} successfully`
    })
})