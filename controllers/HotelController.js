const { CatchAsync } = require("../errorHandling/utils");
const HotelModel = require("../Models/hotels_model");
const UserModel = require("../Models/UserModel");
const util = require("util")
const jwt = require("jsonwebtoken");
const appError = require("../errorHandling/appError");
exports.createHotel = CatchAsync(async function(req, res, next){
    const {name,location,address,image_url,rating, price,city, state, country, description,category, roomNumber, amenities, hotelId} = req.body
    if(hotelId){
        const hotel = await HotelModel.findByIdAndUpdate(hotelId,{name,location,address,image_url,rating, price,city, state, country, description,category, roomNumber, amenities, user:req.user._id})

        if(!hotel){
            return next(new appError("Hotel not found", 404))
        }

        res.status(200).json({
        status: "success",
        message: "updated successfully",
        hotel
        })
  } else {
    const hotel = await HotelModel.create({name,location,address,image_url,rating, price,city, state, country, description,category, roomNumber, amenities, user:req?.user?._id})
    res.status(201).json({
      status: "created",
      hotel
    })
  }
})

exports.getHotel = CatchAsync(async function(req,res,next){

    // const getHotel = await HotelModel.find(req.query)
    // below these using chaining for query
    // const getHotel = await HotelModel.find().where("location").equals("Riverside")
    // const getHotel = await HotelModel.find().where("price").lte("5000").gte(3000)
    const query = req.query
    let queryObj = {...req.query} // using this copy req.query
    let queryString = JSON.stringify(queryObj)
    queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match)=> `$${match}`)
    queryObj = JSON.parse(queryString)
    const price = queryObj.price

    const excludeKeys = ["page", "sort", "limit", "fields", "skip", "searchText"]
    excludeKeys.forEach(key => {
        delete queryObj[key]
    })
    

    // const hotelsQuery = HotelModel.find({
    //     price:{
    //         $lt:2000 // also write like "2000"
    //     }
    // })
    
    let hotelsQuery;
    let nDocuments;
    if(query.searchText){
        hotelsQuery = HotelModel.find({
            $and:[
                {...queryObj},
                {$text: {$search: query.searchText ?? ""}}
            ]
        })
        nDocuments = await HotelModel.countDocuments({
            $and:[
                {...queryObj},
                {$text: {$search: query.searchText ?? ""}}
            ]
        })

    }else {
        hotelsQuery = HotelModel.find(queryObj)
    }
    
    let pages = 1
    if(query.skip&&query.limit){
        const skip = Number(query.skip)
        const limit = Number(query.limit)
        // isNaN is true if not a number if number then false 
        if(!isNaN(skip) && !isNaN(limit)){
            hotelsQuery.skip(skip).limit(limit)
            pages = Math.floor(nDocuments/limit) === 0?1:Math.floor(nDocuments/limit)
        }
    }

    // const hotelsQuery = HotelModel.find(queryObj).sort("price -state") // in sorting -price => decending and price mean ascending

    // Sorting
    if(req.query.sort){
        const sortingQuery = req.query.sort.split(",").join(" ")
        console.log("sorting",sortingQuery)
        hotelsQuery = hotelsQuery.sort(sortingQuery)
    }

    // here i will chain logic to this query
    const hotels = await hotelsQuery; // once the query is ready, i will await and get result
    res.status(200).json({
        status: "success",
        hotels,
        pages,
    })
})
exports.getRoomById = CatchAsync(async function(req,res,next){
    let rooms = await HotelModel.find({user:req.user._id})
    res.status(200).json({
        status: "success",
        rooms
    })
})
exports.deleteRoomById = CatchAsync(async function(req, res, next){

    // Assuming req.body.roomId contains the room ID to delete
    const roomId = req.body.roomId;

    if (!roomId) {
        return res.status(400).json({
            status: "fail",
            message: "Room ID is required"
        });
    }

    // Uncomment and modify the model deletion logic as needed
    await HotelModel.findByIdAndDelete(roomId);

    res.status(200).json({
        status: "success",
        message: "Room deleted successfully"
    });
})


exports.getRoomHostedByDetails = CatchAsync(async function(req, res, next){
    const hotelId = req.params.id

    const hotel = await HotelModel.findById(hotelId).populate("user")

    if(!hotel){
        return next(new appError("Hotel not found", 404))
    }
    res.status(200).json({
        status: "success",
        hotel
    })
})

exports.checkRole = (roles) => {
    return CatchAsync(async function (req, res, next){
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

        if(!roles.includes(user.role)){
            return res.status(403).json({ message: "Access Denied" });
        }
        req.user = user
        next()
    })
}

exports.dashboard = CatchAsync(async function(req, res, next){
    res.status(200).json({ message: "Welcome to the dashboard!", user: req.user });
})

exports.getFavorite = CatchAsync(async function(req, res, next){
    console.log(req.user)
    const favoriteHotels = req.user.favorites
    
    const hotel = await HotelModel.find({_id: {$in: favoriteHotels}})
    if(!hotel){
        return next(new appError("Hotel not found", 404))
    }

    res.status(200).json({
        status: "success",
        hotel
    })
    
})

exports.setFavorite = CatchAsync(async function(req, res, next) {
    let favorites = req.user.favorites || [];  // Ensure favorites is always an array
    let setFlag = req.query.setFlag === 'true';  // Convert string to boolean if passed via query string
    let message; 
    console.log(setFlag)
    // Check if the hotel is already in favorites
    const hotelIndex = favorites.indexOf(req.params.hotelId);
    console.log(hotelIndex)
    if (hotelIndex === -1 && setFlag) {
        favorites.push(req.params.hotelId);
        message = "Added to favorites";
    }

    if (!setFlag && hotelIndex !== -1) {
        // Remove from favorites
        favorites.splice(hotelIndex, 1);
        message = "Removed from favorites";
    }

    // Update user's favorites and save
    req.user.favorites = favorites;

    await req.user.save({ validateBeforeSave: false });

    // Respond with success
    res.status(200).json({ status: "success", message });
});

