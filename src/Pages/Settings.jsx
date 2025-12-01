import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaSignOutAlt, FaTrashAlt, FaUpload, FaKey } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import languageData from "../assets/languageData.json";
import { useNavigate } from 'react-router-dom';

// --- Change Password Modal (Unchanged) ---
const ChangePasswordModal = ({ onClose, language, context }) => {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { authToken } = context; 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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

      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const apiUrl = `${baseUrl}/api/change-password`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
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
      setTimeout(onClose, 2000);

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

const InputField = ({ label, type, name, value, onChange, disabled, language, isTextArea = false }) => (
  <div className={`flex flex-col sm:flex-row sm:items-start py-2 ${language === 'ur' ? 'text-right' : 'text-left'}`}>
    <label className="w-full sm:w-1/3 font-semibold mb-1 sm:mb-0 pt-2">{label}:</label>
    {isTextArea ? (
         <textarea
         name={name}
         value={value || ''}
         onChange={onChange}
         disabled={disabled}
         rows="3"
         className={`textarea textarea-bordered w-full sm:w-2/3 ${disabled ? 'bg-gray-100' : 'textarea-primary'}`}
       />
    ) : (
        <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        className={`input input-bordered w-full sm:w-2/3 ${disabled ? 'bg-gray-100' : 'input-primary'}`}
        />
    )}
  </div>
);

const Settings = () => {
  const context = useAppContext();
  const { language, logout, email } = context;
  const navigate = useNavigate();

  // --- CRITICAL FIX: Universal Store Mapping ---
  const { data: settingsData, add: addSetting, edit: editSetting } = context.settingContext;
  
  // Default Structure including new Urdu Name and Notes
  const defaultSetting = {
    user: { name: '', phoneNo: '', email: '', signature: '' },
    business: { 
        businessName: '', 
        businessNameUrdu: '', // NEW
        phoneNo: '', 
        email: '', 
        address: '', 
        currency: '', 
        role: '', 
        firebaseStorePass: '', 
        logo: '',
        notes: '' // NEW (For Footer/Terms)
    }
  };

  const selectedSetting = (settingsData && settingsData.length > 0) ? settingsData[0] : defaultSetting;

  const saveSetting = async (updatedData) => {
    if (selectedSetting.id) {
      await editSetting(selectedSetting.id, updatedData);
    } else {
      await addSetting(updatedData);
    }
  };

  const [isEditing, setIsEditing] = useState({ user: false, business: false });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [formData, setFormData] = useState(defaultSetting);

  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (settingsData && settingsData.length > 0) {
      const currentData = settingsData[0];
      setFormData(prev => ({
        ...prev,
        ...currentData,
        user: { ...prev.user, ...(currentData.user || {}), email: email || currentData.user?.email || '' },
        business: { ...prev.business, ...(currentData.business || {}) }
      }));
    } else if (email) {
       setFormData(prev => ({ ...prev, user: { ...prev.user, email: email }}));
    }
  }, [settingsData, email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [type, field] = name.split('.');
    
    if (type === 'user' && field === 'email') return;

    setFormData((prevData) => ({
      ...prevData,
      [type]: { ...prevData[type], [field]: value }
    }));
  };

  const toggleEdit = (type) => {
    setIsEditing((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const saveData = async (type) => {
    await saveSetting(formData);
    setIsEditing((prev) => ({ ...prev, [type]: false }));
  };

  const handleLogout = () => {
    if (logout) {
        logout();
        navigate('/login', { replace: true });
    } else {
        localStorage.removeItem('userSession');
        window.location.href = '/login';
    }
  };

  // --- LOGO LOGIC (Strict for Thermal Printers) ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Strict Size Limit: 100KB (102400 bytes)
    // Firestore documents are max 1MB. A 1MB logo will crash the settings fetch.
    if (file.size > 102400) {
      alert('File too big! For thermal printers, use a small logo (Max 100KB).');
      return;
    }

    // 2. Type Check
    if (!file.type.startsWith('image/')) {
        alert('File must be an image (PNG or JPG).');
        return;
    }

    setSelectedFile(file);
  };

  const handleFileUpload = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const updatedData = {
          ...formData,
          business: { ...formData.business, logo: reader.result }
        };
        setFormData(updatedData);
        await saveSetting(updatedData);
        setSelectedFile(null);
        alert("Logo uploaded successfully.");
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDeleteLogo = async () => {
    const updatedData = {
      ...formData,
      business: { ...formData.business, logo: '' }
    };
    setFormData(updatedData);
    await saveSetting(updatedData);
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
              value={formData.user?.[field]}
              onChange={handleChange}
              disabled={!isEditing.user || field === 'email'}
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
          <InputField
              label={languageData[language]?.businessName || "Business Name (Eng)"}
              type="text"
              name="business.businessName"
              value={formData.business?.businessName}
              onChange={handleChange}
              disabled={!isEditing.business}
              language={language}
          />
          {/* URDU NAME */}
          <InputField
              label="Business Name (Urdu)"
              type="text"
              name="business.businessNameUrdu"
              value={formData.business?.businessNameUrdu}
              onChange={handleChange}
              disabled={!isEditing.business}
              language={language}
          />

          {['phoneNo', 'email', 'address', 'currency'].map((field, k) => (
            <InputField
              key={k}
              label={languageData[language]?.[field] || field}
              type={field === 'email' ? 'email' : 'text'}
              name={`business.${field}`}
              value={formData.business?.[field]}
              onChange={handleChange}
              disabled={!isEditing.business}
              language={language}
            />
          ))}

          {/* NOTES FIELD */}
          <InputField
              label="Footer Notes / Terms"
              type="text"
              isTextArea={true}
              name="business.notes"
              value={formData.business?.notes}
              onChange={handleChange}
              disabled={!isEditing.business}
              language={language}
          />

          <button onClick={() => isEditing.business ? saveData('business') : toggleEdit('business')} className="btn btn-primary">
            {isEditing.business ? <FaSave /> : <FaEdit />}
            {isEditing.business ? (languageData[language]?.save || 'Save') : (languageData[language]?.edit || 'Edit')}
          </button>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="bg-white p-4 rounded-lg shadow-md mt-6">
        <h2 className="text-2xl font-bold mb-4">{languageData[language]?.logo || "Logo"}</h2>
        
        {/* LOGO INSTRUCTIONS */}
        <div className="alert alert-info shadow-sm mb-4">
            <div>
                <span className="text-xs sm:text-sm">
                    <strong>For 80mm Thermal Printer:</strong><br/>
                    1. Use Black & White image only.<br/>
                    2. Max width: 400px (Keep it small).<br/>
                    3. Max file size: 100KB.<br/>
                    <em className="text-xs">Large colored images will print poorly and slow down the app.</em>
                </span>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <input type="file" onChange={handleFileChange} accept="image/*" className="input input-bordered w-full max-w-xs" />
          <button onClick={handleFileUpload} className="btn btn-primary w-full sm:w-auto" disabled={!selectedFile}>
            <FaUpload /> {languageData[language]?.upload || "Upload"}
          </button>
        </div>
        
        {formData.business?.logo && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-1">Current Logo Preview:</p>
            <img src={formData.business.logo} alt="Business Logo" className="w-32 h-auto object-contain border p-2 bg-white" />
            <button onClick={handleDeleteLogo} className="btn btn-error btn-sm mt-2">
              <FaTrashAlt /> {languageData[language]?.delete || "Delete"}
            </button>
          </div>
        )}
      </div>

      {/* Security & Logout */}
      <div className="bg-white p-4 rounded-lg shadow-md mt-6">
        <h2 className="text-2xl font-bold mb-4">{languageData[language]?.security || 'Security'}</h2>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button onClick={() => setShowPasswordModal(true)} className="btn btn-outline btn-warning w-full sm:w-auto flex items-center justify-center gap-2">
            <FaKey />
            {languageData[language]?.change_password || 'Change Password'}
          </button>
          <button onClick={handleLogout} className="btn btn-outline btn-error w-full sm:w-auto flex items-center justify-center gap-2">
            <FaSignOutAlt />
            {languageData[language]?.logout || 'Logout'}
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          language={language}
          context={context}
        />
      )}
    </div>
  );
};

export default Settings;

