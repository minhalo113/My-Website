import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { add_swiper_item, get_swiper_items, delete_swiper_item, messageClear } from '../../store/Reducers/homeSwiperReducer';
import toast from 'react-hot-toast';

const HomeSwiper = () => {
  const dispatch = useDispatch();
  const { items, loader, successMessage, errorMessage } = useSelector(state => state.homeSwiper);
  const [link, setLink] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const submit = e => {
    e.preventDefault();
    if (!image || !link) return;
    const form = new FormData();
    form.append('link', link);
    form.append('image', image);
    dispatch(add_swiper_item(form));
  };

  const handleDelete = id => {
    if (window.confirm('Delete this item?')) {
      dispatch(delete_swiper_item(id));
    }
  };

  useEffect(() => { dispatch(get_swiper_items()); }, [dispatch]);

  useEffect(() => {
    if (successMessage) { 
        toast.success(successMessage); 
        dispatch(messageClear());
         setLink('');
          setImage(null);
        setPreview(null); }
    if (errorMessage) { toast.error(errorMessage); dispatch(messageClear()); }
  }, [successMessage, errorMessage, dispatch]);

  return (
    <div className='px-2 lg:px-7 pt-5'>
      <div className='bg-[#6a5fdf] p-4 rounded-md'>
        <h1 className='text-[#d0d2d6] text-xl mb-4'>Home Swiper</h1>
        <form onSubmit={submit} className='space-y-3'>
          <input type='text' placeholder='Link' className='px-4 py-2 w-full rounded' value={link} onChange={e => setLink(e.target.value)} />
          <input
            type='file'
            onChange={e => {
              const file = e.target.files[0];
              if (file) {
                setImage(file);
                setPreview(URL.createObjectURL(file));
              }
            }}
          />
          {preview && (
            <img src={preview} alt='preview' className='w-32 h-20 object-cover' />
          )}
          <button disabled={loader} className='bg-emerald-600 text-white px-6 py-2 rounded'>Add</button>
        </form>
      </div>

      <div className='mt-5 bg-[#6a5fdf] p-4 rounded-md'>
        <h2 className='text-[#d0d2d6] text-lg mb-3'>Items</h2>
        <div className='space-y-2'>
          {items.map(item => (
            <div key={item._id} className='flex items-center gap-4'>
              <img src={item.image.url} alt='' className='w-32 h-20 object-cover' />
              <a href={item.link} className='text-blue-300 break-all'>{item.link}</a>
              <button onClick={() => handleDelete(item._id)} className='text-red-500 ml-auto'>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeSwiper;
