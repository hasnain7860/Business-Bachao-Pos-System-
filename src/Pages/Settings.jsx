import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaSignOutAlt, FaTrashAlt, FaUpload } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import languageData from "../assets/languageData.json";

const InputField = ({ label, type, name, value, onChange, disabled, language }) => (
  <div className={`flex items-center ${language === 'ur' ? 'text-right' : 'text-left'}`}>
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
  const { language } = context;
  const { selectedSetting, saveSetting } = context.settingContext;
  const [isEditing, setIsEditing] = useState({ user: false, business: false });

  const [formData, setFormData] = useState({
    user: { name: '', phoneNo: '', email: '', signature: '' },
    business: { businessName: '', phoneNo: '', email: '', address: '', currency: '', role: '', firebaseStorePass: '', logo: '' }
  });

  const [selectedFile, setSelectedFile] = useState(null);

  console.log(formData);

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

  // 🟢 Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 1048576 && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      alert('File must be an image and less than 1MB');
    }
  };

  // 🟢 Handle File Upload
  const handleFileUpload = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setFormData((prevData) => {
          const updatedData = {
            ...prevData,
            business: { ...prevData.business, logo: reader.result }
          };
          saveSetting(updatedData); // Save the updated formData
          return updatedData;
        });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // 🟢 Handle Delete Logo
  const handleDeleteLogo = async () => {
    setFormData((prevData) => {
      const updatedData = {
        ...prevData,
        business: { ...prevData.business, logo: '' }
      };
      saveSetting(updatedData); // Save the updated formData
      return updatedData;
    });
  };

  return (
    <div className={`p-6 ${language === 'ur' ? 'text-right' : 'text-left'}`}>
      <h2 className="text-2xl font-bold mb-4">{languageData[language].user_information}</h2>
      <div className="space-y-4">
        {['name', 'phoneNo', 'email', 'signature'].map((field, k) => (
          <InputField
            key={k}
            label={languageData[language][field]}
            type={field === 'email' ? 'email' : 'text'}
            name={`user.${field}`}
            value={formData.user[field]}
            onChange={handleChange}
            disabled={!isEditing.user}
            language={language}
          />
        ))}
        <button onClick={() => { saveData(); toggleEdit('user'); }} className="btn btn-primary">
          {isEditing.user ? <FaSave /> : <FaEdit />}
        </button>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">{languageData[language].business_information}</h2>
      <div className="space-y-4">
        {['businessName', 'phoneNo', 'email', 'address', 'currency'].map((field, k) => (
          <InputField
            key={k}
            label={languageData[language][field]}
            type={field === 'email' ? 'email' : 'text'}
            name={`business.${field}`}
            value={formData.business[field]}
            onChange={handleChange}
            disabled={!isEditing.business}
            language={language}
          />
        ))}
        <button onClick={() => { saveData(); toggleEdit('business'); }} className="btn btn-primary">
          {isEditing.business ? <FaSave /> : <FaEdit />}
        </button>
      </div>

      {/* Logo Uploading and Deleting Code */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Logo</h2>
        <div className="flex items-center space-x-4">
          <input type="file" onChange={handleFileChange} className="input input-bordered" />
          <button onClick={handleFileUpload} className="btn btn-primary"><FaUpload /> Upload</button>
        </div>
        {formData.business.logo && (
          <div className="mt-4">
            <img src={formData.business.logo} alt="Business Logo" className="w-32 h-32 object-cover" />
            <button onClick={handleDeleteLogo} className="btn btn-danger mt-2"><FaTrashAlt /> Delete</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
