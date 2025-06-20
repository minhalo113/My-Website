import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { add_coupon, get_coupons, messageClear, delete_coupon } from '../../store/Reducers/couponReducer';
import toast from 'react-hot-toast';

const Coupon = () => {
    const dispatch = useDispatch();
    const {coupons, loader, successMessage, errorMessage} = useSelector(state => state.coupon);

    const [state, setState] = useState({code:'', discount:'', maxUses:''});

    const handleDelete = (id) => {
        if(window.confirm('Are you sure to delete this coupon?')){
            dispatch(delete_coupon(id));
        }
    }

    const addCoupon = e => {
        e.preventDefault();
        dispatch(add_coupon({code: state.code, discount: state.discount, maxUses: state.maxUses}));
    };

    useEffect(() => {
        dispatch(get_coupons());
    }, [dispatch]);

    useEffect(() => {
        if(successMessage){
            toast.success(successMessage);
            dispatch(messageClear());
            setState({code:'', discount:'', maxUses:''});
        }
        if(errorMessage){
            toast.error(errorMessage);
            dispatch(messageClear());
        }
    }, [successMessage, errorMessage, dispatch]);

    return (
        <div className='px-2 lg:px-7 pt-5'>
            <div className='w-full p-4 bg-[#6a5fdf] rounded-md'>
                <h1 className='text-[#d0d2d6] text-xl font-semibold mb-4'>Add Coupon</h1>
                <form onSubmit={addCoupon} className='space-y-3'>
                    <input className='px-4 py-2 w-full rounded' type='text' placeholder='Code' value={state.code} onChange={e=>setState({...state, code:e.target.value})} />
                    <input className='px-4 py-2 w-full rounded' type='number' placeholder='Discount %' value={state.discount} onChange={e=>setState({...state, discount:e.target.value})} />
                    <input className='px-4 py-2 w-full rounded' type='number' placeholder='Max Uses' value={state.maxUses} onChange={e=>setState({...state, maxUses:e.target.value})} />
                    <button disabled={loader} className='bg-emerald-600 text-white px-6 py-2 rounded'>Add</button>
                </form>
            </div>

            <div className='mt-5 p-4 bg-[#6a5fdf] rounded-md'>
                <h2 className='text-[#d0d2d6] text-xl mb-3'>Coupons</h2>
                <table className='w-full text-left text-[#d0d2d6]'>
                    <thead>
                        <tr>
                            <th className='py-2 px-4'>Code</th>
                            <th className='py-2 px-4'>Discount</th>
                            <th className='py-2 px-4'>Used / Max</th>
                            <th className='py-2 px-4'>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map(c => (
                            <tr key={c._id}>
                                <td className='py-1 px-4'>{c.code}</td>
                                <td className='py-1 px-4'>{c.discount}%</td>
                                <td className='py-1 px-4'>{c.used} / {c.maxUses}</td>
                                <td className='py-1 px-4'>
                                    <button onClick={() => handleDelete(c._id)} className='text-red-500'>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Coupon;