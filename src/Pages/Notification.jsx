import React from "react";
import { useAppContext } from "../Appfullcontext";

const Notifications = () => {
  const context = useAppContext();
  const { notifications, markAsRead, delete: deleteNotification } = context.notificationContext;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications available</p>
      ) : (
        <div className="w-full max-w-5xl space-y-4"> {/* Max width increased */}
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg shadow-md transition-all flex justify-between items-center w-full ${
                notif.type === "success"
                  ? "bg-green-100 border-l-4 border-green-500"
                  : notif.type === "error"
                  ? "bg-red-100 border-l-4 border-red-500"
                  : notif.type === "warning"
                  ? "bg-yellow-100 border-l-4 border-yellow-500"
                  : "bg-blue-100 border-l-4 border-blue-500"
              }`}
            >
              {/* Left Side: Notification Content */}
              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-700">{notif.title || "Notification"}</p>
                <p className={`text-gray-600 ${notif.isRead ? "opacity-50 line-through" : ""}`}>
                  {notif.message}
                </p>
                <p className="text-sm text-gray-500 mt-1">{notif.date || "Just now"}</p>
              </div>

              {/* Right Side: Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
                >
                  Read
                </button>
                <button
                  onClick={() => deleteNotification(notif.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
