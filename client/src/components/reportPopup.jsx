import React, { useState } from "react";
import Modal from "react-modal";
import "./reportPopup.css";
import api from "../api/axios";

Modal.setAppElement("#root");

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

const ReportPopup = ({ isOpen, onRequestClose, onReportCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Low");
  const [departments, setDepartments] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
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
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview("");
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      return alert("Geolocation not supported");
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({
          type: "Point",
          coordinates: [longitude, latitude],
        });
        alert("Location captured!");
      },
      () => alert("Failed to fetch location")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !location || departments.length === 0) {
      return alert(
        "Please fill all required fields and select at least one department"
      );
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

      alert("✅ Report submitted successfully!");
      onReportCreated?.(res.data.data); // Notify parent

      // Reset form
      setTitle("");
      setDescription("");
      setSeverity("Low");
      setDepartments([]);
      setImageFile(null);
      setImagePreview("");
      setLocation(null);
      onRequestClose();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            />

            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue"
              required
            />

            <label>Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
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
              className="location-btn"
              onClick={() => setIsDeptPopupOpen(true)}
            >
              Select Departments ({departments.length})
            </button>

            <label>Upload Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
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
              <button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Report"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={onRequestClose}
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
        className="report-modal"
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
