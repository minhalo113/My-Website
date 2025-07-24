import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { get_seller_order,messageClear, seller_order_delivery_status_update } from '../../store/Reducers/OrderReducer';
import toast from 'react-hot-toast';

const OrderDetails = () => {

    const { orderId } = useParams() 
    const dispatch = useDispatch() 
    const [status, setStatus] = useState('')

    const { order,errorMessage,successMessage } = useSelector(state => state.order)

    useEffect(() => {
        setStatus(order?.delivery_status)
    },[order])


    useEffect(() => {
        dispatch(get_seller_order(orderId))
    },[orderId])

    const status_update = (e, orderId) => {
        dispatch(seller_order_delivery_status_update({orderId, delivery_status: {status: e.target.value} }))
        setStatus(e.target.value)
    }

    useEffect(() => { 
        if (successMessage) {
            toast.success(successMessage)
            dispatch(messageClear())  
        } 
        if (errorMessage) {
            toast.error(errorMessage)
            dispatch(messageClear())  
        } 
    },[successMessage,errorMessage])

    return (
        <div className='px-2 lg:px-7 pt-5'>
        <div className='w-full p-4 bg-[#6a5fdf] rounded-md'>

        <div className='p-4'>
            <div className='flex flex-col gap-2 text-lg text-[#d0d2d6]'>
                <h2>#{order._id}</h2>
                <span>{order.date}</span> 
            </div>
             
            <div className='flex flex-wrap'>
                    <div className='pr-3 text-[#d0d2d6] text-lg'>
                    <div className='flex gap-2 items-start'>
                    <h2 className='font-semibold whitespace-nowrap'>Deliver To:</h2>
                    <div className='flex flex-col text-[#d0d2d6]'>
                        <span>Adress: {order?.shippingInfo?.address}</span>
                        <span>Phone Number: {order?.shippingInfo?.phoneNumber}</span>
                        <span>Postal Code: {order?.shippingInfo?.postalCode}</span>
                    </div>
                    </div>
            <div className='flex justify-start items-center gap-3'>
                <h2>Payment Status: </h2>
                <span className='text-base'>{order.payment_status}</span>
             </div>  
             <div>
                <span>Price : ${order.price}</span> 
             </div>
             <div>
                <span>Customer Id : {order.customerId}</span> 
             </div>
             <div>
                <span>Customer Email : {order.customerEmail}</span> 
             </div>
             <div>
                <span>Customer Name : {order.customerName}</span> 
             </div>
             <div>
                <span>Customer Delivery Status : {order.delivery_status}</span> 
             </div>

             {order?.products?.map((p, i) => (
                <div
                    key={i}
                    className='mt-4 w-full p-4 flex flex-col gap-4 bg-[#8288ed] rounded-md'
                >
                    <div className='text-[#d0d2d6]'>
                    <div className='flex gap-3 text-md'>
                        <img className='w-[100px] h-[150px] object-cover' src={p.img[0]} alt="" />

                        <div className='flex flex-col'>
                        <h2 className='font-semibold'>{p.name}</h2>
                        <p>
                            <span>Brand: {p.brand ? p.brand : "N/A"}</span><br />
                            <span>Color: {p.color || 'N/A'}</span><br />
                            <span>Size: {p.size || 'N/A'}</span><br />
                            <span>Type: {p.type || 'N/A'}</span><br />
                            <span className='text-lg'>Quantity: {p.qty}</span><br/>
                            <span className='text-lg'>Price: {p.price}</span><br/>
                            <span className='text-lg'>Product ID: {p.id}</span><br/>
                        </p>

                        </div>
                    </div>
                    </div>
                </div>
                ))}

 


                    </div>
 
 


            </div>


        </div>   
        </div> 
        </div>
    );
};

export default OrderDetails;