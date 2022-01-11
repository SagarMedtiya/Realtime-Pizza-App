require('dotenv').config()
const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000;
const ejs  = require('ejs')
const path = require('path')
const expressLayout = require('express-ejs-layouts')
const mongoose = require('mongoose')
const session = require('express-session') 
const flash = require('express-flash')
const MongoStore = require('connect-mongo')
const passport = require('passport')
const Emitter = require('events')
const Razorpay = require('razorpay')


//Database connection
 const url = process.env.MONGODB;
 mongoose.connect(url,{ useNewUrlParser: true, useUnifiedTopology: true
    }).then(()=>{
        console.log('Connection Successful');
    }).catch((error)=>{     
        console.log('Something went wrong', error)
    });
//Event Emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)


//session store  
// Session config
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store :  MongoStore.create({
        mongoUrl: url,
        autoRemove: 'native' // Default
      }),
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24} // 24 hours
}))    

// Passport config
const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())


app.use(flash())
//Global middlewares
app.use((req, res, next)=>{
    res.locals.session = req.session
    res.locals.user = req.user
    next()
})
//set template engine

app.use(express.static('public'))
app.use(expressLayout)
app.set('views', path.join(__dirname,'/resources/views'))
app.set('view engine','ejs')
app.use(express.json())
app.use(express.urlencoded({ extended:false }))

require('./routes/web')(app)
app.use((req,res)=>{
    res.status(404).send('<h1>404, page not found</h1>')
})

const server = app.listen(PORT,()=>{
                    console.log(`Listening to port ${PORT}`)
                })
//socket connection
const io = require('socket.io')(server)
io.on('connection',(socket)=>{
    //Join
    
    socket.on('join',(orderId)=>{
        socket.join(orderId)
    })
})
eventEmitter.on('orderUpdated',(data)=>{
    io.to(`order_${data.id}`).emit('orderUpdated',data)
})

eventEmitter.on('orderPlaced',(data)=>{
    io.to('adminRoom').emit('orderPlaced', data)
})

//razorpay implementation
