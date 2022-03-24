const Order = require('../../../models/order')
const moment = require('moment')
const stripe = require('stripe')(process.env.SECRET_KEY)

function orderController(){
    return {
        store(req,res) {
            const { address, phone, stripeToken, paymentType } =req.body
            if(!phone || !address){
                return res.status(422).json({ message: 'All fields are require' })
                //req.flash('error','All fields are required')
                //req.flash('phone', phone)
                //req.flash('address', address)
                //return  res.redirect('/cart')
            }
        
            const order = new Order({
                customerId : req.user._id,
                items : req.session.cart.items,
                address,
                phone
            })

           order.save().then(result => {
               Order.populate(result, { path: 'customerId' },(err, orderPlaced)=>{
                //req.flash('success','Order placed successfully')

                
                //Stripe payment

                if(paymentType == 'card'){
                    stripe.charges.create({  
                        amount: req.session.cart.totalPrice *100,
                        source: stripeToken,
                        currency: 'inr',
                        description: `Pizza OrderId: ${orderPlaced._id}`
                    }).then(()=>{
                        
                        orderPlaced.paymentType = paymentType
                        orderPlaced.paymentStatus= true;
                        orderPlaced.save().then((order)=>{
                        console.log(orderPlaced)
                        console.log(order)
                        //emit
                        const eventEmitter = req.app.get('eventEmitter')
                        eventEmitter.emit('orderPlaced', order)
                        delete req.session.cart
                        return res.json({ message : 'Payment done, Order placed successfully'});
                        }).catch(err=>{
                            console.log(err)
                        })
                    }).catch((err)=>{
                        delete req.session.cart
                        return res.json({ message: 'Payment failed but order is placed.' })
                    })
                }
                else{
                    delete req.session.cart
                    return res.json({ message: 'Order is placed successfully' })
                }
               })
                
            }).catch(err=>{
                //req.flash('error','Something went wrong')
                //return res.redirect('/cart')
                return res.status(500).json({ message: 'Something went wrong' })
            })
        },
        async index(req,res){
            const order = await Order.find({ customerId: req.user._id }, 
                null, 
                { sort: { 'createdAt': -1 }}) 
            res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, precheck=0' )
            res.render('customer/order',{ order: order, moment: moment })
            
        },
        async show(req,res){
            const order = await Order.findById(req.params.id)
            console.log(order)
            if(req.user._id.toString() === order.customerId.toString()){
                return res.render('customer/singleOrder', { order: order })
            }
            return res.redirect('/')
        }
    }
}

module.exports =  orderController