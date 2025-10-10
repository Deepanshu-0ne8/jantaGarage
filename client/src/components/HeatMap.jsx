import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/authContext';
import { getAllSystemReports } from '../services/reportService';
import Navbar from '../components/navbar';
import './HeatMap.css';
import { Link } from 'react-router-dom';

const SEVERITY_OPTIONS = ['Low', 'Medium', 'High'];
const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'Resolved'];

const DEPARTMENT_OPTIONS = [
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

const ReportsFilter = ({ filters, setFilters, departmentsList }) => {
    
    const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);

    const handleSeverityChange = (e) => {
        setFilters(prev => ({ ...prev, severity: e.target.value }));
    };

    const handleStatusChange = (e) => {
        setFilters(prev => ({ ...prev, status: e.target.value }));
    };

    const handleDepartmentChange = (dept) => {
        setFilters(prev => ({ 
            ...prev, 
            departments: prev.departments.includes(dept)
                ? prev.departments.filter(d => d !== dept)
                : [...prev.departments, dept]
        }));
    };

    const handleReset = () => {
        setFilters({ severity: '', status: '', departments: [] });
    };
    
    const selectedDeptCount = filters.departments.length;
    const departmentToggleText = selectedDeptCount > 0 ? `${selectedDeptCount} Selected` : 'Filter by Department';

    return (
        <div className="reports-filter-bar">
            <div className="filter-group">
                <label className="filter-label">Severity</label>
                <select value={filters.severity} onChange={handleSeverityChange}>
                    <option value="">All</option>
                    {SEVERITY_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
            
            <div className="filter-group">
                <label className="filter-label">Status</label>
                <select value={filters.status} onChange={handleStatusChange}>
                    <option value="">All</option>
                    {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
            
            <div className="filter-group department-filter-group">
                <label className="filter-label">Department</label>
                <button 
                    type="button"
                    className={`filter-dropdown-toggle ${isDeptDropdownOpen ? 'active' : ''}`}
                    onClick={() => setIsDeptDropdownOpen(prev => !prev)}
                >
                    {departmentToggleText}
                </button>
                
                {isDeptDropdownOpen && (
                    <div className="department-dropdown">
                        {departmentsList.map(d => (
                            <div key={d} className="dropdown-item" onClick={() => handleDepartmentChange(d)}>
                                <input
                                    type="checkbox"
                                    checked={filters.departments.includes(d)}
                                    readOnly 
                                />
                                {d}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <button className="reset-filter-btn" onClick={handleReset}>
                Reset Filters
            </button>
        </div>
    );
};


const ReportListCard = ({ report }) => {
    const statusClass = report.status?.toLowerCase().replace(/_/g, '-') || 'pending';
    const severityClass = report.severity?.toLowerCase() || 'low';
    const reportDate = new Date(report.createdAt).toLocaleDateString();

    return (
        <div className="list-report-card">
            <div className="card-top-info">
                <span className={`status-badge status-${statusClass}`}>{report.status}</span>
                <span className={`severity-chip severity-${severityClass}`}>{report.severity}</span>
            </div>
            <h4 className="card-list-title">{report.title}</h4>
            <p className="card-list-date">Filed: {reportDate}</p>
            <p className="card-list-depts">Depts: {report.departments.slice(0, 2).join(', ')}...</p>
            <Link to={`/reports/get/${report._id}`} className="card-list-link">View Details <i className="fas fa-arrow-right"></i></Link>
        </div>
    );
};


const HeatMap = () => {
    const { user, loading: authLoading } = useAuth();
    const mapRef = useRef(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    
    const [reportsToShow, setReportsToShow] = useState(10);
    const [filters, setFilters] = useState({ severity: '', status: '', departments: [] });

    const fetchReports = useCallback(async () => {
        if (authLoading || !user) return;
        setLoading(true);
        try {
            const fetchedReports = await getAllSystemReports();
            
            const sortedReports = fetchedReports
                .filter(r => r.location?.coordinates)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
            setReports(sortedReports); 
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, authLoading]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const filteredReports = reports.filter(report => {
        const severityMatch = filters.severity ? report.severity === filters.severity : true;
        const statusMatch = filters.status ? report.status === filters.status : true;
        
        const departmentMatch = filters.departments.length > 0 
            ? report.departments.some(dept => filters.departments.includes(dept))
            : true;

        return severityMatch && statusMatch && departmentMatch;
    });

    useEffect(() => {
        if (!reports.length || !window.L || mapInitialized) return;

        try {
            const map = window.L.map(mapRef.current, {
                zoomControl: false 
            }).setView([20.5937, 78.9629], 5);

            window.L.control.zoom({
                position: 'bottomright'
            }).addTo(map);

            window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                maxZoom: 18 
            }).addTo(map);

            const markers = window.L.markerClusterGroup ? window.L.markerClusterGroup() : window.L.layerGroup();

            reports.forEach(report => {
                const [lon, lat] = report.location.coordinates;
                
                const severityClass = report.severity ? `severity-${report.severity.toLowerCase()}` : 'severity-low';
                
                const customIcon = window.L.divIcon({
                    className: `report-marker-icon ${severityClass}`,
                    html: `<i class="fas fa-map-marker-alt"></i>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30]
                });

                const marker = window.L.marker([lat, lon], { icon: customIcon });

                const popupContent = `
                    <div class="map-popup-content">
                        <h4 class="popup-title">${report.title}</h4>
                        <p><strong>Status:</strong> ${report.status}</p>
                        <p><strong>Severity:</strong> <span class="popup-${severityClass}">${report.severity}</span></p>
                        <p><strong>Departments:</strong> ${report.departments.join(', ')}</p>
                        <p class="map-link-btn-wrapper">
                             <a href="https://maps.google.com/?q=${lat},${lon}" target="_blank" class="map-link-btn">View on Google Maps</a>
                        </p>
                    </div>
                `;
                marker.bindPopup(popupContent);
                markers.addLayer(marker);
            });

            map.addLayer(markers);
            
            if (reports.length > 0) {
                const bounds = markers.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            }

            setMapInitialized(true);

        } catch (e) {
            console.error("Leaflet initialization failed:", e);
        }
    }, [reports, mapInitialized]);


    const totalReports = reports.length;
    const currentReportsCount = filteredReports.length;
    const isListTruncated = reportsToShow < currentReportsCount;

    if (authLoading || loading) {
        return (
            <>
                <Navbar />
                <div className="map-page-container loading-state">Fetching data and preparing map...</div>
            </>
        );
    }
    
    const isAuthorized = user && (user.role === 'Admin' || user.role === 'Staff' || user.role === 'citizen');
    if (!isAuthorized) {
         return (
            <>
                <Navbar />
                <div className="map-page-container access-denied">
                    <h2>Access Denied</h2>
                    <p>You must be a Staff or Admin user to view the full system map.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            
            <div className="map-wrapper">
                <header className="map-header">
                    <h1>System Complaints Density Map</h1>
                    <p>Visualization of **{totalReports} total reports**. Zoom in to see individual pins and identify priority clusters.</p>
                    {error && <div className="status-alert alert-error">{error}</div>}
                    {!window.L && <div className="status-alert alert-error">Map library (Leaflet) failed to load. Please ensure dependencies are included in index.html.</div>}
                </header>

                <div id="map-container" ref={mapRef} className="map-content">
                    {!mapInitialized && <p className="map-fallback">Map is initializing...</p>}
                </div>
                
                <section className="reports-list-section">
                    <h2 className="reports-list-title">Browse Reports ({currentReportsCount})</h2>
                    
                    <ReportsFilter filters={filters} setFilters={setFilters} departmentsList={DEPARTMENT_OPTIONS} />
                    
                    <div className="report-list-scroll-container">
                        <div className="report-list-grid">
                            {currentReportsCount > 0 ? (
                                filteredReports.slice(0, reportsToShow).map(report => (
                                    <ReportListCard key={report._id} report={report} />
                                ))
                            ) : (
                                <p className="no-reports-match">No reports match the current filters.</p>
                            )}
                        </div>
                    </div>
                    
                    {isListTruncated && (
                        <button 
                            className="view-all-reports-btn"
                            onClick={() => setReportsToShow(currentReportsCount)}
                        >
                            View All {currentReportsCount} Reports <i className="fas fa-arrow-down"></i>
                        </button>
                    )}
                </section>
            </div>
        </>
    );
};

export default HeatMap;
