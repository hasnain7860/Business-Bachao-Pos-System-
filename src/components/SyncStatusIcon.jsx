// src/components/SyncStatusIcon.jsx

import React, { useState, useEffect } from 'react';
import { getDB } from '../Utils/IndexedDb'; // Path check kar lein
import { FaCheckCircle, FaSyncAlt } from 'react-icons/fa';
import { FiUploadCloud } from 'react-icons/fi';

const SyncStatusIcon = () => {
    const [pendingCount, setPendingCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Yeh function IndexedDB se 'pendingQuery' store ka count check karega
        const checkPendingCount = async () => {
            try {
                const db = await getDB();
                // .count() zyada efficient hai .getAll().length se
                const count = await db.count('pendingQuery');
                setPendingCount(count);
            } catch (error) {
                console.error("Error fetching pending query count:", error);
                setPendingCount(0); // Error aane par 0 maan lein
            } finally {
                setIsLoading(false); // Pehli check ke baad loading band kar dein
            }
        };

        // Component load hote hi check karein
        checkPendingCount();

        // Har 2 second me count ko check karne ke liye interval set karein
        const intervalId = setInterval(checkPendingCount, 2000); // Aap time kam ya zyada kar sakte hain

        // Component unmount hone par interval ko clear karein
        return () => clearInterval(intervalId);
    }, []);

    // ----- UI Logic -----

    // Jab tak pehli baar count load ho raha hai
    if (isLoading) {
        return (
            <div className="relative p-2 bg-gray-700 rounded-full" title="Sync status check ho raha hai...">
                <FaSyncAlt className="animate-spin text-white" />
            </div>
        );
    }

    // Jab data sync hona baaki hai
    if (pendingCount > 0) {
        return (
            <div className="relative p-2 bg-yellow-500 rounded-full" title={`${pendingCount} items sync hone ke liye baaki hain`}>
                <FiUploadCloud className="text-white" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                </span>
            </div>
        );
    }

    // Jab sab kuch synced hai
    return (
        <div className="relative p-2 bg-green-500 rounded-full" title="Data synced hai">
            <FaCheckCircle className="text-white" />
        </div>
    );
};

export default SyncStatusIcon;
