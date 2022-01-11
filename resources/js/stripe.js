import { placeOrder } from './apiService'
import { loadStripe } from '@stripe/stripe-js'


export async function initStripe(){
    const stripe= await loadStripe('pk_test_51JxBzOSChEcWkHb1okLjsFFVsJ5uF4Lfx1nnqGewKKgpVIWtECUSSGWkWLJ6EzsPfpNgWp1ZEYbJUcxmKaODeeD200rd6fW1Sr')
    let card = null;
    function mountWidget(){
        const element =stripe.elements()
        let style ={
            base:{
                color: "#32325d",
                fontFamily: '"Helvetica Neue",  Helvetica, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder':{
                    color:'#aab7c4'
                }
            },
            invalid:{
                color:'#fa755a',
                iconColor:'#fa755a'            
            }
            }
        
        card= element.create('card', { style:style, hidePostalCode: true })
        card.mount('#card-element')
    }

    const paymentType = document.querySelector('#paymentType')
    if(!paymentType){
        return;
    }
    paymentType.addEventListener('change',(e)=>{
         if(e.target.value === 'card'){
            //display widget
            mountWidget();
         }
         else{
            card.destroy()
         }
    })

    //Ajax call
    const paymentForm =document.querySelector('#payment-form')
    if(paymentForm){
        paymentForm.addEventListener('submit', (e)=>{
            e.preventDefault();
            let formData = new FormData(paymentForm);
            let formObject = {}
            for(let [key, value] of formData.entries()){
                formObject[key] = value
            } 

            if(!card){
                //Ajax
                placeOrder(formObject);
                return;
            }
            //verify card
            stripe.createToken(card).then(result=>{
                formObject.stripeToken = result.token.id
                placeOrder(formObject)
            }).catch(err=>{
                console.log(err)
            })

        })
    }
}