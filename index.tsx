import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { QRCodeSVG } from "https://esm.sh/qrcode.react@3.1.0";
import { 
  Clapperboard, 
  Plus, 
  Trash2, 
  Download, 
  LogOut, 
  MapPin, 
  Calendar,
  Wallet,
  MoreVertical,
  Search,
  CheckCircle2,
  QrCode,
  ArrowRight,
  Crosshair,
  Edit2,
  Save,
  Archive,
  X
} from "lucide-react";

// ==========================================
// 1. الأنواع وتعريف البيانات (Types & Schema)
// ==========================================

interface GeoLocation {
  lat: number;
  lng: number;
}

interface Project {
  id: string;
  name: string;
  locationName: string;
  geo: GeoLocation | null;
  budget: number;
  creationDate: string;
  createdAt: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

// ==========================================
// 2. خدمات إدارة البيانات (Data Services)
// ==========================================

const ProjectService = {
  /**
   * استرجاع قائمة المشاريع من التخزين المحلي
   * listProjects()
   */
  listProjects: (): Project[] => {
    try {
      const data = localStorage.getItem('breakapp_projects');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("فشل في استرجاع المشاريع", e);
      return [];
    }
  },
  
  /**
   * إنشاء مشروع جديد وحفظه
   * createProject()
   */
  createProject: (name: string, budget: number, locationName: string, geo: GeoLocation | null, creationDate: string): Project[] => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      locationName,
      geo,
      budget,
      creationDate,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE'
    };

    const projects = ProjectService.listProjects();
    const updated = [newProject, ...projects];
    localStorage.setItem('breakapp_projects', JSON.stringify(updated));
    return updated;
  },

  /**
   * تحديث بيانات المشروع
   * updateProject(id, updates)
   */
  updateProject: (id: string, updates: Partial<Project>): Project[] => {
      const projects = ProjectService.listProjects();
      const updated = projects.map(p => {
          if (p.id === id) {
              return { ...p, ...updates };
          }
          return p;
      });
      localStorage.setItem('breakapp_projects', JSON.stringify(updated));
      return updated;
  },

  /**
   * تعيين موقع جغرافي لمشروع موجود
   * setProjectLocation(projectId, lat, lng)
   */
  setProjectLocation: (projectId: string, lat: number, lng: number): Project[] => {
      return ProjectService.updateProject(projectId, { geo: { lat, lng } });
  },

  /**
   * الحصول على موقع المشروع
   * getProjectLocation(projectId)
   */
  getProjectLocation: (projectId: string): GeoLocation | null => {
      const projects = ProjectService.listProjects();
      const project = projects.find(p => p.id === projectId);
      return project?.geo || null;
  },

  /**
   * حذف مشروع بواسطة المعرف
   * deleteProject(id)
   */
  deleteProject: (id: string): Project[] => {
    const projects = ProjectService.listProjects().filter(p => p.id !== id);
    localStorage.setItem('breakapp_projects', JSON.stringify(projects));
    return projects;
  }
};

// ==========================================
// 3. مكونات الخرائط (Map Components)
// ==========================================

const LocationMap = ({ 
  mode, 
  initialGeo, 
  onLocationSelect 
}: { 
  mode: 'PICK' | 'VIEW', 
  initialGeo?: GeoLocation | null, 
  onLocationSelect?: (lat: number, lng: number) => void 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  // 1. Initialize Map Logic (Run Once)
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Check if Leaflet is loaded
    const L = (window as any).L;
    if (!L) {
      console.error("Leaflet not loaded");
      return;
    }

    if (!mapInstance.current) {
      const startLat = initialGeo?.lat || 30.0444;
      const startLng = initialGeo?.lng || 31.2357;
      const zoomLevel = initialGeo ? 15 : 12;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([startLat, startLng], zoomLevel);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      
      mapInstance.current = map;
    }

    return () => {
       if (mapInstance.current) {
           mapInstance.current.remove();
           mapInstance.current = null;
           markerInstance.current = null;
       }
    }
  }, []); 

  // 2. Update Marker & View when initialGeo changes
  useEffect(() => {
     if (mapInstance.current && initialGeo) {
         const L = (window as any).L;
         const goldIcon = L.icon({
             iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
             shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
             iconSize: [25, 41],
             iconAnchor: [12, 41],
             popupAnchor: [1, -34],
             shadowSize: [41, 41]
         });

         if (!markerInstance.current) {
             markerInstance.current = L.marker([initialGeo.lat, initialGeo.lng], { icon: goldIcon }).addTo(mapInstance.current);
         } else {
             markerInstance.current.setLatLng([initialGeo.lat, initialGeo.lng]);
         }

         if (mode === 'VIEW') {
             mapInstance.current.setView([initialGeo.lat, initialGeo.lng]);
         }
     }
  }, [initialGeo, mode]);

  // 3. Handle Click Events (Re-bind when mode changes)
  useEffect(() => {
      if (!mapInstance.current) return;
      const map = mapInstance.current;
      const L = (window as any).L;

      const handleMapClick = (e: any) => {
          if (mode === 'PICK') {
              const { lat, lng } = e.latlng;
              const goldIcon = L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
              });
              
              if (markerInstance.current) {
                  markerInstance.current.setLatLng([lat, lng]);
              } else {
                  markerInstance.current = L.marker([lat, lng], { icon: goldIcon }).addTo(map);
              }
              
              if (onLocationSelect) onLocationSelect(lat, lng);
          }
      };

      map.on('click', handleMapClick);

      return () => {
          map.off('click', handleMapClick);
      };
  }, [mode, onLocationSelect]);

  return <div ref={mapRef} className="w-full h-full z-0 relative bg-[#121214]" />;
}

// ==========================================
// 4. مكونات لوحة التحكم (Admin Components)
// ==========================================

const AdminDashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<'LIST' | 'CREATE' | 'DETAILS'>('LIST');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // تحميل المشاريع
  useEffect(() => {
    setProjects(ProjectService.listProjects());
  }, []);

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>, geo: GeoLocation | null) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get('name') as string;
    const locationName = formData.get('locationName') as string;
    const budget = Number(formData.get('budget'));
    const creationDate = formData.get('creationDate') as string;

    let finalGeo = geo;

    if (!finalGeo) {
        // إذا لم يتم تحديد موقع، استخدم الموقع الحالي أو القاهرة
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error("Geolocation not supported"));
                    return;
                }
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            finalGeo = { lat: position.coords.latitude, lng: position.coords.longitude };
        } catch (err) {
            console.warn("Geolocation failed or denied, using default Cairo location.", err);
            finalGeo = { lat: 30.0444, lng: 31.2357 }; // Cairo
        }
    }

    const updatedList = ProjectService.createProject(name, budget, locationName, finalGeo, creationDate);
    
    setProjects(updatedList);
    setActiveProject(updatedList[0]); 
    setView('DETAILS');
  };

  const handleUpdateLocation = (projectId: string, lat: number, lng: number) => {
      const updatedList = ProjectService.setProjectLocation(projectId, lat, lng);
      setProjects(updatedList);
      const updatedProject = updatedList.find(p => p.id === projectId) || null;
      setActiveProject(updatedProject);
  };

  const handleUpdateDetails = (projectId: string, updates: Partial<Project>) => {
      const updatedList = ProjectService.updateProject(projectId, updates);
      setProjects(updatedList);
      const updatedProject = updatedList.find(p => p.id === projectId) || null;
      setActiveProject(updatedProject);
  };

  const handleArchive = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if(confirm('هل أنت متأكد من أرشفت هذا المشروع؟')) {
        const updatedList = ProjectService.updateProject(id, { status: 'ARCHIVED' });
        setProjects(updatedList);
        if (activeProject?.id === id) {
            const updatedProject = updatedList.find(p => p.id === id) || null;
            setActiveProject(updatedProject);
        }
    }
  };

  const handleDelete = (id: string) => {
    if(confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
      const updated = ProjectService.deleteProject(id);
      setProjects(updated);
      if (activeProject?.id === id) {
        setView('LIST');
        setActiveProject(null);
      }
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("project-qr");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width + 80;
      canvas.height = img.height + 80;
      if(ctx) {
          ctx.fillStyle = "#09090b"; 
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.strokeStyle = "#d4b483";
          ctx.lineWidth = 10;
          ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

          ctx.drawImage(img, 40, 40);
          
          ctx.font = "bold 24px Arial";
          ctx.fillStyle = "#d4b483";
          ctx.textAlign = "center";
          if (activeProject) {
              ctx.fillText(activeProject.name, canvas.width / 2, canvas.height - 20);
          }

          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = `BreakApp-${activeProject?.name || 'QR'}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  // --- المكونات الفرعية (Sub-Views) ---

  const ProjectListView = () => (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-end mb-6">
        <div>
           <h2 className="text-[#d4b483] text-xs font-bold uppercase tracking-widest mb-1">Production Hub</h2>
           <h1 className="text-2xl text-white font-serif-en">My Projects</h1>
        </div>
        <button 
          onClick={() => setView('CREATE')}
          className="bg-[#d4b483] text-black hover:bg-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(212,180,131,0.3)]"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-sm p-12 text-center bg-zinc-900/20">
            <Clapperboard className="mx-auto text-zinc-700 mb-4" size={48} />
            <h3 className="text-zinc-400 font-bold">No Active Productions</h3>
            <p className="text-zinc-600 text-xs mt-2">Create your first project to generate access codes.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map(p => {
             const isArchived = p.status === 'ARCHIVED';
             return (
                <div 
                  key={p.id} 
                  onClick={() => { setActiveProject(p); setView('DETAILS'); }}
                  className={`group border p-4 rounded-sm cursor-pointer transition-all relative overflow-hidden 
                  ${isArchived 
                    ? 'bg-zinc-900/40 border-zinc-800 opacity-60 grayscale-[0.8]' 
                    : 'bg-[#121214] border-zinc-800 hover:border-[#d4b483]/50'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${isArchived ? 'bg-zinc-600' : 'bg-[#d4b483]'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  
                  {isArchived && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded">
                        Archived
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`text-lg font-serif-en transition-colors ${isArchived ? 'text-zinc-400' : 'text-white group-hover:text-[#d4b483] font-bold'}`}>{p.name}</h3>
                      <div className="flex items-center gap-3 mt-2 text-zinc-500 text-xs">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {p.locationName}</span>
                        <span className="flex items-center gap-1"><Wallet size={12} /> EGP {p.budget.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                         {!isArchived && (
                             <button onClick={(e) => handleArchive(p.id, e)} className="text-zinc-600 hover:text-[#d4b483] transition-colors p-1" title="Archive">
                                <Archive size={16} />
                             </button>
                         )}
                         <MoreVertical size={16} className="text-zinc-600" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                     <span className="text-[10px] text-zinc-600 font-mono">Started: {p.creationDate}</span>
                     <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${isArchived ? 'bg-zinc-800/50 text-zinc-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isArchived ? 'bg-zinc-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                        {p.status}
                     </span>
                  </div>
                </div>
             );
          })}
        </div>
      )}
    </div>
  );

  const CreateProjectView = () => {
    const [selectedGeo, setSelectedGeo] = useState<GeoLocation | null>(null);
    const [isLoadingLoc, setIsLoadingLoc] = useState(false);

    return (
        <div className="h-full flex flex-col animate-fade-in pb-10">
            <div className="mb-4 border-l-2 border-[#d4b483] pl-4">
                <h2 className="text-[#d4b483] text-xs font-bold uppercase tracking-widest mb-1">New Production</h2>
                <h1 className="text-3xl text-white font-serif-en">Setup Details</h1>
            </div>

            <form onSubmit={(e) => {
                setIsLoadingLoc(true);
                handleCreateProject(e, selectedGeo).finally(() => setIsLoadingLoc(false));
            }} className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Project Name</label>
                    <input required name="name" type="text" placeholder="e.g. Ramadan TVC 2024" className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white focus:border-[#d4b483] outline-none rounded-sm transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Start Date</label>
                        <input required name="creationDate" type="date" className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white focus:border-[#d4b483] outline-none rounded-sm transition-colors [color-scheme:dark]" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Budget (EGP)</label>
                        <input required name="budget" type="number" placeholder="50000" className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white focus:border-[#d4b483] outline-none rounded-sm transition-colors" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Location Name</label>
                    <input required name="locationName" type="text" placeholder="e.g. Studio Misr, Giza" className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white focus:border-[#d4b483] outline-none rounded-sm transition-colors" />
                </div>
                
                {/* Map Section */}
                <div className="space-y-2 flex-1 flex flex-col">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold flex items-center gap-2">
                         <Crosshair size={14} className="text-[#d4b483]"/>
                         Pin Location on Map
                    </label>
                    <div className="flex-1 w-full bg-zinc-900 border border-zinc-700 rounded-sm overflow-hidden relative min-h-[200px]">
                        <LocationMap 
                            mode="PICK" 
                            onLocationSelect={(lat, lng) => setSelectedGeo({lat, lng})}
                        />
                        {!selectedGeo && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none z-[1000]">
                                <span className="text-white text-xs bg-black/80 px-3 py-1 rounded">Click map to set location</span>
                            </div>
                        )}
                    </div>
                    {selectedGeo ? (
                        <div className="text-[10px] text-[#d4b483] font-mono flex justify-end">
                            {selectedGeo.lat.toFixed(6)}, {selectedGeo.lng.toFixed(6)}
                        </div>
                    ) : (
                        <div className="text-[10px] text-zinc-500 font-mono flex justify-end">
                            * Auto-detect if skipped
                        </div>
                    )}
                </div>

                <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setView('LIST')} className="flex-1 py-4 border border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">Cancel</button>
                    <button type="submit" disabled={isLoadingLoc} className="flex-[2] bg-[#d4b483] text-black hover:bg-white py-4 text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(212,180,131,0.2)] transition-all flex justify-center items-center gap-2">
                        {isLoadingLoc ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                Locating...
                            </>
                        ) : "Initialize Project"}
                    </button>
                </div>
            </form>
        </div>
    );
  };

  const ProjectDetailsView = () => {
    if (!activeProject) return null;
    const [isEditingMap, setIsEditingMap] = useState(false);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [tempMapGeo, setTempMapGeo] = useState<GeoLocation | null>(null);
    
    // Edit Form State
    const [editName, setEditName] = useState(activeProject.name);
    const [editLocationName, setEditLocationName] = useState(activeProject.locationName);
    const [editBudget, setEditBudget] = useState(activeProject.budget);

    // Sync state if activeProject changes
    useEffect(() => {
        setEditName(activeProject.name);
        setEditLocationName(activeProject.locationName);
        setEditBudget(activeProject.budget);
    }, [activeProject]);
    
    const qrPayload = JSON.stringify({
        id: activeProject.id,
        name: activeProject.name,
        geo: activeProject.geo,
        type: "BREAKAPP_PROJECT_ACCESS"
    });

    const isArchived = activeProject.status === 'ARCHIVED';

    const saveDetails = () => {
        handleUpdateDetails(activeProject.id, {
            name: editName,
            locationName: editLocationName,
            budget: editBudget
        });
        setIsEditingDetails(false);
    };

    const handleMapEditToggle = () => {
        if (isEditingMap) {
            // Save Action
            if (tempMapGeo) {
                if(confirm("Confirm update to project location?")) {
                    handleUpdateLocation(activeProject.id, tempMapGeo.lat, tempMapGeo.lng);
                }
            }
            setIsEditingMap(false);
            setTempMapGeo(null);
        } else {
            // Start Edit Action
            setTempMapGeo(activeProject.geo);
            setIsEditingMap(true);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in pb-6">
             <header className="flex justify-between items-start mb-4">
                <button onClick={() => setView('LIST')} className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest flex items-center gap-1 transition-colors">
                    <ArrowRight className="rotate-180" size={14} /> Back to List
                </button>
                <div className="flex gap-3">
                     {!isArchived && (
                        <button onClick={(e) => handleArchive(activeProject.id, e)} className="text-zinc-500 hover:text-[#d4b483] transition-colors" title="Archive Project">
                            <Archive size={16} />
                        </button>
                     )}
                     <button onClick={() => handleDelete(activeProject.id)} className="text-red-900 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
             </header>

             <div className="grid grid-cols-1 gap-4 mb-4">
                 <div className="bg-[#121214] border border-zinc-800 p-6 rounded-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Clapperboard size={60} />
                    </div>
                    
                    {/* Header Controls */}
                    {!isArchived && (
                        <div className="absolute top-4 right-4 z-20">
                            {isEditingDetails ? (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditingDetails(false)} className="text-zinc-500 hover:text-white"><X size={14}/></button>
                                    <button onClick={saveDetails} className="text-[#d4b483] hover:text-white"><Save size={14}/></button>
                                </div>
                            ) : (
                                <button onClick={() => setIsEditingDetails(true)} className="text-zinc-600 hover:text-[#d4b483]">
                                    <Edit2 size={14} />
                                </button>
                            )}
                        </div>
                    )}

                    {isEditingDetails ? (
                        <div className="space-y-3 relative z-10 pr-6">
                            <input 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-zinc-900/50 border-b border-[#d4b483] text-white text-xl font-serif-en outline-none py-1"
                                placeholder="Project Name"
                            />
                             <div className="flex gap-2">
                                <input 
                                    value={editLocationName}
                                    onChange={(e) => setEditLocationName(e.target.value)}
                                    className="w-1/2 bg-zinc-900/50 border-b border-zinc-700 focus:border-[#d4b483] text-xs text-zinc-300 outline-none py-1"
                                    placeholder="Location"
                                />
                                <input 
                                    type="number"
                                    value={editBudget}
                                    onChange={(e) => setEditBudget(Number(e.target.value))}
                                    className="w-1/2 bg-zinc-900/50 border-b border-zinc-700 focus:border-[#d4b483] text-xs text-zinc-300 outline-none py-1"
                                    placeholder="Budget"
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-serif-en text-white mb-2 relative z-10 pr-6">{activeProject.name}</h1>
                            <div className="flex gap-4 text-xs text-zinc-500 font-mono relative z-10">
                                <span className="flex items-center gap-1"><MapPin size={12}/> {activeProject.locationName}</span>
                                <span className="flex items-center gap-1"><Calendar size={12}/> {activeProject.creationDate}</span>
                            </div>
                            <div className="mt-2 text-xs text-zinc-600 font-mono relative z-10">
                                Budget: EGP {activeProject.budget.toLocaleString()}
                            </div>
                        </>
                    )}
                 </div>

                 {/* Map View / Edit */}
                 <div className="h-40 bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden relative">
                     <LocationMap 
                         mode={isEditingMap ? 'PICK' : 'VIEW'} 
                         initialGeo={isEditingMap && tempMapGeo ? tempMapGeo : activeProject.geo}
                         onLocationSelect={(lat, lng) => {
                             if(isEditingMap) {
                                 setTempMapGeo({lat, lng});
                             }
                         }}
                     />
                     {!isArchived && (
                        <button 
                            onClick={handleMapEditToggle}
                            className={`absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded z-[1000] font-mono flex items-center gap-1 transition-colors ${isEditingMap ? 'bg-emerald-500 text-white' : 'bg-black/80 text-[#d4b483] hover:bg-[#d4b483] hover:text-black'}`}
                        >
                            {isEditingMap ? <Save size={10} /> : <Edit2 size={10} />}
                            {isEditingMap ? "SAVE LOCATION" : "EDIT LOCATION"}
                        </button>
                     )}
                 </div>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-900/30 border border-zinc-800 rounded-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <span className={`text-black text-[9px] font-bold px-2 py-1 uppercase tracking-widest ${isArchived ? 'bg-zinc-500' : 'bg-[#d4b483]'}`}>
                        {isArchived ? 'ARCHIVED' : 'Admin Access'}
                    </span>
                </div>

                <div className={`bg-white p-4 rounded-sm shadow-2xl mb-4 scale-100 transition-transform duration-300 ${!isArchived ? 'hover:scale-105' : 'grayscale opacity-70'}`}>
                    <QRCodeSVG 
                        id="project-qr"
                        value={qrPayload}
                        size={180}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                    <QrCode size={16} className="text-[#d4b483]" />
                    {isArchived ? 'Project Archived' : 'Scan to Join'}
                </h3>
                <p className="text-zinc-500 text-xs text-center max-w-[200px] mb-6">
                    {isArchived ? 'This project is closed. Access codes may no longer be valid.' : 'Direct Crew members and Logistics Runners to scan this code via the BreakApp Scanner.'}
                </p>

                <button 
                    onClick={downloadQR}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-[#d4b483] hover:text-black text-white px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest transition-all w-full justify-center border border-zinc-700 hover:border-[#d4b483]"
                >
                    <Download size={16} /> Export PNG
                </button>
             </div>
        </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-screen bg-[#09090b] text-[#fafafa] shadow-2xl overflow-hidden border-x border-zinc-800 flex flex-col">
        {/* App Header */}
        <header className="p-5 border-b border-white/5 bg-[#09090b]/80 backdrop-blur flex justify-between items-center z-20">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-[#d4b483] flex items-center justify-center rounded-sm bg-[#09090b]">
                    <span className="font-serif-en font-bold text-[#d4b483] text-lg">B</span>
                </div>
                <div>
                    <h1 className="font-bold text-sm tracking-[0.2em] uppercase text-zinc-300">BreakApp</h1>
                    <span className="text-[8px] text-[#d4b483] border border-[#d4b483]/30 px-1 rounded">ADMIN V1.0</span>
                </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-5 relative z-10 scrollbar-hide">
             {view === 'LIST' && <ProjectListView />}
             {view === 'CREATE' && <CreateProjectView />}
             {view === 'DETAILS' && <ProjectDetailsView />}
        </main>
    </div>
  );
};

// ==========================================
// 5. تشغيل التطبيق (App Mount)
// ==========================================

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<AdminDashboard />);
}