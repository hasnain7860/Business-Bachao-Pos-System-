import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaSignOutAlt, FaTrashAlt, FaUpload, FaKey } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import languageData from "../assets/languageData.json"; // Ye file aapke paas honi chahiye
import { useNavigate } from 'react-router-dom';

// --- Naya Component: Change Password Modal ---
const ChangePasswordModal = ({ onClose, language, context }) => {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { authToken } = context; // Context se token lein

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setError(languageData[language]?.fields_required || 'All fields are required.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError(languageData[language]?.passwords_do_not_match || 'New passwords do not match.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setError(languageData[language]?.password_too_short || 'New password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      if (!authToken) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const apiUrl = import.meta.env.PROD
        ? "/api/change-password"
        : `${import.meta.env.VITE_API_BASE_URL}/api/change-password`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // <-- Token yahan bhej rahe hain
        },
        body: JSON.stringify({
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password.');
      }

      setSuccess(data.message || 'Password changed successfully!');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(onClose, 2000); // 2 second baad modal band karein

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className={`bg-white p-6 rounded-lg shadow-xl w-full max-w-md ${language === 'ur' ? 'text-right' : 'text-left'}`}>
        <h3 className="text-2xl font-bold mb-4">{languageData[language]?.change_password || 'Change Password'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            name="oldPassword"
            placeholder={languageData[language]?.old_password || 'Old Password'}
            value={passwords.oldPassword}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
            disabled={isLoading}
          />
          <input
            type="password"
            name="newPassword"
            placeholder={languageData[language]?.new_password || 'New Password'}
            value={passwords.newPassword}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
            disabled={isLoading}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder={languageData[language]?.confirm_new_password || 'Confirm New Password'}
            value={passwords.confirmPassword}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
            disabled={isLoading}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isLoading}>
              {languageData[language]?.cancel || 'Cancel'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? '...' : (languageData[language]?.save_changes || 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// --- End of Change Password Modal ---

// InputField component (Aapke original code se)
const InputField = ({ label, type, name, value, onChange, disabled, language }) => (
  <div className={`flex flex-col sm:flex-row sm:items-center py-2 ${language === 'ur' ? 'text-right' : 'text-left'}`}>
    <label className="w-full sm:w-1/3 font-semibold mb-1 sm:mb-0">{label}:</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`input input-bordered w-full sm:w-2/3 ${disabled ? 'bg-gray-100' : 'input-primary'}`}
    />
  </div>
);

// Settings component (Aapka original code, updated)
const Settings = () => {
  const context = useAppContext();
  const { language, logout, email } = context; // <-- Context se logout aur email lein
  const { selectedSetting, saveSetting } = context.settingContext;
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState({ user: false, business: false });
  const [showPasswordModal, setShowPasswordModal] = useState(false); // <-- Naya state
  
  const [formData, setFormData] = useState({
    user: { name: '', phoneNo: '', email: '', signature: '' },
    business: { businessName: '', phoneNo: '', email: '', address: '', currency: '', role: '', firebaseStorePass: '', logo: '' }
  });

  const [selectedFile, setSelectedFile] = useState(null);

  // Load setting into local state
  useEffect(() => {
    if (selectedSetting) {
      setFormData(selectedSetting);
      // Ensure user email is non-editable and comes from context
      setFormData(prevData => ({
        ...prevData,
        user: { ...prevData.user, email: email || prevData.user.email }
      }));
    }
  }, [selectedSetting, email]);

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    const [type, field] = name.split('.');
    
    // Email ko edit na hone dein
    if (type === 'user' && field === 'email') return;

    setFormData((prevData) => ({
      ...prevData,
      [type]: { ...prevData[type], [field]: value }
    }));
  };

  // Toggle Edit Mode
  const toggleEdit = (type) => {
    setIsEditing((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // Save Data
  const saveData = async (type) => {
    await saveSetting(formData);
    setIsEditing((prev) => ({ ...prev, [type]: false })); // Save ke baad edit mode band karein
  };

  // Handle Logout
  const handleLogout = () => {
    logout(); // Context ka function call karein
    navigate('/login', { replace: true }); // Login page par bhej dein
  };

  // Handle File Selection (Aapka original code)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 1048576 && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      alert('File must be an image and less than 1MB');
    }
  };

  // Handle File Upload (Aapka original code)
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
      setSelectedFile(null); // File clear karein
    }
  };

  // Handle Delete Logo (Aapka original code)
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
    <div className={`p-4 sm:p-6 ${language === 'ur' ? 'text-right' : 'text-left'}`}>
      
      {/* User Information */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">{languageData[language]?.user_information || "User Information"}</h2>
        <div className="space-y-4">
          {['name', 'phoneNo', 'email', 'signature'].map((field, k) => (
            <InputField
              key={k}
              label={languageData[language]?.[field] || field}
              type={field === 'email' ? 'email' : 'text'}
              name={`user.${field}`}
              value={formData.user[field]}
              onChange={handleChange}
              disabled={!isEditing.user || field === 'email'} // Email hamesha disabled
              language={language}
            />
          ))}
          <button onClick={() => isEditing.user ? saveData('user') : toggleEdit('user')} className="btn btn-primary">
            {isEditing.user ? <FaSave /> : <FaEdit />}
            {isEditing.user ? (languageData[language]?.save || 'Save') : (languageData[language]?.edit || 'Edit')}
          </button>
        </div>
      </div>

      {/* Business Information */}
      <div className="bg-white p-4 rounded-lg shadow-md mt-6">
        <h2 className="text-2xl font-bold mt-8 mb-4">{languageData[language]?.business_information || "Business Information"}</h2>
        <div className="space-y-4">
          {['businessName', 'phoneNo', 'email', 'address', 'currency'].map((field, k) => (
            <InputField
              key={k}
              label={languageData[language]?.[field] || field}
              type={field === 'email' ? 'email' : 'text'}
              name={`business.${field}`}
              value={formData.business[field]}
              onChange={handleChange}
              disabled={!isEditing.business}
              language={language}
            />
          ))}
          <button onClick={() => isEditing.business ? saveData('business') : toggleEdit('business')} className="btn btn-primary">
            {isEditing.business ? <FaSave /> : <FaEdit />}
            {isEditing.business ? (languageData[language]?.save || 'Save') : (languageData[language]?.edit || 'Edit')}
          </button>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="bg-white p-4 rounded-lg shadow-md mt-6">
        <h2 className="text-2xl font-bold mb-4">{languageData[language]?.logo || "Logo"}</h2>
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <input type="file" onChange={handleFileChange} className="input input-bordered w-full max-w-xs" />
          <button onClick={handleFileUpload} className="btn btn-primary w-full sm:w-auto" disabled={!selectedFile}>
            <FaUpload /> {languageData[language]?.upload || "Upload"}
          </button>
        </div>
        {formData.business.logo && (
          <div className="mt-4">
            <img src={formData.business.logo} alt="Business Logo" className="w-32 h-32 object-cover rounded-md border" />
            <button onClick={handleDeleteLogo} className="btn btn-error mt-2">
              <FaTrashAlt /> {languageData[language]?.delete || "Delete"}
            </button>
          </div>
        )}
      </div>

      {/* --- NAYA SECTION: Security & Logout --- */}
      <div className="bg-white p-4 rounded-lg shadow-md mt-6">
        <h2 className="text-2xl font-bold mb-4">{languageData[language]?.security || 'Security'}</h2>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button onClick={() => setShowPasswordModal(true)} className="btn btn-outline btn-warning w-full sm:w-auto">
            <FaKey className="mr-2" />
            {languageData[language]?.change_password || 'Change Password'}
          </button>
          <button onClick={handleLogout} className="btn btn-outline btn-error w-full sm:w-auto">
            <FaSignOutAlt className="mr-2" />
            {languageData[language]?.logout || 'Logout'}
          </button>
        </div>
      </div>

      {/* Modal ko render karein agar showPasswordModal true hai */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          language={language}
          context={context} // Modal ko poora context pass karein taake wo token nikaal sake
        />
      )}
    </div>
  );
};

export default Settings;


