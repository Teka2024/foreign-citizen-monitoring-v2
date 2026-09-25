import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Avatar,
  Divider,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Hotel,
  Warning as WarningIcon,
  Edit,
  Add,
  Close,
  Cancel,
  Notes,
  FolderOpen,
  FilePresent,
  Description,
  Image as ImageIcon,
  Download,
  Visibility,
  InsertDriveFile,
  PictureAsPdf,
  Print,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const API_BASE = 'http://localhost:5006';

const CitizenDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [citizen, setCitizen] = useState(null);
  const [accommodationHistory, setAccommodationHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [openCheckOutDialog, setOpenCheckOutDialog] = useState(false);
  const [openPrintDialog, setOpenPrintDialog] = useState(false);
  const [note, setNote] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [checkOutNotes, setCheckOutNotes] = useState('');
  const [previewDialog, setPreviewDialog] = useState({ open: false, doc: null });

  useEffect(() => {
    fetchCitizenDetails();
  }, [id]);

  const fetchCitizenDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/citizens/${id}`);
      const citizenData = response.data.data || response.data.citizen;
      setCitizen(citizenData);
      setAccommodationHistory(response.data.accommodationHistory || []);
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Error fetching citizen details:', error);
      toast.error('Failed to load citizen details');
      navigate('/citizens');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) {
      toast.warning('Please enter a note');
      return;
    }
    try {
      await api.post(`/citizens/${id}/notes`, { note });
      toast.success('Note added successfully');
      setOpenNoteDialog(false);
      setNote('');
      fetchCitizenDetails();
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleCheckOut = async () => {
    if (!checkOutDate) {
      toast.warning('Please select a check-out date');
      return;
    }
    try {
      await api.post('/accommodations/check-out', {
        citizenId: id,
        checkOutDate: checkOutDate,
        notes: checkOutNotes,
      });
      toast.success('Citizen checked out successfully');
      setOpenCheckOutDialog(false);
      fetchCitizenDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check out');
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    const normalized = filePath.replace(/\\/g, '/');
    return `${API_BASE}/${normalized}`;
  };

  const isImageFile = (filePath) => {
    if (!filePath) return false;
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filePath);
  };

  const isPdfFile = (filePath) => {
    if (!filePath) return false;
    return /\.pdf$/i.test(filePath);
  };

  const handlePreview = (title, filePath, meta = {}) => {
    setPreviewDialog({ open: true, doc: { title, filePath, meta } });
  };

  const closePreview = () => setPreviewDialog({ open: false, doc: null });

  const handlePrint = () => {
    setTimeout(() => window.print(), 300);
  };

  const getEntryDocumentInfo = (c) => {
    const type = c.entryDocType || 'visa';

    if (type === 'visa') {
      return {
        title: 'Visa Information',
        icon: '🛂',
        fields: [
          { label: 'Visa Type', value: c.visaType },
          { label: 'Visa Number', value: c.visaNumber },
          { label: 'Visa Issue Date', value: c.visaIssueDate ? format(new Date(c.visaIssueDate), 'MMM dd, yyyy') : null },
          { label: 'Visa Expiry Date', value: c.visaExpiryDate ? format(new Date(c.visaExpiryDate), 'MMM dd, yyyy') : null },
        ],
      };
    }
    if (type === 'id') {
      return {
        title: 'ID Information',
        icon: '🆔',
        fields: [
          { label: 'ID Type', value: c.idType ? c.idType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null },
          { label: 'ID Number', value: c.idNumber },
          { label: 'ID Issue Date', value: c.idIssueDate ? format(new Date(c.idIssueDate), 'MMM dd, yyyy') : null },
          { label: 'ID Expiry Date', value: c.idExpiryDate ? format(new Date(c.idExpiryDate), 'MMM dd, yyyy') : null },
        ],
      };
    }
    if (type === 'stamp') {
      return {
        title: 'Stamp Information',
        icon: '📌',
        fields: [
          { label: 'Stamp Type', value: c.stampType ? c.stampType.charAt(0).toUpperCase() + c.stampType.slice(1) : null },
          { label: 'Stamp Number', value: c.stampNumber },
          { label: 'Stamp Issue Date', value: c.stampIssueDate ? format(new Date(c.stampIssueDate), 'MMM dd, yyyy') : null },
          { label: 'Stamp Expiry Date', value: c.stampExpiryDate ? format(new Date(c.stampExpiryDate), 'MMM dd, yyyy') : null },
        ],
      };
    }
    return {
      title: 'Other Document Information',
      icon: '📄',
      fields: [
        { label: 'Document Name', value: c.otherDocName },
        { label: 'Document Number', value: c.otherDocNumber },
        { label: 'Issue Date', value: c.otherIssueDate ? format(new Date(c.otherIssueDate), 'MMM dd, yyyy') : null },
        { label: 'Expiry Date', value: c.otherExpiryDate ? format(new Date(c.otherExpiryDate), 'MMM dd, yyyy') : null },
      ],
    };
  };

  if (loading) return <LinearProgress />;
  if (!citizen) return <Box sx={{ p: 3 }}><Alert severity="error">Citizen not found</Alert></Box>;

  const isOverstayed = differenceInDays(new Date(), new Date(citizen.expectedExitDate)) > 0;
  const daysRemaining = differenceInDays(new Date(citizen.expectedExitDate), new Date());
  const entryDocInfo = getEntryDocumentInfo(citizen);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* ==================== HEADER ==================== */}
      <Paper sx={{
        p: 3.5, mb: 3, borderRadius: 4,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
        color: 'white',
        boxShadow: '0 8px 32px rgba(25, 118, 210, 0.30)',
        position: 'relative', overflow: 'hidden',
        '&::before': {
          content: '""', position: 'absolute',
          top: -60, right: -60, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        },
        '&::after': {
          content: '""', position: 'absolute',
          bottom: -80, right: 120, width: 160, height: 160,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
        },
      }}>
        <Grid container alignItems="center" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Grid item>
            <Avatar
              src={citizen.photo ? getFileUrl(citizen.photo) : undefined}
              sx={{
                width: 80, height: 80, bgcolor: 'white', color: 'primary.main',
                fontWeight: 800, fontSize: '2rem',
                border: '3px solid rgba(255,255,255,0.3)',
              }}
            >
              {citizen.fullName?.charAt(0) || 'C'}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              {citizen.fullName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Chip label={`Passport: ${citizen.passportNumber}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              <Chip label={`Nationality: ${citizen.nationality}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              <Chip label={`Status: ${citizen.status || 'Active'}`} size="small" color={citizen.status === 'active' ? 'success' : 'warning'} />
              <Chip label={`Risk: ${citizen.riskLevel || 'Low'}`} size="small" color={citizen.riskLevel === 'low' ? 'success' : 'error'} />
              {isOverstayed && <Chip label={`Overstayed by ${Math.abs(daysRemaining)} days`} size="small" color="error" />}
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={() => setOpenPrintDialog(true)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)', color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                }}
              >
                Print / Download
              </Button>
              <Button
                variant="contained"
                startIcon={<Edit />}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)', color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                }}
                onClick={() => navigate(`/citizens/${id}/edit`)}
              >
                Edit
              </Button>
              {citizen.currentAccommodation?.status === 'checked_in' && (
                <Button
                  variant="contained"
                  startIcon={<Cancel />}
                  sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
                  onClick={() => setOpenCheckOutDialog(true)}
                >
                  Check Out
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ==================== TABS (Documents REMOVED — now on Overview) ==================== */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ px: 2 }}>
          <Tab label="Overview" icon={<Person />} iconPosition="start" />
          <Tab label="Accommodation" icon={<Hotel />} iconPosition="start" />
          <Tab label="Alerts" icon={<WarningIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* 1. Personal Information (with photo) */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    src={citizen.photo ? getFileUrl(citizen.photo) : undefined}
                    sx={{
                      width: 100, height: 100, borderRadius: 2,
                      border: '2px solid #e0e0e0',
                      bgcolor: 'primary.main', fontSize: '2.5rem', fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {citizen.fullName?.charAt(0) || 'C'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="textSecondary">Full Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                      {citizen.fullName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Date of Birth</Typography>
                    <Typography variant="body1">
                      {citizen.dateOfBirth ? format(new Date(citizen.dateOfBirth), 'MMM dd, yyyy') : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Gender</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{citizen.gender || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Nationality</Typography>
                    <Typography variant="body1">{citizen.nationality}</Typography>
                  </Grid>
                  {(citizen.placeOfBirth?.city || citizen.placeOfBirth?.country) && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Place of Birth</Typography>
                      <Typography variant="body1">
                        {[citizen.placeOfBirth?.city, citizen.placeOfBirth?.country].filter(Boolean).join(', ')}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 2. Entry Doc Info — dynamic */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <span style={{ marginRight: 8 }}>{entryDocInfo.icon}</span>
                  {entryDocInfo.title}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {entryDocInfo.fields.map((f, i) => (
                    <Grid item xs={6} key={i}>
                      <Typography variant="caption" color="textSecondary">{f.label}</Typography>
                      <Typography variant="body1">
                        {f.value || <span style={{ color: '#9e9e9e' }}>N/A</span>}
                      </Typography>
                    </Grid>
                  ))}
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Entry Date</Typography>
                    <Typography variant="body1">
                      {citizen.entryDate ? format(new Date(citizen.entryDate), 'MMM dd, yyyy') : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Expected Exit</Typography>
                    <Typography variant="body1">
                      {citizen.expectedExitDate ? format(new Date(citizen.expectedExitDate), 'MMM dd, yyyy') : 'N/A'}
                      {daysRemaining >= 0 && citizen.expectedExitDate && (
                        <Chip label={`${daysRemaining} days remaining`} size="small" color={daysRemaining > 30 ? 'success' : 'warning'} sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Entry Port</Typography>
                    <Typography variant="body1">{citizen.entryPort || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 3. Contact Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Contact Information</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Phone</Typography>
                    <Typography variant="body1">{citizen.personalContact?.phone || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Email</Typography>
                    <Typography variant="body1">{citizen.personalContact?.email || 'N/A'}</Typography>
                  </Grid>
                  {(citizen.personalContact?.address?.street ||
                    citizen.personalContact?.address?.city ||
                    citizen.personalContact?.address?.country) && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Address</Typography>
                      <Typography variant="body1">
                        {[
                          citizen.personalContact?.address?.street,
                          citizen.personalContact?.address?.city,
                          citizen.personalContact?.address?.state,
                          citizen.personalContact?.address?.country,
                        ].filter(Boolean).join(', ') || 'N/A'}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* ✅ NEW POSITION: Documents section right after Contact Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <FolderOpen sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">Uploaded Documents</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {/* Passport Photo */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">Passport Photo</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                    {citizen.photo ? (
                      <>
                        <Avatar
                          src={getFileUrl(citizen.photo)}
                          sx={{ width: 56, height: 56, borderRadius: 1 }}
                          variant="square"
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small" variant="outlined" startIcon={<Visibility />}
                            onClick={() => handlePreview('Passport Photo', citizen.photo, { type: 'Photo' })}
                          >
                            View
                          </Button>
                          <Button
                            size="small" variant="outlined" color="success" startIcon={<Download />}
                            href={getFileUrl(citizen.photo)} download target="_blank"
                          >
                            Download
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body2" color="textSecondary">Not uploaded</Typography>
                    )}
                  </Box>
                </Box>

                {/* Passport File */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">Passport File</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                    {citizen.passportFile ? (
                      <>
                        <Avatar variant="square" sx={{ width: 56, height: 56, bgcolor: 'grey.100' }}>
                          {isImageFile(citizen.passportFile) ? (
                            <img
                              src={getFileUrl(citizen.passportFile)}
                              alt="Passport"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <PictureAsPdf sx={{ color: '#ef5350' }} />
                          )}
                        </Avatar>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small" variant="outlined" startIcon={<Visibility />}
                            onClick={() => handlePreview('Passport File', citizen.passportFile, { type: 'Passport' })}
                          >
                            View
                          </Button>
                          <Button
                            size="small" variant="outlined" color="success" startIcon={<Download />}
                            href={getFileUrl(citizen.passportFile)} download target="_blank"
                          >
                            Download
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body2" color="textSecondary">Not uploaded</Typography>
                    )}
                  </Box>
                </Box>

                {/* Entry Document */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">Entry Document</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                    {citizen.entryDocumentFile ? (
                      <>
                        <Avatar variant="square" sx={{ width: 56, height: 56, bgcolor: 'grey.100' }}>
                          {isImageFile(citizen.entryDocumentFile) ? (
                            <img
                              src={getFileUrl(citizen.entryDocumentFile)}
                              alt="Entry Document"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <PictureAsPdf sx={{ color: '#ef5350' }} />
                          )}
                        </Avatar>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small" variant="outlined" startIcon={<Visibility />}
                            onClick={() => handlePreview('Entry Document', citizen.entryDocumentFile, { type: 'Entry Document' })}
                          >
                            View
                          </Button>
                          <Button
                            size="small" variant="outlined" color="success" startIcon={<Download />}
                            href={getFileUrl(citizen.entryDocumentFile)} download target="_blank"
                          >
                            Download
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body2" color="textSecondary">Not uploaded</Typography>
                    )}
                  </Box>
                </Box>

                {/* Additional Documents */}
                {citizen.documents && citizen.documents.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Additional Documents ({citizen.documents.length})
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {citizen.documents.map((doc, index) => (
                        <Box
                          key={doc._id || index}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            p: 1, mb: 1, bgcolor: 'grey.50', borderRadius: 1,
                          }}
                        >
                          <Chip
                            label={doc.docType?.toUpperCase() || 'DOC'}
                            size="small"
                            color={
                              doc.docType === 'visa' ? 'primary' :
                              doc.docType === 'id' ? 'info' :
                              doc.docType === 'stamp' ? 'warning' : 'default'
                            }
                          />
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {doc.documentNumber || doc.fileName || 'Document'}
                          </Typography>
                          {doc.fileUrl && (
                            <>
                              <IconButton
                                size="small" color="primary"
                                onClick={() => handlePreview(
                                  `${doc.docType?.toUpperCase()} Document`,
                                  doc.fileUrl,
                                  { type: doc.docType, number: doc.documentNumber }
                                )}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small" color="success"
                                href={getFileUrl(doc.fileUrl)} download target="_blank"
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 5. Monitoring Notes */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Monitoring Notes</Typography>
                  <Button variant="outlined" startIcon={<Add />} onClick={() => setOpenNoteDialog(true)}>
                    Add Note
                  </Button>
                </Box>
                <Divider sx={{ my: 2 }} />
                {citizen.monitoringNotes?.length > 0 ? (
                  citizen.monitoringNotes.map((n, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">{n.officer?.fullName || 'Unknown Officer'}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(n.date), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>{n.note}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">No monitoring notes yet</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ==================== ACCOMMODATION TAB ==================== */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Accommodation History</Typography>
            <Divider sx={{ mb: 2 }} />
            {accommodationHistory.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Accommodation</TableCell>
                      <TableCell>Check-In</TableCell>
                      <TableCell>Check-Out</TableCell>
                      <TableCell>Room</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accommodationHistory.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>{record.accommodationId?.name || 'N/A'}</TableCell>
                        <TableCell>{record.checkInDate ? format(new Date(record.checkInDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>{record.checkOutDate ? format(new Date(record.checkOutDate), 'MMM dd, yyyy') : 'Active'}</TableCell>
                        <TableCell>{record.roomNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip label={record.status} size="small" color={record.status === 'active' ? 'success' : 'default'} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="textSecondary">No accommodation history found</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================== ALERTS TAB ==================== */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Alerts</Typography>
            <Divider sx={{ mb: 2 }} />
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <Box
                  key={alert._id}
                  sx={{
                    p: 2, mb: 2, borderRadius: 1, border: 1,
                    borderColor: alert.severity === 'critical' ? 'error.main' :
                                 alert.severity === 'high' ? 'warning.main' : 'info.main',
                    bgcolor: alert.severity === 'critical' ? 'error.light' :
                             alert.severity === 'high' ? 'warning.light' : 'info.light',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">{alert.message}</Typography>
                    <Chip label={alert.status} size="small" color={alert.status === 'resolved' ? 'success' : 'warning'} />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {alert.createdAt ? format(new Date(alert.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">No alerts for this citizen</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================== PRINT PREVIEW DIALOG ==================== */}
      <Dialog open={openPrintDialog} onClose={() => setOpenPrintDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Citizen Profile — Print Preview</Typography>
            <IconButton onClick={() => setOpenPrintDialog(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box id="citizen-print-view" sx={{ bgcolor: 'white', p: 3 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', mb: 3, borderBottom: '2px solid #1976d2', pb: 2 }}>
              <Avatar
                src={citizen.photo ? getFileUrl(citizen.photo) : undefined}
                sx={{ width: 110, height: 130, borderRadius: 1, bgcolor: 'primary.main', fontSize: '3rem', fontWeight: 800 }}
              >
                {citizen.fullName?.charAt(0) || 'C'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0d47a1' }}>
                  {citizen.fullName}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, color: '#666' }}>
                  Foreign Citizen Profile — ICS-FCMS
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`Passport: ${citizen.passportNumber}`} size="small" />
                  <Chip label={`Nationality: ${citizen.nationality}`} size="small" />
                  <Chip label={`Status: ${citizen.status || 'Active'}`} size="small" color={citizen.status === 'active' ? 'success' : 'warning'} />
                  <Chip label={`Risk: ${citizen.riskLevel || 'Low'}`} size="small" color={citizen.riskLevel === 'low' ? 'success' : 'error'} />
                </Box>
              </Box>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>1. Personal Information</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3, fontSize: '0.85rem' }}>
              <Box><strong>Full Name:</strong> {citizen.fullName}</Box>
              <Box><strong>Date of Birth:</strong> {citizen.dateOfBirth ? format(new Date(citizen.dateOfBirth), 'MMM dd, yyyy') : 'N/A'}</Box>
              <Box><strong>Gender:</strong> {citizen.gender || 'N/A'}</Box>
              <Box><strong>Nationality:</strong> {citizen.nationality}</Box>
              <Box><strong>Passport Number:</strong> {citizen.passportNumber}</Box>
              <Box><strong>Passport Issue:</strong> {citizen.passportIssueDate ? format(new Date(citizen.passportIssueDate), 'MMM dd, yyyy') : 'N/A'}</Box>
              <Box><strong>Passport Expiry:</strong> {citizen.passportExpiryDate ? format(new Date(citizen.passportExpiryDate), 'MMM dd, yyyy') : 'N/A'}</Box>
              {(citizen.placeOfBirth?.city || citizen.placeOfBirth?.country) && (
                <Box><strong>Place of Birth:</strong> {[citizen.placeOfBirth?.city, citizen.placeOfBirth?.country].filter(Boolean).join(', ')}</Box>
              )}
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>2. {entryDocInfo.title}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3, fontSize: '0.85rem' }}>
              {entryDocInfo.fields.map((f, i) => (
                <Box key={i}><strong>{f.label}:</strong> {f.value || 'N/A'}</Box>
              ))}
              <Box><strong>Entry Date:</strong> {citizen.entryDate ? format(new Date(citizen.entryDate), 'MMM dd, yyyy') : 'N/A'}</Box>
              <Box><strong>Expected Exit:</strong> {citizen.expectedExitDate ? format(new Date(citizen.expectedExitDate), 'MMM dd, yyyy') : 'N/A'}</Box>
              <Box><strong>Entry Port:</strong> {citizen.entryPort || 'N/A'}</Box>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>3. Contact Information</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3, fontSize: '0.85rem' }}>
              <Box><strong>Phone:</strong> {citizen.personalContact?.phone || 'N/A'}</Box>
              <Box><strong>Email:</strong> {citizen.personalContact?.email || 'N/A'}</Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <strong>Address:</strong>{' '}
                {[citizen.personalContact?.address?.street, citizen.personalContact?.address?.city,
                  citizen.personalContact?.address?.state, citizen.personalContact?.address?.country]
                  .filter(Boolean).join(', ') || 'N/A'}
              </Box>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>4. Attached Documents</Typography>
            <Box sx={{ fontSize: '0.85rem', mb: 2 }}>
              <Box><strong>Passport Photo:</strong> {citizen.photo ? '✓ Uploaded' : '✗ Missing'}</Box>
              <Box><strong>Passport File:</strong> {citizen.passportFile ? '✓ Uploaded' : '✗ Missing'}</Box>
              <Box><strong>Entry Document:</strong> {citizen.entryDocumentFile ? '✓ Uploaded' : '✗ Missing'}</Box>
              {citizen.documents?.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <strong>Additional Documents ({citizen.documents.length}):</strong>
                  <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                    {citizen.documents.map((doc, i) => (
                      <li key={i}>
                        {doc.docType?.toUpperCase()} — {doc.documentNumber || 'N/A'} (Issue: {doc.issueDate ? format(new Date(doc.issueDate), 'MMM dd, yyyy') : 'N/A'})
                      </li>
                    ))}
                  </ul>
                </Box>
              )}
            </Box>

            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
              Generated on {format(new Date(), 'MMMM dd, yyyy HH:mm')} — ICS-FCMS
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPrintDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>
            Print / Save as PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==================== DOCUMENT PREVIEW DIALOG ==================== */}
      <Dialog open={previewDialog.open} onClose={closePreview} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{previewDialog.doc?.title || 'Document Preview'}</Typography>
            <IconButton onClick={closePreview}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {previewDialog.doc && (
            <Box>
              {isImageFile(previewDialog.doc.filePath) ? (
                <Box sx={{ textAlign: 'center', bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
                  <img
                    src={getFileUrl(previewDialog.doc.filePath)}
                    alt={previewDialog.doc.title}
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                  />
                </Box>
              ) : isPdfFile(previewDialog.doc.filePath) ? (
                <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, textAlign: 'center' }}>
                  <PictureAsPdf sx={{ fontSize: 80, color: '#ef5350', mb: 2 }} />
                  <Typography variant="body1" sx={{ mb: 2 }}>PDF document — open in a new tab</Typography>
                  <Button
                    variant="contained" startIcon={<Visibility />}
                    href={getFileUrl(previewDialog.doc.filePath)}
                    target="_blank" rel="noopener noreferrer"
                  >
                    Open PDF
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <InsertDriveFile sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body2" color="textSecondary">Preview not available</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {previewDialog.doc && (
            <Button
              startIcon={<Download />}
              href={getFileUrl(previewDialog.doc.filePath)}
              download target="_blank"
            >
              Download
            </Button>
          )}
          <Button onClick={closePreview}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={openNoteDialog} onClose={() => setOpenNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Monitoring Note</Typography>
            <IconButton onClick={() => setOpenNoteDialog(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth multiline rows={4} label="Note"
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Enter monitoring note..." sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNoteDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddNote} disabled={!note.trim()}>Add Note</Button>
        </DialogActions>
      </Dialog>

      {/* Check Out Dialog */}
      <Dialog open={openCheckOutDialog} onClose={() => setOpenCheckOutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Check Out Citizen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Confirm check-out for {citizen.fullName}
            </Typography>
            <TextField
              fullWidth label="Check-Out Date" type="date"
              value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)}
              InputLabelProps={{ shrink: true }} sx={{ mt: 2 }}
            />
            <TextField
              fullWidth multiline rows={3} label="Notes"
              value={checkOutNotes} onChange={(e) => setCheckOutNotes(e.target.value)}
              placeholder="Optional notes..." sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckOutDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleCheckOut} disabled={!checkOutDate}>
            Confirm Check Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CitizenDetails;