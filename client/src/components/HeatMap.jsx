import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';
import { getAllSystemReports, getHeatmapGridData } from '../services/reportService';
import Navbar from '../components/navbar';

// Restore global L to CDN_L to ensure Leaflet plugins (leaflet.heat and markercluster)
// find L.HeatLayer and other extensions properly on the global namespace.
if (typeof window !== 'undefined' && window.CDN_L) {
    window.L = window.CDN_L;
}

const HeatMap = () => {
    const { user, loading: authLoading } = useAuth();
    const socket = useSocket();
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const heatLayerRef = useRef(null);
    const markersLayerRef = useRef(null);

    const [gridData, setGridData] = useState([]);
    const [reports, setReports] = useState([]);
    const [zoomLevel, setZoomLevel] = useState(5);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [boundsApplied, setBoundsApplied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Check if CDN Leaflet is available
    const getLeaflet = () => window.CDN_L || window.L;
    const [leafletLoaded, setLeafletLoaded] = useState(!!getLeaflet());

    // Poll for Leaflet loaded state if not immediately available
    useEffect(() => {
        if (getLeaflet()) {
            setLeafletLoaded(true);
            return;
        }
        const interval = setInterval(() => {
            if (getLeaflet()) {
                setLeafletLoaded(true);
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Fetch heatmap grid data
    const fetchGridData = useCallback(async () => {
        if (authLoading || !user) return;
        try {
            const data = await getHeatmapGridData();
            setGridData(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching grid data:", err);
            setError(err.message);
        }
    }, [user, authLoading]);

    // Fetch individual system reports for markers layer (zoom level >= 13)
    const fetchReportsData = useCallback(async () => {
        if (authLoading || !user) return;
        try {
            const data = await getAllSystemReports();
            const valid = data.filter(r => r.location?.coordinates);
            setReports(valid);
            setError(null);
        } catch (err) {
            console.error("Error fetching reports data:", err);
            setError(err.message);
        }
    }, [user, authLoading]);

    // Listen to real-time socket events
    useEffect(() => {
        if (!socket) return;
        
        const handleUpdate = () => {
            console.log("📍 HeatMap: received real-time update, fetching latest data");
            fetchGridData();
            if (zoomLevel >= 13) {
                fetchReportsData();
            }
        };

        socket.on("newReport", handleUpdate);
        socket.on("reportOverdue", handleUpdate);

        return () => {
            socket.off("newReport", handleUpdate);
            socket.off("reportOverdue", handleUpdate);
        };
    }, [socket, fetchGridData, fetchReportsData, zoomLevel]);

    // Initial load of grid data
    useEffect(() => {
        const loadInitial = async () => {
            setLoading(true);
            await fetchGridData();
            setLoading(false);
        };
        loadInitial();
    }, [fetchGridData]);

    // Fetch individual reports only when zoom is zoomed in
    useEffect(() => {
        if (zoomLevel >= 13 && reports.length === 0) {
            fetchReportsData();
        }
    }, [zoomLevel, reports.length, fetchReportsData]);

    // Setup Leaflet map instance and layers
    useEffect(() => {
        if (window.CDN_L) {
            window.L = window.CDN_L;
        }
        const L = getLeaflet();
        if (!leafletLoaded || loading || mapInstanceRef.current || !mapRef.current || !L) return;

        try {
            // Constrain map bounds to India only
            const indiaBounds = L.latLngBounds(
                [6.0, 68.0],  // Southwest coordinates
                [38.0, 98.0]  // Northeast coordinates
            );

            const map = L.map(mapRef.current, {
                zoomControl: false,
                maxBounds: indiaBounds,
                maxBoundsViscosity: 1.0,
                minZoom: 5
            }).setView([20.5937, 78.9629], 5);

            L.control.zoom({
                position: 'bottomright'
            }).addTo(map);

            // Using CartoDB Dark Matter tile layer for dark theme
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                maxZoom: 18 
            }).addTo(map);

            // Heat layer
            heatLayerRef.current = L.heatLayer([], {
                radius: 35,
                blur: 15,
                maxZoom: 13,
                gradient: {
                    0.2: '#10B981', // Green
                    0.5: '#F59E0B', // Yellow/Orange
                    1.0: '#EF4444'  // Red
                }
            }).addTo(map);

            // Marker cluster / standard layer group
            markersLayerRef.current = L.markerClusterGroup 
                ? L.markerClusterGroup({
                    showCoverageOnHover: false,
                    maxClusterRadius: 40
                  }) 
                : L.layerGroup();

            mapInstanceRef.current = map;
            setMapInitialized(true);

            // Zoom end listener
            map.on('zoomend', () => {
                setZoomLevel(map.getZoom());
            });

            setZoomLevel(map.getZoom());

        } catch (e) {
            console.error("Leaflet map initialization failed:", e);
        }
    }, [leafletLoaded, loading]);

    // Autofit bounds on initial loading of grid data
    useEffect(() => {
        if (window.CDN_L) {
            window.L = window.CDN_L;
        }
        const L = getLeaflet();
        const map = mapInstanceRef.current;
        if (map && gridData.length > 0 && !boundsApplied && L) {
            const latLngs = gridData.map(p => [p.lat, p.lng]);
            const bounds = L.latLngBounds(latLngs);
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
                setBoundsApplied(true);
            }
        }
    }, [gridData, boundsApplied]);

    // Update heatmap points when gridData changes
    useEffect(() => {
        const heatLayer = heatLayerRef.current;
        if (!heatLayer) return;

        const points = gridData.map(cell => [cell.lat, cell.lng, cell.count]);
        heatLayer.setLatLngs(points);
    }, [gridData]);

    // Update individual markers when reports changes
    useEffect(() => {
        if (window.CDN_L) {
            window.L = window.CDN_L;
        }
        const L = getLeaflet();
        const markersLayer = markersLayerRef.current;
        const map = mapInstanceRef.current;
        if (!markersLayer || !map || !L) return;

        markersLayer.clearLayers();

        reports.forEach(report => {
            const [lon, lat] = report.location.coordinates;
            let severityColor = '#10B981'; // low - emerald
            if (report.severity?.toLowerCase() === 'medium') severityColor = '#F59E0B'; // amber
            if (report.severity?.toLowerCase() === 'high') severityColor = '#F43F5E'; // rose

            const statusColors = {
                'pending': 'bg-rose-500/20 text-rose-400 border-rose-500/50',
                'in_progress': 'bg-amber-500/20 text-amber-400 border-amber-500/50',
                'resolved': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
                'closed': 'bg-slate-500/20 text-slate-400 border-slate-500/50',
                'open': 'bg-blue-500/20 text-blue-400 border-blue-500/50'
            };

            const severityClass = {
                'low': 'text-emerald-400',
                'medium': 'text-amber-400',
                'high': 'text-rose-400'
            };

            const statusCls = statusColors[report.status?.toLowerCase()] || statusColors['pending'];
            const sevCls = severityClass[report.severity?.toLowerCase()] || severityClass['low'];

            const customIcon = L.divIcon({
                className: 'bg-transparent border-none',
                html: `
                    <div class="relative group cursor-pointer w-9 h-9">
                        <div class="absolute inset-0 rounded-full animate-ping opacity-20" style="background-color: ${severityColor}"></div>
                        <div class="relative w-9 h-9 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 border-white/20 transition-transform group-hover:scale-110" style="background-color: ${severityColor}">
                            <i class="fas fa-map-marker-alt text-sm drop-shadow"></i>
                        </div>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 36]
            });

            const marker = L.marker([lat, lon], { icon: customIcon });

            const popupContent = `
                <div class="bg-slate-900/90 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-2xl min-w-[280px] font-sans !m-0">
                    <div class="flex justify-between items-center mb-3 pb-3 border-b border-slate-700/50">
                        <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${statusCls}">${report.status}</span>
                        <span class="text-[10px] font-bold uppercase tracking-wider ${sevCls}">${report.severity} Priority</span>
                    </div>
                    <h4 class="text-white font-bold text-sm mb-2 leading-tight">${report.title}</h4>
                    <p class="text-slate-400 text-xs mb-3 line-clamp-2">${report.description ? (report.description.substring(0, 100) + '...') : 'No description available'}</p>
                    <div class="flex items-center gap-2 mb-4 text-xs text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-700/30">
                        <i class="fas fa-building text-blue-400/70"></i> 
                        <span class="truncate">${report.departments.join(', ')}</span>
                    </div>
                    <div class="flex gap-2">
                        <a href="/reportDetail/${report._id}" class="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-md">
                            View Details
                        </a>
                        <a href="https://maps.google.com/?q=${lat},${lon}" target="_blank" class="flex-1 text-center py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1">
                            <i class="fas fa-directions"></i> Nav
                        </a>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent, { 
                maxWidth: 320, 
                minWidth: 280,
                className: 'custom-leaflet-popup-dark' 
            });
            markersLayer.addLayer(marker);
        });
    }, [reports]);

    // Handle zoom layer transitions (add/remove from map)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const heatLayer = heatLayerRef.current;
        const markersLayer = markersLayerRef.current;

        if (zoomLevel >= 13) {
            if (map.hasLayer(heatLayer)) {
                map.removeLayer(heatLayer);
            }
            if (!map.hasLayer(markersLayer)) {
                map.addLayer(markersLayer);
            }
        } else {
            if (map.hasLayer(markersLayer)) {
                map.removeLayer(markersLayer);
            }
            if (!map.hasLayer(heatLayer)) {
                map.addLayer(heatLayer);
            }
        }
    }, [zoomLevel]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-950 font-sans">
                <Navbar />
                <div className="flex justify-center items-center h-[80vh] flex-col gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    <p className="text-slate-400 font-medium">Fetching density data and preparing map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-x-hidden flex flex-col">
            <Navbar />
            
            <style>{`
                /* Target Leaflet specific popup containers to remove default white backgrounds */
                .custom-leaflet-popup-dark .leaflet-popup-content-wrapper,
                .custom-leaflet-popup-dark .leaflet-popup-tip {
                    background: transparent;
                    box-shadow: none;
                    padding: 0;
                }
                .custom-leaflet-popup-dark .leaflet-popup-content {
                    margin: 0;
                    width: 100% !important;
                }
                .custom-leaflet-popup-dark a.leaflet-popup-close-button {
                    color: #94a3b8;
                    padding: 8px 8px 0 0;
                    z-index: 10;
                }
                .custom-leaflet-popup-dark a.leaflet-popup-close-button:hover {
                    color: #f43f5e;
                }
            `}</style>

            <div className="flex-grow flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10">
                <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <i className="fas fa-layer-group text-purple-400"></i> Density Heatmap
                    </h1>
                    <p className="text-slate-400 mt-2">Visualization of complaints clustering and operational hot zones across India.</p>
                    {error && (
                        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg flex items-center gap-3">
                            <i className="fas fa-exclamation-circle text-rose-500"></i>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}
                </div>

                <div className="flex-grow flex flex-col glass-card p-2 md:p-3 overflow-hidden rounded-2xl border-slate-700/60 shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500">
                    <div className="w-full h-[60vh] lg:h-[70vh] rounded-xl overflow-hidden border border-slate-700/50 relative bg-slate-900 z-0">
                        <div id="map-container" ref={mapRef} className="w-full h-full z-0">
                            {!mapInitialized && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10 text-slate-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <i className="fas fa-satellite-dish text-3xl animate-pulse text-purple-400"></i>
                                        <span>Map is initializing...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Horizontal status & details bar placed below the map */}
                    <div className="mt-3 flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-3">
                            {zoomLevel < 13 ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                                    Heatmap View
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                                    Individual Pins
                                </div>
                            )}
                        </div>
                        
                        {/* Map Legend */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 drop-shadow">Low Density</span>
                            <div className="w-32 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 drop-shadow">High Density</span>
                        </div>

                        <div className="text-sm font-medium text-slate-400 hidden lg:block">
                            {zoomLevel < 13 ? (
                                <p><i className="fas fa-search-plus text-slate-500"></i> Zoom in to view details and pins.</p>
                            ) : (
                                <p><i className="fas fa-search-minus text-slate-500"></i> Zoom out to see density clusters.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Background Ambience */}
            <div className="fixed top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
        </div>
    );
};

export default HeatMap;
