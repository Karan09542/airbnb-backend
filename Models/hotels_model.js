const mongoose = require("mongoose")

const hotelSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User_Authenticate",
        required: [true,"hostId must be required"]
    },
    name: {
        type: String,
        required: [true, "Please provide hotel name!"],
    },
    location: {
        type: String,
        required: [true, "Please provide hotel Location i.e. Downtown or Uptown or left or right or Where the banyan tree श्रीमननारायण!"],
    },
    address: {
        type: String,
        required: [true, "Please provide Address Of HOTEL"]
        // street: {
        //     type: String,
        //     required: [true, "Please provide Street!"]
        // },
        // postal_code: { // mean_Postal_index_number_mean_PIN_number_of_six_digit
        //     type: String,
        //     required: [true, "Please provide PIN Number!"]
        // },
    },
     city: {
            type: String,
            required: [true, "Please provide City!"]
    },
    state: {
            type: String,
            required: [true, "Please provide State!"]
    },
    country: {
            type: String,
            required: [true, "Please provide Country Name!"]
    },
    description: {
            type: String,
            required: [true, "Please provide description!"]
    },
    category: {
            type: String,
            required: [true, "Please provide category!"]
    },
    image_url: {
        type: [String],
        required: [true, "Please provide Images"]
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default:3
    },
    
    price: {
        type: Number,
        required: [true, "Please provide hotel price!"]
    },
    roomNumber: {
        type: Number,
        required: [true, "Please provide hotel room number!"]
    },
    hostedAt: {
        type: Date,
        default: Date.now
    },
    amenities: {
        description: {
            type: String,
            required: [true, "Please provide hotel amenities description"]
        },
        services: {
            type: [String],
            required: [true, "Please provide hotel amenities services list"]
        }
    }
})
hotelSchema.index({"$**": "text"})

const HotelModel = mongoose.model("hotel", hotelSchema)
module.exports = HotelModel