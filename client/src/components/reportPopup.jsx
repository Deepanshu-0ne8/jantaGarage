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
        <div className={overlayClassName} onClick={onRequestClose}>
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

const departmentsList = [
  "Water Supply & Sewage Department", "Public Health & Sanitation Department", "Roads & Infrastructure Department",
  "Street Lighting Department", "Parks & Horticulture Department", "Building & Construction Department",
  "Drainage Department", "Electricity Department", "Public Works Department", "Traffic & Transportation Department",
  "Solid Waste Management Department", "Animal Control Department", "Health & Hospital Services",
  "Fire & Emergency Services", "Environmental Department", "Revenue Department", "Urban Planning & Development Authority",
  "Public Grievance & Complaint Cell"
];

const severityLevels = ["Low", "Medium", "High"];

// --- COHERE API CONFIGURATION ---
const apiKey = import.meta.env.VITE_COHERE_API_KEY;
const apiUrl = `https://api.cohere.com/v2/chat`;

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

  const autoFillFormFromImage = async () => {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            setIsAnalyzing(true);
            if (!imageFile) throw new Error("No image file selected.");

            const base64ImageData = await fileToBase64(imageFile);
            const mimeType = imageFile.type;
            
            const analysisPrompt = `Analyze this image and provide the following details for a municipal issue report in a strict JSON format:
{
  "title": "A brief, descriptive title of the issue (e.g., 'Large pothole on Main Street')",
  "description": "A concise, professional paragraph describing the issue, objects, and damage visible. Do not use conversational language.",
  "severity": "The severity of the issue, strictly one of ['Low', 'Medium', 'High']",
  "departments": ["An array of 1 or more relevant departments responsible for fixing this issue, chosen ONLY from this exact list: 'Water Supply & Sewage Department', 'Public Health & Sanitation Department', 'Roads & Infrastructure Department', 'Street Lighting Department', 'Parks & Horticulture Department', 'Building & Construction Department', 'Drainage Department', 'Electricity Department', 'Public Works Department', 'Traffic & Transportation Department', 'Solid Waste Management Department', 'Animal Control Department', 'Health & Hospital Services', 'Fire & Emergency Services', 'Environmental Department', 'Revenue Department', 'Urban Planning & Development Authority', 'Public Grievance & Complaint Cell'"]
}
Return ONLY the raw JSON object without any markdown formatting or code blocks.`;

            const payload = {
                model: "command-a-vision-07-2025",
                response_format: { type: "json_object" },
                messages: [{
                    role: "user",
                    content: [
                        { type: "text", text: analysisPrompt },
                        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64ImageData}` } }
                    ]
                }],
            };

            const response = await window.fetch(apiUrl, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json' 
                },
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
                throw new Error(`AI analysis failed with status ${response.status}: ${errorDetail.message || 'Unknown error'}`);
            }

            const result = await response.json();
            const text = result?.message?.content?.[0]?.text || "";
            
            // Try to parse JSON from the text
            let parsedData;
            try {
                // Cohere sometimes wraps in markdown
                const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
                parsedData = JSON.parse(cleanedText);
            } catch(err) {
                console.error("Failed to parse AI response as JSON", text);
                throw new Error("Invalid response format from AI");
            }

            if (parsedData.title) setTitle(parsedData.title);
            if (parsedData.description) setDescription(parsedData.description);
            if (parsedData.severity && severityLevels.includes(parsedData.severity)) setSeverity(parsedData.severity);
            if (parsedData.departments && Array.isArray(parsedData.departments)) {
                // Filter to only valid departments
                const validDepts = parsedData.departments.filter(d => departmentsList.includes(d));
                if (validDepts.length > 0) setDepartments(validDepts);
            }
            
            return;
            
        } catch (e) {
            console.error("AI Analysis Error:", e);
            alert("Failed to auto-fill form. Please try again or fill manually.");
            break; 
        } finally {
            setIsAnalyzing(false);
        }
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (imageFile && (!title || !description || departments.length === 0) && !isAnalyzing) {
        await autoFillFormFromImage();
        if (!title || !description || departments.length === 0) return; // if it still fails
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
      {/* MAIN REPORT MODAL */}
      <Modal 
        isOpen={isOpen} 
        onRequestClose={onRequestClose} 
        className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-slate-700/60 relative p-0" 
        overlayClassName="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-start bg-slate-900/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 pointer-events-none"></div>
            <h2 className="text-2xl font-extrabold text-white mb-0 tracking-tight flex items-center gap-2 relative z-10">
                <i className="fas fa-file-signature text-blue-400"></i> Create Report
            </h2>
            <button 
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors relative z-10"
                onClick={onRequestClose}
            >
                <i className="fas fa-times"></i>
            </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar bg-slate-900/40">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Title */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Title</label>
                <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="E.g., Large pothole on Main St." 
                    required 
                    disabled={isSubmissionDisabled} 
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
            </div>

            {/* Severity */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Severity Level</label>
                <div className="flex gap-3">
                    {severityLevels.map((level) => (
                        <button
                            key={level}
                            type="button"
                            onClick={() => setSeverity(level)}
                            disabled={isSubmissionDisabled}
                            className={`flex-1 py-2.5 rounded-lg border font-semibold text-sm transition-all ${
                                severity === level 
                                    ? level === 'Low' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                    : level === 'Medium' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                    : 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                            }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* Image Upload */}
            <div>
                <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Evidence Photo <span className="text-slate-500 font-normal normal-case">(Optional)</span></label>
                    {imageFile && (
                        <button 
                            type="button" 
                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors bg-emerald-500/10 px-2 py-1 rounded shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                            onClick={autoFillFormFromImage} 
                            disabled={isSubmissionDisabled}
                        >
                            <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
                            {isAnalyzing ? "Analyzing & Auto-Filling..." : "Auto-Fill Form via AI"}
                        </button>
                    )}
                </div>
                
                <div className="relative group">
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        disabled={isSubmissionDisabled} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        id="image-upload"
                    />
                    <div className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-colors ${
                        imagePreview ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-800/30 group-hover:bg-slate-800/50'
                    }`}>
                        {imagePreview ? (
                            <div className="relative w-full max-h-48 rounded-lg overflow-hidden flex justify-center">
                                <img src={imagePreview} alt="Selected Preview" className="max-h-48 object-contain" />
                            </div>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                                    <i className="fas fa-cloud-upload-alt text-xl text-blue-400"></i>
                                </div>
                                <span className="text-sm font-medium text-slate-300">Click or drag image to upload</span>
                                <span className="text-xs text-slate-500 mt-1">PNG, JPG, JPEG up to 5MB</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            <div>
                <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
                </div>
                <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Describe the issue in detail..." 
                    required 
                    disabled={isSubmissionDisabled} 
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors min-h-[100px] resize-y custom-scrollbar"
                />
            </div>

            {/* Departments */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Assign Departments</label>
                <button 
                    type="button" 
                    className="w-full bg-slate-800 border border-slate-700 hover:bg-slate-700/80 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors flex justify-between items-center group" 
                    onClick={() => setIsDeptPopupOpen(true)} 
                    disabled={isSubmissionDisabled}
                >
                    <span className={departments.length > 0 ? "text-white" : "text-slate-400"}>
                        {departments.length > 0 ? `${departments.length} Department(s) Selected` : "Select Responsible Departments"}
                    </span>
                    <i className="fas fa-chevron-right text-slate-500 group-hover:text-white transition-colors"></i>
                </button>
                {departments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {departments.map((dept, i) => (
                            <span key={i} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded text-xs font-medium flex items-center gap-1.5">
                                {dept}
                                <button type="button" onClick={() => toggleDepartment(dept)} className="text-blue-400/50 hover:text-blue-400"><i className="fas fa-times"></i></button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Location */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Location Setup</label>
                
                <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 mb-3">
                  <button 
                    type="button" 
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${locationMode === "auto" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-300"}`} 
                    onClick={() => { setLocationMode("auto"); setLocation(null); }}
                    disabled={isSubmissionDisabled}
                  >
                    <i className="fas fa-location-arrow mr-1.5"></i> GPS
                  </button>
                  <button 
                    type="button" 
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${locationMode === "map" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-300"}`} 
                    onClick={() => { setLocationMode("map"); }}
                    disabled={isSubmissionDisabled}
                  >
                    <i className="fas fa-map mr-1.5"></i> Pick on Map
                  </button>
                  <button 
                    type="button" 
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${locationMode === "manual" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-300"}`} 
                    onClick={() => { setLocationMode("manual"); setLocation(null); setManualLat(""); setManualLng(""); }}
                    disabled={isSubmissionDisabled}
                  >
                    <i className="fas fa-keyboard mr-1.5"></i> Manual
                  </button>
                </div>

                {locationMode === "auto" && (
                  <button 
                    type="button" 
                    className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg px-4 py-3 text-sm font-semibold transition-colors flex justify-center items-center gap-2" 
                    onClick={handleGetLocation} 
                    disabled={isSubmissionDisabled}
                  >
                    <i className="fas fa-crosshairs"></i> Get Current Location
                  </button>
                )}

                {locationMode === "manual" && (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input 
                        type="number" 
                        step="any" 
                        placeholder="Latitude (e.g. 21.251)" 
                        value={manualLat} 
                        onChange={(e) => handleManualCoordChange("lat", e.target.value)} 
                        required={locationMode === "manual"} 
                        disabled={isSubmissionDisabled}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" 
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="number" 
                        step="any" 
                        placeholder="Longitude (e.g. 81.629)" 
                        value={manualLng} 
                        onChange={(e) => handleManualCoordChange("lng", e.target.value)} 
                        required={locationMode === "manual"} 
                        disabled={isSubmissionDisabled}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" 
                      />
                    </div>
                  </div>
                )}

                {locationMode === "map" && (
                  <button 
                    type="button" 
                    className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg px-4 py-3 text-sm font-semibold transition-colors flex justify-center items-center gap-2" 
                    onClick={openMapPopup} 
                    disabled={isSubmissionDisabled}
                  >
                    <i className="fas fa-map-marked-alt"></i> Open Interactive Map
                  </button>
                )}

                {location && (
                  <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <i className="fas fa-check"></i>
                      </div>
                      <div>
                          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Location Captured</p>
                          <p className="text-sm font-mono text-emerald-400">{location.coordinates[1].toFixed(5)}, {location.coordinates[0].toFixed(5)}</p>
                      </div>
                  </div>
                )}
            </div>

          </form>
        </div>

        <div className="p-5 border-t border-slate-700/50 bg-slate-900/50 flex gap-3">
            <button 
                type="button" 
                className="flex-1 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold transition-colors" 
                onClick={onRequestClose} 
                disabled={isSubmissionDisabled}
            >
                Cancel
            </button>
            <button 
                type="button"
                onClick={handleSubmit}
                disabled={isSubmissionDisabled || (!title || (!description && !imageFile) || !location || departments.length === 0)}
                className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isAnalyzing ? (
                    <><i className="fas fa-spinner fa-spin"></i> Analyzing...</>
                ) : loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
                ) : (
                    <><i className="fas fa-paper-plane"></i> Submit Report</>
                )}
            </button>
        </div>
      </Modal>

      {/* NEW: DEDICATED FULL-SIZE MAP MODAL */}
      <Modal 
        isOpen={isMapPopupOpen} 
        onRequestClose={() => setIsMapPopupOpen(false)} 
        className="glass-card w-[95%] max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-slate-700/60 p-0" 
        overlayClassName="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      >
         <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/80 backdrop-blur-md z-10 relative">
             <div>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <i className="fas fa-map-marker-alt text-purple-400"></i> Drop a Pin
                </h3>
                <p className="text-xs text-slate-400">Drag the map and click to set the exact location of the issue.</p>
             </div>
             {tempMapLocation && (
                 <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1.5">
                     <i className="fas fa-check-circle"></i> Pin Dropped!
                 </span>
             )}
         </div>
         
         <div className="flex-grow relative z-0">
            {/* Scroll zoom is strictly enabled here because it's isolated from the form! */}
            <MapContainer 
                center={tempMapLocation ? [tempMapLocation.lat, tempMapLocation.lng] : [21.2514, 81.6296]} 
                zoom={13} 
                scrollWheelZoom={true} 
                style={{ height: "100%", width: "100%", zIndex: 1 }}
                className="z-0"
            >
              <TileLayer 
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <LocationMarker position={tempMapLocation} setPosition={setTempMapLocation} />
            </MapContainer>
         </div>

         <div className="p-5 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-md flex justify-end gap-3 z-10 relative">
             <button 
                type="button" 
                className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold transition-colors" 
                onClick={() => setIsMapPopupOpen(false)}
             >
                Cancel
             </button>
             <button 
                type="button" 
                className="px-8 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={confirmMapLocation} 
                disabled={!tempMapLocation}
             >
                Confirm Location
             </button>
         </div>
      </Modal>

      {/* DEPARTMENTS MODAL */}
      <Modal 
        isOpen={isDeptPopupOpen} 
        onRequestClose={() => setIsDeptPopupOpen(false)} 
        className="glass-card w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-slate-700/60 p-0" 
        overlayClassName="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      >
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-start bg-slate-900/50">
            <div>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <i className="fas fa-sitemap text-blue-400"></i> Select Departments
                </h3>
                <p className="text-xs text-slate-400">Choose all departments relevant to this issue.</p>
            </div>
            <button 
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                onClick={() => setIsDeptPopupOpen(false)}
            >
                <i className="fas fa-times"></i>
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar bg-slate-900/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departmentsList.map((dep) => {
              const isSelected = departments.includes(dep);
              return (
                <label 
                    key={dep} 
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                            ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                            : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600'
                    }`}
                >
                  <div className="relative flex items-center justify-center mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => toggleDepartment(dep)} 
                        className="peer appearance-none w-5 h-5 rounded border border-slate-500 checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer"
                      />
                      <i className="fas fa-check absolute text-white text-xs opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"></i>
                  </div>
                  <span className={`text-sm font-medium leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {dep}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="p-5 border-t border-slate-700/50 bg-slate-900/50 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-400">
                <strong className="text-white">{departments.length}</strong> selected
            </span>
            <button 
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all" 
                onClick={() => setIsDeptPopupOpen(false)}
            >
                Done
            </button>
        </div>
      </Modal>
    </>
  );
};

export default ReportPopup;