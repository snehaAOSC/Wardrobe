import React, { useState, useEffect } from 'react';
import { X, Upload, Sparkles, Check, Image as ImageIcon, Loader } from 'lucide-react';

const COMMON_COLORS = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Black', hex: '#111827' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Green', hex: '#059669' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Beige', hex: '#d4b996' },
  { name: 'Grey', hex: '#6b7280' },
  { name: 'Gold', hex: '#d4af37' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Brown', hex: '#78350f' }
];

const OCCASIONS = [
  'Casual',
  'Party',
  'Wedding',
  'Festival',
  'Office',
  'College',
  'Date night',
  'Travel',
  'Daily wear'
];

const SEASONS = ['Summer', 'Winter', 'Spring', 'Autumn', 'Monsoon', 'All Season'];

const STYLES = ['Chic', 'Elegant', 'Traditional', 'Casual', 'Formal', 'Minimalist', 'Romantic', 'Streetwear'];

export default function UploadClothModal({
  isOpen,
  onClose,
  file,
  previewUrl,
  onSave,
  isSubmitting,
  statusMessage
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Dress');
  const [subCategory, setSubCategory] = useState('');
  const [colorName, setColorName] = useState('White');
  const [primaryColor, setPrimaryColor] = useState('#ffffff');
  const [pattern, setPattern] = useState('Plain');
  const [material, setMaterial] = useState('');
  const [selectedOccasions, setSelectedOccasions] = useState(['Casual']);
  const [selectedSeasons, setSelectedSeasons] = useState(['Summer']);
  const [selectedStyles, setSelectedStyles] = useState(['Chic']);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Prepopulate initial values based on file name or defaults
  useEffect(() => {
    if (file && isOpen) {
      let cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      cleanName = cleanName.replace(/\b\w/g, (c) => c.toUpperCase());
      setName(cleanName);

      // Guess initial category from filename if obvious, user can easily adjust
      const lower = cleanName.toLowerCase();
      if (lower.includes('frock')) {
        setCategory('Frock');
        setSubCategory('Frock');
      } else if (lower.includes('saree') || lower.includes('sari')) {
        setCategory('Saree');
        setSubCategory('Saree');
      } else if (lower.includes('anarkali')) {
        setCategory('Anarkali');
        setSubCategory('Anarkali');
      } else if (lower.includes('dress')) {
        setCategory('Dress');
        setSubCategory('Dress');
      } else if (lower.includes('jeans')) {
        setCategory('Jeans');
        setSubCategory('Jeans');
      } else if (lower.includes('shirt')) {
        setCategory('Shirt');
        setSubCategory('Button-Down');
      } else if (lower.includes('tee') || lower.includes('t-shirt')) {
        setCategory('T-Shirt');
        setSubCategory('T-Shirt');
      } else if (lower.includes('jacket') || lower.includes('coat')) {
        setCategory('Jacket');
        setSubCategory('Jacket');
      } else if (lower.includes('shoe') || lower.includes('sneaker')) {
        setCategory('Shoes');
        setSubCategory('Shoes');
      } else if (lower.includes('skirt')) {
        setCategory('Skirt');
        setSubCategory('Skirt');
      }

      // Check for color keywords in file name
      for (const c of COMMON_COLORS) {
        if (lower.includes(c.name.toLowerCase())) {
          setColorName(c.name);
          setPrimaryColor(c.hex);
          break;
        }
      }

      setDescription('');
      setFormError('');
    }
  }, [file, isOpen]);

  if (!isOpen) return null;

  const toggleOccasion = (occ) => {
    setSelectedOccasions((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
    );
  };

  const toggleSeason = (sea) => {
    setSelectedSeasons((prev) =>
      prev.includes(sea) ? prev.filter((s) => s !== sea) : [...prev, sea]
    );
  };

  const toggleStyle = (sty) => {
    setSelectedStyles((prev) =>
      prev.includes(sty) ? prev.filter((s) => s !== sty) : [...prev, sty]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a name for your clothing item.');
      return;
    }
    setFormError('');

    onSave({
      name: name.trim(),
      category,
      subCategory: subCategory.trim() || category,
      color: colorName.trim() || 'Custom',
      primaryColor,
      pattern: pattern.trim() || 'Plain',
      material: material.trim() || 'Cotton Blend',
      occasion: selectedOccasions.length > 0 ? selectedOccasions : ['Casual'],
      season: selectedSeasons.length > 0 ? selectedSeasons : ['All Season'],
      style: selectedStyles.length > 0 ? selectedStyles : ['Chic'],
      description: description.trim() || `${colorName} ${name} tailored in ${material || 'quality fabric'}. Perfect for ${selectedOccasions.join(', ')}.`,
      tags: [
        ...selectedOccasions,
        ...selectedSeasons,
        ...selectedStyles,
        category,
        subCategory,
        colorName,
        pattern,
        material
      ].filter(Boolean)
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(10, 6, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          background: 'linear-gradient(145deg, #181228, #110b1f)',
          borderRadius: '20px',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#ffffff',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Upload size={17} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                Save Clothing Item to Wardrobe
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.55)' }}>
                Enter the exact details for accurate RAG search and 3D avatar try-on
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {formError && (
            <div
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '12px',
                marginBottom: '16px'
              }}
            >
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: '20px', marginBottom: '18px' }}>
            {/* Left: Image Preview */}
            <div>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '3 / 4',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Upload preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <ImageIcon size={32} color="rgba(255,255,255,0.3)" />
                )}
              </div>
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: '10.5px',
                  color: 'rgba(255, 255, 255, 0.45)',
                  textAlign: 'center'
                }}
              >
                Uploaded Photo
              </p>
            </div>

            {/* Right: Core Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#c4b5fd', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Clothing Item Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ivory White Summer Frock, Banarasi Saree"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#c4b5fd', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '9px',
                      background: '#1d152f',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <optgroup label="Dresses & Indian Ethnic">
                      <option value="Dress">Dress</option>
                      <option value="Frock">Frock</option>
                      <option value="Saree">Saree</option>
                      <option value="Anarkali">Anarkali</option>
                      <option value="Kurti">Kurti</option>
                      <option value="Lehenga">Lehenga</option>
                      <option value="Suit">Suit</option>
                      <option value="Ethnic">Ethnic / Traditional</option>
                    </optgroup>
                    <optgroup label="Tops">
                      <option value="Shirt">Shirt</option>
                      <option value="T-Shirt">T-Shirt</option>
                      <option value="Other">Top / Blouse / Sweater</option>
                    </optgroup>
                    <optgroup label="Bottoms">
                      <option value="Jeans">Jeans</option>
                      <option value="Trousers">Trousers / Pants</option>
                      <option value="Skirt">Skirt</option>
                    </optgroup>
                    <optgroup label="Outerwear & Accessories">
                      <option value="Jacket">Jacket / Coat / Blazer</option>
                      <option value="Shoes">Shoes / Footwear / Juttis</option>
                      <option value="Accessories">Accessories / Bag / Belt</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#c4b5fd', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Subcategory / Cut
                  </label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="e.g. Frock, Cocktail, Button-Down"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '9px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#c4b5fd', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Primary Color: <span style={{ color: '#fff', textTransform: 'none' }}>{colorName}</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  {COMMON_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setColorName(c.name);
                        setPrimaryColor(c.hex);
                      }}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: c.hex,
                        border: primaryColor === c.hex ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: primaryColor === c.hex ? '0 0 10px rgba(168,85,247,0.7)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={c.name}
                    >
                      {primaryColor === c.hex && (
                        <Check size={12} color={c.hex === '#ffffff' || c.hex === '#eab308' || c.hex === '#d4b996' ? '#000' : '#fff'} />
                      )}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    placeholder="Custom color"
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      width: '90px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pattern & Material */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#c4b5fd', marginBottom: '4px', textTransform: 'uppercase' }}>
                Pattern
              </label>
              <select
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: '#1d152f',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Plain">Plain / Solid</option>
                <option value="Floral">Floral</option>
                <option value="Striped">Striped</option>
                <option value="Checked">Checked</option>
                <option value="Printed">Printed</option>
                <option value="Embroidered">Embroidered / Zari</option>
                <option value="Polka Dot">Polka Dot</option>
                <option value="Abstract">Abstract</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#c4b5fd', marginBottom: '4px', textTransform: 'uppercase' }}>
                Fabric / Material
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. 100% Breathable Cotton, Chiffon, Silk"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Occasions (Multi-select) */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#c4b5fd', marginBottom: '6px', textTransform: 'uppercase' }}>
              Suitable Occasions (Select all that apply)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {OCCASIONS.map((occ) => {
                const active = selectedOccasions.includes(occ);
                return (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => toggleOccasion(occ)}
                    style={{
                      padding: '4px 11px',
                      borderRadius: '999px',
                      background: active ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.06)',
                      border: active ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.12)',
                      color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
                      fontSize: '11px',
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {occ}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seasons (Multi-select) */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#c4b5fd', marginBottom: '6px', textTransform: 'uppercase' }}>
              Suitable Season
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SEASONS.map((sea) => {
                const active = selectedSeasons.includes(sea);
                return (
                  <button
                    key={sea}
                    type="button"
                    onClick={() => toggleSeason(sea)}
                    style={{
                      padding: '4px 11px',
                      borderRadius: '999px',
                      background: active ? 'linear-gradient(135deg, #059669, #10b981)' : 'rgba(255,255,255,0.06)',
                      border: active ? '1px solid #6ee7b7' : '1px solid rgba(255,255,255,0.12)',
                      color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
                      fontSize: '11px',
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {sea}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style Vibes */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#c4b5fd', marginBottom: '6px', textTransform: 'uppercase' }}>
              Style Aesthetic
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {STYLES.map((sty) => {
                const active = selectedStyles.includes(sty);
                return (
                  <button
                    key={sty}
                    type="button"
                    onClick={() => toggleStyle(sty)}
                    style={{
                      padding: '4px 11px',
                      borderRadius: '999px',
                      background: active ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255,255,255,0.06)',
                      border: active ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.12)',
                      color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
                      fontSize: '11px',
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {sty}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Custom Caption / Description */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#c4b5fd', marginBottom: '4px', textTransform: 'uppercase' }}>
              Your Description / Styling Caption (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. My favorite white flared cotton frock with floral tiering, perfect for summer brunches."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '9px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 24px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(124, 58, 237, 0.45)'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader size={14} className="spin" />
                  <span>{statusMessage || 'Saving to MongoDB…'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Save to Wardrobe &amp; Try On</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

