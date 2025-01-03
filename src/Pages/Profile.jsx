import React, { useState } from "react";
import { 
  FaUserEdit, 
  FaSignOutAlt, 
  FaEnvelope, 
  FaPhoneAlt, 
  FaMapMarkerAlt 
} from "react-icons/fa";
import { MdDateRange } from "react-icons/md";

const Profile = () => {
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+123 456 7890",
    location: "New York, USA",
    profilePic: "https://via.placeholder.com/150",
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState(user);

  // Handle form inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Save changes
  const handleSaveChanges = () => {
    setUser(formData);
    setIsEditModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-base-100 shadow-lg rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center space-x-6">
        <div className="relative w-24 h-24 rounded-full overflow-hidden">
          <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <FaEnvelope className="text-primary" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center space-x-3">
            <FaPhoneAlt className="text-primary" />
            <span>{user.phone}</span>
          </div>
          <div className="flex items-center space-x-3">
            <FaMapMarkerAlt className="text-primary" />
            <span>{user.location}</span>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="px-4 py-2 bg-secondary text-secondary-content rounded-md flex items-center space-x-2 hover:bg-secondary-dark"
        >
          <FaUserEdit />
          <span>Edit Profile</span>
        </button>
        <button className="px-4 py-2 bg-danger text-danger-content rounded-md flex items-center space-x-2 hover:bg-danger-dark">
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-primary text-primary-content rounded-md hover:bg-primary-dark"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;