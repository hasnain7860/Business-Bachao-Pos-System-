import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaSave, FaPrint, FaEye } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';

const TemplateManager = () => {
  const { settingContext } = useAppContext();
  const { data: allSettings, edit: editSetting } = settingContext;

  // We assume settings[0] holds our app configuration
  const currentSettings = allSettings?.[0] || {};
  
  // Local state for the list of templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Available sections that can be reordered
  const availableSections = [
    { id: 'logo', label: 'Business Logo', enabled: true },
    { id: 'business_info', label: 'Business Details', enabled: true },
    { id: 'header_text', label: 'Custom Header Message', enabled: true },
    { id: 'customer_info', label: 'Customer Details', enabled: true },
    { id: 'invoice_meta', label: 'Invoice # & Date', enabled: true },
    { id: 'items_table', label: 'Items List', enabled: true }, // Core component, usually mandatory
    { id: 'totals_area', label: 'Grand Totals', enabled: true },
    { id: 'footer_text', label: 'Custom Footer Message', enabled: true },
    { id: 'barcode', label: 'Barcode/QR', enabled: false },
    { id: 'signature', label: 'Signature Line', enabled: false },
  ];

  // Default Template Structure
  const createNewTemplate = () => ({
    id: Date.now().toString(), // Simple ID generation
    name: 'New Template',
    paperSize: '80mm', // 80mm, 58mm, A4, A5
    fontSize: '12px',
    fontFamily: 'sans', // sans, serif, mono
    sections: [...availableSections], // Copy default sections
    customCSS: '',
    headerText: 'Welcome to our shop!',
    footerText: 'Thank you for visiting.',
    isDefault: false
  });

  // Load templates from global settings on mount
  useEffect(() => {
    if (currentSettings.templates && Array.isArray(currentSettings.templates)) {
      setTemplates(currentSettings.templates);
      if (currentSettings.templates.length > 0) {
        setSelectedTemplateId(currentSettings.templates[0].id);
      }
    } else {
      // If no templates exist, create a default one
      const defaultTemp = createNewTemplate();
      defaultTemp.name = "Standard Receipt";
      defaultTemp.isDefault = true;
      setTemplates([defaultTemp]);
      setSelectedTemplateId(defaultTemp.id);
    }
  }, [currentSettings]);

  // --- ACTIONS ---

  const handleAddTemplate = () => {
    const newTemp = createNewTemplate();
    setTemplates([...templates, newTemp]);
    setSelectedTemplateId(newTemp.id);
  };

  const handleDeleteTemplate = (id) => {
    if (templates.length <= 1) {
      alert("You must have at least one template.");
      return;
    }
    const newList = templates.filter(t => t.id !== id);
    setTemplates(newList);
    setSelectedTemplateId(newList[0].id);
  };

  const handleUpdateTemplate = (field, value) => {
    setTemplates(prev => prev.map(t => 
      t.id === selectedTemplateId ? { ...t, [field]: value } : t
    ));
  };

  const handleSectionToggle = (sectionId) => {
    setTemplates(prev => prev.map(t => {
      if (t.id !== selectedTemplateId) return t;
      const newSections = t.sections.map(s => 
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      );
      return { ...t, sections: newSections };
    }));
  };

  const moveSection = (index, direction) => {
    const activeTemplate = templates.find(t => t.id === selectedTemplateId);
    if (!activeTemplate) return;

    const newSections = [...activeTemplate.sections];
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    // Swap
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];

    handleUpdateTemplate('sections', newSections);
  };

  const saveToDatabase = async () => {
    if (!currentSettings.id) {
        alert("Error: No settings record found to update.");
        return;
    }
    // Save the entire templates array to the settings document
    await editSetting(currentSettings.id, { ...currentSettings, templates });
    alert("Templates saved successfully!");
  };

  // --- RENDER HELPERS ---

  const activeTemplate = templates.find(t => t.id === selectedTemplateId);

  if (!activeTemplate) return <div>Loading templates...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4 gap-4">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FaPrint className="text-blue-600" /> Print Template Manager
        </h1>
        <div className="flex gap-2">
           <button 
             className="btn btn-outline btn-sm gap-2"
             onClick={() => setPreviewMode(!previewMode)}
           >
             <FaEye /> {previewMode ? 'Edit Mode' : 'Preview Mode'}
           </button>
           <button 
             className="btn btn-primary btn-sm gap-2"
             onClick={saveToDatabase}
           >
             <FaSave /> Save All
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
        
        {/* LEFT: Sidebar List */}
        <div className="w-full lg:w-1/4 bg-white rounded-lg shadow-sm flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
            <span className="font-bold">My Templates</span>
            <button onClick={handleAddTemplate} className="btn btn-xs btn-circle btn-primary"><FaPlus /></button>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {templates.map(t => (
              <div 
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                className={`p-3 rounded-md cursor-pointer border flex justify-between items-center transition-all ${
                  selectedTemplateId === t.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.paperSize}</div>
                </div>
                {templates.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <FaTrash size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Editor (Only visible if not in full preview on mobile) */}
        {!previewMode && (
          <div className="w-full lg:w-2/4 bg-white rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-gray-50 rounded-t-lg">
              <h2 className="font-bold">Edit Template</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Basic Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs font-bold">Template Name</span></label>
                  <input 
                    type="text" 
                    value={activeTemplate.name} 
                    onChange={(e) => handleUpdateTemplate('name', e.target.value)}
                    className="input input-bordered input-sm" 
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs font-bold">Paper Size</span></label>
                  <select 
                    value={activeTemplate.paperSize} 
                    onChange={(e) => handleUpdateTemplate('paperSize', e.target.value)}
                    className="select select-bordered select-sm"
                  >
                    <option value="80mm">80mm Thermal</option>
                    <option value="58mm">58mm Thermal</option>
                    <option value="A4">A4 Standard</option>
                    <option value="A5">A5 Half Page</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs font-bold">Font Family</span></label>
                  <select 
                    value={activeTemplate.fontFamily} 
                    onChange={(e) => handleUpdateTemplate('fontFamily', e.target.value)}
                    className="select select-bordered select-sm"
                  >
                    <option value="sans">Sans-Serif (Modern)</option>
                    <option value="serif">Serif (Classic)</option>
                    <option value="mono">Monospace (Code/Retro)</option>
                  </select>
                </div>
                 <div className="form-control">
                  <label className="label"><span className="label-text text-xs font-bold">Font Size</span></label>
                  <select 
                    value={activeTemplate.fontSize} 
                    onChange={(e) => handleUpdateTemplate('fontSize', e.target.value)}
                    className="select select-bordered select-sm"
                  >
                    <option value="10px">Small (10px)</option>
                    <option value="12px">Normal (12px)</option>
                    <option value="14px">Large (14px)</option>
                    <option value="16px">Extra Large (16px)</option>
                  </select>
                </div>
              </div>

              {/* Section Reordering */}
              <div>
                <h3 className="text-sm font-bold mb-2 uppercase text-gray-400">Layout Sections (Drag Logic)</h3>
                <div className="bg-gray-50 rounded-lg p-2 space-y-2 border">
                  {activeTemplate.sections.map((section, index) => (
                    <div 
                      key={section.id} 
                      className={`flex items-center gap-3 p-2 rounded border bg-white shadow-sm ${!section.enabled ? 'opacity-50 grayscale' : ''}`}
                    >
                      {/* Toggle */}
                      <input 
                        type="checkbox" 
                        checked={section.enabled} 
                        onChange={() => handleSectionToggle(section.id)}
                        className="checkbox checkbox-xs checkbox-primary" 
                      />
                      
                      {/* Label */}
                      <span className="flex-1 text-sm font-medium">{section.label}</span>

                      {/* Reorder Buttons */}
                      <div className="flex gap-1">
                        <button 
                          disabled={index === 0}
                          onClick={() => moveSection(index, -1)}
                          className="btn btn-ghost btn-xs text-gray-500 disabled:opacity-20"
                        >
                          <FaArrowUp />
                        </button>
                        <button 
                          disabled={index === activeTemplate.sections.length - 1}
                          onClick={() => moveSection(index, 1)}
                          className="btn btn-ghost btn-xs text-gray-500 disabled:opacity-20"
                        >
                          <FaArrowDown />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Text */}
              <div className="space-y-4">
                 <div className="form-control">
                    <label className="label"><span className="label-text text-xs font-bold">Header Message</span></label>
                    <textarea 
                        value={activeTemplate.headerText}
                        onChange={(e) => handleUpdateTemplate('headerText', e.target.value)}
                        className="textarea textarea-bordered h-20 text-sm"
                        placeholder="Welcome..."
                    ></textarea>
                 </div>
                 <div className="form-control">
                    <label className="label"><span className="label-text text-xs font-bold">Footer Message</span></label>
                    <textarea 
                        value={activeTemplate.footerText}
                        onChange={(e) => handleUpdateTemplate('footerText', e.target.value)}
                        className="textarea textarea-bordered h-20 text-sm"
                        placeholder="Thank you..."
                    ></textarea>
                 </div>
              </div>

            </div>
          </div>
        )}

        {/* RIGHT: Live Preview */}
        <div className={`${previewMode ? 'w-full' : 'hidden lg:block lg:w-1/4'} bg-gray-800 rounded-lg shadow-inner p-4 flex flex-col items-center justify-center overflow-hidden`}>
          <div className="text-white text-xs mb-2 font-mono uppercase tracking-widest">Live Preview</div>
          
          <div className="bg-white shadow-2xl overflow-y-auto h-full w-full max-w-[400px]" style={{
            width: activeTemplate.paperSize === 'A4' ? '100%' : activeTemplate.paperSize === '80mm' ? '300px' : '220px',
            fontFamily: activeTemplate.fontFamily === 'mono' ? 'monospace' : activeTemplate.fontFamily === 'serif' ? 'serif' : 'sans-serif',
            fontSize: activeTemplate.fontSize
          }}>
             {/* THE ACTUAL PREVIEW RENDERING */}
             <div className="p-4 flex flex-col gap-2 min-h-[500px]">
                {activeTemplate.sections.map(section => {
                    if (!section.enabled) return null;

                    switch(section.id) {
                        case 'logo':
                             return <div key="logo" className="w-16 h-16 bg-gray-200 mx-auto rounded-full flex items-center justify-center text-xs text-gray-400">LOGO</div>;
                        case 'business_info':
                            return (
                                <div key="biz" className="text-center">
                                    <div className="font-bold text-lg">My Business Name</div>
                                    <div className="text-xs">123 Market St, City</div>
                                    <div className="text-xs">Ph: 0300-1234567</div>
                                </div>
                            );
                        case 'header_text':
                            return activeTemplate.headerText ? <div key="head" className="text-center text-xs italic my-1">{activeTemplate.headerText}</div> : null;
                        case 'invoice_meta':
                            return (
                                <div key="meta" className="flex justify-between border-b pb-1 mt-2">
                                    <span className="font-bold">Inv: #1001</span>
                                    <span>25-Oct-2025</span>
                                </div>
                            );
                        case 'customer_info':
                            return (
                                <div key="cust" className="text-xs border-b pb-1">
                                    <span className="font-bold">Bill To:</span> Walk-in Customer
                                </div>
                            );
                        case 'items_table':
                            return (
                                <table key="items" className="w-full text-left mt-2">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="py-1">Item</th>
                                            <th className="py-1 text-right">Qty</th>
                                            <th className="py-1 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td className="py-1">Milk Pack</td><td className="text-right">2</td><td className="text-right">400</td></tr>
                                        <tr><td className="py-1">Bread Large</td><td className="text-right">1</td><td className="text-right">150</td></tr>
                                    </tbody>
                                </table>
                            );
                        case 'totals_area':
                            return (
                                <div key="totals" className="flex flex-col items-end mt-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between w-full font-bold">
                                        <span>Total</span>
                                        <span>550.00</span>
                                    </div>
                                </div>
                            );
                        case 'footer_text':
                             return activeTemplate.footerText ? <div key="foot" className="text-center text-xs mt-4">{activeTemplate.footerText}</div> : null;
                        case 'barcode':
                             return <div key="bar" className="h-8 bg-black mt-2 mx-auto w-2/3"></div>;
                        case 'signature':
                             return <div key="sig" className="mt-8 border-t border-black w-1/2 mx-auto text-center text-xs pt-1">Signature</div>;
                        default: 
                            return null;
                    }
                })}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TemplateManager;

