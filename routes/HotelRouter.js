const express = require("express")
const { createHotel, getHotel, getRoomHostedByDetails, checkRole, dashboard, getRoomById, deleteRoomById, getFavorite, setFavorite } = require("../controllers/HotelController")

const HotelRouter = express.Router()

HotelRouter.get("/", getHotel)
HotelRouter.post("/host/rooms",checkRole(["host"]), getRoomById) 
HotelRouter.post("/host/room/delete", checkRole(["host"]), deleteRoomById)
HotelRouter.post("/host",checkRole(["host"]), createHotel)
HotelRouter.get("/rooms/:id", getRoomHostedByDetails), 
HotelRouter.post("/dashboard", checkRole(["host"]), dashboard)
HotelRouter.post("/getFavorite", checkRole(["host","user"]), getFavorite)
HotelRouter.post("/setFavorite/:hotelId", checkRole(["host","user"]), setFavorite)

module.exports = HotelRouter