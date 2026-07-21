import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone,
  Edit, 
  Trash2, 
  Download,
  Loader2,
  QrCode,
  Calendar,
  Clock,
  Printer,
  Camera,
  CheckCircle,
  AlertCircle,
  UserCheck,
  History,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabaseService } from '@/services/supabaseService';
import { useDataSync } from '@/hooks/useDataSync';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { canUserModifyRecord, normalizeRole } from '@/utils/rbac';

export default function Staff() {
  const currentUser = storage.get(STORAGE_KEYS.SESSION_USER, null);
  const isAccountant = normalizeRole(currentUser?.role) === 'ACCOUNTANT';
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [newStaff, setNewStaff] = useState({ name: '', role: 'doctor', department: '', email: '', phone: '', specialty: '', consultationFee: '' });

  const [activeStaffTab, setActiveStaffTab] = useState<'directory' | 'terminal' | 'badges' | 'register'>('directory');
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>(() => {
    const saved = storage.get(STORAGE_KEYS.STAFF_ATTENDANCE, []);
    if (saved && saved.length > 0) return saved;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return [
      {
        id: 'att-1',
        staffId: 'stf-1',
        staffName: 'Dr. Ramesh Mehta',
        role: 'SUPER_ADMIN',
        department: 'Cardiology',
        date: todayStr,
        checkInTime: '08:42 AM',
        checkOutTime: null,
        status: 'On Time',
        workingHours: null,
        method: 'QR_CODE'
      },
      {
        id: 'att-2',
        staffId: 'stf-2',
        staffName: 'Staff Nurse Priya S.',
        role: 'NURSE',
        department: 'General Ward',
        date: todayStr,
        checkInTime: '07:54 AM',
        checkOutTime: null,
        status: 'On Time',
        workingHours: null,
        method: 'QR_CODE'
      },
      {
        id: 'att-3',
        staffId: 'stf-3',
        staffName: 'Dr. Anjali Mehta',
        role: 'DOCTOR',
        department: 'Pediatrics',
        date: todayStr,
        checkInTime: '09:35 AM',
        checkOutTime: null,
        status: 'Late',
        workingHours: null,
        method: 'QR_CODE'
      },
      {
        id: 'att-4',
        staffId: 'stf-1',
        staffName: 'Dr. Ramesh Mehta',
        role: 'SUPER_ADMIN',
        department: 'Cardiology',
        date: yesterdayStr,
        checkInTime: '08:38 AM',
        checkOutTime: '05:12 PM',
        status: 'On Time',
        workingHours: 8.5,
        method: 'QR_CODE'
      },
      {
        id: 'att-5',
        staffId: 'stf-2',
        staffName: 'Staff Nurse Priya S.',
        role: 'NURSE',
        department: 'General Ward',
        date: yesterdayStr,
        checkInTime: '07:58 AM',
        checkOutTime: '04:02 PM',
        status: 'On Time',
        workingHours: 8.0,
        method: 'QR_CODE'
      }
    ];
  });

  const [terminalMode, setTerminalMode] = useState<'in' | 'out' | 'auto'>('auto');
  const [scannedStaffId, setScannedStaffId] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [selectedBadgeStaff, setSelectedBadgeStaff] = useState<any>(null);
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState(() => new Date().toISOString().split('T')[0]);
  const [lastScanSuccess, setLastScanSuccess] = useState<any>(null);
  const [isManualPunchOpen, setIsManualPunchOpen] = useState(false);
  const [manualPunchData, setManualPunchData] = useState({
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '09:00 AM',
    checkOutTime: '05:00 PM',
    status: 'On Time'
  });

  const handlePrintBadge = (user: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocker prevented printing. Please enable popups.');
      return;
    }
    const empIdStr = `EMP-${user.id.substring(0, 8).toUpperCase()}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=5&data=${user.id}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Staff ID Badge - ${user.name}</title>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f3f4f6;
            }
            .badge-card {
              width: 280px;
              height: 440px;
              background: white;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              overflow: hidden;
              display: flex;
              flex-direction: column;
              border: 1px solid #e5e7eb;
              page-break-inside: avoid;
            }
            .badge-header {
              background: linear-gradient(135deg, #1A5E63, #154c50);
              color: white;
              padding: 20px 10px;
              text-align: center;
              border-bottom: 4px solid #FFD1A9;
            }
            .hospital-title {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
            .hospital-sub {
              font-size: 8px;
              opacity: 0.8;
              letter-spacing: 1px;
            }
            .badge-body {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 24px 16px;
              text-align: center;
            }
            .avatar-img {
              width: 90px;
              height: 90px;
              border-radius: 50%;
              border: 3px solid #1A5E63;
              object-fit: cover;
              margin-bottom: 12px;
            }
            .staff-name {
              font-size: 18px;
              font-weight: 800;
              color: #1f2937;
              margin: 0 0 4px 0;
            }
            .staff-role {
              font-size: 11px;
              font-weight: 700;
              color: #1A5E63;
              text-transform: uppercase;
              background: #f0fdfa;
              padding: 4px 12px;
              border-radius: 9999px;
              border: 1px solid #ccfbf1;
              margin-bottom: 16px;
            }
            .qr-container {
              background: white;
              padding: 8px;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
              margin-bottom: 12px;
            }
            .emp-id {
              font-family: monospace;
              font-size: 11px;
              color: #6b7280;
              font-weight: bold;
            }
            .badge-footer {
              background: #f9fafb;
              padding: 10px;
              text-align: center;
              font-size: 9px;
              color: #9ca3af;
              border-top: 1px solid #f3f4f6;
            }
            @media print {
              body {
                background: white;
              }
              .badge-card {
                box-shadow: none;
                border: 1px solid #ccc;
              }
            }
          </style>
        </head>
        <body>
          <div class="badge-card">
            <div class="badge-header">
              <div class="hospital-title">GastroPlus</div>
              <div class="hospital-sub">HEALTHCARE & SURGICALS</div>
            </div>
            <div class="badge-body">
              <img class="avatar-img" src="${user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}" />
              <div class="staff-name">${user.name}</div>
              <div class="staff-role">${user.role?.replace('_', ' ') || 'Staff'}</div>
              <div class="qr-container">
                <img src="${qrUrl}" width="120" height="120" />
              </div>
              <div class="emp-id">${empIdStr}</div>
            </div>
            <div class="badge-footer">
              Valid for hospital access & automated QR attendance
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleManualPunchSubmit = () => {
    if (!manualPunchData.staffId) {
      toast.error('Please select an employee');
      return;
    }
    const emp = staff.find(s => s.id === manualPunchData.staffId);
    if (!emp) {
      toast.error('Employee not found');
      return;
    }

    let hours = null;
    if (manualPunchData.checkOutTime) {
      const parseTimeString = (tStr: string) => {
        const [time, modifier] = tStr.split(' ');
        let [hrs, mins] = time.split(':').map(Number);
        if (modifier === 'PM' && hrs < 12) hrs += 12;
        if (modifier === 'AM' && hrs === 12) hrs = 0;
        return hrs * 60 + mins;
      };
      const inMins = parseTimeString(manualPunchData.checkInTime);
      const outMins = parseTimeString(manualPunchData.checkOutTime);
      hours = Number((Math.max(0, outMins - inMins) / 60).toFixed(2));
    }

    const newLog = {
      id: 'att-' + Date.now(),
      staffId: emp.id,
      staffName: emp.name,
      role: emp.role,
      department: emp.department || 'Administration',
      date: manualPunchData.date,
      checkInTime: manualPunchData.checkInTime,
      checkOutTime: manualPunchData.checkOutTime || null,
      status: manualPunchData.status,
      workingHours: hours,
      method: 'MANUAL_ENTRY'
    };

    setAttendanceLogs([newLog, ...attendanceLogs]);
    setIsManualPunchOpen(false);
    toast.success(`Manual attendance logged for ${emp.name}`);
  };

  const isDoctorOrSurgeon = (role: string) => {
    const r = (role || '').toUpperCase();
    return r.includes('DOCTOR') || r.includes('SURGEON');
  };

  const mapDbRoleToFormRole = (dbRole: string): string => {
    if (!dbRole) return 'doctor';
    const r = dbRole.toUpperCase().trim();
    if (r === 'RECEPTIONIST') return 'reception';
    if (r === 'LAB_TECHNICIAN') return 'lab_staff';
    return r.toLowerCase();
  };

  const mapFormRoleToDbRole = (formRole: string): string => {
    if (!formRole) return 'DOCTOR';
    const r = formRole.toLowerCase().trim();
    if (r === 'reception') return 'RECEPTIONIST';
    if (r === 'lab_staff') return 'LAB_TECHNICIAN';
    return r.toUpperCase().replace(' ', '_');
  };

  useEffect(() => {
    storage.set(STORAGE_KEYS.STAFF_ATTENDANCE, attendanceLogs);
  }, [attendanceLogs]);

  const handleQrPunch = (scannedId: string) => {
    if (!scannedId) return;
    
    const cleanId = scannedId.replace(/^EMP-/i, '').trim();
    const employee = staff.find(s => 
      String(s.id).toLowerCase() === cleanId.toLowerCase() ||
      String(s.id).substring(0, 8).toLowerCase() === cleanId.toLowerCase()
    );

    if (!employee) {
      toast.error(`Employee ID "${scannedId}" not found in system.`);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Find if they have an active punch today
    const existingPunchesToday = attendanceLogs.filter(log => log.staffId === employee.id && log.date === todayStr);
    const activePunch = existingPunchesToday.find(log => log.checkOutTime === null);

    let modeToExecute: 'in' | 'out' = 'in';
    if (terminalMode === 'auto') {
      if (activePunch) {
        modeToExecute = 'out';
      } else {
        modeToExecute = 'in';
      }
    } else {
      modeToExecute = terminalMode as 'in' | 'out';
    }

    if (modeToExecute === 'in') {
      if (activePunch) {
        toast.warning(`${employee.name} is already checked in since ${activePunch.checkInTime}`);
        return;
      }

      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const checkInMinutes = currentHour * 60 + currentMin;
      const lateThresholdMinutes = 9 * 60 + 15; // 09:15 AM
      const status = checkInMinutes > lateThresholdMinutes ? 'Late' : 'On Time';

      const newLog = {
        id: 'att-' + Date.now(),
        staffId: employee.id,
        staffName: employee.name,
        role: employee.role,
        department: employee.department || 'Administration',
        date: todayStr,
        checkInTime: timeStr,
        checkOutTime: null,
        status: status,
        workingHours: null,
        method: 'QR_CODE'
      };

      const updated = [newLog, ...attendanceLogs];
      setAttendanceLogs(updated);
      setLastScanSuccess({
        employee,
        action: 'In',
        time: timeStr,
        status: status
      });
      toast.success(`Check-In Successful: ${employee.name} at ${timeStr} (${status})`);
    } else {
      if (!activePunch) {
        const openPunchAnyDay = attendanceLogs.find(log => log.staffId === employee.id && log.checkOutTime === null);
        if (openPunchAnyDay) {
          const updatedLogs = attendanceLogs.map(log => {
            if (log.id === openPunchAnyDay.id) {
              return {
                ...log,
                checkOutTime: timeStr,
                workingHours: 8.0
              };
            }
            return log;
          });
          setAttendanceLogs(updatedLogs);
          setLastScanSuccess({
            employee,
            action: 'Out',
            time: timeStr,
            status: 'Completed'
          });
          toast.success(`Check-Out Successful (Previous day): ${employee.name} at ${timeStr}`);
          return;
        }

        toast.error(`No active Check-In found for ${employee.name} today.`);
        return;
      }

      const parseTimeString = (tStr: string) => {
        const [time, modifier] = tStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      const checkInMinutes = parseTimeString(activePunch.checkInTime);
      const checkOutMinutes = now.getHours() * 60 + now.getMinutes();
      const durationMins = Math.max(0, checkOutMinutes - checkInMinutes);
      const hoursDecimal = Number((durationMins / 60).toFixed(2));

      const updatedLogs = attendanceLogs.map(log => {
        if (log.id === activePunch.id) {
          return {
            ...log,
            checkOutTime: timeStr,
            workingHours: hoursDecimal
          };
        }
        return log;
      });

      setAttendanceLogs(updatedLogs);
      setLastScanSuccess({
        employee,
        action: 'Out',
        time: timeStr,
        status: 'Hours: ' + hoursDecimal
      });
      toast.success(`Check-Out Successful: ${employee.name} at ${timeStr} (Worked: ${hoursDecimal}h)`);
    }

    setScannedStaffId('');
  };

  const fetchData = async () => {
    const isInitial = staff.length === 0;
    if (isInitial) {
      setLoading(true);
    }
    const data = await supabaseService.getStaff();
    if (data) setStaff(data);
    setLoading(false);
  };

  useDataSync(fetchData);

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email) {
      toast.error('Please fill in required fields');
      return;
    }
    const staffToAdd = {
      name: newStaff.name,
      email: newStaff.email,
      role: mapFormRoleToDbRole(newStaff.role),
      department: newStaff.department,
      specialization: newStaff.specialty,
      consultationFee: isDoctorOrSurgeon(newStaff.role) && newStaff.consultationFee ? Number(newStaff.consultationFee) : 0,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newStaff.name}`
    };

    const result = await supabaseService.createStaff(staffToAdd);
    if (result) {
      toast.success('New staff member added');
      setIsAddOpen(false);
      setNewStaff({ name: '', role: 'doctor', department: '', email: '', phone: '', specialty: '', consultationFee: '' });
      fetchData();
    } else {
      toast.error('Failed to add staff member');
    }
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff.name || !editingStaff.email) {
      toast.error('Please fill in required fields');
      return;
    }
    const updates = {
      name: editingStaff.name,
      email: editingStaff.email,
      role: mapFormRoleToDbRole(editingStaff.role),
      department: editingStaff.department,
      specialization: editingStaff.specialty,
      consultationFee: isDoctorOrSurgeon(editingStaff.role) && editingStaff.consultationFee ? Number(editingStaff.consultationFee) : 0,
      avatar: editingStaff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editingStaff.name}`,
      degree: editingStaff.degree || '',
      password: editingStaff.password || '',
      phone: editingStaff.phone || null
    };

    const result = await supabaseService.updateStaff(editingStaff.id, updates);
    if (result) {
      toast.success('Staff member updated');
      setIsEditOpen(false);
      setEditingStaff(null);
      fetchData();
    } else {
      toast.error('Failed to update staff member');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    const roleUpper = (currentUser?.role || '').toUpperCase();
    if (roleUpper === 'RECEPTIONIST' || roleUpper === 'RECEPTION' || roleUpper === 'FRONT_DESK' || roleUpper === 'DOCTOR' || roleUpper === 'SURGEON' || roleUpper === 'ACCOUNTANT' || roleUpper === 'ACCOUNTS') {
      toast.error('Deletion of staff members is restricted for Front Office, Doctor, and Accountant roles.');
      return;
    }
    const member = staff.find(s => s.id === id);
    if (member && !canUserModifyRecord(member, currentUser, staff)) {
      toast.error("Access Denied: This staff profile was created by an Admin and cannot be deleted by non-admin users.");
      return;
    }
    if (confirm('Are you sure you want to remove this staff member?')) {
      const result = await supabaseService.deleteStaff(id);
      if (result) {
        toast.success('Staff member removed');
        fetchData();
      } else {
        toast.error('Failed to remove staff member');
      }
    }
  };

  const handleExportStaff = () => {
    const headers = ['Name', 'Role', 'Department', 'Email'];
    const rows = staff.map(s => [
      s.name,
      s.role,
      s.department || 'N/A',
      s.email
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'staff_directory.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Staff directory exported');
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    total: staff.length,
    doctors: staff.filter(s => s.role.includes('DOCTOR') || s.role.includes('SURGEON')).length,
    nurses: staff.filter(s => s.role.includes('NURSE')).length,
    others: staff.filter(s => !s.role.includes('DOCTOR') && !s.role.includes('SURGEON') && !s.role.includes('NURSE')).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-medical-blue" />
        <span className="ml-2 font-medium">Loading Staff Directory...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border shadow-sm text-slate-900" style={{ background: 'linear-gradient(135deg, #FFD1A9, #FFE5C9, #FFF3E5)', borderColor: '#F5CBB0' }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#5A2D1B]">Staff Management</h1>
          <p className="text-[#8A563F] font-semibold text-sm">Manage hospital employees, roles, and access permissions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white/80 border-[#5A2D1B]/25 text-[#5A2D1B] hover:bg-white font-bold" onClick={handleExportStaff}>
            <Download className="w-4 h-4 text-[#5A2D1B]" />
            Export Directory
          </Button>
          {!isAccountant && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#1A5E63] hover:bg-[#154c50] text-white gap-2 font-bold" onClick={() => setIsAddOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Add New Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>Register a new staff member in the system.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                      placeholder="Enter name" 
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select 
                      value={newStaff.role}
                      onValueChange={(v) => setNewStaff({...newStaff, role: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">super_admin</SelectItem>
                        <SelectItem value="doctor">doctor</SelectItem>
                        <SelectItem value="surgeon">surgeon</SelectItem>
                        <SelectItem value="nurse">nurse</SelectItem>
                        <SelectItem value="reception">reception</SelectItem>
                        <SelectItem value="pharmacist">pharmacist</SelectItem>
                        <SelectItem value="lab_staff">lab_staff</SelectItem>
                        <SelectItem value="accountant">accountant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input 
                      placeholder="e.g. Cardiology" 
                      value={newStaff.department}
                      onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Specialty</Label>
                    <Input 
                      placeholder="e.g. Pediatrics" 
                      value={newStaff.specialty}
                      onChange={(e) => setNewStaff({...newStaff, specialty: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email" 
                      placeholder="email@hospital.com" 
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    />
                  </div>
                  {isDoctorOrSurgeon(newStaff.role) && (
                    <div className="space-y-2">
                      <Label>Consultation Fee (₹)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 500" 
                        value={newStaff.consultationFee}
                        onChange={(e) => setNewStaff({...newStaff, consultationFee: e.target.value})}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button className="bg-medical-blue" onClick={handleAddStaff}>Add Staff</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>      {/* Tab Selector */}
      <div className="flex border-b border-slate-200 pb-px gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveStaffTab('directory')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeStaffTab === 'directory'
              ? 'border-[#1A5E63] text-[#1A5E63] font-black'
              : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
          }`}
        >
          <Users className="w-4 h-4" />
          Employee Directory
        </button>
        <button
          onClick={() => setActiveStaffTab('terminal')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeStaffTab === 'terminal'
              ? 'border-[#1A5E63] text-[#1A5E63] font-black'
              : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
          }`}
        >
          <Camera className="w-4 h-4" />
          QR Attendance Terminal
        </button>
        <button
          onClick={() => setActiveStaffTab('badges')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeStaffTab === 'badges'
              ? 'border-[#1A5E63] text-[#1A5E63] font-black'
              : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Printable QR Badges
        </button>
        <button
          onClick={() => setActiveStaffTab('register')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeStaffTab === 'register'
              ? 'border-[#1A5E63] text-[#1A5E63] font-black'
              : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
          }`}
        >
          <History className="w-4 h-4" />
          Attendance Logs
        </button>
      </div>

      {activeStaffTab === 'directory' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Total Staff</p>
                <h3 className="text-xl font-bold">{stats.total}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Doctors</p>
                <h3 className="text-xl font-bold text-blue-600">{stats.doctors}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Nurses</p>
                <h3 className="text-xl font-bold text-teal-600">{stats.nurses}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Admin/Support</p>
                <h3 className="text-xl font-bold text-slate-600">{stats.others}</h3>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Employee Directory</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search employee..." 
                    className="pl-10 bg-slate-50 border-none h-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9 font-medium">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="whitespace-nowrap">Employee</TableHead>
                      <TableHead className="whitespace-nowrap">Role & Dept</TableHead>
                      <TableHead className="whitespace-nowrap">Contact</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.length > 0 ? filteredStaff.map((user) => (
                      <TableRow key={user.id} className="border-slate-50 transition-colors hover:bg-slate-50/50">
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-slate-100">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="bg-medical-blue/10 text-medical-blue font-bold">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm text-slate-800">{user.name}</p>
                              <p className="text-[10px] text-muted-foreground">EMP-{user.id.substring(0, 6).toUpperCase()}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <Badge variant="outline" className="w-fit text-[10px] font-bold uppercase tracking-tight mb-1 bg-white">
                              {user.role.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{user.department || 'Administration'}</span>
                            {(user.role?.toUpperCase().includes('DOCTOR') || user.role?.toUpperCase().includes('SURGEON')) && (
                              <span className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                                Consultation: ₹{user.consultationFee ?? user.consultation_fee ?? 0}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1 text-xs text-slate-600">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            {!isAccountant && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-medical-blue/10 hover:text-medical-blue" 
                                onClick={() => {
                                  try {
                                    setEditingStaff({
                                      ...user,
                                      role: mapDbRoleToFormRole(user.role),
                                      specialty: user.specialization || '',
                                      consultationFee: user.consultationFee !== undefined && user.consultationFee !== null 
                                        ? String(user.consultationFee) 
                                        : (user.consultation_fee !== undefined && user.consultation_fee !== null ? String(user.consultation_fee) : '')
                                    });
                                    setIsEditOpen(true);
                                  } catch (err) {
                                    console.error('Error opening edit staff details:', err);
                                  }
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {!isAccountant && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => handleDeleteStaff(user.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No employees found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeStaffTab === 'terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          {/* Left Column: Kiosk Scanner Simulator (Span 7) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
                <CardTitle className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Camera className="w-4 h-4 text-[#1A5E63]" />
                  Central QR Check-In/Out Kiosk
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Mode Selector */}
                <div className="flex justify-center gap-2">
                  <Button
                    variant={terminalMode === 'auto' ? 'default' : 'outline'}
                    onClick={() => setTerminalMode('auto')}
                    className={`text-xs h-8 px-4 font-bold cursor-pointer ${terminalMode === 'auto' ? 'bg-[#1A5E63] text-white hover:bg-[#154c50]' : ''}`}
                  >
                    Smart Auto-Detect
                  </Button>
                  <Button
                    variant={terminalMode === 'in' ? 'default' : 'outline'}
                    onClick={() => setTerminalMode('in')}
                    className={`text-xs h-8 px-4 font-bold cursor-pointer ${terminalMode === 'in' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}`}
                  >
                    Force CHECK-IN
                  </Button>
                  <Button
                    variant={terminalMode === 'out' ? 'default' : 'outline'}
                    onClick={() => setTerminalMode('out')}
                    className={`text-xs h-8 px-4 font-bold cursor-pointer ${terminalMode === 'out' ? 'bg-rose-600 text-white hover:bg-rose-700' : ''}`}
                  >
                    Force CHECK-OUT
                  </Button>
                </div>

                {/* Simulated Webcam viewbox */}
                <div className="relative aspect-video max-w-md mx-auto bg-slate-950 rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl flex flex-col justify-between p-4 text-white font-mono">
                  {/* Neon laser line scanning effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-teal-500/10 pointer-events-none" />
                  <div className="absolute left-0 right-0 h-1 bg-teal-400 shadow-[0_0_15px_#2dd4bf] animate-[bounce_3s_infinite] opacity-80" />

                  <div className="flex justify-between items-start text-[10px] text-teal-400 font-bold tracking-widest uppercase">
                    <span>Terminal ID: GASTRO-K-01</span>
                    <span className="flex items-center gap-1.5 animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Live Feed
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center py-10 opacity-75">
                    <QrCode className="w-16 h-16 text-teal-400 mb-2 animate-pulse" />
                    <span className="text-xs font-bold text-slate-300">Align QR badge within frame</span>
                    <span className="text-[9px] text-slate-500 mt-1">Accepts staff digital & physical cards</span>
                  </div>

                  <div className="text-[10px] text-slate-400 text-center uppercase tracking-wider">
                    Place badge in front of webcam/scanner
                  </div>
                </div>

                {/* Input block mimicking USB hardware scanner or typing scan */}
                <div className="max-w-md mx-auto space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Scan QR Code or Enter Employee ID</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <QrCode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="e.g. EMP-1, EMP-2, or click below..."
                          value={scannedStaffId}
                          onChange={(e) => setScannedStaffId(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleQrPunch(scannedStaffId);
                            }
                          }}
                          className="pl-9 h-9 text-xs"
                        />
                      </div>
                      <Button
                        onClick={() => handleQrPunch(scannedStaffId)}
                        className="h-9 text-xs font-bold bg-[#1A5E63] hover:bg-[#154c50] text-white px-4 cursor-pointer"
                      >
                        Simulate Scan
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick Scan Selection list for demo/iframe testing */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-500 mb-2.5 text-center">
                    💡 Quick Simulator: Click an employee below to simulate scanning their QR Badge
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {staff.map((s) => {
                      const isCurrentlyIn = attendanceLogs.some(
                        (log) => log.staffId === s.id && !log.checkOutTime && log.date === new Date().toISOString().split('T')[0]
                      );
                      return (
                        <button
                          key={s.id}
                          onClick={() => handleQrPunch(s.id)}
                          className={`p-2 rounded-xl border text-left text-xs transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2 ${
                            isCurrentlyIn
                              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 font-bold'
                              : 'bg-white hover:bg-slate-50 border-slate-100'
                          }`}
                        >
                          <Avatar className="w-6 h-6 border">
                            <AvatarImage src={s.avatar} />
                            <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="truncate flex-1">
                            <p className="font-semibold text-[11px] truncate">{s.name}</p>
                            <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${isCurrentlyIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                              {isCurrentlyIn ? 'On Duty' : 'Out'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Scan status & Currently Checked In (Span 5) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Last Scan Status Card */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
                <CardTitle className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Terminal Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-center">
                {lastScanSuccess ? (
                  <div className="space-y-3 animate-in zoom-in-95 duration-200">
                    <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-800">{lastScanSuccess.employee.name}</h4>
                      <p className="text-xs text-muted-foreground uppercase font-black font-mono">
                        {lastScanSuccess.employee.role.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border text-xs font-mono">
                      <span className={`font-bold ${lastScanSuccess.action === 'In' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        PUNCH {lastScanSuccess.action.toUpperCase()}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-600">{lastScanSuccess.time}</span>
                    </div>
                    {lastScanSuccess.status && (
                      <p className="text-[10px] text-slate-400 italic">Status: {lastScanSuccess.status}</p>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-slate-400">
                    <QrCode className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-400 animate-pulse" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Waiting for QR scan...</p>
                    <p className="text-[9.5px] text-slate-400 mt-1">Scan a staff badge using the input or click quick punch</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Currently Active Staff Card */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Users className="w-4 h-4 text-[#1A5E63]" />
                  Currently Checked-In
                </CardTitle>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-bold border-none text-[10px]">
                  {attendanceLogs.filter(log => !log.checkOutTime && log.date === new Date().toISOString().split('T')[0]).length} On Premise
                </Badge>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
                  {(() => {
                    const activePunches = attendanceLogs.filter(
                      (log) => !log.checkOutTime && log.date === new Date().toISOString().split('T')[0]
                    );

                    if (activePunches.length === 0) {
                      return (
                        <p className="text-center text-xs text-slate-400 py-6 italic">No staff members are currently checked in.</p>
                      );
                    }

                    return activePunches.map((punch) => {
                      const emp = staff.find(s => s.id === punch.staffId);
                      return (
                        <div key={punch.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100/60 text-xs">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-8 h-8 border">
                              <AvatarImage src={emp?.avatar} />
                              <AvatarFallback>{punch.staffName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-slate-800">{punch.staffName}</p>
                              <p className="text-[9.5px] text-slate-400 font-mono">In: {punch.checkInTime}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-[9px] font-bold ${punch.status === 'Late' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {punch.status}
                          </Badge>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeStaffTab === 'badges' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
              <CardTitle className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 font-mono">
                <QrCode className="w-4 h-4 text-[#1A5E63]" />
                Employee Identity Card & QR Badge Directory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((member) => {
                  const cleanEmpId = `EMP-${member.id.substring(0, 8).toUpperCase()}`;
                  return (
                    <Card key={member.id} className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white flex flex-col justify-between hover:border-teal-100 transition-all group">
                      <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-[#1A5E63]">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="truncate">
                            <h4 className="font-extrabold text-sm text-slate-800 truncate">{member.name}</h4>
                            <p className="text-[10px] text-muted-foreground uppercase font-black font-mono tracking-wider">{member.role.replace('_', ' ')}</p>
                          </div>
                        </div>

                        {/* ID Badge Preview block */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-dashed border-slate-200 flex items-center justify-between gap-3">
                          <div className="space-y-1.5 text-xs text-slate-600">
                            <p className="text-[10px] font-bold text-slate-400">ID CODE:</p>
                            <p className="font-mono font-bold text-slate-700">{cleanEmpId}</p>
                            <p className="text-[10px] text-slate-400">DEPT:</p>
                            <p className="font-semibold text-slate-700">{member.department || 'Administration'}</p>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border flex items-center justify-center">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=4&data=${member.id}`}
                              alt="Staff QR"
                              className="w-16 h-16"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 border-t border-slate-100/80 flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBadgeStaff(member)}
                          className="text-[11px] h-8 font-bold flex-1 cursor-pointer"
                        >
                          Show Badge Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePrintBadge(member)}
                          className="bg-[#1A5E63] hover:bg-[#154c50] text-white text-[11px] h-8 font-black flex items-center gap-1 px-3 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeStaffTab === 'register' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Daily Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Today Punches</p>
                <h3 className="text-xl font-bold text-[#1A5E63]">
                  {attendanceLogs.filter(log => log.date === new Date().toISOString().split('T')[0]).length}
                </h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Currently Checked-In</p>
                <h3 className="text-xl font-bold text-emerald-600">
                  {attendanceLogs.filter(log => !log.checkOutTime && log.date === new Date().toISOString().split('T')[0]).length}
                </h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">On Time Today</p>
                <h3 className="text-xl font-bold text-teal-600">
                  {attendanceLogs.filter(log => log.date === new Date().toISOString().split('T')[0] && log.status === 'On Time').length}
                </h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Late Entries Today</p>
                <h3 className="text-xl font-bold text-amber-600">
                  {attendanceLogs.filter(log => log.date === new Date().toISOString().split('T')[0] && log.status === 'Late').length}
                </h3>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4 border-b border-slate-50">
              <div>
                <CardTitle className="text-lg">Attendance Punch Register</CardTitle>
                <p className="text-xs text-muted-foreground">Historical roster of staff check-in and check-out logs.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={attendanceDateFilter}
                  onChange={(e) => setAttendanceDateFilter(e.target.value)}
                  className="h-9 text-xs bg-slate-50/50 border-none w-36"
                />
                <div className="relative w-44">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    placeholder="Search logs..."
                    value={attendanceSearchQuery}
                    onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-xs bg-slate-50/50 border-none"
                  />
                </div>
                <Button
                  onClick={() => setIsManualPunchOpen(true)}
                  className="h-9 text-xs font-bold bg-[#1A5E63] hover:bg-[#154c50] text-white px-3 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Manual Punch
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const headers = ['Staff Name', 'Role', 'Department', 'Date', 'Check In', 'Check Out', 'Status', 'Working Hours', 'Method'];
                    const rows = attendanceLogs.map(log => [
                      log.staffName,
                      log.role,
                      log.department,
                      log.date,
                      log.checkInTime,
                      log.checkOutTime || 'Active',
                      log.status,
                      log.workingHours || 'N/A',
                      log.method
                    ]);
                    const csv = [headers, ...rows].map(e => e.join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `staff_attendance_${attendanceDateFilter}.csv`;
                    a.click();
                    toast.success('Roster exported successfully');
                  }}
                  className="h-9 text-xs font-bold px-3 border border-slate-200 cursor-pointer"
                >
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Employee Details</TableHead>
                      <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Date</TableHead>
                      <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Punches (In/Out)</TableHead>
                      <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Duration</TableHead>
                      <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Method</TableHead>
                      <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Arrive Status</TableHead>
                      <TableHead className="text-right text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const filteredLogs = attendanceLogs.filter(log => {
                        const matchesSearch = log.staffName.toLowerCase().includes(attendanceSearchQuery.toLowerCase()) ||
                          log.role.toLowerCase().includes(attendanceSearchQuery.toLowerCase()) ||
                          log.department.toLowerCase().includes(attendanceSearchQuery.toLowerCase());
                        const matchesDate = !attendanceDateFilter || log.date === attendanceDateFilter;
                        return matchesSearch && matchesDate;
                      });

                      if (filteredLogs.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <History className="w-8 h-8 mx-auto mb-2 opacity-25 text-slate-400" />
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No attendance logs found for this date/search.</p>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return filteredLogs.map((log) => {
                        const emp = staff.find(s => s.id === log.staffId);
                        return (
                          <TableRow key={log.id} className="border-slate-50 hover:bg-slate-50/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8 border">
                                  <AvatarImage src={emp?.avatar} />
                                  <AvatarFallback>{log.staffName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-slate-800 text-xs">{log.staffName}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase font-mono">{log.role.replace('_', ' ')}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-xs text-slate-600 font-mono">
                              {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-xs font-mono">
                                <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">{log.checkInTime}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                {log.checkOutTime ? (
                                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">{log.checkOutTime}</span>
                                ) : (
                                  <span className="bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded font-extrabold animate-pulse">ACTIVE</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-700 font-bold font-mono">
                              {log.workingHours ? `${log.workingHours} hrs` : (log.checkOutTime ? 'N/A' : 'In Progress')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[9.5px] font-mono px-1.5 py-0.5 uppercase ${log.method === 'QR_CODE' ? 'bg-indigo-50/40 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                {log.method?.replace('_', ' ') || 'QR CODE'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] font-bold border-none ${log.status === 'Late' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-[#1A5E63]'}`}>
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this punch entry?')) {
                                    setAttendanceLogs(attendanceLogs.filter(item => item.id !== log.id));
                                    toast.success('Punch log removed');
                                  }
                                }}
                                className="h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[10px] font-bold cursor-pointer"
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Printable ID Badge Dialog Preview */}
      <Dialog open={!!selectedBadgeStaff} onOpenChange={(open) => { if(!open) setSelectedBadgeStaff(null); }}>
        <DialogContent className="sm:max-w-[360px] flex flex-col items-center">
          <DialogHeader className="w-full text-center pb-2">
            <DialogTitle className="text-sm font-black uppercase text-slate-600 tracking-wider">Staff Digital ID Card</DialogTitle>
            <DialogDescription>Hospital credential & QR barcode keycard</DialogDescription>
          </DialogHeader>

          {selectedBadgeStaff && (
            <div className="space-y-4 w-full flex flex-col items-center">
              {/* Badge visual card */}
              <div className="w-[280px] h-[420px] bg-white rounded-2xl shadow-xl border overflow-hidden flex flex-col justify-between">
                <div className="bg-gradient-to-r from-[#1A5E63] to-[#154c50] text-white p-4 text-center border-b-4 border-[#FFD1A9]">
                  <h3 className="font-extrabold text-[13px] tracking-widest uppercase">GastroPlus</h3>
                  <p className="text-[7.5px] tracking-wider text-teal-100 opacity-90 uppercase">Healthcare & Surgicals</p>
                </div>
                <div className="p-4 flex flex-col items-center text-center flex-1 justify-center space-y-3">
                  <Avatar className="w-20 h-20 border-2 border-[#1A5E63]">
                    <AvatarImage src={selectedBadgeStaff.avatar} />
                    <AvatarFallback>{selectedBadgeStaff.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-black text-md text-slate-800">{selectedBadgeStaff.name}</h4>
                    <p className="text-[10px] text-[#1A5E63] font-bold uppercase tracking-wider mt-0.5">
                      {selectedBadgeStaff.role?.replace('_', ' ')}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{selectedBadgeStaff.department || 'Administration'}</p>
                  </div>
                  <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=3&data=${selectedBadgeStaff.id}`}
                      alt="ID QR"
                      className="w-20 h-20"
                    />
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 font-bold uppercase">
                    EMP-{selectedBadgeStaff.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="bg-slate-50 py-2 border-t border-slate-100 text-center text-[8px] text-slate-400 font-medium">
                  Valid for scanner check-in & access control
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 w-full pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedBadgeStaff(null)}
                  className="flex-1 text-xs h-9 font-bold"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handlePrintBadge(selectedBadgeStaff)}
                  className="flex-1 bg-[#1A5E63] hover:bg-[#154c50] text-white text-xs h-9 font-black flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Print ID Card
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Attendance Punch Dialog */}
      <Dialog open={isManualPunchOpen} onOpenChange={setIsManualPunchOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Log Manual Attendance Punch</DialogTitle>
            <DialogDescription>Administrative override for staff check-in or checkout.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Select Employee <span className="text-red-500">*</span></Label>
              <Select
                value={manualPunchData.staffId}
                onValueChange={(v) => setManualPunchData({ ...manualPunchData, staffId: v })}
              >
                <SelectTrigger className="text-xs h-9 bg-white">
                  <SelectValue placeholder="Choose staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} - {s.role?.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={manualPunchData.date}
                  onChange={(e) => setManualPunchData({ ...manualPunchData, date: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Arrival Status</Label>
                <Select
                  value={manualPunchData.status}
                  onValueChange={(v) => setManualPunchData({ ...manualPunchData, status: v })}
                >
                  <SelectTrigger className="text-xs h-9 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On Time">On Time</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                    <SelectItem value="Half Day">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Clock In Time <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. 08:30 AM"
                  value={manualPunchData.checkInTime}
                  onChange={(e) => setManualPunchData({ ...manualPunchData, checkInTime: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Clock Out Time (Optional)</Label>
                <Input
                  placeholder="e.g. 05:00 PM"
                  value={manualPunchData.checkOutTime}
                  onChange={(e) => setManualPunchData({ ...manualPunchData, checkOutTime: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsManualPunchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualPunchSubmit} className="bg-[#1A5E63] hover:bg-[#154c50] text-white size-sm font-bold cursor-pointer">
              Save Attendance Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Employee Details</DialogTitle>
            <DialogDescription>Modify information for {editingStaff?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                placeholder="Enter name" 
                value={editingStaff?.name || ''}
                onChange={(e) => setEditingStaff({...editingStaff, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={editingStaff?.role || 'doctor'}
                onValueChange={(v) => setEditingStaff({...editingStaff, role: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="surgeon">Surgeon</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="reception">Receptionist</SelectItem>
                  <SelectItem value="pharmacist">Pharmacist</SelectItem>
                  <SelectItem value="lab_staff">Lab Staff</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input 
                placeholder="e.g. Cardiology" 
                value={editingStaff?.department || ''}
                onChange={(e) => setEditingStaff({...editingStaff, department: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Specialty</Label>
              <Input 
                placeholder="e.g. Pediatrics" 
                value={editingStaff?.specialty || ''}
                onChange={(e) => setEditingStaff({...editingStaff, specialty: e.target.value})}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                placeholder="email@hospital.com" 
                value={editingStaff?.email || ''}
                onChange={(e) => setEditingStaff({...editingStaff, email: e.target.value})}
              />
            </div>
            {isDoctorOrSurgeon(editingStaff?.role) && (
              <div className="space-y-2 col-span-2">
                <Label>Consultation Fee (₹)</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 500" 
                  value={editingStaff?.consultationFee || ''}
                  onChange={(e) => setEditingStaff({...editingStaff, consultationFee: e.target.value})}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button className="bg-medical-blue" onClick={handleUpdateStaff}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
