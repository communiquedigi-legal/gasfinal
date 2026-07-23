export interface PrintPatient {
  name: string;
  age?: number | string;
  gender?: string;
  mrn?: string;
  phone?: string;
  fatherName?: string;
  allergies?: string | string[];
  pastHistory?: string;
  medicalHistory?: string;
  clinicalHistory?: string;
  history?: string;
  complaints?: string;
}

export interface PrintMedicine {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  time?: string;
  startTime?: string;
  instructions?: string;
  route?: string;
  remarks?: string;
}

export interface PrintVitals {
  temp?: string | number;
  temperature?: string | number;
  bp?: string;
  blood_pressure?: string;
  bloodPressure?: string;
  bpSystolic?: string | number;
  bpDiastolic?: string | number;
  pulse?: string | number;
  pulse_rate?: string | number;
  pulseRate?: string | number;
  spo2?: string | number;
  weight?: string | number;
  height?: string | number;
  bmi?: string | number;
  rr?: string | number;
  respiration?: string | number;
  respRate?: string | number;
  cbs?: string;
  rs?: string;
  cns?: string;
  cvs?: string;
  pa?: string;
  pr?: string;
  rbs?: string;
  grbs?: string;
  sugar?: string;
  blood_sugar?: string;
  gcs?: string;
  gcsTotal?: string;
  painScale?: string;
  pallor?: string;
  icterus?: string;
  edema?: string;
  clubbing?: string;
  cyanosis?: string;
  lymphadenopathy?: string;
}

export interface PrintPrescription {
  date?: string;
  medicines: PrintMedicine[];
  advice?: string;
  diagnosis?: string;
  notes?: string;
  examinationFindings?: string;
  pastHistory?: string;
  allergies?: string | string[];
  complaints?: string;
  chiefComplaints?: string;
  drawing?: string;
  photos?: string[];
  attachmentUrl?: string;
  attachmentName?: string;
  vitals?: PrintVitals;
  findings?: string;
  suggestions?: string;
  investigationsAdvised?: string | string[];
  followUpDate?: string;
}

export interface PrintDoctor {
  name?: string;
  degree?: string;
  specialization?: string;
  department?: string;
  id?: string;
}

export function getPrescriptionPrintHtml(
  patient: PrintPatient,
  prescription: PrintPrescription,
  doctor?: PrintDoctor,
  hospitalInfo?: { name: string; address: string; phone: string },
  templateImage?: string | null
): string {
  const actualTemplateImage = templateImage !== undefined ? templateImage : (typeof window !== 'undefined' ? localStorage.getItem('hms_template_image') : null);

  // Parse whether there is a valid custom preprinted background letterhead image (to overlay on)
  const isValidTemplateImage = !!(
    actualTemplateImage &&
    typeof actualTemplateImage === 'string' &&
    actualTemplateImage.trim() !== '' &&
    actualTemplateImage !== 'null' &&
    actualTemplateImage !== 'undefined' &&
    (actualTemplateImage.startsWith('http') || actualTemplateImage.startsWith('data:image') || actualTemplateImage.startsWith('/'))
  );

  const hospName = hospitalInfo?.name || 'NEW GASTRO PLUS HOSPITAL';
  const hospAddress = hospitalInfo?.address || 'Gastro Plus Hospital, Plot No. 7 & 8 ,Om Shiv Nagar, Gufa Mandir Road,Lal Ghati Bhopal,462030, Madhya Pradesh';
  const hospPhone = hospitalInfo?.phone || '9109102145/9109101246';
  
  const patName = patient?.name || 'N/A';
  const patAgeGender = `${patient?.age || 'N/A'}Y / ${patient?.gender || 'N/A'}`;
  const presDate = prescription?.date || new Date().toISOString().split('T')[0];
  const patMRN = patient?.mrn || 'N/A';
  const patPhone = patient?.phone || '';
  const patFatherName = patient?.fatherName || (patient as any)?.father_name || '';

  // Extract advice, examination, history, allergies, drawing, diagnosis, photos
  let advText = prescription.advice || prescription.suggestions || prescription.notes || '';
  let examFindings = prescription.examinationFindings || prescription.findings || '';
  let drawImg = prescription.drawing || '';
  let diag = prescription.diagnosis || '';
  let photoList: string[] = prescription.photos ? [...prescription.photos] : [];
  
  // Combine vitals from patient object and prescription
  let vts: any = {
    ...((patient as any)?.vitals || {}),
    ...(prescription?.vitals || {})
  };

  // Extract complaints, allergies, and clinical history from prescription or patient record
  let rawAllergies = prescription.allergies || patient?.allergies || (patient as any)?.known_allergies || (patient as any)?.allergy || (patient as any)?.allergies_list;
  let allergiesText = '';
  if (Array.isArray(rawAllergies)) {
    allergiesText = rawAllergies.filter(Boolean).join(', ');
  } else if (typeof rawAllergies === 'string') {
    allergiesText = rawAllergies.trim();
  }

  let pastHist = prescription.pastHistory || patient?.pastHistory || patient?.medicalHistory || patient?.clinicalHistory || patient?.history || (patient as any)?.medical_history || (patient as any)?.past_history || (patient as any)?.past_medical_history || '';

  let complaintsText = prescription.complaints || prescription.chiefComplaints || patient?.complaints || (patient as any)?.presentingComplaints || (patient as any)?.chief_complaints || (patient as any)?.symptoms || '';

  if (prescription.attachmentUrl && prescription.attachmentUrl.startsWith('data:image')) {
    if (!photoList.includes(prescription.attachmentUrl)) {
      photoList.push(prescription.attachmentUrl);
    }
  }

  // Try deserializing advice if it's stored as JSON
  if (typeof advText === 'string' && advText.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(advText);
      if (parsed && typeof parsed === 'object') {
        advText = parsed.advice || parsed.suggestions || '';
        if (parsed.examinationFindings) examFindings = parsed.examinationFindings;
        if (parsed.findings && !examFindings) examFindings = parsed.findings;
        if (parsed.pastHistory && !pastHist) pastHist = parsed.pastHistory;
        if (parsed.allergies && !allergiesText) {
          allergiesText = typeof parsed.allergies === 'string' ? parsed.allergies : (Array.isArray(parsed.allergies) ? parsed.allergies.join(', ') : '');
        }
        if (parsed.complaints && !complaintsText) complaintsText = parsed.complaints;
        if (parsed.drawing) drawImg = parsed.drawing;
        if (parsed.diagnosis && !diag) diag = parsed.diagnosis;
        if (parsed.vitals) vts = { ...vts, ...parsed.vitals };
        if (parsed.photos && Array.isArray(parsed.photos)) {
          parsed.photos.forEach((ph: string) => {
            if (ph && !photoList.includes(ph)) photoList.push(ph);
          });
        }
        if (parsed.attachmentUrl && parsed.attachmentUrl.startsWith('data:image')) {
          if (!photoList.includes(parsed.attachmentUrl)) photoList.push(parsed.attachmentUrl);
        }
      }
    } catch (e) {
      // Not JSON or parse failed
    }
  }

  // Extract comprehensive vitals
  const bpVal = vts?.bp || (vts?.bpSystolic && vts?.bpDiastolic ? `${vts.bpSystolic}/${vts.bpDiastolic}` : vts?.blood_pressure || vts?.bloodPressure || '');
  const pulseVal = vts?.pulse !== undefined && vts?.pulse !== 0 && vts?.pulse !== '0' ? String(vts.pulse) : (vts?.pulse_rate || vts?.pulseRate ? String(vts.pulse_rate || vts.pulseRate) : '');
  const tempVal = vts?.temp !== undefined && vts?.temp !== '' ? String(vts.temp) : (vts?.temperature !== undefined && vts?.temperature !== '' ? String(vts.temperature) : '');
  const spo2Val = vts?.spo2 !== undefined && vts?.spo2 !== 0 && vts?.spo2 !== '0' ? String(vts.spo2) : '';
  const weightVal = vts?.weight !== undefined && vts?.weight !== '' ? String(vts.weight) : '';
  const heightVal = vts?.height !== undefined && vts?.height !== '' ? String(vts.height) : '';
  const bmiVal = vts?.bmi !== undefined && vts?.bmi !== '' ? String(vts.bmi) : '';
  const rrVal = vts?.rr !== undefined && vts?.rr !== 0 && vts?.rr !== '0' ? String(vts.rr) : (vts?.respiration || vts?.respRate ? String(vts.respiration || vts.respRate) : '');
  const cbsVal = vts?.cbs || '';
  const rsVal = vts?.rs || '';
  const cnsVal = vts?.cns || '';
  const cvsVal = vts?.cvs || '';
  const paVal = vts?.pa || '';
  const prVal = vts?.pr || '';
  const rbsVal = vts?.rbs || vts?.grbs || vts?.sugar || vts?.blood_sugar || '';
  const gcsVal = vts?.gcs || vts?.gcsTotal || '';
  const painVal = vts?.painScale || '';

  // General Exam
  const genExamParts = [];
  if (vts?.pallor) genExamParts.push(`Pallor: ${vts.pallor}`);
  if (vts?.icterus) genExamParts.push(`Icterus: ${vts.icterus}`);
  if (vts?.edema) genExamParts.push(`Edema: ${vts.edema}`);
  if (vts?.clubbing) genExamParts.push(`Clubbing: ${vts.clubbing}`);
  if (vts?.cyanosis) genExamParts.push(`Cyanosis: ${vts.cyanosis}`);
  if (vts?.lymphadenopathy) genExamParts.push(`Lymphadenopathy: ${vts.lymphadenopathy}`);
  const genExamStr = genExamParts.join(' | ');

  const docName = doctor?.name || 'Attending Doctor';
  const docReg = doctor?.degree ? `Reg No: MC-${doctor.id?.toUpperCase() || '1234567'}` : 'Reg No: MC1234567';
  const docSpecialty = doctor?.specialization || doctor?.department || 'Senior Consultant';

  // Format Medicines content
  let medContent = '';
  if (prescription.medicines && prescription.medicines.length > 0) {
    medContent = prescription.medicines.map((m, idx) => {
      const nameStr = m.name || 'Medicine';
      const dosageStr = m.dosage || '-';
      const freqStr = m.frequency || '-';
      const durStr = m.duration || '-';
      const instStr = m.instructions || m.time || m.remarks || m.startTime || '';
      return `
        <tr style="border-bottom: 1.5px solid #e2e8f0; page-break-inside: avoid;">
          <td style="padding: 10px 12px; font-weight: 700; color: #0f172a; font-size: 13px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #64748b; font-size: 11px; font-weight: 600;">${idx + 1}.</span>
              <span>${nameStr}</span>
            </div>
            ${m.route ? `<span style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 9.5px; font-weight: 700; padding: 1px 5px; border-radius: 4px; margin-top: 2px;">${m.route}</span>` : ''}
          </td>
          <td style="padding: 10px 12px; font-weight: 600; color: #334155; font-size: 13px;">${dosageStr}</td>
          <td style="padding: 10px 12px; font-weight: 600; color: #334155; font-size: 13px;">${freqStr}</td>
          <td style="padding: 10px 12px; font-weight: 600; color: #334155; font-size: 13px;">${durStr}</td>
          <td style="padding: 10px 12px; font-weight: 600; color: #1e3a8a; font-size: 12px;">${instStr || '-'}</td>
        </tr>
      `;
    }).join('');
  } else {
    for (let i = 0; i < 4; i++) {
      medContent += `
        <tr style="border-bottom: 1px dotted #cbd5e1; height: 40px; page-break-inside: avoid;">
          <td style="padding: 10px 12px;"></td>
          <td style="padding: 10px 12px;"></td>
          <td style="padding: 10px 12px;"></td>
          <td style="padding: 10px 12px;"></td>
          <td style="padding: 10px 12px;"></td>
        </tr>
      `;
    }
  }

  // Format Diagnosis, Examination Findings, Advice, Drawing, and Doctor Photos content
  let clinicalSummaryHtml = `
    <div style="margin-bottom: 12px; font-family: 'Plus Jakarta Sans', sans-serif; display: flex; flex-direction: column; gap: 8px; page-break-inside: avoid;">
      <!-- Documented Allergies -->
      ${allergiesText ? `
        <div style="background: #fff5f5; border: 1.5px solid #fecaca; border-radius: 6px; padding: 7px 12px; border-left: 4px solid #dc2626;">
          <div style="font-weight: 800; font-size: 10px; text-transform: uppercase; color: #b91c1c; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
            <span>⚠️ DOCUMENTED ALLERGIES & DRUG SENSITIVITIES:</span>
          </div>
          <div style="font-size: 12.5px; color: #7f1d1d; font-weight: 800; margin-top: 2px; white-space: pre-wrap;">${allergiesText}</div>
        </div>
      ` : `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 5px 10px; border-left: 3px solid #16a34a; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 10px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">🛡️ Documented Allergies:</span>
          <span style="font-size: 11.5px; color: #15803d; font-weight: 700;">No Known Drug Allergies (NKDA) Recorded</span>
        </div>
      `}

      <!-- Clinical History, Complaints & Diagnosis -->
      ${(complaintsText || pastHist || diag) ? `
        <div style="display: flex; flex-wrap: wrap; gap: 8px; width: 100%;">
          ${complaintsText ? `
            <div style="flex: 1; min-width: 220px; background: #f0fdfa; border: 1.5px solid #ccfbf1; border-radius: 6px; padding: 7px 10px; border-left: 3.5px solid #0d9488;">
              <div style="font-weight: 800; font-size: 9.5px; text-transform: uppercase; color: #0f766e; letter-spacing: 0.05em;">💬 Chief Complaints / Symptoms:</div>
              <div style="font-size: 12px; color: #115e59; font-weight: 600; margin-top: 2px; white-space: pre-wrap;">${complaintsText}</div>
            </div>
          ` : ''}

          ${pastHist ? `
            <div style="flex: 1; min-width: 220px; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 6px; padding: 7px 10px; border-left: 3.5px solid #4b5563;">
              <div style="font-weight: 800; font-size: 9.5px; text-transform: uppercase; color: #374151; letter-spacing: 0.05em;">📋 Clinical & Past Medical History:</div>
              <div style="font-size: 12px; color: #1f2937; font-weight: 600; margin-top: 2px; white-space: pre-wrap;">${pastHist}</div>
            </div>
          ` : ''}

          ${diag ? `
            <div style="width: 100%; background: #fef2f2; border: 1.5px solid #fee2e2; border-radius: 6px; padding: 7px 10px; border-left: 3.5px solid #dc2626;">
              <div style="font-weight: 800; font-size: 9.5px; text-transform: uppercase; color: #dc2626; letter-spacing: 0.05em;">🩺 Diagnosis / Clinical Impression:</div>
              <div style="font-size: 12.5px; color: #0f172a; font-weight: 800; margin-top: 2px;">${diag}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;

  let additionalSections = '';

  if (examFindings) {
    additionalSections += `
      <div style="margin-top: 14px; font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; page-break-inside: avoid;">
        <div style="font-weight: 800; font-size: 10.5px; text-transform: uppercase; color: #0284c7; letter-spacing: 0.06em; margin-bottom: 4px;">🔍 Examination Findings (O/E Findings):</div>
        <div style="font-size: 12.5px; color: #0c4a6e; font-weight: 600; line-height: 1.5; background: #f0f9ff; border: 1.5px solid #e0f2fe; border-radius: 6px; padding: 8px 12px; border-left: 4px solid #0284c7; white-space: pre-wrap;">${examFindings}</div>
      </div>
    `;
  }

  if (advText) {
    additionalSections += `
      <div style="margin-top: 14px; font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; page-break-inside: avoid;">
        <div style="font-weight: 800; font-size: 10.5px; text-transform: uppercase; color: #059669; letter-spacing: 0.06em; margin-bottom: 4px;">💡 Clinical Remarks, Suggestions & Advice:</div>
        <div style="font-size: 12.5px; color: #064e3b; font-weight: 600; line-height: 1.5; background: #ecfdf5; border: 1.5px solid #d1fae5; border-radius: 6px; padding: 8px 12px; border-left: 4px solid #059669; white-space: pre-wrap;">${advText}</div>
      </div>
    `;
  }

  if (prescription.investigationsAdvised) {
    const invStr = Array.isArray(prescription.investigationsAdvised) 
      ? prescription.investigationsAdvised.join(', ') 
      : String(prescription.investigationsAdvised);
    if (invStr.trim()) {
      additionalSections += `
        <div style="margin-top: 14px; font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; page-break-inside: avoid;">
          <div style="font-weight: 800; font-size: 10.5px; text-transform: uppercase; color: #4338ca; letter-spacing: 0.06em; margin-bottom: 4px;">🧪 Investigations / Lab & Radiology Advised:</div>
          <div style="font-size: 12.5px; color: #312e81; font-weight: 700; line-height: 1.5; background: #eef2ff; border: 1.5px solid #c7d2fe; border-radius: 6px; padding: 8px 12px; border-left: 4px solid #4338ca;">${invStr}</div>
        </div>
      `;
    }
  }

  if (prescription.followUpDate) {
    additionalSections += `
      <div style="margin-top: 14px; font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; page-break-inside: avoid;">
        <div style="font-weight: 800; font-size: 10.5px; text-transform: uppercase; color: #047857; letter-spacing: 0.06em; margin-bottom: 4px;">📅 Follow-up / Next Visit Date:</div>
        <div style="font-size: 13px; color: #065f46; font-weight: 800; line-height: 1.5; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 6px; padding: 8px 12px; border-left: 4px solid #047857; display: inline-block;">${prescription.followUpDate}</div>
      </div>
    `;
  }

  if (drawImg) {
    additionalSections += `
      <div style="margin-top: 14px; font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; page-break-inside: avoid;">
        <div style="font-weight: 800; font-size: 10.5px; text-transform: uppercase; color: #7c3aed; letter-spacing: 0.06em; margin-bottom: 4px;">🎨 Clinical Diagram / Annotations:</div>
        <div style="background: #ffffff; border: 1.5px solid #e9d5ff; border-radius: 6px; padding: 8px; border-left: 4px solid #7c3aed; text-align: center; display: inline-block;">
          <img src="${drawImg}" style="max-height: 200px; display: block; margin: 0 auto; object-fit: contain;" />
        </div>
      </div>
    `;
  }

  if (photoList && photoList.length > 0) {
    additionalSections += `
      <div style="margin-top: 14px; font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; page-break-inside: avoid;">
        <div style="font-weight: 800; font-size: 10.5px; text-transform: uppercase; color: #2563eb; letter-spacing: 0.06em; margin-bottom: 4px;">📷 Clinical Photos Attached:</div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 6px; padding: 8px; border-left: 4px solid #2563eb;">
          ${photoList.map((ph, idx) => `
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff; text-align: center;">
              <img src="${ph}" style="max-height: 160px; max-width: 200px; display: block; object-fit: contain; margin: 0 auto; padding: 4px;" alt="Clinical Photo ${idx + 1}" />
              <div style="font-size: 9px; font-weight: 700; color: #475569; background: #f1f5f9; padding: 2px 4px; border-top: 1px solid #e2e8f0;">Photo ${idx + 1}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Prescription - ${patName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');
          
          @page {
            size: A4;
            margin: 12mm 15mm 15mm 15mm;
          }
          body {
            font-family: 'Plus Jakarta Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: #fff;
            position: relative;
          }
          .template-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
          }
          .container {
            width: 100%;
            min-height: 250mm;
            position: relative;
            box-sizing: border-box;
            padding-top: ${isValidTemplateImage ? '220px' : '0px'};
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .main-content {
            flex-grow: 1;
          }
          
          /* Custom Premium Letterhead styling */
          .header {
            display: ${isValidTemplateImage ? 'none' : 'block'};
            margin-bottom: 16px;
          }
          
          /* Rx Symbol & Watermark */
          .rx-container {
            position: relative;
            margin-left: 2px;
          }
          .rx-symbol {
            font-size: 38px;
            font-style: italic;
            font-weight: 700;
            font-family: 'Playfair Display', Georgia, serif;
            margin: 0 0 8px 0;
            color: #1d4ed8;
            display: inline-block;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 300px;
            opacity: 0.03;
            z-index: -2;
            pointer-events: none;
          }
          
          /* Medicines Table Styling */
          .meds-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            z-index: 10;
          }
          .meds-table th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 9px 12px;
            text-align: left;
          }
          .meds-table th:first-child {
            border-top-left-radius: 6px;
            border-bottom-left-radius: 6px;
          }
          .meds-table th:last-child {
            border-top-right-radius: 6px;
            border-bottom-right-radius: 6px;
          }
          
          /* Footer & Authorizations */
          .footer-section {
            margin-top: 25px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            page-break-inside: avoid;
          }
          .footer-left {
            max-width: 360px;
            border-left: 3px solid #1d4ed8;
            padding-left: 10px;
          }
          .footer-right {
            text-align: right;
            min-width: 220px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .sig-line {
            width: 180px;
            border-bottom: 1.5px solid #0f172a;
            margin-bottom: 8px;
          }
          .doc-name {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 2px 0;
          }
          .doc-reg {
            font-size: 11px;
            color: #475569;
            margin: 0 0 2px 0;
            font-weight: 600;
          }
          .doc-spec {
            font-size: 10px;
            color: #64748b;
            margin: 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }

          .bottom-footer {
            page-break-inside: avoid;
            margin-top: 10px;
          }

          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 20px; display: flex; gap: 12px; justify-content: center; align-items: center; font-family: sans-serif; z-index: 1000; position: relative;">
          <button onclick="window.print()" style="background: #1e3a8a; color: white; border: none; padding: 9px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            🖨️ Action: Print Prescription / Save PDF
          </button>
          <button onclick="window.close()" style="background: #ffffff; color: #475569; border: 1px solid #cbd5e1; padding: 9px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            ❌ Close
          </button>
        </div>
        <!-- Background Premium Watermark -->
        <div class="watermark">
          <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#1d4ed8" stroke-width="3" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#ef4444" stroke-width="1.5" />
            <text x="50" y="55" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="24" fill="#1d4ed8" text-anchor="middle" style="letter-spacing: -0.5px;">GH</text>
          </svg>
        </div>

        <div class="container">
          <div class="main-content">
            ${isValidTemplateImage ? `<div class="template-bg"><img src="${actualTemplateImage}" style="width: 100%;" /></div>` : ''}
            
            <!-- Custom Bilingual Premium Letterhead -->
            <div class="header">
              <div style="position: relative; padding: 12px 18px; display: flex; align-items: center; background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 60%, #e0f2fe 100%); border-bottom: 3.5px solid #b91c1c; border-radius: 8px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #1d4ed8 0%, #3b82f6 50%, #1d4ed8 100%);"></div>
                
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: 4px;">
                  <!-- Left: Neo GastroPlus Hospital Logo (Image 20 style) -->
                  <div style="flex-shrink: 0; margin-right: 15px;">
                    <svg viewBox="0 0 240 240" style="width: 88px; height: 88px; display: block; flex-shrink: 0;">
                      <!-- Background light card -->
                      <rect width="240" height="240" rx="22" fill="#fcfbf7" stroke="#e7e5e4" stroke-width="1.5" />
                      
                      <!-- Group containing stomach and golden arc -->
                      <g transform="translate(20, 10) scale(0.82)">
                        <!-- Stomach Outer Contour -->
                        <path d="M 102,15 C 102,30 98,40 88,52 C 74,70 50,82 50,115 C 50,148 76,164 108,164 C 140,164 164,142 164,102 C 164,62 138,48 132,15 Z" fill="#0f766e" />
                        
                        <!-- Shading curve inside stomach for 3D depth -->
                        <path d="M 96,35 C 96,50 82,64 74,80 C 68,92 65,108 70,122 C 75,136 90,148 108,148 C 128,148 144,132 146,108 C 148,84 132,64 126,35 Z" fill="#0d9488" opacity="0.35" />

                        <!-- Pure White Medical Cross (+) in Top-Right Lobe -->
                        <path d="M 120,44 H 136 V 60 H 152 V 76 H 136 V 92 H 120 V 76 H 104 V 60 H 120 Z" fill="#ffffff" />
                        
                        <!-- Golden Cradling Arc under stomach -->
                        <path d="M 32,108 C 44,162 106,188 174,134 C 152,174 80,186 32,108 Z" fill="#ca8a04" />
                        
                        <!-- Second golden line below arc -->
                        <path d="M 46,155 C 80,182 138,175 166,150 C 138,172 88,175 46,155 Z" fill="#d97706" opacity="0.75" />
                      </g>
                      
                      <!-- Text Elements inside Logo -->
                      <line x1="55" y1="172" x2="80" y2="172" stroke="#0f766e" stroke-width="1.2" />
                      <text x="120" y="175" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="11" fill="#0f766e" text-anchor="middle" letter-spacing="2">NEO</text>
                      <line x1="160" y1="172" x2="185" y2="172" stroke="#0f766e" stroke-width="1.2" />
                      
                      <text x="120" y="196" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="20" text-anchor="middle">
                        <tspan fill="#0f766e">Gastro</tspan><tspan fill="#ca8a04">Plus</tspan>
                      </text>
                      
                      <line x1="45" y1="210" x2="70" y2="210" stroke="#ca8a04" stroke-width="1.2" />
                      <text x="120" y="213" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="10" fill="#ca8a04" text-anchor="middle" letter-spacing="2">HOSPITAL</text>
                      <line x1="170" y1="210" x2="195" y2="210" stroke="#ca8a04" stroke-width="1.2" />
                      
                      <text x="120" y="228" font-family="'Plus Jakarta Sans', sans-serif" font-style="italic" font-weight="600" font-size="7.5" fill="#0f766e" text-anchor="middle">
                        Advanced Digestive &amp; Surgical Care
                      </text>
                    </svg>
                  </div>
                  
                  <!-- Middle: Center Title (English Big at Top, Hindi Small Below) -->
                  <div style="flex-grow: 1; text-align: center;">
                    <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 30px; color: #ef4444; text-shadow: 2px 2px 0px #fff, -2px -2px 0px #fff, 2px -2px 0px #fff, -2px 2px 0px #fff, 2px 2px 4px rgba(0,0,0,0.12); text-transform: uppercase; margin: 0; line-height: 1.1; letter-spacing: 0.5px;">${hospName}</div>
                    <div style="font-family: 'Noto Sans Devanagari', sans-serif; font-weight: 800; font-size: 15px; color: #1d4ed8; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 4px;">न्यू गैस्ट्रो प्लस हॉस्पिटल</div>
                  </div>

                  <!-- Right: Caduceus icon -->
                  <div style="flex-shrink: 0; width: 72px; text-align: right; opacity: 0.15;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="1.5" style="width: 50px; height: 50px; margin-left: auto;">
                      <path d="M19 10.5H13.5V5C13.5 4.17157 12.8284 3.5 12 3.5C11.1716 3.5 10.5 4.17157 10.5 5V10.5H5C4.17157 10.5 3.5 11.1716 3.5 12C3.5 12.8284 4.17157 13.5 5 13.5H10.5V19C10.5 19.8284 11.1716 20.5 12 20.5C12.8284 20.5 13.5 19.8284 13.5 19V13.5H19C19.8284 13.5 20.5 12.8284 20.5 12C20.5 11.1716 19.8284 10.5 19 10.5Z" fill="#e0f2fe"/>
                      <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Patient Information Grid -->
            <div style="border-top: 1.5px solid #e2e8f0; border-bottom: 1.5px solid #e2e8f0; padding: 10px 8px; margin-bottom: 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.5px; font-weight: 700; color: #1e293b; display: flex; flex-direction: column; gap: 10px;">
              <!-- Row 1 -->
              <div style="display: flex; gap: 16px; flex-wrap: wrap; width: 100%;">
                <div style="flex: 1.8; min-width: 220px; display: flex; align-items: flex-end;">
                  <span>Patient Name:</span>
                  <span style="flex-grow: 1; border-bottom: 1.5px dotted #94a3b8; margin-left: 6px; padding-bottom: 1px; font-weight: 800; color: #1d4ed8; padding-left: 4px;">${patName}</span>
                </div>
                <div style="flex: 1; min-width: 120px; display: flex; align-items: flex-end;">
                  <span>Age / Sex:</span>
                  <span style="flex-grow: 1; border-bottom: 1.5px dotted #94a3b8; margin-left: 6px; padding-bottom: 1px; font-weight: 800; color: #1d4ed8; padding-left: 4px;">${patAgeGender}</span>
                </div>
                <div style="flex: 1; min-width: 110px; display: flex; align-items: flex-end;">
                  <span>Date:</span>
                  <span style="flex-grow: 1; border-bottom: 1.5px dotted #94a3b8; margin-left: 6px; padding-bottom: 1px; font-weight: 800; color: #1d4ed8; padding-left: 4px;">${presDate}</span>
                </div>
              </div>
              <!-- Row 2 -->
              <div style="display: flex; gap: 16px; flex-wrap: wrap; width: 100%;">
                <div style="flex: 1.5; min-width: 220px; display: flex; align-items: flex-end;">
                  <span>Father / Husband Name:</span>
                  <span style="flex-grow: 1; border-bottom: 1.5px dotted #94a3b8; margin-left: 6px; padding-bottom: 1px; font-weight: 800; color: #1d4ed8; padding-left: 4px;">${patFatherName || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span>
                </div>
                <div style="flex: 1; min-width: 140px; display: flex; align-items: flex-end;">
                  <span>Mobile No:</span>
                  <span style="flex-grow: 1; border-bottom: 1.5px dotted #94a3b8; margin-left: 6px; padding-bottom: 1px; font-weight: 800; color: #1d4ed8; padding-left: 4px;">${patPhone || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span>
                </div>
                <div style="flex: 0.8; min-width: 100px; display: flex; align-items: flex-end;">
                  <span>MRN:</span>
                  <span style="flex-grow: 1; border-bottom: 1.5px dotted #94a3b8; margin-left: 6px; padding-bottom: 1px; font-weight: 800; color: #1d4ed8; padding-left: 4px;">${patMRN}</span>
                </div>
              </div>
            </div>

            <!-- Comprehensive Vitals / On Examination (O/E) Box -->
            <div style="display: flex; gap: 10px; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; font-weight: 700; color: #334155; background-color: #f8fafc; align-items: center; page-break-inside: avoid;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.05em; border-right: 1.5px solid #cbd5e1; padding-right: 10px; margin-right: 4px; white-space: nowrap;">Vitals / O/E</span>
              <div style="flex: 1; display: flex; justify-content: flex-start; flex-wrap: wrap; gap: 8px 16px; align-items: center;">
                <div>BP: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 50px; display: inline-block; text-align: center; padding-bottom: 1px;">${bpVal || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span> mmHg</div>
                <div>Pulse: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${pulseVal || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span> /min</div>
                <div>Temp: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${tempVal || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span> °F</div>
                <div>SpO2: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${spo2Val || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span> %</div>
                <div>Weight: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${weightVal || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span> kg</div>
                ${heightVal ? `<div>Height: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${heightVal}</span> cm</div>` : ''}
                ${bmiVal ? `<div>BMI: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${bmiVal}</span></div>` : ''}
                <div>Resp Rate: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${rrVal || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span> /min</div>
                ${rbsVal ? `<div>RBS/GRBS: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 40px; display: inline-block; text-align: center; padding-bottom: 1px;">${rbsVal}</span> mg/dL</div>` : ''}
                ${cbsVal ? `<div>CBS: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${cbsVal}</span></div>` : ''}
                ${rsVal ? `<div>RS: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${rsVal}</span></div>` : ''}
                ${cvsVal ? `<div>CVS: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${cvsVal}</span></div>` : ''}
                ${cnsVal ? `<div>CNS: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${cnsVal}</span></div>` : ''}
                ${paVal ? `<div>P/A: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${paVal}</span></div>` : ''}
                ${prVal ? `<div>P/R: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${prVal}</span></div>` : ''}
                ${gcsVal ? `<div>GCS: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${gcsVal}</span></div>` : ''}
                ${painVal ? `<div>Pain Scale: <span style="font-weight: 800; color: #1d4ed8; border-bottom: 1px dotted #94a3b8; min-width: 35px; display: inline-block; text-align: center; padding-bottom: 1px;">${painVal}/10</span></div>` : ''}
                ${genExamStr ? `<div style="width: 100%; font-size: 11px; color: #475569; font-style: italic; border-top: 1px dashed #cbd5e1; padding-top: 4px; margin-top: 2px;">General Exam: ${genExamStr}</div>` : ''}
              </div>
            </div>
            
            ${clinicalSummaryHtml}

            <div class="rx-container">
              <div class="rx-symbol">Rx</div>
            </div>
            
            <table class="meds-table">
              <thead>
                <tr>
                  <th style="width: 38%;">MEDICINE & STRENGTH</th>
                  <th style="width: 15%;">DOSAGE</th>
                  <th style="width: 18%;">FREQUENCY</th>
                  <th style="width: 14%;">DURATION</th>
                  <th style="width: 15%;">INSTRUCTION</th>
                </tr>
              </thead>
              <tbody>
                ${medContent}
              </tbody>
            </table>
            
            ${additionalSections}
          </div>

          <div>
            <div class="footer-section">
              <div class="footer-left">
                <h3 style="font-size: 10.5px; font-weight: 800; color: #1d4ed8; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Plus Jakarta Sans', sans-serif;">Digital Health Record</h3>
                <p style="font-size: 9.5px; color: #64748b; margin: 0; line-height: 1.4; font-weight: 500;">
                  This document is an authorized clinical prescription registered under hospital safety guidelines. Valid for 7 days.
                </p>
              </div>
              <div class="footer-right">
                <div class="sig-line"></div>
                <h3 class="doc-name">${docName}</h3>
                <p class="doc-reg">${docReg}</p>
                <p class="doc-spec">${docSpecialty}</p>
              </div>
            </div>

            <!-- Bottom Custom Footer -->
            <div class="bottom-footer">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 8px 4px 8px; border-top: 1.5px solid #e2e8f0;">
                <!-- Left: 24/7 Services Badge -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="position: relative; width: 40px; height: 40px; background-color: #1d4ed8; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #ef4444; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
                    <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 12px; color: #ffffff; position: absolute; top: 5px; left: 5px;">24</span>
                    <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 12px; color: #ef4444; position: absolute; bottom: 5px; right: 5px;">7</span>
                    <div style="position: absolute; width: 26px; height: 1.5px; background-color: #ffffff; transform: rotate(-45deg);"></div>
                  </div>
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 9.5px; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1;">Emergency</span>
                    <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 11.5px; color: #ef4444; text-transform: uppercase; line-height: 1.1;">Services</span>
                  </div>
                </div>

                <!-- Middle/Left: Location Address -->
                <div style="display: flex; align-items: center; gap: 6px; color: #b91c1c; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10.5px; font-weight: 700; max-width: 340px; line-height: 1.3;">
                  <span style="font-size: 13px; color: #ef4444;">📍</span>
                  <span>${hospAddress}</span>
                </div>

                <!-- Right: Telephone Numbers -->
                <div style="display: flex; align-items: center; gap: 8px; border-left: 1.5px solid #e2e8f0; padding-left: 12px;">
                  <div style="display: flex; flex-direction: column; text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; font-weight: 800; color: #1d4ed8; line-height: 1.3;">
                    ${hospPhone.split('/').map(num => `<span style="display: flex; align-items: center; gap: 4px;">${num.trim().startsWith('+91') ? '' : '+91-'}${num.trim()}</span>`).join('')}
                  </div>
                  <div style="width: 26px; height: 26px; background-color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    📞
                  </div>
                </div>
              </div>
              
              <!-- Dark blue solid strip at the very bottom -->
              <div style="height: 10px; background-color: #1e3a8a; margin-top: 8px; border-radius: 2px; width: 100%;"></div>
            </div>
          </div>
        </div>
        
        <script>
          window.onload = () => {
            window.print();
          }
        </script>
      </body>
    </html>
  `;
}

