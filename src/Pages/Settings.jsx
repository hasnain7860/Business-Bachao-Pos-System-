import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaSignOutAlt } from 'react-icons/fa';

import { useAppContext } from '../Appfullcontext';

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
  const { selectedSetting, saveSetting } =  context.settingContext;
  const [isEditing, setIsEditing] = useState({ user: false, business: false });

  const [formData, setFormData] = useState({
    user: { name: '', phoneNo: '', email: '', signature: '' },
    business: { businessName: '', phoneNo: '', email: '', currency: '', role: '', firebaseStorePass: '' }
  });

  // 🟢 Load setting into local state
  useEffect(() => {
    if (selectedSetting) {
      setFormData(selectedSetting);
    }
  }, [selectedSetting]);

  // 🟢 Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    const [type, field] = name.split('.');
    setFormData((prevData) => ({
      ...prevData,
      [type]: { ...prevData[type], [field]: value }
    }));
  };

  // 🟢 Toggle Edit Mode
  const toggleEdit = (type) => {
    setIsEditing((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // 🟢 Save Data
  const saveData = async () => {
    await saveSetting(formData);
    // Disable edit mode after save
  };

  // 🟢 Handle Logout
  const handleLogout = () => {
    console.log("User logged out");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Information</h2>
      <div className="space-y-4">
        {['name', 'phoneNo', 'email', 'signature'].map((field, k) => (
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
        <button onClick={() => { saveData(); toggleEdit('user'); }} className="btn btn-primary">
          {isEditing.user ? <FaSave /> : <FaEdit />}
        </button>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Business Information</h2>
      <div className="space-y-4">
        {['businessName', 'phoneNo', 'email', 'currency'].map((field, k) => (
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
        <button onClick={() => { saveData(); toggleEdit('business'); }} className="btn btn-primary">
          {isEditing.business ? <FaSave /> : <FaEdit />}
        </button>
      </div>

      <button onClick={handleLogout} className="btn btn-danger flex items-center mt-8">
        <FaSignOutAlt className="mr-2" /> Logout
      </button>
    </div>
  );
};

export default Settings;
