import axios from 'axios'
import iziToast from 'izitoast'
export function placeOrder(formObject){
    axios.post('/order',formObject).then((res)=>{
        iziToast.success({
            message: res.data.message,
            position: 'topRight',
            timeout: 2000,
        })
        console.log(res.data)
        setTimeout(()=>{
            window.location.href = '/customer/order';
        },1000);
        
    }).catch((err)=>{
        iziToast.error({
            message: err.res.data.message,
            position: 'topRight',
            timeout: 1000,
        })
    })
}