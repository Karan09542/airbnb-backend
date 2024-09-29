const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User_Authenticate",
        required: true,
    },
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "hotel",
        required: true
    },
    checkInDate: {
        type: Date,
        required: [true, "Please provide scheduled date to arrive and start their stay"]
    },
    checkOutDate: {
        type: Date,
        required: [true, "Please provide date of ending of reservation period"]
        
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    paymentStatus: {
        type: String,
        enum: ["paid", "pending", "failed"],
        default: "pending",
    },
    reservationStatus: {
        type: String,
        enum: ["accepted", "rejected","pending","cancelled"],
        default: "pending",
    },
    roomType: {
        type: String,
        enum: ["single", "deluxe"],
        required: [true, "Please provide type of room i.e. Single/Deluxe Room"]
    },
    discount: {
        type: Number,
        default: 0,
    }
});

const BookingModel = mongoose.model("Booking", bookingSchema);
module.exports = BookingModel;
