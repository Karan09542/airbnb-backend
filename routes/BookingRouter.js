const express = require("express")
const { Booking, authorizeBooking, ReservationDetail, TripsDetail, BookingUserDetail, updateReservationStatus, cancelBooking, deleteCancelledBooking } = require("../controllers/BookingController")
const { checkRole } = require("../controllers/HotelController")

const BookingRouter = express.Router()

BookingRouter.post("/",authorizeBooking, Booking)
BookingRouter.post("/trips", authorizeBooking, TripsDetail)
BookingRouter.post("/reservation", authorizeBooking, ReservationDetail)
BookingRouter.post("/BookingUserDetails", checkRole(["host"]), BookingUserDetail)
BookingRouter.post("/updateReservationStatus", checkRole(["host"]), updateReservationStatus)
BookingRouter.post("/cancelBooking", authorizeBooking, cancelBooking)
BookingRouter.post("/deleteCancledBooking", authorizeBooking, deleteCancelledBooking)

module.exports = BookingRouter;