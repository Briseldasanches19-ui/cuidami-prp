import { GoogleGenAI } from "@google/genai";
import { Patient, Note, VitalSigns } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePatientSummary = async (patient: Patient): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Error: API Key faltante.";

  const recentVitals = patient.vitals.slice(-3);
  const recentNotes = patient.notes.slice(-3);

  const prompt = `
    Actúa como un médico experto. Analiza los siguientes datos del paciente y genera un resumen clínico conciso.
    
    Paciente: ${patient.fullName}, ${patient.gender}, Nacido: ${patient.dob}
    Alergias: ${patient.allergies.join(', ') || 'Ninguna'}
    Condiciones: ${patient.conditions.join(', ') || 'Ninguna'}
    
    Signos Vitales Recientes: ${JSON.stringify(recentVitals)}
    Notas Recientes: ${JSON.stringify(recentNotes)}

    Formato de respuesta:
    1. Resumen del estado actual.
    2. Alertas o riesgos potenciales.
    3. Recomendaciones clínicas breves.
    
    Mantén un tono profesional y clínico.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No se pudo generar el resumen.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error al conectar con el asistente de IA.";
  }
};

export const analyzeMedicalNote = async (noteContent: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Error config.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analiza la siguiente nota clínica, corrige errores ortográficos y sugiere códigos CIE-10 posibles si aplica: "${noteContent}"`,
    });
    return response.text || "Sin análisis.";
  } catch (e) {
    return "Error de servicio.";
  }
};
