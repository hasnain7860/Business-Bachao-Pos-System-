import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaSignOutAlt } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';

const Settings = () => {
  const context = useAppContext();
  const { settings, add, edit, delete: deleteSetting, selectedSetting, select } = context.settingContext;
console.log(settings)
  const [formData, setFormData] = useState({
    id: null,
    user: {
      name: '',
      phoneNo: '',
      email: '',
      signature: '',
    },
    business: {
      businessName: '',
      phoneNo: '',
      email: '',
      currency: '',
    },
  });

  const [isEditing, setIsEditing] = useState({
    user: false,
    business: false,
  });

  useEffect(() => {
    if (selectedSetting) {
      setFormData({
        id: selectedSetting.id,
        user: {
          name: selectedSetting.user.name || '',
          phoneNo: selectedSetting.user.phoneNo || '',
          email: selectedSetting.user.email || '',
          signature: selectedSetting.user.signature || '',
        },
        business: {
          businessName: selectedSetting.business.businessName || '',
          phoneNo: selectedSetting.business.phoneNo || '',
          email: selectedSetting.business.email || '',
          currency: selectedSetting.business.currency || '',
        },
      });
    }
  }, [selectedSetting]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [type, field] = name.split('.');
    
    setFormData((prevData) => ({
      ...prevData,
      [type]: {
        ...prevData[type],
        [field]: value,
      },
    }));
  };

  const toggleEditUser = () => {
    setIsEditing({ ...isEditing, user: !isEditing.user });
  };

  const toggleEditBusiness = () => {
    setIsEditing({ ...isEditing, business: !isEditing.business });
  };

  const handleLogout = () => {
    console.log("User logged out");
  };

  const saveData = async () => {
    if (formData.id) {
      await edit(formData.id, formData); // Update existing setting
    } else {
      await add(formData); // Add new setting
    }
    console.log("Data saved to database:", formData);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Information</h2>
      <div className="space-y-4">
        {['name', 'phoneNo', 'email', 'signature'].map((field) => (
          <div key={field} className="flex items-center">
            <label className="w-1/3 font-semibold">{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
            <input
              type={field === 'email' ? 'email' : 'text'}
              name={`user.${field}`}
              value={formData.user[field]}
              onChange={handleChange}
              disabled={!isEditing.user}
              className={`input input-bordered w-2/3 ${isEditing.user ? 'input-primary' : 'bg-gray-100'}`}
              style={field === 'signature' ? { fontFamily: 'Brush Script MT, cursive', pointerEvents: isEditing.user ? 'auto' : 'none' } : {}}
            />
          </div>
        ))}
        <div className="flex items-center">
          <button
            onClick={() => {
              if (isEditing.user) {
                saveData();
              }
              toggleEditUser();
            }}
            className="btn btn-primary"
          >
            {isEditing.user ? <FaSave /> : <FaEdit />}
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Business Information</h2>
      <div className="space-y-4">
        {['businessName', 'phoneNo', 'email', 'currency'].map((field) => (
          <div key={field} className="flex items-center">
            <label className="w-1/3 font-semibold">{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
            <input
              type={field === 'email' ? 'email' : 'text'}
              name={`business.${field}`}
              value={formData.business[field]}
              onChange={handleChange}
              disabled={!isEditing.business}
              className={`input input-bordered w-2/3 ${isEditing.business ? 'input-primary' : 'bg-gray-100'}`}
            />
          </div>
        ))}
        <div className="flex items-center">
          <button
            onClick={() => {
              if (isEditing.business) {
                saveData();
              }
              toggleEditBusiness();
            }}
            className="btn btn-primary"
          >
            {isEditing.business ? <FaSave /> : <FaEdit />}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="btn btn-danger flex items-center"
        >
          <FaSignOutAlt className="mr-2" /> Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;