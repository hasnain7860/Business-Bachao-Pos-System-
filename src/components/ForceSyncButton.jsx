// src/components/ForceSyncButton.jsx

import React, { useState, useEffect } from 'react';
import { getDB, processPendingQueries } from '../Utils/IndexedDb'; // processPendingQueries ko import karein
import { FaSyncAlt, FaCheckCircle } from 'react-icons/fa';

const ForceSyncButton = () => {
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'success', 'error'

    // Pending count ko check karne ka logic
    useEffect(() => {
        const checkCount = async () => {
            try {
                const db = await getDB();
                const count = await db.count('pendingQuery');
                setPendingCount(count);
            } catch (e) {
                console.error("Could not check pending count", e);
            }
        };

        // Yeh interval pending count ko UI par update rakhega
        const intervalId = setInterval(checkCount, 2500);
        checkCount(); // Initial check

        return () => clearInterval(intervalId);
    }, [isSyncing]); // Jab sync ho, to count ko re-check karein

    const handleSync = async () => {
        if (!navigator.onLine) {
            alert("Internet connection nahi hai. Please connect karke dobara try karein.");
            return;
        }

        setIsSyncing(true);
        setSyncStatus('idle');

        try {
            await processPendingQueries();
            setSyncStatus('success');
        } catch (error) {
            console.error("Manual sync failed:", error);
            setSyncStatus('error');
            alert("Sync fail ho gaya. Details ke liye console check karein.");
        } finally {
            setIsSyncing(false);
            // 3 second ke baad status message hata dein
            setTimeout(() => setSyncStatus('idle'), 3000);
        }
    };

    // Button ka text aur icon state ke hisab se change hoga
    const getButtonContent = () => {
        if (isSyncing) {
            return <><FaSyncAlt className="animate-spin mr-2" /> Syncing...</>;
        }
        if (syncStatus === 'success') {
            return <><FaCheckCircle className="mr-2 text-green-400" /> Synced!</>;
        }
        if (pendingCount > 0) {
            return `Sync (${pendingCount}) Items`;
        }
        return "All Synced";
    };

    return (
        <button
            onClick={handleSync}
            disabled={isSyncing || pendingCount === 0}
            className={`px-3 py-2 text-sm font-medium text-white rounded-md flex items-center transition-all duration-300 ${
                isSyncing
                    ? 'bg-yellow-600 cursor-not-allowed'
                    : pendingCount > 0
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 cursor-not-allowed'
            }`}
        >
            {getButtonContent()}
        </button>
    );
};

export default ForceSyncButton;

