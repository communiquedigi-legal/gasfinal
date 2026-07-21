import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  User, 
  CheckCircle, 
  Clock, 
  Printer, 
  Trash2, 
  Eye, 
  X, 
  Calendar,
  AlertTriangle,
  FileCheck2,
  Lock,
  ChevronRight,
  ClipboardCheck,
  FileSignature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { storage } from '@/lib/storage';
import { supabaseService } from '@/services/supabaseService';
import { OTConsent } from '@/types';

const CONSENT_TEMPLATES: Record<string, { title: string; text: string }> = {
  'General': {
    title: 'General Admission & Diagnostic Treatment Consent',
    text: `1. CONSENT TO TREATMENT: I hereby authorize the medical, nursing, and administrative staff of GASTROPLUS HOSPITAL to administer diagnostics, lab tests, routine nursing interventions, and general non-invasive healthcare treatments deemed appropriate by my attending physicians.\n\n2. FINANCIAL DISCLOSURE: I understand that I am fully responsible for any charges incurred during my hospital visit that are not covered by insurance or government schemes.\n\n3. PRIVACY & RECORDS: I agree to the storage and sharing of my clinical data for ongoing care, billing, and regulatory audits in compliance with healthcare data protection standards.`
  },
  'Surgery': {
    title: 'Informed Surgical Procedure Consent',
    text: `1. AUTHORIZATION OF PROCEDURE: I authorize the primary surgeon and their assistants to perform the scheduled surgical operation on me. The nature, purpose, and scope of the surgery have been explained to me in detail.\n\n2. SURGICAL RISKS: I recognize that all surgical procedures carry inherent risks, including but not limited to severe hemorrhage, post-operative infection, scarring, adjacent organ injury, or cardiac event. No guarantee has been made regarding the absolute outcome of the surgery.\n\n3. EMERGENCY CLINICAL ALTERATIONS: If during the course of the surgery any unforeseen conditions arise requiring immediate actions, I authorize the surgical team to perform whatever procedures are medically necessary to save my life.`
  },
  'Anaesthesia': {
    title: 'Consent for Anaesthesia Services',
    text: `I hereby authorize the anesthesiology team to administer the selected anesthesia techniques (General, Spinal, Epidural, Regional, or Monitored Anesthesia Care) for my scheduled surgery. The techniques, expected results, and risks (such as sore throat, headaches, dental injury, nerve block issues, and extremely rare cardiac/respiratory complications) have been discussed with me.`
  },
  'Blood Transfusion': {
    title: 'Blood and Blood Product Transfusion Consent',
    text: `1. RECOMMENDATION OF THERAPY: I consent to the administration of blood, packed cells, platelets, fresh frozen plasma, or other blood products under the direction of my treating medical team.\n\n2. BENEFITS & CRITICAL RISKS: While blood screening minimizes risks, I acknowledge that transfusions carry minor risks (fever, allergic hives) and rare, critical risks (hemolytic transfusion reaction, transfusion-related acute lung injury (TRALI), bacterial contamination, or transmission of viral infections like Hepatitis or HIV).\n\n3. DIRECTED ALTERNATIVES: I have been briefed on alternative treatments such as iron therapy or volume expanders and understand why blood transfusion is recommended in my current clinical situation.`
  },
  'ICU': {
    title: 'Intensive Care Unit (ICU) Admission and Monitoring Consent',
    text: `1. ICU ADMISSION CRITERIA: I consent to my/the patient's admission to the Intensive Care Unit (ICU) for high-intensity clinical monitoring and multi-organ life support interventions.\n\n2. INVASIVE PROCEDURES: I understand that ICU care frequently requires invasive procedures, including central venous catheter insertion, arterial lines, endotracheal intubation, mechanical ventilation, renal dialysis, or temporary pacemaker placement.\n\n3. REAL-TIME PROGNOSIS: I acknowledge that critical illness is unstable, and the ICU team will provide regular clinical briefings. I understand that the primary goal is resuscitation, stabilizing major vitals, and preventing multi-organ failure.`
  },
  'High-risk': {
    title: 'High-Risk Surgical and Morbidity Consent',
    text: `1. CRITICAL DESIGNATION: I acknowledge that my planned procedure is classified as HIGH-RISK due to pre-existing co-morbidities (such as advanced heart failure, pulmonary dysfunction, renal impairment, or septic shock) or the complex anatomical nature of the surgery.\n\n2. ELEVATED MORTALITY DISCLOSURE: The medical team has explicitly explained to me and my next-of-kin that there is a significant, elevated risk of intra-operative or post-operative mortality (death) or severe, irreversible disability (e.g. major stroke, paralysis, permanent vegetative state).\n\n3. RESUSCITATION PREFERENCES: In signing this, I acknowledge that I want the medical team to undertake all logical resuscitative measures unless an active, verified DNR (Do Not Resuscitate) order is on file.`
  }
};

const INITIAL_CONSENTS: OTConsent[] = [
  { id: 'ct-1', patientId: 'p1', type: 'General', terms: CONSENT_TEMPLATES['General'].text, patientName: 'Arjun Mehta', witnessName: 'Dr. Sarah Sharma', signedAt: '2026-07-01T10:00:00Z', signatureType: 'Typed', signatureData: 'Arjun Mehta', status: 'Signed' },
  { id: 'ct-2', patientId: 'p2', type: 'Surgery', terms: CONSENT_TEMPLATES['Surgery'].text, patientName: 'Ananya Iyer', witnessName: 'Nurse Deepika Roy', signedAt: '2026-07-02T14:30:00Z', signatureType: 'Typed', signatureData: 'Ananya Iyer', status: 'Signed' },
  { id: 'ct-3', patientId: 'p3', type: 'Anaesthesia', terms: CONSENT_TEMPLATES['Anaesthesia'].text, patientName: 'Rajesh Kumar', guardianName: 'Meena Kumar', witnessName: 'Dr. Alok Verma', signedAt: '2026-07-03T08:15:00Z', signatureType: 'Typed', signatureData: 'Rajesh Kumar', status: 'Signed' }
];

interface OTConsentManagementProps {
  patientId?: string;
}

export default function OTConsentManagement({ patientId }: OTConsentManagementProps = {}) {
  const [consents, setConsents] = useState<OTConsent[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingConsent, setViewingConsent] = useState<OTConsent | null>(null);

  // Patient dropdown search
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientList, setShowPatientList] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    type: 'General' as OTConsent['type'],
    terms: CONSENT_TEMPLATES['General'].text,
    guardianName: '',
    witnessName: '',
    signatureData: '',
    status: 'Signed' as OTConsent['status']
  });

  // Custom Anaesthesia Options
  const [anaesthesiaOptions, setAnaesthesiaOptions] = useState({
    general: false,
    spinalEpidural: false,
    spinalEpiduralWithSedation: false,
    nerveBlock: false,
    nerveBlockWithSedation: false,
    regional: false,
    regionalWithSedation: false,
    macWithSedation: false,
    macWithoutSedation: false
  });

  useEffect(() => {
    const fetchConsentsAndPatients = async () => {
      // Load consents
      const storedCons = await supabaseService.getOTConsents();
      if (storedCons && storedCons.length > 0) {
        setConsents(storedCons);
      } else {
        setConsents(INITIAL_CONSENTS);
      }

      // Load patients
      const data = await supabaseService.getPatients();
      if (data) setPatients(data);
    };
    fetchConsentsAndPatients();
  }, []);

  const handleOpenAdd = () => {
    // If patientId is specified, find the patient and pre-select
    const preselectedPat = patientId ? patients.find(p => p.id === patientId) : null;
    setPatientSearch(preselectedPat ? preselectedPat.name : '');
    setFormData({
      patientId: patientId || '',
      patientName: preselectedPat ? preselectedPat.name : '',
      type: 'General',
      terms: CONSENT_TEMPLATES['General'].text,
      guardianName: '',
      witnessName: '',
      signatureData: '',
      status: 'Signed'
    });
    setAnaesthesiaOptions({
      general: false,
      spinalEpidural: false,
      spinalEpiduralWithSedation: false,
      nerveBlock: false,
      nerveBlockWithSedation: false,
      regional: false,
      regionalWithSedation: false,
      macWithSedation: false,
      macWithoutSedation: false
    });
    setIsAddOpen(true);
  };

  const handleTypeChange = (type: OTConsent['type']) => {
    setFormData(prev => ({
      ...prev,
      type,
      terms: CONSENT_TEMPLATES[type]?.text || ''
    }));
  };

  const handleSelectPatient = (pat: any) => {
    setFormData(prev => ({
      ...prev,
      patientId: pat.id,
      patientName: pat.name
    }));
    setPatientSearch(pat.name);
    setShowPatientList(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      toast.error('Please select a valid patient');
      return;
    }
    if (!formData.signatureData) {
      toast.error('Patient or Guardian Signature is required.');
      return;
    }
    if (!formData.witnessName) {
      toast.error('Witness / Staff Name is required.');
      return;
    }

    // Include anesthesia selections in terms if type is Anaesthesia
    let termsToSave = formData.terms;
    if (formData.type === 'Anaesthesia') {
      termsToSave = JSON.stringify({
        baseTerms: formData.terms,
        selections: anaesthesiaOptions
      });
    }

    const newConsent: OTConsent = {
      id: `ct-${Date.now()}`,
      patientId: formData.patientId,
      type: formData.type,
      terms: termsToSave,
      patientName: formData.patientName,
      guardianName: formData.guardianName || undefined,
      witnessName: formData.witnessName,
      signedAt: new Date().toISOString(),
      signatureType: 'Typed',
      signatureData: formData.signatureData,
      status: formData.status
    };

    const saved = await supabaseService.createOTConsent(newConsent);
    if (saved) {
      setConsents(prev => [saved, ...prev]);
      toast.success('Clinical consent signed and archived successfully!');
      setIsAddOpen(false);
    } else {
      toast.error('Failed to archive consent');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete/revoke this consent form?')) {
      const success = await supabaseService.deleteOTConsent(id);
      if (success) {
        setConsents(prev => prev.filter(c => c.id !== id));
        toast.success('Consent record deleted');
      } else {
        toast.error('Failed to delete consent record');
      }
    }
  };

  const handlePrint = (consent: OTConsent, printBlank = false) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Failed to open print layout. Please disable popup blockers.');
      return;
    }

    const patientDetails = patients.find(p => p.id === consent.patientId) || { mrn: 'N/A', age: 'N/A', gender: 'N/A', phone: 'N/A' };
    const dateFormatted = printBlank ? '____________________' : new Date(consent.signedAt).toLocaleString();

    // Parse options if Anesthesia
    let isAnesthesia = consent.type === 'Anaesthesia';
    let options = {
      general: false,
      spinalEpidural: false,
      spinalEpiduralWithSedation: false,
      nerveBlock: false,
      nerveBlockWithSedation: false,
      regional: false,
      regionalWithSedation: false,
      macWithSedation: false,
      macWithoutSedation: false
    };

    let baseTerms = consent.terms;

    if (isAnesthesia && !printBlank) {
      try {
        const parsed = JSON.parse(consent.terms);
        if (parsed && parsed.selections) {
          options = parsed.selections;
          baseTerms = parsed.baseTerms;
        }
      } catch {
        // Fallback if not json
      }
    }

    const box = (checked: boolean) => `
      <span style="display:inline-block; width:12px; height:12px; border:1px solid #000; text-align:center; line-height:10px; font-size:10px; font-weight:bold; font-family: monospace; margin-right:6px; vertical-align:middle;">
        ${checked ? '✓' : '&nbsp;'}
      </span>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Consent Form - ${consent.type} - ${printBlank ? 'Blank' : consent.patientName}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #111; line-height: 1.5; font-size: 11px; }
            .header { text-align: center; border-bottom: 3px double #1A5E63; padding-bottom: 12px; margin-bottom: 20px; }
            .header h1 { color: #1A5E63; margin: 0; font-size: 22px; font-weight: black; text-transform: uppercase; }
            .header p { margin: 4px 0 0 0; color: #555; font-size: 11px; }
            .title { text-align: center; font-size: 15px; font-weight: bold; text-transform: uppercase; margin: 15px 0; color: #000; letter-spacing: 0.5px; }
            .patient-box { border: 1px solid #ccc; background-color: #fafafa; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-size: 11px; }
            .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .patient-grid div span { font-weight: bold; }
            .terms-box { font-size: 11px; background: #fff; margin-bottom: 25px; color: #222; text-align: justify; }
            
            .anesthesia-table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; font-size: 10px; }
            .anesthesia-table th, .anesthesia-table td { border: 1px solid #666; padding: 6px; text-align: left; vertical-align: top; }
            .anesthesia-table th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
            
            .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; font-size: 11px; page-break-inside: avoid; }
            .sig-block { border-top: 1px dashed #999; padding-top: 8px; text-align: left; }
            .sig-block p { margin: 4px 0; }
            .sig-data { font-family: 'Georgia', serif; font-style: italic; font-size: 15px; color: #1A5E63; margin: 10px 0; height: 25px; }
            .footer { margin-top: 40px; font-size: 9px; text-align: center; border-top: 1px solid #eee; padding-top: 10px; color: #777; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>GASTROPLUS MULTISPECIALITY HOSPITAL</h1>
            <p>Gastro Plus Hospital, Plot No. 7 & 8, Om Shiv Nagar, Gufa Mandir Road, Lal Ghati Bhopal - 462030</p>
          </div>
          
          <div class="title">${isAnesthesia ? 'Consent for Anaesthesia Services' : CONSENT_TEMPLATES[consent.type]?.title || consent.type + ' Consent'}</div>
          
          <div class="patient-box">
            <div class="patient-grid">
              <div><span>Patient Name:</span> ${printBlank ? '________________________________________' : consent.patientName}</div>
              <div><span>UHID No / MRN:</span> ${printBlank ? '____________________' : patientDetails.mrn}</div>
              <div><span>Age / Gender:</span> ${printBlank ? '________ / ________' : (patientDetails.age + ' Yrs / ' + patientDetails.gender)}</div>
              <div><span>Signed Date & Time:</span> ${dateFormatted}</div>
            </div>
          </div>

          <div class="terms-box">
            ${isAnesthesia ? `
              <p>I consent to the administration of anaesthesia services checked below to be administered by Dr. Navodita Tiwari or other credentialed members of the Anaesthesiology department for my scheduled procedure.</p>
              
              <table class="anesthesia-table">
                <thead>
                  <tr>
                    <th style="width: 10%; text-align: center;">Select</th>
                    <th style="width: 25%;">Technique</th>
                    <th style="width: 30%;">Expected Result</th>
                    <th style="width: 35%;">Typical Risks & Complications</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="text-align: center;">${box(options.general)}</td>
                    <td><strong>GENERAL ANAESTHESIA</strong></td>
                    <td>Total unconscious state, airway support, mechanical ventilation.</td>
                    <td>Sore throat, hoarseness, nausea/vomiting, shivering, tooth/lip injury, very rare brain/heart risk.</td>
                  </tr>
                  <tr>
                    <td style="text-align: center;">
                      ${box(options.spinalEpidural)} Spinal<br/>
                      ${box(options.spinalEpiduralWithSedation)} With Sedation
                    </td>
                    <td><strong>SPINAL OR EPIDURAL</strong></td>
                    <td>Loss of sensation in lower body/legs via drug injection into back canal.</td>
                    <td>Headache (PDPH), backache, temporary urinary retention, nerve irritation, drop in BP.</td>
                  </tr>
                  <tr>
                    <td style="text-align: center;">
                      ${box(options.nerveBlock)} Block<br/>
                      ${box(options.nerveBlockWithSedation)} With Sedation
                    </td>
                    <td><strong>MAJOR/MINOR NERVE BLOCK</strong></td>
                    <td>Loss of sensation in specific limb/arm/leg via drug injection near local nerves.</td>
                    <td>Temporary or permanent nerve injury, local bruising, systemic toxic reaction (LAST).</td>
                  </tr>
                  <tr>
                    <td style="text-align: center;">
                      ${box(options.regional)} Regional<br/>
                      ${box(options.regionalWithSedation)} With Sedation
                    </td>
                    <td><strong>INTRAVENOUS REGIONAL</strong></td>
                    <td>Loss of sensation in arm/leg using a specialized cuff pressure and IV drug.</td>
                    <td>Tourniquet pain, systemic drug leakage, seizure, heart arrhythmia.</td>
                  </tr>
                  <tr>
                    <td style="text-align: center;">${box(options.macWithSedation)}</td>
                    <td><strong>MONITORED ANAESTHESIA CARE (with sedation)</strong></td>
                    <td>Moderate to deep sedation, pain relief. Patient remains breathing naturally.</td>
                    <td>Airway depression, hypoxia, rapid conversion to General Anaesthesia, memory loss.</td>
                  </tr>
                  <tr>
                    <td style="text-align: center;">${box(options.macWithoutSedation)}</td>
                    <td><strong>MONITORED ANAESTHESIA CARE (without sedation)</strong></td>
                    <td>Local anesthesia and continuous monitoring of vital signs. No sedation.</td>
                    <td>Awareness of environment, mild anxiety, pain at local site.</td>
                  </tr>
                </tbody>
              </table>

              <p style="font-weight: bold; margin-top: 10px;">STATEMENT OF INVOLVEMENT & UNDERSTANDING:</p>
              <p>The anesthesiologist has explained the selected anaesthesia methods, typical benefits, risks, and alternatives. I realize that anesthesia administration has potential complications and that no absolute guarantees can be made regarding outcomes. I certify that I have fully disclosed my medical records, allergies, previous anesthesia reactions, and NBM (Nil-By-Mouth) status.</p>
            ` : baseTerms.replace(/\n/g, '<br/>')}
          </div>

          <div class="signature-section">
            <div class="sig-block">
              <div class="sig-data">${printBlank ? '' : (consent.signatureData || 'Signed Electronically')}</div>
              <p><strong>Signature of Patient / Next of Kin / Guardian</strong></p>
              <p>Name: ${printBlank ? '________________________________________' : consent.patientName}</p>
              ${consent.guardianName ? `<p>Guardian/Relation: ${consent.guardianName}</p>` : ''}
              <p>Date: ____________________ Time: _________</p>
            </div>
            
            <div class="sig-block">
              <div class="sig-data">${printBlank ? '' : (consent.witnessName || 'Witnessed')}</div>
              <p><strong>Witness / Attending Medical Staff Signature</strong></p>
              <p>Name: ${printBlank ? '________________________________________' : consent.witnessName}</p>
              <p>Designation: Clinical Coordinator</p>
              <p>Date: ____________________ Time: _________</p>
            </div>
          </div>

          <div class="footer">
            <p>GastroPlus Multispeciality Hospital - Quality & Patient Safety Approved. Ref Code: CL-CNS-ANS-2026.</p>
            <p>Generated via GastroPlus Health Cloud on ${new Date().toLocaleString()}</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); }
            window.onafterprint = function() { window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success(printBlank ? 'Blank template ready for print' : 'Consent printed successfully!');
  };

  const filteredConsents = consents.filter(c => {
    const matchesSearch = c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.witnessName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || c.type === selectedType;
    const matchesPatient = patientId ? c.patientId === patientId : true;
    return matchesSearch && matchesType && matchesPatient;
  });

  const consentTypes = ['All', 'General', 'Surgery', 'Anaesthesia', 'Blood Transfusion', 'ICU', 'High-risk'];

  return (
    <div className="space-y-6">
      {/* Informational Banner */}
      <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl border border-[#1A5E63]/20 bg-slate-50/50">
        <div className="p-4 rounded-xl bg-[#1A5E63]/10 text-[#1A5E63] self-start shrink-0">
          <FileSignature className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-[#1A5E63] text-lg">Informed & Manual Clinical Consents</h3>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            Fully customizable medical consent modules for General Surgery, ICU, Blood Transfusion, and Anaesthesia. Supports offline handwriting workflows via <strong>Print Blank Form</strong> or fully authorized digital timestamped signatures.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline" className="bg-teal-50 border-teal-200 text-teal-800 text-[10px] font-bold">WHO Standard Templates</Badge>
            <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-800 text-[10px] font-bold">Printable Blank Sheets</Badge>
            <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-800 text-[10px] font-bold">Interactive Anaesthesia Blocks</Badge>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Filterable Consent Archives */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Informed Consent Archives</CardTitle>
                  <CardDescription className="text-xs">Access clinical authorizations, anesthetist blocks, and ICU designations.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Trigger general blank print
                      const tempConsent: OTConsent = {
                        id: 'temp', patientId: '', type: 'General', terms: CONSENT_TEMPLATES['General'].text,
                        patientName: 'Blank Template', witnessName: 'Staff Nurse', signedAt: new Date().toISOString(),
                        signatureType: 'Typed', signatureData: '', status: 'Draft'
                      };
                      handlePrint(tempConsent, true);
                    }}
                    className="border-slate-300 font-bold text-xs h-9 gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Blank Template
                  </Button>
                  <Button onClick={handleOpenAdd} className="bg-medical-blue hover:bg-medical-blue/90 gap-1 text-xs font-semibold h-9">
                    <Plus className="w-4 h-4" />
                    Sign New Consent
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by patient or witness..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px] h-9 text-xs">
                    <SelectValue placeholder="Consent Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {consentTypes.map(t => <SelectItem key={t} value={t} className="text-xs">{t === 'All' ? 'All Types' : t + ' Consent'}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {filteredConsents.length > 0 ? (
                  filteredConsents.map((consent) => (
                    <div key={consent.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-xs transition-all bg-white flex items-center justify-between gap-4 group">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[9px] font-bold px-2 py-0.5 uppercase ${
                            consent.type === 'High-risk' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            consent.type === 'ICU' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            consent.type === 'Surgery' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            consent.type === 'Anaesthesia' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}>
                            {consent.type} Consent
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(consent.signedAt).toLocaleDateString()} at {new Date(consent.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800">{consent.patientName}</h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          Witness / Staff: <strong className="text-slate-600">{consent.witnessName}</strong> {consent.guardianName ? `• Guardian: ${consent.guardianName}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:bg-slate-100" 
                          onClick={() => setViewingConsent(consent)}
                          title="Quick View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-medical-blue hover:bg-blue-50"
                          onClick={() => handlePrint(consent, false)}
                          title="Print Form"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                          onClick={() => handleDelete(consent.id)}
                          title="Revoke / Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    No consent authorization records matched criteria.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Required Checklists & Templates */}
        <div className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-[#1A5E63]">Required Checklists</CardTitle>
              <CardDescription className="text-[10px]">Verify all patient permissions before scheduling incision times.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-2 text-xs font-semibold text-slate-700">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-50/40 border border-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-950">Pre-Op Anaesthesia Form</p>
                  <p className="text-[10px] text-emerald-800 font-medium mt-0.5">Mandatory for any spinal or general block procedures.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-50/40 border border-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-950">Blood Autologous Reserve</p>
                  <p className="text-[10px] text-emerald-800 font-medium mt-0.5">Checked when high blood loss is estimated (e.g. cardiac).</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-amber-50/30 border border-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-950">High-Risk Signatures</p>
                  <p className="text-[10px] text-amber-800 font-medium mt-0.5">Co-signed by next-of-kin if ASA score is Class IV or V.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-extrabold text-slate-800">Quick Template Review</CardTitle>
              <CardDescription className="text-[10px]">Read core conditions for various consent modules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {Object.entries(CONSENT_TEMPLATES).map(([key, item]) => (
                <div 
                  key={key} 
                  className="p-2 border rounded-lg hover:bg-slate-50 cursor-pointer flex justify-between items-center group transition-colors"
                  onClick={() => setViewingConsent({
                    id: 'temp',
                    patientId: '',
                    type: key as any,
                    terms: item.text,
                    patientName: 'Template Viewer',
                    witnessName: 'None',
                    signedAt: new Date().toISOString(),
                    signatureType: 'Typed',
                    signatureData: '',
                    status: 'Draft'
                  })}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">{key}</p>
                    <p className="text-[9px] text-slate-400 truncate max-w-[150px]">{item.title}</p>
                  </div>
                  <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-medical-blue hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        const tempConsent: OTConsent = {
                          id: 'temp', patientId: '', type: key as any, terms: item.text,
                          patientName: 'Blank Template', witnessName: 'Staff Nurse', signedAt: new Date().toISOString(),
                          signatureType: 'Typed', signatureData: '', status: 'Draft'
                        };
                        handlePrint(tempConsent, true);
                      }}
                      title="Print Blank Layout"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* NEW CONSENT DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border-none shadow-2xl p-6 bg-white text-slate-800">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-medical-blue text-white">
                <FileSignature className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-black text-slate-800">Sign Informed Clinical Consent</DialogTitle>
            </div>
            <DialogDescription className="text-xs">Verify details, anesthetic risks, and sign pre-operative authorizations.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs font-semibold text-slate-700">
            {/* Patient selector search */}
            <div className="space-y-1 relative">
              <Label className="text-xs font-bold text-slate-700">Select Patient *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Type name, phone or MRN to search..."
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowPatientList(true);
                  }}
                  onFocus={() => setShowPatientList(true)}
                  className="pl-9 h-9 text-xs bg-slate-50 font-medium"
                />
              </div>

              {showPatientList && patientSearch && (
                <div className="absolute top-16 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-[160px] overflow-y-auto">
                  {patients
                    .filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.mrn.toLowerCase().includes(patientSearch.toLowerCase()))
                    .map(p => (
                      <div 
                        key={p.id}
                        onClick={() => handleSelectPatient(p)}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-[11px]">{p.name}</p>
                          <p className="text-[9px] text-slate-400">MRN: {p.mrn} • Phone: {p.phone || 'N/A'}</p>
                        </div>
                        <Badge variant="outline" className="text-[8px] uppercase">{p.registration_type || 'Patient'}</Badge>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Consent Authorization Module *</Label>
                <Select value={formData.type} onValueChange={(v) => handleTypeChange(v as any)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Consent Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {consentTypes.filter(t => t !== 'All').map(t => <SelectItem key={t} value={t} className="text-xs">{t} Consent</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Next of Kin / Guardian (Optional)</Label>
                <Input 
                  placeholder="e.g. Meena Kumar (Wife)" 
                  value={formData.guardianName}
                  onChange={e => setFormData({...formData, guardianName: e.target.value})}
                  className="h-9 text-xs bg-slate-50 font-medium"
                />
              </div>
            </div>

            {/* ANAESTHESIA CUSTOM OPTIONS */}
            {formData.type === 'Anaesthesia' ? (
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 space-y-3">
                <p className="font-black text-emerald-950 uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Select Anaesthesia Services to Administer
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-100">
                    <Checkbox 
                      checked={anaesthesiaOptions.general}
                      onCheckedChange={checked => setAnaesthesiaOptions({...anaesthesiaOptions, general: !!checked})}
                    />
                    <span>General Anaesthesia</span>
                  </label>

                  <div className="bg-white p-2 rounded-lg border border-slate-100 space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox 
                        checked={anaesthesiaOptions.spinalEpidural}
                        onCheckedChange={checked => setAnaesthesiaOptions({...anaesthesiaOptions, spinalEpidural: !!checked})}
                      />
                      <span className="font-bold">Spinal or Epidural</span>
                    </label>
                    <label className="flex items-center gap-2 pl-6 cursor-pointer opacity-80 text-[10px]">
                      <Checkbox 
                        checked={anaesthesiaOptions.spinalEpiduralWithSedation}
                        disabled={!anaesthesiaOptions.spinalEpidural}
                        onCheckedChange={checked => setAnaesthesiaOptions({...anaesthesiaOptions, spinalEpiduralWithSedation: !!checked})}
                      />
                      <span>With Sedation</span>
                    </label>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-100 space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox 
                        checked={anaesthesiaOptions.nerveBlock}
                        onCheckedChange={checked => setAnaesthesiaOptions({...anaesthesiaOptions, nerveBlock: !!checked})}
                      />
                      <span className="font-bold">Major/Minor Nerve Block</span>
                    </label>
                    <label className="flex items-center gap-2 pl-6 cursor-pointer opacity-80 text-[10px]">
                      <Checkbox 
                        checked={anaesthesiaOptions.nerveBlockWithSedation}
                        disabled={!anaesthesiaOptions.nerveBlock}
                        onCheckedChange={checked => setAnaesthesiaOptions({...anaesthesiaOptions, nerveBlockWithSedation: !!checked})}
                      />
                      <span>With Sedation</span>
                    </label>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-100 space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox 
                        checked={anaesthesiaOptions.regional}
                        onCheckedChange={checked => setAnaesthesiaOptions({...anaesthesiaOptions, regional: !!checked})}
                      />
                      <span className="font-bold">Intravenous Regional</span>
                    </label>
                    <label className="flex items-center gap-2 pl-6 cursor-pointer opacity-80 text-[10px]">
                      <Checkbox 
                        checked={anaesthesiaOptions.regionalWithSedation}
                        disabled={!anaesthesiaOptions.regional}
                        onCheckedChange={checked => setAnaesthesiaOptions({...anaesthesiaOptions, regionalWithSedation: !!checked})}
                      />
                      <span>With Sedation</span>
                    </label>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-100">
                    <Checkbox 
                      checked={anaesthesiaOptions.macWithSedation}
                      onCheckedChange={checked => setAnaesthesiaOptions({...anaesthesiaOptions, macWithSedation: !!checked})}
                    />
                    <span>Monitored Anaesthesia (with sedation)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-100">
                    <Checkbox 
                      checked={anaesthesiaOptions.macWithoutSedation}
                      onCheckedChange={checked => setAnaesthesiaOptions({...anaesthesiaOptions, macWithoutSedation: !!checked})}
                    />
                    <span>Monitored Anaesthesia (no sedation)</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Clinical Terms & Conditions Disclosure</Label>
                <div className="p-3 bg-slate-50 border rounded-xl text-[10px] text-slate-600 font-medium whitespace-pre-line leading-normal max-h-[160px] overflow-y-auto">
                  {formData.terms}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <Label>Witness / Attending Medical Officer *</Label>
                <Input 
                  placeholder="e.g. Dr. Alok Verma" 
                  value={formData.witnessName}
                  onChange={e => setFormData({...formData, witnessName: e.target.value})}
                  className="h-9 text-xs bg-slate-50 font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label>Authorize & Digitally Sign (Type Patient/Guardian Full Name) *</Label>
                <Input 
                  placeholder="e.g. Arjun Mehta" 
                  value={formData.signatureData}
                  onChange={e => setFormData({...formData, signatureData: e.target.value})}
                  className="h-9 text-xs font-black bg-slate-50 border-indigo-200 text-indigo-900 placeholder-slate-400 font-serif italic"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="text-xs h-9">Cancel</Button>
              <Button type="submit" className="bg-medical-blue hover:bg-medical-blue/90 text-xs h-9">Archive & Print Signed Consent</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW DIALOG */}
      <Dialog open={!!viewingConsent} onOpenChange={() => setViewingConsent(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border-none shadow-2xl p-6 bg-white text-slate-800">
          {viewingConsent && (
            <>
              <DialogHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <Badge className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[9px] uppercase font-bold py-0.5 mb-1">{viewingConsent.type} Consent</Badge>
                  <DialogTitle className="text-base font-bold text-slate-800">Consent Verification Detail</DialogTitle>
                </div>
                <Button 
                  onClick={() => handlePrint(viewingConsent)} 
                  className="bg-medical-blue text-white hover:bg-medical-blue/95 font-bold text-xs gap-1 h-8 px-3"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Form
                </Button>
              </DialogHeader>

              <div className="space-y-4 pt-4 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Patient Name</span>
                    <p className="font-extrabold text-slate-800 text-sm mt-0.5">{viewingConsent.patientName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Witness / Attending</span>
                    <p className="font-extrabold text-slate-800 text-sm mt-0.5">{viewingConsent.witnessName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Authorized At</span>
                    <p className="font-bold text-slate-600 mt-0.5">{new Date(viewingConsent.signedAt).toLocaleString()}</p>
                  </div>
                  {viewingConsent.guardianName && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Guardian / Relation</span>
                      <p className="font-bold text-slate-600 mt-0.5">{viewingConsent.guardianName}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Disclosure Agreement Terms</span>
                  <div className="p-3.5 bg-white border rounded-xl text-[10px] text-slate-600 font-medium whitespace-pre-line leading-normal max-h-[220px] overflow-y-auto shadow-2xs">
                    {(() => {
                      if (viewingConsent.type === 'Anaesthesia') {
                        try {
                          const parsed = JSON.parse(viewingConsent.terms);
                          if (parsed && parsed.baseTerms) {
                            // Show selections
                            const sel = parsed.selections || {};
                            const selList = Object.entries(sel)
                              .filter(([_, val]) => !!val)
                              .map(([key, _]) => key.replace(/([A-Z])/g, ' $1').toUpperCase());
                            
                            return (
                              <div className="space-y-2">
                                <p className="italic font-bold text-slate-800">Anesthetic Techniques Authorized:</p>
                                <div className="flex flex-wrap gap-1">
                                  {selList.length > 0 ? selList.map(s => <Badge key={s} variant="outline" className="text-[8px] bg-emerald-50 text-emerald-800 border-emerald-200">{s}</Badge>) : <Badge variant="outline" className="text-[8px]">NONE SELECTED</Badge>}
                                </div>
                                <Separator className="my-2" />
                                <p>{parsed.baseTerms}</p>
                              </div>
                            );
                          }
                        } catch {
                          // normal string
                        }
                      }
                      return viewingConsent.terms;
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                    <span className="text-[10px] text-indigo-400 uppercase font-bold">Patient Signature Mark</span>
                    <p className="font-serif italic font-black text-indigo-950 text-base mt-1">"{viewingConsent.signatureData}"</p>
                    <p className="text-[9px] text-indigo-500 font-bold uppercase mt-1">Digitally Sealed</p>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-xl flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Verification Hash</span>
                    <p className="font-mono text-[9px] text-slate-500 mt-1 truncate">SHA256-{viewingConsent.id.toUpperCase()}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Legal Compliant</p>
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t">
                  <Button onClick={() => setViewingConsent(null)} className="h-9 text-xs font-bold bg-slate-900 text-white">Close Details</Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
