import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaSignOutAlt } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import { v4 as uuidv4 } from 'uuid';

const InputField = ({ label, type, name, value, onChange, disabled }) => (
  <div className="flex items-center">
    <label className="w-1/3 font-semibold">{label}:</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`input input-bordered w-2/3 ${disabled ? 'bg-gray-100' : 'input-primary'}`}
    />
  </div>
);

const Settings = () => {
  const context = useAppContext();
  const { settings, add, edit, delete: deleteSetting, selectedSetting, select } = context.settingContext;

  const [formData, setFormData] = useState({
    id: uuidv4(),
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
      role: '',
      firebaseStorePass: ''
    },
  });

  const [isEditing, setIsEditing] = useState({ user: false, business: false });

useEffect(() => {
  const initializeFormData = async () => {
    if (selectedSetting) {
      setFormData({ ...selectedSetting });
    } else {
      console.log("Adding new setting for the first time");
      const newFormData = {
        id: uuidv4(), // Generate a new ID
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
          role: '',
          firebaseStorePass: ''
        },
      };
      setFormData(newFormData);
      await add(newFormData); // Add the new setting
    }
  };

  initializeFormData();
}, [selectedSetting, add]); // Ensure 'add' is included in the dependencies

  

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

  const toggleEdit = (type) => {
    setIsEditing((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleLogout = () => {
    console.log("User logged out");
  };
const saveData = async () => {
  if (!formData.id) {
    // Assign a new ID if adding a new setting
    formData.id = uuidv4();
    await add(formData);
    console.log("Added new setting");
  } else {
    console.log(selectedSetting)
    await edit(formData.id, formData);
    console.log("Edited existing setting");
  }
};
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Information</h2>
      <div className="space-y-4">
        {['name', 'phoneNo', 'email', 'signature'].map((field , k) => (
          <InputField
            key={k}
            label={field.charAt(0).toUpperCase() + field.slice(1)}
            type={field === 'email' ? 'email' : 'text'}
            name={`user.${field}`}
            value={formData.user[field]}
            onChange={handleChange}
            disabled={!isEditing.user}
          />
        ))}
        <div className="flex items-center">
          <button onClick={() => { saveData(); toggleEdit('user'); }} className="btn btn-primary">
            {isEditing.user ? <FaSave /> : <FaEdit />}
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Business Information</h2>
      <div className="space-y-4">
        {['businessName', 'phoneNo', 'email', 'currency'].map((field,k) => (
          <InputField
            key={k}
            label={field.charAt(0).toUpperCase() + field.slice(1)}
            type={field === 'email' ? 'email' : 'text'}
            name={`business.${field}`}
            value={formData.business[field]}
            onChange={handleChange}
            disabled={!isEditing.business}
          />
        ))}
        <div className="flex items-center">
          <button onClick={() => { saveData(); toggleEdit('business'); }} className="btn btn-primary">
            {isEditing.business ? <FaSave /> : <FaEdit />}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <button onClick={handleLogout} className="btn btn-danger flex items-center">
          <FaSignOutAlt className="mr-2" /> Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;