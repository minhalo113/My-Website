import React, { useEffect, useState } from 'react';
import { LuAArrowDown,  LuSquareArrowDown} from "react-icons/lu";

import { Link } from 'react-router-dom';
import Pagination from '../Pagination';
import { useDispatch, useSelector } from 'react-redux';
import { clearReloadOrders, get_seller_orders, seller_order_accept_reject_status_update, seller_order_delivery_status_update, seller_payment_accept_reject_status_update, delete_order, messageClear } from '../../store/Reducers/OrderReducer';
import Search from '../components/Search';
import toast from 'react-hot-toast';
import { FaTrash } from 'react-icons/fa';

const Orders = () => {

    const dispatch = useDispatch()

    const [currentPage, setCurrentPage] = useState(1)
    const [searchValue, setSearchValue] = useState('')
    const [parPage, setParPage] = useState(5)
    const [show, setShow] =  useState(false)
    const [productShow, setProductShow] = useState(false)

    const {myOrders, totalOrder, successMessage,errorMessage, reloadOrders} = useSelector(state => state.order)

    const showOrderDetailButton = (orderId) => {
        setShow(prev => prev === orderId ? false : orderId)
    }

    const showProductsOfOrder = (orderId) => {
        setProductShow(prev => prev === orderId ? false : orderId)
    }

    const order_status_update = (e, orderId) => {
        dispatch(seller_order_accept_reject_status_update({orderId, info: {order_status: e.target.value}}))
    }

    const delivery_status_update = (e, orderId) => {
        dispatch(seller_order_delivery_status_update({orderId, info: {delivery_status: e.target.value} }))
    }

    const payment_status_update = (e, orderId) => {
        dispatch(seller_payment_accept_reject_status_update({orderId, info: {payment_status: e.target.value}}))
    }

    const handleDelete = (orderId) => {
        if(window.confirm('Are you sure to delete this order?')){
            dispatch(delete_order(orderId))
        }
    }

    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage);
            dispatch(messageClear());
        }
        if (errorMessage) {
            toast.error(errorMessage);
            console.log(errorMessage);
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage]);
    

    useEffect(() => {
        if (reloadOrders || searchValue || currentPage || parPage) {
            const obj = {
                parPage: parseInt(parPage),
                page: parseInt(currentPage),
                searchValue
            };
            dispatch(get_seller_orders(obj));
    
            if (reloadOrders) dispatch(clearReloadOrders()); // reset the trigger
        }
    }, [reloadOrders, searchValue, currentPage, parPage]);

    return (
        <div className='px-2 lg:px-7 pt-5'>
            <div className='w-full p-4 bg-[#6a5fdf] rounded-md'>
                 <Search setParPage={setParPage} setSearchValue={setSearchValue} searchValue={searchValue}  />


        <div className='relative mt-5 overflow-x-auto'>
            <div className='w-full text-sm text-left [#d0d2d6]'>
                <div className='text-sm text-[#d0d2d6] uppercase border-b border-slate-700'>

            <div className=' flex justify-between items-center'>
                <div className='py-3 w-[25%] font-bold'>Order id</div>
                <div className='py-3 w-[13%] font-bold'>Price</div>
                <div className='py-3 w-[18%] font-bold'>Payment Status</div>
                <div className='py-3 w-[18%] font-bold'>Order Status</div>
                <div className='py-3 w-[18%] font-bold'>Delivery Status</div>
                <div className='py-3 w-[18%] font-bold'>Action </div>
                <div className='py-3 w-[8%] font-bold'><LuAArrowDown /></div> 
            </div> 
                </div>

        {
            (myOrders || []).map((o,i) =>  <div className='text-[#d0d2d6] '>
            <div className=' flex justify-between items-start border-b border-slate-700'>
         <div className='py-3 w-[25%] font-medium whitespace-nowrap'>#{o._id}</div>
                <div className='py-3 w-[13%] font-medium'>${o.price}</div>
                <div className='py-3 w-[18%]'>
                    <select onChange={(e) => payment_status_update(e, o._id)} value={o.payment_status} name="" id="" className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#475569] border border-slate-700 rounded-md text-[#d0d2d6]'>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Uncaptured">Uncaptured</option>
                        <option value="Pending">Pending</option>
                    </select> 
                </div>

                <div className='py-3 w-[18%]'>
                    <select onChange={(e) => order_status_update(e, o._id)} value={o.order_status} name="" id="" className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#475569] border border-slate-700 rounded-md text-[#d0d2d6]'>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Pending">Pending</option>
                    </select> 
                </div>

                <div className='py-3 w-[18%]'>
                    <select onChange={(e) => delivery_status_update(e, o._id)} value={o.delivery_status} name="" id="" className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#475569] border border-slate-700 rounded-md text-[#d0d2d6]'>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Warehouse">Warehouse</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out For Delivery">Out For Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Returned">Returned</option>
                        <option value="Cancelled">Cancelled</option>
                    </select> 
                </div>
                <div className='py-3 w-[9%] font-medium'>
                    <Link to={`/admin/dashboard/order/details/${o._id}`} className='underline'>View</Link>
                </div>

                <div className='py-3 w-[9%] flex justify-center'>
                    <button onClick={() => handleDelete(o._id)} className='text-red-500'>
                        <FaTrash />
                    </button>
                </div>

                <div onClick={() => showOrderDetailButton(o._id)} className='py-3 w-[8%] font-medium'><LuAArrowDown /></div> 
            </div> 
            <div className={show === o._id ? 'block border-b border-slate-700 bg-[#8288ed] p-3' : 'hidden'}>

                <div className="text-sm text-white space-y-1">
                    <div><span className="font-bold text-red-700">Customer ID:</span> #{o.customerId}</div>
                    <div><span className="font-bold text-red-700">Customer Email:</span> {o.customerEmail || 'N/A'}</div>
                    <div><span className="font-bold text-red-700">Customer Name:</span> {o.customerName || 'N/A'}</div>
                    <div><span className="font-bold text-red-700">Phone:</span> {o.shippingInfo?.phoneNumber || 'N/A'}</div>
                    <div><span className="font-bold text-red-700">Address:</span> {o.shippingInfo?.address || 'N/A'}</div>
                    <div><span className="font-bold text-red-700">Postal Code:</span> {o.shippingInfo?.postalCode || 'N/A'}</div>
                    <div>
                        <div className='flex items-center justify-between'>
                            <span className='font-bold text-red-700'>Products:</span>
                            {
                                o.products.length !== 0 && (
                                    <div onClick={() => showProductsOfOrder(o._id)}><LuAArrowDown/></div>
                                )
                            }
                        </div>
                    
                        <ul className={productShow === o._id ? 'list-none ml-5 space-y-3 max-h-60 overflow-y-auto pr-2' : 'hidden'}>
                            {o.products.map((p,i) => (
                                <li key = {i} className="border border-slate-400 rounded-md p-3 bg-slate-300 text-slate-900">
                                    <div><span className='font-semibold text-red-900'>Name: </span>{p.name}</div>
                                    <div>
                                        <span className='font-semibold text-red-900'>
                                            Color:
                                        </span>
                                        {p.color || 'N/A'}
                                    </div>
                                    <div>
                                        <span className='font-semibold text-red-900'>
                                            Size:
                                        </span>
                                        {p.size || 'N/A'}
                                    </div>
                                    <div>
                                        <span className='font-semibold text-red-900'>
                                            Type:
                                        </span>
                                        {p.type || 'N/A'}
                                    </div>
                                    <div><span className='font-semibold text-red-900'>Price: </span>{p.price}</div>
                                    <div><span className='font-semibold text-red-900'>Quantity: </span>{p.qty}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div><span className="font-semibold text-red-700">Date:</span> {o.date}</div>
                </div>
                    </div>
                </div> )
        }

 
 
 

            </div> 
        </div>

            {
                totalOrder <= parPage ? "" : <div className='w-full flex justify-end mt-4 bottom-4 right-4'>
                <Pagination 
                    pageNumber = {currentPage}
                    setPageNumber = {setCurrentPage}
                    totalItem = {totalOrder}
                    parPage = {parPage}
                    showItem = {4}
                />
                </div>
            }
                    



            </div> 
        </div>
    );
};

export default Orders;