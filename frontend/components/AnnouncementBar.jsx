import React, {useState} from "react";

const AnnouncementBar = () => {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <div className="bg-amber-600 text-white text-center py-1 text-sm flex justify-center items-center">
            <span>
                Use Code <span className="font-bold">SAVE10</span> at check out for 10% off!
            </span>
            <button
                aria-label="Close announcement"
                className="ml-4 text-white hover:text-gray-200 font-bold text-lg w-6 h-6 rounded flex items-center justify-center"
                onClick={() => setVisible(false)}
                >
                &times;
                </button>

        </div>
    )
}

export default AnnouncementBar;