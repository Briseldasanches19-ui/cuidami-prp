
import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Users, Calendar as CalendarIcon, Settings, LogOut, 
  FileText, Plus, Search, AlertCircle, Save, Stethoscope, 
  Clipboard, HeartPulse, User as UserIcon, Shield, Baby, FilePlus, ChevronRight,
  Trash2, X, CheckCircle, Printer, Thermometer, Syringe, BedDouble, AlertTriangle, FileSignature, Sparkles, Droplet, Palette, RefreshCw, Image as ImageIcon,
  Wifi, WifiOff, QrCode, ClipboardList, Menu, MessageSquare, Send, Camera, Paperclip, File as FileIcon
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { Role, Specialty, User, Patient, AppState, AuditLog, Note, VitalSigns, Appointment, AppSettings, Vaccine, Procedure, Document } from './types';
import { generatePatientSummary } from './services/geminiService';

// --- CONFIGURACIÓN INICIAL ---
const INITIAL_SETTINGS: AppSettings = {
  centerName: 'Cuidami Pro',
  logoUrl: '',
  primaryColor: '#0d9488', // Teal-600 default
  secondaryColor: '#4f46e5', // Indigo-600 default
  darkMode: false
};

// --- UTILS ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const getAge = (dob: string) => {
  if (!dob) return 0;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

// --- LOGICA MEDICA AVANZADA (PARTE 6) ---

// Alertas Inteligentes
const getMedicalAlerts = (patient: Patient): string[] => {
    const alerts: string[] = [];
    const lastVital = patient.vitals[patient.vitals.length - 1];
    const age = getAge(patient.dob);

    if (lastVital) {
        // Fiebre
        if (lastVital.temp >= 38) alerts.push("ALERTA: Fiebre detectada (" + lastVital.temp + "°C)");
        
        // Hipertensión (Simplificada)
        if (age > 18 && lastVital.bpSystolic > 140) alerts.push("ALERTA: Crisis Hipertensiva Posible");
        
        // Desaturación
        if (lastVital.oxygenSat < 92) alerts.push("PELIGRO: Desaturación de Oxígeno (" + lastVital.oxygenSat + "%)");
        
        // Taquicardia
        if (lastVital.heartRate > 100) alerts.push("ALERTA: Taquicardia");
    }

    // Alertas por condición
    if (patient.allergies.length > 0) alerts.push("PACIENTE ALÉRGICO: Revisar historial");
    
    // Alertas Pediátricas
    if (age < 5 && (!patient.vaccines || patient.vaccines.length === 0)) alerts.push("PENDIENTE: Revisión de Vacunas");

    return alerts;
};

// --- COMPONENTS ---

const OfflineIndicator = ({ isOffline }: { isOffline: boolean }) => {
    if (!isOffline) return null;
    return (
        <div className="bg-red-500 text-white text-xs font-bold text-center py-1 flex items-center justify-center space-x-2 fixed top-0 w-full z-[100]">
            <WifiOff size={14} />
            <span>MODO OFFLINE: Sin conexión. Datos guardados localmente.</span>
        </div>
    );
};

// 1. Sidebar Adaptativo (Responsive)
const Sidebar = ({ user, activeView, setView, onLogout, settings, isOpen, onClose }: { user: User, activeView: string, setView: (v: any) => void, onLogout: () => void, settings: AppSettings, isOpen: boolean, onClose: () => void }) => (
  <>
    {/* Overlay for mobile */}
    {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose}></div>
    )}
    
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white shadow-xl transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:h-screen flex flex-col print:hidden`}>
        <div className="p-6 border-b border-slate-700 flex items-center space-x-3 mt-4 relative">
            <button onClick={onClose} className="absolute top-2 right-2 md:hidden text-slate-400"><X size={20}/></button>
            <div 
                className="p-2 rounded-lg shadow-lg overflow-hidden flex items-center justify-center w-10 h-10 bg-white shrink-0"
            >
                {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                    <Activity className="w-6 h-6" style={{ color: settings.primaryColor }} />
                )}
            </div>
            <div className="overflow-hidden">
                <h1 className="text-lg font-bold tracking-tight truncate w-36" title={settings.centerName}>{settings.centerName}</h1>
                <p className="text-[10px] text-slate-400">Tu salud en las mejores manos</p>
            </div>
        </div>

        <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-white border border-slate-600" style={{ borderColor: settings.secondaryColor }}>
            {user.name.charAt(0)}
            </div>
            <div>
            <p className="text-sm font-medium truncate w-32 text-white">{user.name}</p>
            <p className="text-xs text-slate-400 truncate w-32 opacity-80">{user.role === Role.DOCTOR ? 'Doctor(a)' : 'Enfermero(a)'}</p>
            </div>
        </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <SidebarItem icon={<Activity />} label="Dashboard" active={activeView === 'DASHBOARD'} onClick={() => { setView('DASHBOARD'); onClose(); }} color={settings.primaryColor} />
            <SidebarItem icon={<Users />} label="Pacientes" active={activeView === 'PATIENTS' || activeView === 'PATIENT_DETAIL'} onClick={() => { setView('PATIENTS'); onClose(); }} color={settings.primaryColor} />
            <SidebarItem icon={<MessageSquare />} label="Chat Médico" active={activeView === 'CHAT'} onClick={() => { setView('CHAT'); onClose(); }} color={settings.primaryColor} />
            <SidebarItem icon={<Settings />} label="Configuración" active={activeView === 'SETTINGS'} onClick={() => { setView('SETTINGS'); onClose(); }} color={settings.primaryColor} />
        </nav>

        <div className="p-4 bg-slate-900 border-t border-slate-800">
            <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-sm transition-colors text-slate-300 hover:text-white border border-slate-700 mb-4">
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
            </button>
            
            <div className="text-[10px] text-slate-500 text-center leading-tight space-y-1">
                <p className="font-semibold text-slate-400">Cuidami Pro © {new Date().getFullYear()}</p>
                <div className="pt-2 border-t border-slate-800 mt-2">
                    <p>Creado por:</p>
                    <p className="font-bold text-slate-300">George Emmanuel Almonte Sanchez</p>
                    <p>Todos los derechos reservados</p>
                </div>
            </div>
        </div>
    </div>
  </>
);

const SidebarItem = ({ icon, label, active, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${active ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    style={active ? { backgroundColor: color, boxShadow: `0 4px 6px -1px ${color}40` } : {}}
  >
    {React.cloneElement(icon, { size: 20 })}
    <span className="font-medium">{label}</span>
  </button>
);

// 2. Modals

const EmergencyCardModal = ({ patient, onClose, settings }: { patient: Patient, onClose: () => void, settings: AppSettings }) => (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in print:bg-white print:absolute print:inset-0">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative print:shadow-none print:w-full">
            <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-red-200 print:hidden"><X size={24}/></button>
            
            {/* Header Tarjeta */}
            <div className="p-6 text-center text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}>
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <Activity size={200} className="absolute -left-10 -top-10"/>
                </div>
                <h2 className="text-2xl font-bold relative z-10 mb-1">TARJETA DE EMERGENCIA</h2>
                <p className="text-sm opacity-90 relative z-10">{settings.centerName}</p>
            </div>

            <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                     <div className="w-24 h-24 rounded-full border-4 border-slate-100 flex items-center justify-center text-4xl font-bold text-white shadow-lg shrink-0" style={{ backgroundColor: patient.gender === 'F' ? '#f472b6' : '#60a5fa' }}>
                        {patient.fullName.charAt(0)}
                     </div>
                     <div>
                         <h3 className="text-xl font-bold text-slate-900 leading-tight">{patient.fullName}</h3>
                         <p className="text-sm text-slate-500 font-mono mt-1">ID: {patient.identificationNumber || 'N/A'}</p>
                         <div className="flex gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold border border-slate-200">
                                {patient.bloodType || 'Sangre: Desc.'}
                            </span>
                             <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold border border-slate-200">
                                {getAge(patient.dob)} años
                            </span>
                         </div>
                     </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
                        <p className="text-xs font-bold text-red-500 uppercase flex items-center mb-1"><AlertTriangle size={12} className="mr-1"/> Alergias</p>
                        <p className="text-sm text-red-700 font-medium">{patient.allergies.length > 0 ? patient.allergies.join(', ') : 'Negativo'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                             <p className="text-xs font-bold text-slate-400 uppercase mb-1">Contacto Emergencia</p>
                             <p className="text-sm font-bold text-slate-700">{patient.contactPhone}</p>
                        </div>
                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                             <p className="text-xs font-bold text-slate-400 uppercase mb-1">Condiciones</p>
                             <p className="text-sm font-bold text-slate-700">{patient.conditions.length > 0 ? patient.conditions[0] : 'Ninguna'}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-dashed border-slate-200">
                         <div className="text-xs text-slate-400">
                             <p>Escanea para ver</p>
                             <p>historial completo</p>
                         </div>
                         <div className="bg-slate-900 p-2 rounded text-white">
                             <QrCode size={48} />
                         </div>
                    </div>
                </div>

                <button onClick={() => window.print()} className="w-full mt-6 bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-700 print:hidden">
                    <Printer size={18}/>
                    <span>Imprimir Tarjeta</span>
                </button>
            </div>
        </div>
    </div>
);

const NewPatientModal = ({ onClose, onSave, settings }: { onClose: () => void, onSave: (p: Patient) => void, settings: AppSettings }) => {
  const [formData, setFormData] = useState({
    fullName: '', dob: '', gender: 'M', identificationNumber: '', 
    contactPhone: '', bloodType: '', allergies: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación Estricta (Parte 5)
    if (!formData.fullName.trim() || !formData.dob) {
      setError('El nombre y la fecha de nacimiento son obligatorios.');
      return;
    }

    const age = getAge(formData.dob);
    if (age > 120) {
        setError('La fecha de nacimiento no es válida (Edad > 120 años).');
        return;
    }
    if (age < 0) {
        setError('La fecha de nacimiento no puede ser futura.');
        return;
    }

    const newPatient: Patient = {
      id: `P-${Date.now().toString().slice(-6)}`,
      fullName: formData.fullName,
      dob: formData.dob,
      gender: formData.gender as any,
      identificationNumber: formData.identificationNumber,
      contactPhone: formData.contactPhone,
      bloodType: formData.bloodType || undefined,
      allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
      conditions: [],
      notes: [], vitals: [], documents: [], consents: [],
      vaccines: [], procedures: [], // Parte 6 Init
      status: 'ACTIVE',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    onSave(newPatient);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 h-full md:h-auto overflow-y-auto">
        <div className="p-6 flex justify-between items-center text-white" style={{ backgroundColor: settings.primaryColor }}>
          <h2 className="text-xl font-bold flex items-center"><UserIcon className="mr-2"/> Registrar Nuevo Paciente</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center text-sm border border-red-100">
              <AlertCircle size={18} className="mr-2"/> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo *</label>
              <input 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{ '--tw-ring-color': settings.primaryColor } as any}
                placeholder="Ej. María González"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cédula / ID</label>
              <input 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{ '--tw-ring-color': settings.primaryColor } as any}
                placeholder="Identificación única"
                value={formData.identificationNumber}
                onChange={e => setFormData({...formData, identificationNumber: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Nacimiento *</label>
              <input 
                required
                type="date"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{ '--tw-ring-color': settings.primaryColor } as any}
                value={formData.dob}
                onChange={e => setFormData({...formData, dob: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Género</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{ '--tw-ring-color': settings.primaryColor } as any}
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alergias (Separar por comas)</label>
              <input 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{ '--tw-ring-color': settings.primaryColor } as any}
                placeholder="Ej. Penicilina, Sulfa..."
                value={formData.allergies}
                onChange={e => setFormData({...formData, allergies: e.target.value})}
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{ '--tw-ring-color': settings.primaryColor } as any}
                placeholder="Número de contacto"
                value={formData.contactPhone}
                onChange={e => setFormData({...formData, contactPhone: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">Cancelar</button>
            <button 
                type="submit" 
                className="px-8 py-3 rounded-lg text-white font-bold hover:opacity-90 shadow-lg transform hover:-translate-y-0.5 transition-all"
                style={{ backgroundColor: settings.primaryColor }}
            >
                Guardar Paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CalculatorModal = ({ onClose, settings }: { onClose: () => void, settings: AppSettings }) => {
  const [activeCalc, setActiveCalc] = useState('BMI');
  const [inputs, setInputs] = useState<any>({});
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    let res = '';
    if (activeCalc === 'BMI') {
      const h = parseFloat(inputs.height) / 100;
      const w = parseFloat(inputs.weight);
      if (h && w) {
        const bmi = (w / (h * h)).toFixed(2);
        res = `IMC: ${bmi}`;
      }
    } else if (activeCalc === 'DOSE') {
      const w = parseFloat(inputs.weight);
      const dose = parseFloat(inputs.dose);
      if (w && dose) res = `Dosis Total: ${(w * dose).toFixed(2)} mg`;
    }
    setResult(res || 'Faltan datos');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-4 flex justify-between items-center text-white" style={{ backgroundColor: settings.secondaryColor }}>
          <h2 className="font-bold flex items-center"><Stethoscope className="mr-2"/> Herramientas Médicas</h2>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="flex border-b border-slate-200">
          <button onClick={() => {setActiveCalc('BMI'); setResult(null)}} className={`flex-1 p-3 text-sm font-medium ${activeCalc === 'BMI' ? 'border-b-2' : 'text-slate-500'}`} style={activeCalc === 'BMI' ? { color: settings.primaryColor, borderColor: settings.primaryColor } : {}}>IMC</button>
          <button onClick={() => {setActiveCalc('DOSE'); setResult(null)}} className={`flex-1 p-3 text-sm font-medium ${activeCalc === 'DOSE' ? 'border-b-2' : 'text-slate-500'}`} style={activeCalc === 'DOSE' ? { color: settings.primaryColor, borderColor: settings.primaryColor } : {}}>Dosis</button>
        </div>
        <div className="p-6 space-y-4">
          {activeCalc === 'BMI' && (
            <>
              <input type="number" placeholder="Peso (kg)" className="w-full p-3 bg-slate-50 border rounded-lg" onChange={e => setInputs({...inputs, weight: e.target.value})} />
              <input type="number" placeholder="Altura (cm)" className="w-full p-3 bg-slate-50 border rounded-lg" onChange={e => setInputs({...inputs, height: e.target.value})} />
            </>
          )}
          {activeCalc === 'DOSE' && (
             <>
              <input type="number" placeholder="Peso Paciente (kg)" className="w-full p-3 bg-slate-50 border rounded-lg" onChange={e => setInputs({...inputs, weight: e.target.value})} />
              <input type="number" placeholder="Dosis mg/kg" className="w-full p-3 bg-slate-50 border rounded-lg" onChange={e => setInputs({...inputs, dose: e.target.value})} />
            </>
          )}
          
          <button onClick={calculate} className="w-full text-white py-3 rounded-lg font-bold shadow-md hover:opacity-90" style={{ backgroundColor: settings.primaryColor }}>Calcular</button>
          
          {result && (
            <div className="mt-4 p-4 rounded-lg text-center animate-fade-in bg-slate-100 border border-slate-200">
              <p className="text-xl font-bold" style={{ color: settings.primaryColor }}>{result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. Main Views

const ChatView = ({ user, settings }: { user: User, settings: AppSettings }) => {
    const [messages, setMessages] = useState<{id: string, text: string, sender: string, isMe: boolean, time: string}[]>([
        {id: '1', text: 'Dr., tenemos los resultados del paciente Pérez.', sender: 'Enfermería', isMe: false, time: '10:30 AM'},
        {id: '2', text: 'Perfecto, los reviso en un momento. ¿Cómo está la saturación?', sender: user.name, isMe: true, time: '10:32 AM'},
        {id: '3', text: 'Estable en 98%. Sin novedad.', sender: 'Enfermería', isMe: false, time: '10:33 AM'},
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, {
            id: generateId(),
            text: input,
            sender: user.name,
            isMe: true,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
        setInput('');
    };

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full"><MessageSquare size={20}/></div>
                    <div>
                        <h3 className="font-bold text-slate-800">Chat Médico Seguro</h3>
                        <p className="text-xs text-slate-500">Canal: Enfermería General</p>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-2xl ${msg.isMe ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`} style={msg.isMe ? {backgroundColor: settings.primaryColor} : {}}>
                            <p className="text-xs font-bold mb-1 opacity-80">{msg.sender}</p>
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-[10px] text-right mt-1 ${msg.isMe ? 'text-white/70' : 'text-slate-400'}`}>{msg.time}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex items-center space-x-2">
                <button className="p-2 text-slate-400 hover:text-slate-600"><Paperclip size={20}/></button>
                <input 
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Escriba un mensaje seguro..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700" style={{backgroundColor: settings.primaryColor}}>
                    <Send size={20}/>
                </button>
            </div>
        </div>
    );
};

const PatientList = ({ patients, onSelectPatient, onNewPatient, user, onDeletePatient, settings }: { patients: Patient[], onSelectPatient: (id: string) => void, onNewPatient: () => void, user: User, onDeletePatient: (id: string) => void, settings: AppSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.identificationNumber?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Mis Pacientes</h2>
          <p className="text-slate-500">Gestión clínica simplificada</p>
        </div>
        <button 
            onClick={onNewPatient} 
            className="text-white px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg transition-transform transform hover:-translate-y-0.5 font-bold w-full md:w-auto justify-center"
            style={{ backgroundColor: settings.primaryColor }}
        >
          <Plus size={20} />
          <span>Registrar Paciente</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white"
              style={{ '--tw-ring-color': settings.primaryColor } as any}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
             <div className="bg-slate-50 p-6 rounded-full mb-4">
               <Users size={48} className="opacity-20 text-slate-600"/>
             </div>
             <p className="text-lg font-medium text-slate-600">No hay pacientes registrados</p>
             <p className="text-sm mb-6">Comienza registrando tu primer paciente.</p>
             <button onClick={onNewPatient} className="font-medium hover:underline" style={{ color: settings.primaryColor }}>Registrar ahora</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Edad</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(patient => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => onSelectPatient(patient.id)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0`} style={{ backgroundColor: patient.gender === 'F' ? '#f472b6' : '#60a5fa' }}>
                        {patient.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 transition-colors truncate" style={{ color: settings.secondaryColor }}>{patient.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">ID: {patient.identificationNumber || 'S/N'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {getAge(patient.dob)} años
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex w-fit items-center border ${
                      patient.status === 'HOSPITALIZED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {patient.status === 'HOSPITALIZED' ? 'Ingresado' : 'Ambulatorio'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                       onClick={(e) => { e.stopPropagation(); onDeletePatient(patient.id); }}
                       className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                       title="Borrar"
                    >
                       <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

const PatientDetail = ({ patient, user, onUpdatePatient, onBack, settings, onOpenEmergencyCard }: { patient: Patient, user: User, onUpdatePatient: (p: Patient) => void, onBack: () => void, settings: AppSettings, onOpenEmergencyCard: () => void }) => {
  // Ajuste automático de vista según rol y especialidad (IA Lógica)
  const isPediatrics = user.specialty === Specialty.PEDIATRICS || user.specialty === Specialty.NURSING_PEDIATRIC || getAge(patient.dob) < 12;
  const isNurse = user.role === Role.NURSE;
  
  const defaultTab = isNurse ? 'PROCEDURES' : 'NOTES';
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'NOTES' | 'VITALS' | 'PEDIATRICS' | 'PROCEDURES' | 'DOCUMENTS'>(defaultTab);
  
  const [newNote, setNewNote] = useState('');
  const [newVital, setNewVital] = useState<any>({ bpSystolic: '', bpDiastolic: '', heartRate: '', temp: '', oxygenSat: '', weight: '' });
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Alertas automáticas
  const alerts = getMedicalAlerts(patient);

  const handleGenerateSummary = async () => {
    setLoadingAi(true);
    const summary = await generatePatientSummary(patient);
    setAiSummary(summary);
    setLoadingAi(false);
  };

  const handleSaveNote = () => {
    if(!newNote.trim()) return;
    
    // Firma Digital Automática
    const note: Note = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      authorId: user.id,
      authorName: user.name,
      role: user.role,
      content: newNote,
      type: user.role === Role.NURSE ? 'NURSING' : 'EVOLUTION',
      signed: true,
      signatureHash: `SIG-${Math.random().toString(36).substr(2, 9)}`
    };
    onUpdatePatient({
      ...patient,
      notes: [note, ...patient.notes],
      updatedAt: Date.now()
    });
    setNewNote('');
  };

  const handleSaveVitals = () => {
      if(!newVital.bpSystolic || !newVital.temp) return;

      const vitalEntry: VitalSigns = {
          date: new Date().toISOString(),
          bpSystolic: Number(newVital.bpSystolic),
          bpDiastolic: Number(newVital.bpDiastolic),
          heartRate: Number(newVital.heartRate),
          temp: Number(newVital.temp),
          oxygenSat: Number(newVital.oxygenSat),
          weight: Number(newVital.weight),
          height: 0,
          recordedBy: user.name
      };
      
      onUpdatePatient({
          ...patient,
          vitals: [...patient.vitals, vitalEntry],
          updatedAt: Date.now()
      });
      setNewVital({ bpSystolic: '', bpDiastolic: '', heartRate: '', temp: '', oxygenSat: '', weight: '' });
      alert("Signos vitales registrados");
  };

  const handleAddVaccine = () => {
      const vName = prompt("Nombre de la Vacuna:");
      if (vName) {
          const newVac: Vaccine = {
              id: generateId(),
              name: vName,
              dateApplied: new Date().toISOString(),
              status: 'APPLIED'
          };
          onUpdatePatient({
              ...patient,
              vaccines: [...patient.vaccines, newVac]
          });
      }
  };

  const handleAddProcedure = () => {
      const pName = prompt("Procedimiento realizado:");
      if (pName) {
          const newProc: Procedure = {
              id: generateId(),
              name: pName,
              date: new Date().toISOString(),
              performedBy: user.name,
              notes: 'Realizado sin complicaciones',
              status: 'COMPLETED'
          };
          onUpdatePatient({
              ...patient,
              procedures: [...patient.procedures, newProc]
          });
      }
  };
  
  // Manejo de Documentos (Parte 6.10)
  const handleUploadDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const newDoc: Document = {
              id: generateId(),
              name: file.name,
              type: 'OTHER',
              date: new Date().toISOString(),
              authorName: user.name,
              url: URL.createObjectURL(file) // Simulación de URL local
          };
          onUpdatePatient({
              ...patient,
              documents: [...patient.documents, newDoc]
          });
      }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 print:p-0 print:max-w-none">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 print:hidden gap-4">
         <div className="flex items-center space-x-2 w-full md:w-auto">
            <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ChevronRight className="rotate-180 text-slate-600" size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-700">Volver a lista</h2>
         </div>
         <div className="flex gap-2 w-full md:w-auto">
             <button 
               onClick={onOpenEmergencyCard}
               className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-bold"
             >
                <HeartPulse size={18} />
                <span className="md:inline">Tarjeta Emergencia</span>
             </button>
             <button 
               onClick={handlePrint}
               className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
             >
                <Printer size={18} />
                <span className="md:inline">Imprimir</span>
             </button>
         </div>
      </div>

      {/* Alertas Médicas Automáticas */}
      {alerts.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-pulse print:border print:bg-white">
              <h4 className="font-bold text-red-700 flex items-center mb-1"><AlertTriangle size={18} className="mr-2"/> Alertas Clínicas Detectadas</h4>
              <ul className="list-disc list-inside text-sm text-red-600">
                  {alerts.map((alert, i) => <li key={i}>{alert}</li>)}
              </ul>
          </div>
      )}

      {/* Header Profile */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden print:shadow-none print:border-none">
        <div className="flex flex-col md:flex-row justify-between gap-6 print:flex-row">
          <div className="flex items-start space-x-5">
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-lg print:border print:border-slate-300 print:text-black print:bg-white shrink-0`} style={{ backgroundColor: patient.gender === 'F' ? '#f472b6' : '#60a5fa' }}>
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 leading-tight">{patient.fullName}</h1>
              <div className="flex flex-wrap gap-2 text-sm text-slate-600 font-medium">
                <span className="bg-slate-100 px-3 py-1 rounded-lg print:border print:border-slate-200">ID: {patient.identificationNumber}</span>
                <span className="bg-slate-100 px-3 py-1 rounded-lg print:border print:border-slate-200">{getAge(patient.dob)} años</span>
                <span className="bg-slate-100 px-3 py-1 rounded-lg print:border print:border-slate-200">{patient.gender === 'M' ? 'Masc.' : patient.gender === 'F' ? 'Fem.' : 'Otro'}</span>
              </div>
              <p className="mt-3 text-red-500 text-sm font-semibold flex items-center">
                 <AlertTriangle size={14} className="mr-1"/>
                 Alergias: {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'Ninguna'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col justify-center print:hidden">
             {user.role === Role.DOCTOR && (
                <button 
                onClick={handleGenerateSummary}
                className="w-full md:w-auto px-6 py-3 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center space-x-2 font-bold transform hover:-translate-y-0.5"
                style={{ background: `linear-gradient(to right, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                disabled={loadingAi}
                >
                {loadingAi ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Sparkles size={20} />}
                <span>Analizar con IA</span>
                </button>
             )}
          </div>
        </div>
      </div>

      {/* AI Summary Panel */}
      {aiSummary && (
        <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-xl animate-fade-in relative shadow-sm print:hidden">
          <button onClick={() => setAiSummary(null)} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600"><X size={20}/></button>
          <div className="flex items-start space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg shrink-0">
                <Sparkles className="text-indigo-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 mb-2 text-lg">Análisis Inteligente Gemini</h3>
              <div className="prose prose-sm text-indigo-800 whitespace-pre-line leading-relaxed">
                {aiSummary}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs - Print Hidden */}
      <div className="flex space-x-1 bg-slate-200 p-1 rounded-xl w-full md:w-fit print:hidden overflow-x-auto">
        {user.role === Role.DOCTOR && (
            <button onClick={() => setActiveTab('NOTES')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'NOTES' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Notas</button>
        )}
        <button onClick={() => setActiveTab('VITALS')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'VITALS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Signos</button>
        
        {isPediatrics && (
             <button onClick={() => setActiveTab('PEDIATRICS')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'PEDIATRICS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                 <Baby size={16} className="inline mr-1"/> Pedi
             </button>
        )}

        <button onClick={() => setActiveTab('PROCEDURES')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'PROCEDURES' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
            <Syringe size={16} className="inline mr-1"/> Proc
        </button>

        <button onClick={() => setActiveTab('DOCUMENTS')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'DOCUMENTS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
            <FileIcon size={16} className="inline mr-1"/> Docs
        </button>
      </div>

      {/* CONTENIDO DINÁMICO */}

      {(activeTab === 'NOTES' || activeTab === 'OVERVIEW') && (
        <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                    <FileText className="mr-2" style={{ color: settings.primaryColor }}/> 
                    {user.role === Role.DOCTOR ? 'Nueva Nota Médica (SOAP)' : 'Nueva Nota de Enfermería'}
                </h4>
                <textarea 
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:outline-none transition-all resize-none text-base mb-4"
                    placeholder={user.role === Role.DOCTOR ? "Subjetivo, Objetivo, Análisis, Plan..." : "Observaciones de turno, cuidados realizados..."}
                    style={{ '--tw-ring-color': settings.primaryColor } as any}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                />
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-xs text-slate-400 flex items-center">
                        <Shield size={12} className="mr-1"/> Firma Digital Habilitada
                    </div>
                    <button 
                        onClick={handleSaveNote}
                        disabled={!newNote.trim()}
                        className="w-full md:w-auto text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center justify-center space-x-2"
                        style={{ backgroundColor: settings.primaryColor }}
                    >
                        <FileSignature size={18}/>
                        <span>Firmar y Guardar</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4 print:block">
            <h3 className="font-bold text-slate-800 text-lg border-b pb-2 hidden print:block">Historial de Notas</h3>
            {patient.notes.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No hay notas registradas.</p>
            ) : (
                patient.notes.map(note => (
                    <div key={note.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:mb-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                                <div className={`p-1.5 rounded-lg ${note.role === Role.DOCTOR ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                                    {note.role === Role.DOCTOR ? <Stethoscope size={14}/> : <Thermometer size={14}/>}
                                </div>
                                <div>
                                    <span className="font-bold text-slate-800 block">{note.authorName}</span>
                                    <span className="text-xs text-slate-500 uppercase">{note.role === Role.DOCTOR ? 'Doctor' : 'Enfermería'}</span>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 font-medium">{new Date(note.date).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line border-l-4 pl-4" style={{ borderColor: note.role === Role.DOCTOR ? '#3b82f6' : '#14b8a6' }}>{note.content}</p>
                        
                        {note.signed && (
                            <div className="mt-4 pt-2 border-t border-dashed border-slate-200 flex justify-end">
                                <div className="text-right">
                                    <div className="font-parisienne text-lg text-slate-600 italic font-bold">Firma Digital: {note.authorName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">Hash: {note.signatureHash}</div>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
            </div>
        </div>
      )}

      {activeTab === 'PEDIATRICS' && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-slate-800 flex items-center"><Syringe size={20} className="mr-2 text-pink-500"/> Esquema de Vacunación</h4>
                          <button onClick={handleAddVaccine} className="text-xs bg-pink-50 text-pink-600 px-3 py-1 rounded-full font-bold hover:bg-pink-100">+ Agregar</button>
                      </div>
                      {patient.vaccines.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-4">Sin vacunas registradas</p>
                      ) : (
                          <ul className="space-y-2">
                              {patient.vaccines.map(v => (
                                  <li key={v.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                                      <span className="font-medium text-slate-700">{v.name}</span>
                                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Aplicada {new Date(v.dateApplied || '').toLocaleDateString()}</span>
                                  </li>
                              ))}
                          </ul>
                      )}
                  </div>

                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 flex items-center mb-4"><Baby size={20} className="mr-2 text-blue-500"/> Desarrollo (Percentiles)</h4>
                      <div className="bg-slate-50 p-4 rounded-xl text-center">
                          <p className="text-sm text-slate-500 mb-2">Peso Actual</p>
                          <p className="text-2xl font-bold text-slate-800">{patient.vitals[patient.vitals.length-1]?.weight || '--'} kg</p>
                          <p className="text-xs text-blue-500 mt-1 font-bold">Percentil 50 (Normal)</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'PROCEDURES' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                 <h4 className="font-bold text-slate-800 flex items-center"><ClipboardList size={20} className="mr-2 text-teal-600"/> Registro de Procedimientos</h4>
                 <button onClick={handleAddProcedure} className="bg-teal-50 text-teal-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-teal-100 print:hidden">+ Registrar Procedimiento</button>
             </div>
             
             {patient.procedures.length === 0 ? (
                 <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                     <ClipboardList className="mx-auto text-slate-300 mb-2" size={32}/>
                     <p className="text-slate-400">No se han realizado procedimientos.</p>
                 </div>
             ) : (
                 <div className="space-y-4">
                     {patient.procedures.map(proc => (
                         <div key={proc.id} className="border border-slate-100 p-4 rounded-xl flex justify-between items-center">
                             <div>
                                 <p className="font-bold text-slate-800">{proc.name}</p>
                                 <p className="text-xs text-slate-500">{new Date(proc.date).toLocaleString()} - Por: {proc.performedBy}</p>
                             </div>
                             <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold">COMPLETADO</span>
                         </div>
                     ))}
                 </div>
             )}
          </div>
      )}

      {/* Módulo de Documentos (Parte 6.10) */}
      {activeTab === 'DOCUMENTS' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                 <h4 className="font-bold text-slate-800 flex items-center"><FileIcon size={20} className="mr-2 text-blue-600"/> Documentos y Adjuntos</h4>
                 <label className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 cursor-pointer flex items-center space-x-2 print:hidden">
                     <Camera size={16} />
                     <span>Escanear / Subir</span>
                     <input type="file" className="hidden" accept="image/*,.pdf" capture="environment" onChange={handleUploadDocument} />
                 </label>
             </div>

             {patient.documents.length === 0 ? (
                 <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                     <Camera className="mx-auto text-slate-300 mb-2" size={32}/>
                     <p className="text-slate-500 font-medium">No hay documentos adjuntos</p>
                     <p className="text-xs text-slate-400">Tome fotos de recetas, analíticas o estudios.</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {patient.documents.map(doc => (
                         <div key={doc.id} className="border border-slate-200 p-3 rounded-xl hover:shadow-md transition-shadow relative group">
                             <div className="h-24 bg-slate-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                {doc.url ? (
                                    <img src={doc.url} alt="doc" className="w-full h-full object-cover" />
                                ) : (
                                    <FileText className="text-slate-400" />
                                )}
                             </div>
                             <p className="text-sm font-bold text-slate-800 truncate">{doc.name}</p>
                             <p className="text-xs text-slate-500">{new Date(doc.date).toLocaleDateString()}</p>
                         </div>
                     ))}
                 </div>
             )}
          </div>
      )}

      {activeTab === 'VITALS' && (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                    <Activity className="mr-2" style={{ color: settings.primaryColor }}/> 
                    Registrar Signos Vitales
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <input type="number" placeholder="T.A. Sistólica" className="p-2 border rounded-lg bg-slate-50" value={newVital.bpSystolic} onChange={e => setNewVital({...newVital, bpSystolic: e.target.value})} />
                    <input type="number" placeholder="T.A. Diastólica" className="p-2 border rounded-lg bg-slate-50" value={newVital.bpDiastolic} onChange={e => setNewVital({...newVital, bpDiastolic: e.target.value})} />
                    <input type="number" placeholder="Frec. Cardíaca" className="p-2 border rounded-lg bg-slate-50" value={newVital.heartRate} onChange={e => setNewVital({...newVital, heartRate: e.target.value})} />
                    <input type="number" placeholder="Temp (°C)" className="p-2 border rounded-lg bg-slate-50" value={newVital.temp} onChange={e => setNewVital({...newVital, temp: e.target.value})} />
                    <input type="number" placeholder="Sat O2 (%)" className="p-2 border rounded-lg bg-slate-50" value={newVital.oxygenSat} onChange={e => setNewVital({...newVital, oxygenSat: e.target.value})} />
                    <input type="number" placeholder="Peso (kg)" className="p-2 border rounded-lg bg-slate-50" value={newVital.weight} onChange={e => setNewVital({...newVital, weight: e.target.value})} />
                </div>
                <button 
                    onClick={handleSaveVitals}
                    className="mt-4 text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 w-full md:w-auto"
                    style={{ backgroundColor: settings.primaryColor }}
                >
                    Registrar Medición
                </button>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center py-12 print:border print:shadow-none">
                <h3 className="text-xl font-medium text-slate-800 mb-2">Gráfica de Evolución</h3>
                {patient.vitals.length > 0 ? (
                    <div className="h-64 w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={patient.vitals}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <RechartsTooltip />
                            <Line type="monotone" dataKey="bpSystolic" stroke="#ef4444" strokeWidth={2} name="Sistólica" />
                            <Line type="monotone" dataKey="bpDiastolic" stroke="#3b82f6" strokeWidth={2} name="Diastólica" />
                            <Line type="monotone" dataKey="temp" stroke="#eab308" strokeWidth={2} name="Temp" />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-slate-400 mt-4 flex flex-col items-center">
                        <Activity size={40} className="mb-2 opacity-20"/>
                        <p>No hay signos vitales registrados aún.</p>
                    </div>
                )}
            </div>

            {patient.vitals.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                    <h3 className="font-bold text-slate-800 mb-2">Tabla de Registros</h3>
                    <table className="w-full text-left text-sm border-collapse border border-slate-200 min-w-[600px]">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="border p-2">Fecha</th>
                                <th className="border p-2">T.A.</th>
                                <th className="border p-2">FC</th>
                                <th className="border p-2">Temp</th>
                                <th className="border p-2">SatO2</th>
                                <th className="border p-2">Resp.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patient.vitals.slice().reverse().map((v, idx) => (
                                <tr key={idx}>
                                    <td className="border p-2">{new Date(v.date).toLocaleString()}</td>
                                    <td className="border p-2">{v.bpSystolic}/{v.bpDiastolic}</td>
                                    <td className="border p-2">{v.heartRate}</td>
                                    <td className="border p-2">{v.temp}°C</td>
                                    <td className="border p-2">{v.oxygenSat}%</td>
                                    <td className="border p-2">{v.recordedBy}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

const LoginScreen = ({ onLogin, settings, onUpdateSettings }: { onLogin: (name: string, role: Role, specialty: Specialty) => void, settings: AppSettings, onUpdateSettings: (s: AppSettings) => void }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState<Role>(Role.DOCTOR);
    const [specialty, setSpecialty] = useState<Specialty>(Specialty.GENERAL);
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
        onLogin(name, role, specialty);
      }
    };
  
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-900">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full blur-[120px] opacity-20" style={{ backgroundColor: settings.primaryColor }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full blur-[120px] opacity-20" style={{ backgroundColor: settings.secondaryColor }}></div>
  
        <div className="bg-white w-full max-w-md rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-lg bg-slate-50 overflow-hidden">
               {settings.logoUrl ? (
                   <img src={settings.logoUrl} className="w-full h-full object-contain" alt="logo"/>
               ) : (
                   <Activity className="w-10 h-10" style={{ color: settings.primaryColor }} />
               )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">{settings.centerName}</h1>
            <p className="text-slate-500 font-medium text-lg">Tu salud en las mejores manos</p>
          </div>
  
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tu Nombre Completo</label>
              <input 
                type="text" 
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 outline-none transition-all font-medium"
                style={{ '--tw-ring-color': settings.primaryColor } as any}
                placeholder="Ej. Dr. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
  
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setRole(Role.DOCTOR)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all text-center ${role === Role.DOCTOR ? 'bg-slate-50' : 'bg-white border-slate-100 text-slate-400'}`}
                style={role === Role.DOCTOR ? { borderColor: settings.primaryColor, color: settings.primaryColor } : {}}
              >
                <Stethoscope className="mx-auto mb-2" size={24}/>
                <span className="font-bold text-sm">Doctor/a</span>
              </div>
              <div 
                onClick={() => setRole(Role.NURSE)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all text-center ${role === Role.NURSE ? 'bg-slate-50' : 'bg-white border-slate-100 text-slate-400'}`}
                style={role === Role.NURSE ? { borderColor: settings.primaryColor, color: settings.primaryColor } : {}}
              >
                <Thermometer className="mx-auto mb-2" size={24}/>
                <span className="font-bold text-sm">Enfermería</span>
              </div>
            </div>
  
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Especialidad</label>
                <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 outline-none transition-all font-medium text-slate-700 max-h-60"
                    style={{ '--tw-ring-color': settings.primaryColor } as any}
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value as Specialty)}
                >
                    {Object.values(Specialty).sort().map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
  
            <button 
              type="submit" 
              className="w-full text-white p-4 rounded-xl font-bold text-lg hover:opacity-90 transition-transform transform hover:-translate-y-1 shadow-xl"
              style={{ backgroundColor: settings.primaryColor }}
            >
              Ingresar al Sistema
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400 font-bold mb-1">Cuidami - Tu salud en las mejores manos</p>
             <p className="text-xs text-slate-500 font-medium">Dueño: George Emmanuel Almonte Sanchez</p>
             <p className="text-[10px] text-slate-400 mt-1">Todos los derechos reservados</p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
             <details className="text-xs text-slate-400">
                 <summary className="cursor-pointer hover:text-slate-600">Personalizar Pantalla de Acceso</summary>
                 <div className="mt-2 space-y-2">
                     <input type="text" placeholder="Nombre Centro" className="w-full p-2 border rounded" value={settings.centerName} onChange={e => onUpdateSettings({...settings, centerName: e.target.value})} />
                     <div className="flex gap-2">
                        <input type="color" value={settings.primaryColor} onChange={e => onUpdateSettings({...settings, primaryColor: e.target.value})} className="h-8 w-full"/>
                        <input type="color" value={settings.secondaryColor} onChange={e => onUpdateSettings({...settings, secondaryColor: e.target.value})} className="h-8 w-full"/>
                     </div>
                 </div>
             </details>
          </div>
        </div>
      </div>
    );
};

const SettingsView = ({ settings, onUpdateSettings, onClearData, onFactoryReset }: { settings: AppSettings, onUpdateSettings: (s: AppSettings) => void, onClearData: () => void, onFactoryReset: () => void }) => (
  <div className="max-w-3xl mx-auto py-8 pb-32">
    <h2 className="text-2xl font-bold text-slate-800 mb-6">Personalización y Configuración</h2>
    
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
       <div className="p-6 border-b border-slate-100 flex items-center space-x-2">
          <Palette className="text-slate-500" />
          <h3 className="font-bold text-slate-800">Identidad Institucional</h3>
       </div>
       <div className="p-6 space-y-6">
          <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de la Institución</label>
              <input 
                 className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                 value={settings.centerName}
                 onChange={(e) => onUpdateSettings({...settings, centerName: e.target.value})}
              />
          </div>
          <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center"><ImageIcon size={16} className="mr-2"/> URL del Logo</label>
              <div className="flex gap-3">
                  <input 
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm font-mono"
                    placeholder="https://ejemplo.com/logo.png"
                    value={settings.logoUrl}
                    onChange={(e) => onUpdateSettings({...settings, logoUrl: e.target.value})}
                  />
                  {settings.logoUrl && (
                      <div className="w-12 h-12 bg-slate-50 border rounded-lg flex items-center justify-center p-1">
                          <img src={settings.logoUrl} className="w-full h-full object-contain" alt="Preview"/>
                      </div>
                  )}
              </div>
              <p className="text-xs text-slate-400 mt-2">Pega aquí el enlace directo a tu imagen (PNG o JPG).</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Color Principal</label>
                  <div className="flex items-center space-x-2">
                      <input 
                        type="color" 
                        className="h-10 w-10 rounded overflow-hidden cursor-pointer border-0"
                        value={settings.primaryColor}
                        onChange={(e) => onUpdateSettings({...settings, primaryColor: e.target.value})}
                      />
                      <span className="text-slate-500 text-sm font-mono">{settings.primaryColor}</span>
                  </div>
              </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Color Secundario</label>
                   <div className="flex items-center space-x-2">
                      <input 
                        type="color" 
                        className="h-10 w-10 rounded overflow-hidden cursor-pointer border-0"
                        value={settings.secondaryColor}
                        onChange={(e) => onUpdateSettings({...settings, secondaryColor: e.target.value})}
                      />
                      <span className="text-slate-500 text-sm font-mono">{settings.secondaryColor}</span>
                  </div>
              </div>
          </div>
       </div>
    </div>

    <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 overflow-hidden mb-6">
      <div className="p-6 border-b border-red-100">
        <h3 className="font-bold text-red-700 mb-2 flex items-center"><AlertCircle className="mr-2" size={18}/> Zona de Peligro / Solución de Problemas</h3>
        <p className="text-sm text-red-600">
          Usa estas opciones si la aplicación presenta errores graves, se traba o deseas empezar desde cero.
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-100">
            <div>
                <h4 className="font-bold text-slate-800 text-sm">Borrar Datos de Pacientes</h4>
                <p className="text-xs text-slate-500">Elimina todos los registros pero mantiene tu configuración.</p>
            </div>
            <button 
            onClick={onClearData}
            className="flex items-center space-x-2 px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-bold text-sm"
            >
            <Trash2 size={16}/>
            <span>Borrar Datos</span>
            </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-100">
            <div>
                <h4 className="font-bold text-slate-800 text-sm">Restablecimiento de Fábrica (Reinicio Web)</h4>
                <p className="text-xs text-slate-500">Borra TODO y recarga la página. Útil si la web da problemas.</p>
            </div>
            <button 
            onClick={onFactoryReset}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-sm shadow-md"
            >
            <RefreshCw size={16}/>
            <span>Reiniciar App</span>
            </button>
        </div>
      </div>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    patients: [],
    appointments: [],
    logs: [],
    settings: INITIAL_SETTINGS,
    view: 'LOGIN',
    activePatientId: null,
    modals: { newPatient: false, calculator: false, emergencyCard: false },
    isOffline: !navigator.onLine
  });
  
  // Responsive Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Offline Detection
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setState(prev => ({ ...prev, isOffline: true }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    }
  }, []);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('cuidami_v2_data');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.patients) {
            const migratedPatients = parsed.patients.map((p: any) => ({
                ...p,
                vaccines: p.vaccines || [],
                procedures: p.procedures || []
            }));

          setState(prev => ({ 
              ...prev, 
              patients: migratedPatients, 
              logs: parsed.logs || [],
              settings: parsed.settings || INITIAL_SETTINGS
          }));
        }
      } catch (e) { console.error("Error loading data", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cuidami_v2_data', JSON.stringify({ 
        patients: state.patients, 
        logs: state.logs,
        settings: state.settings 
    }));
  }, [state.patients, state.logs, state.settings]);

  const auditLog = (userId: string, userName: string, action: string, details: string) => {
    const newLog: AuditLog = {
      id: generateId(),
      timestamp: Date.now(),
      userId,
      userName,
      action,
      details
    };
    setState(prev => ({ ...prev, logs: [newLog, ...prev.logs] }));
  };

  const handleCustomLogin = (name: string, role: Role, specialty: Specialty) => {
      const user: User = {
          id: generateId(),
          name: name,
          role: role,
          specialty: specialty,
          avatar: '' 
      };
      setState(prev => ({ ...prev, currentUser: user, view: 'PATIENTS' })); 
  };

  const handleCreatePatient = (newPatient: Patient) => {
    setState(prev => ({
      ...prev,
      patients: [newPatient, ...prev.patients],
      modals: { ...prev.modals, newPatient: false },
      view: 'PATIENT_DETAIL',
      activePatientId: newPatient.id
    }));
    if (state.currentUser) auditLog(state.currentUser.id, state.currentUser.name, 'CREATE_PATIENT', `Paciente registrado: ${newPatient.fullName}`);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setState(prev => ({
      ...prev,
      patients: prev.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p)
    }));
  };

  const handleDeletePatient = (id: string) => {
    if (confirm('¿Eliminar paciente?')) {
      setState(prev => ({
        ...prev,
        patients: prev.patients.filter(p => p.id !== id),
        activePatientId: null,
        view: 'PATIENTS'
      }));
    }
  };

  const handleClearData = () => {
    if (confirm('ADVERTENCIA: ¿Borrar solo los datos de pacientes? La configuración se mantendrá.')) {
      setState(prev => ({ ...prev, patients: [], logs: [], activePatientId: null, view: 'PATIENTS' }));
    }
  };

  const handleFactoryReset = () => {
    if (confirm('PELIGRO: ¿Estás seguro de que quieres reiniciar la aplicación de fábrica? Se borrarán TODOS los datos y configuraciones. La página se recargará.')) {
        localStorage.clear();
        window.location.reload();
    }
  };

  if (!state.currentUser) {
    return (
        <LoginScreen 
            onLogin={handleCustomLogin} 
            settings={state.settings} 
            onUpdateSettings={(s) => setState(prev => ({...prev, settings: s}))}
        />
    );
  }

  const activePatient = state.patients.find(p => p.id === state.activePatientId);

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
      <OfflineIndicator isOffline={state.isOffline} />
      
      <Sidebar 
        user={state.currentUser} 
        activeView={state.view} 
        setView={(v: any) => setState(prev => ({...prev, view: v}))} 
        onLogout={() => setState(prev => ({...prev, currentUser: null, view: 'LOGIN'}))}
        settings={state.settings}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="flex-1 transition-all duration-300 md:ml-64 pb-10 print:ml-0 print:pb-0 w-full">
        <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm print:hidden">
           <div className="flex items-center space-x-4">
               <button className="md:hidden text-slate-500 hover:text-slate-700" onClick={() => setSidebarOpen(true)}>
                   <Menu size={24} />
               </button>
               <h1 className="text-lg md:text-xl font-bold text-slate-800 truncate">
                 {state.view === 'DASHBOARD' && 'Panel General'}
                 {state.view === 'PATIENTS' && 'Pacientes'}
                 {state.view === 'PATIENT_DETAIL' && 'Historia Clínica'}
                 {state.view === 'SETTINGS' && 'Configuración'}
                 {state.view === 'CHAT' && 'Mensajería'}
               </h1>
           </div>
           <div className="flex items-center space-x-3">
             <button 
               onClick={() => setState(prev => ({...prev, modals: {...prev.modals, calculator: true}}))}
               className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg transition-colors font-medium text-sm" 
             >
               <Stethoscope size={18}/>
               <span className="hidden md:inline">Herramientas</span>
             </button>
           </div>
        </header>

        <div className="p-4 md:p-8 print:p-0">
          {state.view === 'DASHBOARD' && (
             <div className="animate-fade-in max-w-5xl mx-auto">
                <div 
                    className="rounded-2xl p-6 md:p-8 text-white mb-8 shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${state.settings.primaryColor}, ${state.settings.secondaryColor})` }}
                >
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">Hola, {state.currentUser.name}</h2>
                    <p className="opacity-90 mb-6">Bienvenido a {state.settings.centerName}.</p>
                    <div className="flex flex-col md:flex-row gap-4">
                        <button onClick={() => setState(prev => ({...prev, view: 'PATIENTS'}))} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:bg-slate-50 text-center">
                            Ver Pacientes
                        </button>
                        <button onClick={() => setState(prev => ({...prev, modals: {...prev.modals, newPatient: true}}))} className="bg-black/20 hover:bg-black/30 text-white px-6 py-3 rounded-xl font-bold transition-all backdrop-blur-sm border border-white/10 text-center">
                            Registrar Nuevo
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-slate-500 font-medium mb-1">Total Pacientes</p>
                        <p className="text-4xl font-bold" style={{ color: state.settings.primaryColor }}>{state.patients.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-slate-500 font-medium mb-1">Hospitalizados</p>
                        <p className="text-4xl font-bold" style={{ color: state.settings.secondaryColor }}>{state.patients.filter(p => p.status === 'HOSPITALIZED').length}</p>
                    </div>
                </div>
             </div>
          )}

          {state.view === 'CHAT' && (
              <ChatView user={state.currentUser} settings={state.settings} />
          )}

          {state.view === 'PATIENTS' && (
            <PatientList 
              patients={state.patients} 
              onSelectPatient={(id) => setState(prev => ({...prev, activePatientId: id, view: 'PATIENT_DETAIL'}))}
              onNewPatient={() => setState(prev => ({...prev, modals: {...prev.modals, newPatient: true}}))}
              user={state.currentUser}
              onDeletePatient={handleDeletePatient}
              settings={state.settings}
            />
          )}

          {state.view === 'PATIENT_DETAIL' && activePatient && (
            <PatientDetail 
              patient={activePatient} 
              user={state.currentUser}
              onUpdatePatient={handleUpdatePatient}
              onBack={() => setState(prev => ({ ...prev, view: 'PATIENTS', activePatientId: null }))} 
              settings={state.settings}
              onOpenEmergencyCard={() => setState(prev => ({...prev, modals: {...prev.modals, emergencyCard: true}}))}
            />
          )}
          
          {state.view === 'SETTINGS' && (
            <SettingsView 
                settings={state.settings} 
                onUpdateSettings={(s) => setState(prev => ({...prev, settings: s}))}
                onClearData={handleClearData} 
                onFactoryReset={handleFactoryReset}
            />
          )}
        </div>
      </main>

      {/* Modals Layer */}
      {state.modals.newPatient && (
        <NewPatientModal 
          onClose={() => setState(prev => ({...prev, modals: {...prev.modals, newPatient: false}}))}
          onSave={handleCreatePatient}
          settings={state.settings}
        />
      )}
      
      {state.modals.calculator && (
        <CalculatorModal 
          onClose={() => setState(prev => ({...prev, modals: {...prev.modals, calculator: false}}))}
          settings={state.settings}
        />
      )}

      {state.modals.emergencyCard && activePatient && (
        <EmergencyCardModal 
          patient={activePatient}
          onClose={() => setState(prev => ({...prev, modals: {...prev.modals, emergencyCard: false}}))}
          settings={state.settings}
        />
      )}
    </div>
  );
};

export default App;
