import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- LEAFLET ICON FIX ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;
// ------------------------

const Modal = ({ isOpen, onRequestClose, className, overlayClassName, children }) => {
    if (!isOpen) return null;
    return (
        <div className={overlayClassName} style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000, 
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={onRequestClose}>
            <div className={className} onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

// Map Click Handler for the Popup
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position ? (
    <Marker position={[position.lat, position.lng]} />
  ) : null;
};

const TailwindCSS = () => (
    <style>{`
        .report-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.75); z-index: 1000; display: flex; justify-content: center; align-items: center; }
        
        /* Modal Base Styles */
        .report-modal, .dept-modal { background: white; padding: 25px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative; }
        
        /* NEW: Map Popup Styles */
        .map-popup-modal { background: white; padding: 20px; border-radius: 12px; max-width: 800px; width: 95%; height: 85vh; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative; }
        .map-popup-container { flex-grow: 1; border-radius: 8px; overflow: hidden; border: 2px solid #e5e7eb; margin-bottom: 15px; position: relative; }
        .map-popup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .map-popup-header h3 { margin: 0; color: #1f2937; }
        .map-popup-header p { margin: 0; color: #6b7280; font-size: 0.9rem; }

        .report-popup h2, .report-popup h3 { color: #3b82f6; margin-top: 0; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; font-weight: 700; }
        .report-form label { display: block; margin-top: 15px; margin-bottom: 5px; font-weight: 600; color: #1f2937; }
        .report-form input[type="text"], .report-form input[type="number"], .report-form textarea, .report-form select { width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; box-sizing: border-box; }
        .report-form textarea { min-height: 80px; resize: vertical; }
        
        /* Location UI Styles */
        .location-mode-toggle { display: flex; gap: 5px; margin-top: 5px; margin-bottom: 10px; }
        .toggle-btn { flex: 1; padding: 8px 4px; border: 1px solid #d1d5db; background-color: #f9fafb; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; }
        .toggle-btn.active { background-color: #3b82f6; color: white; border-color: #3b82f6; }
        .manual-coords-inputs { display: flex; gap: 10px; margin-top: 5px; }
        .manual-coords-inputs div { flex: 1; }
        
        .open-map-btn { background-color: #4b5563; color: white; padding: 12px; border: none; border-radius: 6px; width: 100%; cursor: pointer; font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 8px; transition: background-color 0.2s; }
        .open-map-btn:hover { background-color: #374151; }

        .location-btn, .select-dept-btn { background-color: #f3f4f6; color: #1f2937; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; width: 100%; margin-top: 5px; cursor: pointer; transition: background-color 0.2s; }
        .location-btn:hover:not(:disabled), .select-dept-btn:hover:not(:disabled) { background-color: #e5e7eb; }
        .analyze-btn { background-color: #10b981; color: white; padding: 8px 12px; border: none; border-radius: 6px; margin-top: 5px; width: 100%; cursor: pointer; transition: background-color 0.2s; display: flex; justify-content: center; align-items: center; }
        .analyze-btn:hover:not(:disabled) { background-color: #0d9488; }
        .analyze-btn:disabled { background-color: #a7f3d0; cursor: not-allowed; }
        .location-info { margin-top: 10px; padding: 8px; background-color: #d1fae5; color: #065f46; border-radius: 4px; font-size: 0.9rem; border-left: 4px solid #059669; }
        
        .form-buttons { display: flex; gap: 10px; margin-top: 25px; }
        .form-buttons button { padding: 12px; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; flex-grow: 1; transition: background-color 0.2s; }
        .form-buttons button[type="submit"] { background-color: #3b82f6; color: white; }
        .form-buttons button[type="submit"]:hover:not(:disabled) { background-color: #2563eb; }
        .form-buttons button[type="submit"]:disabled { background-color: #93c5fd; cursor: not-allowed; }
        .cancel-btn { background-color: #ef4444; color: white; }
        .cancel-btn:hover:not(:disabled) { background-color: #b91c1c; }
        
        .image-preview-container { margin-top: 15px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px; max-height: 200px; overflow: hidden; }
        .image-preview { width: 100%; height: auto; display: block; }
        .departments-checkboxes { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 10px; }
        .departments-checkboxes label { margin-top: 0; font-weight: 400; display: inline; cursor: pointer; }
        .departments-checkboxes input { margin-right: 5px; }
    `}</style>
);

const departmentsList = [
  "Water Supply & Sewage Department", "Public Health & Sanitation Department", "Roads & Infrastructure Department",
  "Street Lighting Department", "Parks & Horticulture Department", "Building & Construction Department",
  "Drainage Department", "Electricity Department", "Public Works Department", "Traffic & Transportation Department",
  "Solid Waste Management Department", "Animal Control Department", "Health & Hospital Services",
  "Fire & Emergency Services", "Environmental Department", "Revenue Department", "Urban Planning & Development Authority",
  "Public Grievance & Complaint Cell"
];

const severityLevels = ["Low", "Medium", "High"];

// --- GEMINI API CONFIGURATION ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const ReportPopup = ({ isOpen, onRequestClose, onReportCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Low");
  const [departments, setDepartments] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeptPopupOpen, setIsDeptPopupOpen] = useState(false);
  
  // Location Handling States
  const [locationMode, setLocationMode] = useState("auto"); // "auto", "manual", or "map"
  const [location, setLocation] = useState(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  
  // New Map Popup States
  const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
  const [tempMapLocation, setTempMapLocation] = useState(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const toggleDepartment = (dep) => {
    setDepartments((prev) =>
      prev.includes(dep) ? prev.filter((d) => d !== dep) : [...prev, dep]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      if (imagePreview) URL.revokeObjectURL(imagePreview); 
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return; 
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ type: "Point", coordinates: [longitude, latitude] });
        console.log("Location captured successfully!");
      },
      () => console.error("Failed to fetch location")
    );
  };

  const handleManualCoordChange = (type, val) => {
    let lat = type === "lat" ? val : manualLat;
    let lng = type === "lng" ? val : manualLng;

    if (type === "lat") setManualLat(val);
    if (type === "lng") setManualLng(val);

    if (lat !== "" && lng !== "") {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      setLocation({
        type: "Point",
        coordinates: [parsedLng, parsedLat],
      });
    } else {
      setLocation(null); 
    }
  };

  // Triggered when user saves the location from the Map Popup
  const confirmMapLocation = () => {
    if (tempMapLocation) {
        setLocation({
            type: "Point",
            coordinates: [tempMapLocation.lng, tempMapLocation.lat]
        });
        // Sync manual inputs so everything matches
        setManualLat(tempMapLocation.lat.toFixed(6));
        setManualLng(tempMapLocation.lng.toFixed(6));
    }
    setIsMapPopupOpen(false);
  };

  const openMapPopup = () => {
      // If we already have a location, set the temp marker there
      if (location) {
          setTempMapLocation({ lat: location.coordinates[1], lng: location.coordinates[0] });
      } else {
          setTempMapLocation(null);
      }
      setIsMapPopupOpen(true);
  };

  const generateDescriptionFromImage = async () => {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            setIsAnalyzing(true);
            if (!imageFile) throw new Error("No image file selected.");

            const base64ImageData = await fileToBase64(imageFile);
            const mimeType = imageFile.type;
            
            const analysisPrompt = "Describe this image in a concise, professional paragraph, focusing only on objects, damage, and location details relevant to a municipal report. Do not use conversational language.";

            const payload = {
                contents: [{
                    role: "user",
                    parts: [
                        { text: analysisPrompt },
                        { inlineData: { mimeType: mimeType, data: base64ImageData } }
                    ]
                }],
            };

            const response = await window.fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.status === 503 || response.status === 429) {
                attempt++;
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (!response.ok) {
                const errorDetail = await response.json();
                throw new Error(`AI analysis failed with status ${response.status}: ${errorDetail.error?.message || 'Unknown error'}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text) {
                setDescription(text);
            } 
            return;
            
        } catch (e) {
            console.error("AI Analysis Error:", e);
            break; 
        } finally {
            setIsAnalyzing(false);
        }
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (imageFile && !description && !isAnalyzing) {
        await generateDescriptionFromImage();
        return; 
    }

    if (!title || !description || !location || departments.length === 0) {
        console.error("Missing required fields");
        return; 
    }
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description); 
      formData.append("severity", severity);
      formData.append("departments", JSON.stringify(departments));
      formData.append("location", JSON.stringify(location));
      if (imageFile) formData.append("reportImage", imageFile);

      const res = await api.post("/reports", formData, {
        withCredentials: true,
      });

      onReportCreated?.(res.data.data);

      setTitle("");
      setDescription("");
      setSeverity("Low");
      setDepartments([]);
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
      setLocation(null);
      setManualLat("");
      setManualLng("");
      setLocationMode("auto");
      onRequestClose();
    } catch (error) {
      console.error("Submission Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isSubmissionDisabled = loading || isAnalyzing;

  return (
    <>
      <TailwindCSS />
      
      {/* MAIN REPORT MODAL */}
      <Modal isOpen={isOpen} onRequestClose={onRequestClose} className="report-modal" overlayClassName="report-overlay">
        <div className="report-popup">
          <h2>Create Report</h2>
          <form onSubmit={handleSubmit} className="report-form">
            <label>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" required disabled={isSubmissionDisabled} />

            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue" required disabled={isSubmissionDisabled} />
            {imageFile && !description && (
                <button type="button" className="analyze-btn" onClick={generateDescriptionFromImage} disabled={isSubmissionDisabled}>
                    {isAnalyzing ? "Analyzing Image..." : "Auto-Fill Description (AI)"}
                </button>
            )}

            <label>Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} disabled={isSubmissionDisabled}>
              {severityLevels.map((level) => (<option key={level} value={level}>{level}</option>))}
            </select>

            <label>Departments</label>
            <button type="button" className="select-dept-btn" onClick={() => setIsDeptPopupOpen(true)} disabled={isSubmissionDisabled}>
              Select Departments ({departments.length})
            </button>

            <label>Upload Image (optional)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={isSubmissionDisabled} />

            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Selected Preview" className="image-preview" />
              </div>
            )}

            <label>Location Setup</label>
            <div className="location-mode-toggle">
              <button 
                type="button" 
                className={`toggle-btn ${locationMode === "auto" ? "active" : ""}`} 
                onClick={() => { setLocationMode("auto"); setLocation(null); }}
                disabled={isSubmissionDisabled}
              >
                Auto (GPS)
              </button>
              <button 
                type="button" 
                className={`toggle-btn ${locationMode === "manual" ? "active" : ""}`} 
                onClick={() => { setLocationMode("manual"); setLocation(null); setManualLat(""); setManualLng(""); }}
                disabled={isSubmissionDisabled}
              >
                Manual Input
              </button>
              <button 
                type="button" 
                className={`toggle-btn ${locationMode === "map" ? "active" : ""}`} 
                onClick={() => { setLocationMode("map"); }}
                disabled={isSubmissionDisabled}
              >
                Pick on Map
              </button>
            </div>

            {locationMode === "auto" && (
              <button type="button" className="location-btn" onClick={handleGetLocation} disabled={isSubmissionDisabled}>
                Get Current Location
              </button>
            )}

            {locationMode === "manual" && (
              <div className="manual-coords-inputs">
                <div>
                  <input type="number" step="any" placeholder="Latitude" value={manualLat} onChange={(e) => handleManualCoordChange("lat", e.target.value)} required={locationMode === "manual"} disabled={isSubmissionDisabled} />
                </div>
                <div>
                  <input type="number" step="any" placeholder="Longitude" value={manualLng} onChange={(e) => handleManualCoordChange("lng", e.target.value)} required={locationMode === "manual"} disabled={isSubmissionDisabled} />
                </div>
              </div>
            )}

            {locationMode === "map" && (
              <div style={{ marginTop: '10px' }}>
                <button type="button" className="open-map-btn" onClick={openMapPopup} disabled={isSubmissionDisabled}>
                  🗺️ Open Interactive Map
                </button>
              </div>
            )}

            {location && (
              <p className="location-info">
                ✅ Location Set: <strong>{location.coordinates[1].toFixed(5)}, {location.coordinates[0].toFixed(5)}</strong> 
                {locationMode === "manual" ? " (Manual)" : locationMode === "map" ? " (Map Picker)" : " (GPS)"}
              </p>
            )}

            <div className="form-buttons">
              <button type="submit" disabled={isSubmissionDisabled}>
                {isAnalyzing ? "Analyzing..." : (loading ? "Submitting..." : "Submit Report")}
              </button>
              <button type="button" className="cancel-btn" onClick={onRequestClose} disabled={isSubmissionDisabled}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* NEW: DEDICATED FULL-SIZE MAP MODAL */}
      <Modal isOpen={isMapPopupOpen} onRequestClose={() => setIsMapPopupOpen(false)} className="map-popup-modal" overlayClassName="report-overlay">
         <div className="map-popup-header">
             <div>
                <h3>Select Issue Location</h3>
                <p>Drag, zoom, and click to drop a pin on the exact location.</p>
             </div>
             {tempMapLocation && (
                 <span style={{color: '#059669', fontWeight: 'bold'}}>Pin Dropped!</span>
             )}
         </div>
         
         <div className="map-popup-container">
            {/* Scroll zoom is strictly enabled here because it's isolated from the form! */}
            <MapContainer 
                center={tempMapLocation ? [tempMapLocation.lat, tempMapLocation.lng] : [21.2514, 81.6296]} 
                zoom={13} 
                scrollWheelZoom={true} 
                style={{ height: "100%", width: "100%", zIndex: 1 }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              <LocationMarker position={tempMapLocation} setPosition={setTempMapLocation} />
            </MapContainer>
         </div>

         <div className="form-buttons" style={{marginTop: '0'}}>
             <button type="button" style={{backgroundColor: '#10b981', color: 'white'}} onClick={confirmMapLocation} disabled={!tempMapLocation}>
                Confirm Location
             </button>
             <button type="button" className="cancel-btn" onClick={() => setIsMapPopupOpen(false)}>
                Cancel
             </button>
         </div>
      </Modal>

      {/* DEPARTMENTS MODAL */}
      <Modal isOpen={isDeptPopupOpen} onRequestClose={() => setIsDeptPopupOpen(false)} className="dept-modal" overlayClassName="report-overlay">
        <div className="report-popup">
          <h3>Select Departments</h3>
          <div className="departments-checkboxes">
            {departmentsList.map((dep) => (
              <div key={dep}>
                <input type="checkbox" id={dep} checked={departments.includes(dep)} onChange={() => toggleDepartment(dep)} />
                <label htmlFor={dep}>{dep}</label>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "15px", textAlign: "right" }}>
            <button className="location-btn" onClick={() => setIsDeptPopupOpen(false)}>Done</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ReportPopup;