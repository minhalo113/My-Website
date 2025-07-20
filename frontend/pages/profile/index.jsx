import React, {useState, useEffect, useContext} from 'react';
import api from '../../src/api/api.js';
import PageHeader from '../../components/PageHeader';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ProfilePage = () => {
    const {user} = useContext(AuthContext)
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');

    useEffect(() => {
        if(user){
            setName(user.name || '');
            setEmail(user.email || '');
            setPreviewUrl(user?.image?.url || '');
            console.log(user?.image)
        }
    }, [user])

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
    }

    const handleImageUpload = async () => {
        if (!selectedImage) return;

        const formData = new FormData();
        formData.append('avatar', selectedImage);

        try{
            const res = await api.post('/customer/profile-image', formData, {withCredentials: true})
            toast.success(res.data.message)
        }catch(err){
            toast.error(err?.response?.data?.message || "Upload Failed");
            console.log(err)
        }
    }

    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        if(password && password !== confirmPassword){
            toast.error("New password and confirmation do not match!");
            return;
        }
        let data = {
            currentPassword: currentPassword,
            newPassword: password || undefined,
        }

        try{
            const res = await api.post(
                "/customer/update-profile",
                data
                ,
                {
                    withCredentials: true
                }
            )

            toast.success(res.data.message || "Profile updated successfully")
            setCurrentPassword("");
            setPassword("");
            setConfirmPassword("");
        }catch(err){
            toast.error(err?.response?.data?.message || "Update Failed");
        }

    }

    if (!user){
        return (
            <div className="min-h-screen bg-slate-700 text-slate-100">
                <PageHeader title="Your Profile" curPage="Your Profile" />
                <p className="text-slate-400">Please Logiin First To Check Your Profile</p>
            </div>
        )
    }

    return (
        <>
        <PageHeader title="Your Profile" curPage="Your Profile" />
  
        <section className="py-10 bg-white mt-4 mb-2">
        <div className="container mx-auto max-w-2xl px-6 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-4">
            <img
                src={previewUrl || '/images/default-avatar.png'}
                alt="avatar"
                className="w-50 h-50 rounded-full object-cover"
            />
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <button
                onClick={handleImageUpload}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded"
            >
                Upload Image
            </button>
            </div>

            <form
            onSubmit={handleProfileUpdate}
            className="w-full space-y-4 max-w-md text-center"
            >
            <div className="text-left">
                <label className="block font-semibold mb-1">Name</label>
                <input
                type="text"
                value={name}
                readOnly
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded px-4 py-2"
                required
                />
            </div>

            <div className="text-left">
                <label className="block font-semibold mb-1">Email</label>
                <input
                type="email"
                value={email}
                readOnly
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-4 py-2"
                required
                />
            </div>

            <div className="text-left">
                <label className="block font-semibold mb-1">Current Password</label>
                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border rounded px-4 py-2"
                    required
                />
            </div>

            <div className="text-left">
                <label className="block font-semibold mb-1">New Password</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-4 py-2"
                required
                />
            </div>

            <div className="text-left">
                <label className="block font-semibold mb-1">Confirm Password</label>
                <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded px-4 py-2"
                required
                />
            </div>

            <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded mt-2 mb-2"
            >
                Save Changes
            </button>
            </form>
        </div>
        </section>

      </>
      );
}

export default ProfilePage;