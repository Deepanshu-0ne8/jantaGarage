import React, { useState } from "react";
import api from "../api/axios";
// NOTE: All local and external dependencies are now defined or mocked internally for stability.

// --- Mock API and Styling Imports (for Canvas compilation) ---
// const mockApi = {
//     post: async (url, data) => {
//         // Simulate successful submission and return a mock report object
//         console.log("Mock API Post:", url, data);
//         await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
//         return { 
//             data: { 
//                 data: {
//                     _id: Date.now().toString(),
//                     title: data.get('title'),
//                     description: data.get('description'),
//                     status: 'OPEN',
//                     updatedAt: new Date().toISOString(),
//                     createdAt: new Date().toISOString()
//                 } 
//             }
//         };
//     }
// };

const Modal = ({ isOpen, onRequestClose, className, overlayClassName, children }) => {
    if (!isOpen) return null;

    return (
        <div className={overlayClassName} style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000, 
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={onRequestClose}>
            <div className={className} style={{ 
                background: 'white', padding: '25px', borderRadius: '12px', 
                maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' 
            }} onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

// Mock the CSS file content with Tailwind classes for aesthetics
const TailwindCSS = () => (
    <style>{`
        .report-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.75); z-index: 1000; display: flex; justify-content: center; align-items: center;
        }
        .report-modal, .dept-modal {
            background: white; padding: 25px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative;
        }
        .report-popup h2, .report-popup h3 { color: #3b82f6; margin-top: 0; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; font-weight: 700; }
        .report-form label { display: block; margin-top: 15px; margin-bottom: 5px; font-weight: 600; color: #1f2937; }
        .report-form input[type="text"], .report-form textarea, .report-form select { width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; box-sizing: border-box; }
        .report-form textarea { min-height: 80px; resize: vertical; }
        .location-btn, .select-dept-btn { background-color: #f3f4f6; color: #1f2937; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; width: 100%; margin-top: 5px; cursor: pointer; transition: background-color 0.2s; }
        .location-btn:hover:not(:disabled), .select-dept-btn:hover:not(:disabled) { background-color: #e5e7eb; }
        .analyze-btn { background-color: #10b981; color: white; padding: 8px 12px; border: none; border-radius: 6px; margin-top: 5px; width: 100%; cursor: pointer; transition: background-color 0.2s; display: flex; justify-content: center; align-items: center; }
        .analyze-btn:hover:not(:disabled) { background-color: #0d9488; }
        .analyze-btn:disabled { background-color: #a7f3d0; cursor: not-allowed; }
        .location-info { margin-top: 10px; padding: 8px; background-color: #d1fae5; color: #065f46; border-radius: 4px; font-size: 0.9rem; }
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
// -----------------------------------------------------------------

const departmentsList = [
  "Water Supply & Sewage Department",
  "Public Health & Sanitation Department",
  "Roads & Infrastructure Department",
  "Street Lighting Department",
  "Parks & Horticulture Department",
  "Building & Construction Department",
  "Drainage Department",
  "Electricity Department",
  "Public Works Department",
  "Traffic & Transportation Department",
  "Solid Waste Management Department",
  "Animal Control Department",
  "Health & Hospital Services",
  "Fire & Emergency Services",
  "Environmental Department",
  "Revenue Department",
  "Urban Planning & Development Authority",
  "Public Grievance & Complaint Cell",
];

const severityLevels = ["Low", "Medium", "High"];

// --- Gemini API Configuration ---
// Leaving key blank; Canvas environment handles API key injection.
const apiKey = "AIzaSyDz7zubqFtdRWN-lC0uvair4vslk71ZPmE"; 
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

// Utility: Converts File/Blob data to Base64 string (without prefix)
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};
// ---------------------------------

const ReportPopup = ({ isOpen, onRequestClose, onReportCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Low");
  const [departments, setDepartments] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // New state for AI analysis
  const [isDeptPopupOpen, setIsDeptPopupOpen] = useState(false);

  const toggleDepartment = (dep) => {
    setDepartments((prev) =>
      prev.includes(dep) ? prev.filter((d) => d !== dep) : [...prev, dep]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      // Revoke previous blob URL if it exists
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
      // Replaced alert with console error/custom message display as per guideline
      console.error("Geolocation not supported");
      return; 
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({
          type: "Point",
          coordinates: [longitude, latitude],
        });
        // Replaced alert with console log for success
        console.log("Location captured successfully!");
      },
      () => console.error("Failed to fetch location")
    );
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
            
            // Check for transient errors (503 Service Unavailable, 429 Quota Exceeded/Rate Limit)
            if (response.status === 503 || response.status === 429) {
                attempt++;
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
                console.warn(`AI analysis failed (Status ${response.status}). Retrying in ${delay / 1000}s... (Attempt ${attempt}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // Retry the loop
            }

            if (!response.ok) {
                const errorDetail = await response.json();
                throw new Error(`AI analysis failed with status ${response.status}: ${errorDetail.error?.message || 'Unknown error'}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text) {
                setDescription(text);
                console.log("AI generated a description based on your image.");
            } else {
                console.warn("AI could not generate a description. Please enter one manually.");
            }
            return; // Success, exit function
            
        } catch (e) {
            console.error("AI Analysis Error:", e);
            // Non-transient error (like 403, 400, or network failure), stop retrying
            console.error(`AI analysis failed permanently: ${e.message}`);
            break; 
        } finally {
            setIsAnalyzing(false);
        }
    }
    
    // If loop finished without success, ensure state is clean
    setIsAnalyzing(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Check if AI Analysis is needed and run it first
    if (imageFile && !description && !isAnalyzing) {
        // If image present and description empty, run analysis. This will update state, 
        // and the function will return, waiting for the user to submit again.
        console.log("Image present but description missing. Launching AI analysis first.");
        await generateDescriptionFromImage();
        return; 
    }


    // 2. Final mandatory field check 
    if (!title || !description || !location || departments.length === 0) {
        // Log missing fields instead of alert
        console.error("Missing required fields:", { title, description, location, departments: departments.length });
        return; 
    }
    
    // 3. Proceed with submission
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description); 
      formData.append("severity", severity);
      formData.append("departments", JSON.stringify(departments));
      formData.append("location", JSON.stringify(location));
      if (imageFile) formData.append("reportImage", imageFile);

      // Using mockApi for compilation stability (Replace with 'api' in production)
      const res = await api.post("/reports", formData, {
        withCredentials: true,
      });

      console.log("Report submitted successfully!");
      onReportCreated?.(res.data.data); // Notify parent

      // Reset form
      setTitle("");
      setDescription("");
      setSeverity("Low");
      setDepartments([]);
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
      setLocation(null);
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
      {/* Main report modal */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        className="report-modal"
        overlayClassName="report-overlay"
      >
        <div className="report-popup">
          <h2>Create Report</h2>
          <form onSubmit={handleSubmit} className="report-form">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              required
              disabled={isSubmissionDisabled}
            />

            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue"
              required
              disabled={isSubmissionDisabled}
            />
            {imageFile && !description && (
                <button 
                    type="button" 
                    className="analyze-btn" 
                    onClick={generateDescriptionFromImage} 
                    disabled={isSubmissionDisabled}
                >
                    {isAnalyzing ? "Analyzing Image..." : "Auto-Fill Description (AI)"}
                </button>
            )}

            <label>Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              disabled={isSubmissionDisabled}
            >
              {severityLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            <label>Departments</label>
            <button
              type="button"
              className="select-dept-btn"
              onClick={() => setIsDeptPopupOpen(true)}
              disabled={isSubmissionDisabled}
            >
              Select Departments ({departments.length})
            </button>

            <label>Upload Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isSubmissionDisabled}
            />

            {imagePreview && (
              <div className="image-preview-container">
                <img
                  src={imagePreview}
                  alt="Selected Preview"
                  className="image-preview"
                />
              </div>
            )}

            <button
              type="button"
              className="location-btn"
              onClick={handleGetLocation}
              disabled={isSubmissionDisabled}
            >
              Get Current Location
            </button>
            {location && (
              <p className="location-info">
                ✅ Location Captured: {location.coordinates[1].toFixed(4)},{" "}
                {location.coordinates[0].toFixed(4)}
              </p>
            )}

            <div className="form-buttons">
              <button type="submit" disabled={isSubmissionDisabled}>
                {isAnalyzing ? "Analyzing..." : (loading ? "Submitting..." : "Submit Report")}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={onRequestClose}
                disabled={isSubmissionDisabled}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Departments nested modal */}
      <Modal
        isOpen={isDeptPopupOpen}
        onRequestClose={() => setIsDeptPopupOpen(false)}
        className="dept-modal"
        overlayClassName="report-overlay"
      >
        <div className="report-popup">
          <h3>Select Departments</h3>
          <div className="departments-checkboxes">
            {departmentsList.map((dep) => (
              <div key={dep}>
                <input
                  type="checkbox"
                  id={dep}
                  checked={departments.includes(dep)}
                  onChange={() => toggleDepartment(dep)}
                />
                <label htmlFor={dep}>{dep}</label>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "15px", textAlign: "right" }}>
            <button
              className="location-btn"
              onClick={() => setIsDeptPopupOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ReportPopup;
