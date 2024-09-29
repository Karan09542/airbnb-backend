const {connect, default: mongoose} = require("mongoose")
const app = require("./app")
const port = process.env.PORT|| "8000"

const isProduction = process.env.NODE_ENV === 'production';
const protocol = isProduction ? 'https' : 'http';
const host = isProduction ? 'your-app.vercel.app' : 'localhost';

app.listen(port, ()=> {
    console.log(`server listening on port ${port}: ${protocol}://${host}:${port}`)
})

const DB_URL = process.env.DB_URL.replace("<password>", process.env.DB_PASSWORD)


const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    reconnectTries: 5,
    reconnectInterval: 5000,
  };
let sitaramDB = connect(DB_URL).then(()=> {
    console.log("sitaramDB connection स्वाहा")
},options)

const db = mongoose.connection
db.on('error', (err) => {
    console.error('Connection error:', err);
  });
  
  db.on('disconnected', () => {
    console.log('Mongoose disconnected due to no internet. Retrying...');
  });
  
  db.on('reconnected', () => {
    console.log('Mongoose successfully reconnected!');
  });



