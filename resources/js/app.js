import axios from 'axios'
import Noty from 'noty'
import { initAdmin } from './admin'
import moment from 'moment'
import { initStripe } from './stripe'
import iziToast from 'izitoast'


let addToCart = document.querySelectorAll('.add-to-cart')
let cartCounter = document.querySelector('.cartCounter')

function updateCart(pizza){
    axios.post('/update-cart',pizza).then(res=>{
        cartCounter.innerText = res.data.totalQty
        iziToast.success({
            message: 'Item added to cart',
            position: 'topRight',
            timeout: 1000,
        })
       
    }).catch(err =>{
        iziToast.error({
            message: 'Something went wrong',
            position: 'topRight',
            timeout: 1000,
        })
    })
}

addToCart.forEach((btn)=>{
    btn.addEventListener('click', (e)=>{
        let pizza = JSON.parse(btn.dataset.pizza)   //put the name of the data attribute
        updateCart(pizza)
    })
})

const alertMsg = document.querySelector('#success-alert')
if(alertMsg){
    setTimeout(()=>{
        alertMsg.remove()
    },2000)
}



//Change order status
let statuses = document.querySelectorAll('.status-line')

let hiddenInput = document.querySelector('#hiddenInput')
let order = hiddenInput ? hiddenInput.value : null
order = JSON.parse(order)
let time = document.createElement('small')

function updateStatus(order){
    statuses.forEach((status)=>{
        status.classList.remove('step-completed')
        status.classList.remove('current')
    })
    let stepCompleted = true;
    statuses.forEach((status)=>{
        let dataProp= status.dataset.status
        if(stepCompleted){
            status.classList.add('step-completed')
        }

        if(dataProp === order.status){
            stepCompleted = false
            time.innerText = moment(order.updatedAt).format('dddd Do hh:mm A')
            status.appendChild(time)
            if(status.nextElementSibling){
                status.nextElementSibling.classList.add('current')
            }
        }
    })

}

updateStatus(order);

initStripe()
//socket
let socket = io()

//join
if(order){
    socket.emit('join', `order_${order._id}`)
}

let adminAreaPath = window.location.pathname;
if(adminAreaPath.includes('admin')){
    initAdmin(socket) 
    socket.emit('join', 'adminRoom')
}



socket.on('orderUpdated',(data)=>{
     const updatedOrder = {...order}
     updatedOrder.updatedAt = moment().format()
     updatedOrder.status = data.status
     updateStatus(updatedOrder)
     iziToast.success({
        message: 'Order updated',
        position: 'topRight',
        timeout: 2000,
    })
})
