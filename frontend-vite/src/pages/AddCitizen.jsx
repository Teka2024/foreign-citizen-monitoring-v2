import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormHelperText,
} from '@mui/material';
import {
  PhotoCamera,
  Delete,
  CloudUpload,
  PictureAsPdf,
  Description,
  Visibility,
  Close,
  Person,
  Email,
  Phone,
  CalendarToday,
  LocationOn,
  Work,
  School,
  Add,
  InsertDriveFile,
  UploadFile,
  FilePresent,
  CheckCircle,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import api from '../api/axios';

const AddCitizen = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [passportFile, setPassportFile] = useState(null);
  const [passportFileName, setPassportFileName] = useState('');
  const [entryDocFile, setEntryDocFile] = useState(null);
  const [entryDocFileName, setEntryDocFileName] = useState('');
  const [documents, setDocuments] = useState([]);
  const [viewDocument, setViewDocument] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    firstName: '',
    middleName: '',
    lastName: '',
    nationality: '',
    dateOfBirth: '',
    gender: 'male',
    placeOfBirth: { city: '', country: '' },
    // Entry Document Type: 'visa', 'id', 'stamp', 'other'
    entryDocType: 'visa',
    // Visa fields
    visaType: '',
    visaNumber: '',
    visaIssueDate: '',
    visaExpiryDate: '',
    // ID fields
    idNumber: '',
    idType: '',
    idIssueDate: '',
    idExpiryDate: '',
    // Stamp fields
    stampNumber: '',
    stampType: 'entry',  // ✅ Default to 'entry'
    stampIssueDate: '',
    stampExpiryDate: '',
    // Other fields
    otherDocName: '',
    otherDocNumber: '',
    otherIssueDate: '',
    otherExpiryDate: '',
    // Entry details
    entryDate: new Date().toISOString().split('T')[0],
    expectedExitDate: '',
    entryPort: '',
    personalContact: {
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
    },
    employment: {
      employer: '',
      position: '',
      address: '',
      phone: '',
      startDate: '',
      endDate: '',
    },
    education: {
      institution: '',
      course: '',
      startDate: '',
      endDate: '',
    },
    riskLevel: 'low',
    status: 'active',
  });

  const [newDocument, setNewDocument] = useState({
    docType: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: '',
    file: null,
    visaType: '',
    visaNumber: '',
    idNumber: '',
    idType: '',
    stampNumber: '',
    stampType: 'entry',  // ✅ Default to 'entry'
    documentName: '',
    autoFilled: false,
  });

  const documentTypes = [
    { value: 'visa', label: 'Visa' },
    { value: 'id', label: 'ID' },
    { value: 'stamp', label: 'Stamp' },
    { value: 'other', label: 'Other' },
  ];

  const entryDocTypes = [
    { value: 'visa', label: 'Visa' },
    { value: 'id', label: 'ID' },
    { value: 'stamp', label: 'Stamp' },     
    { value: 'other', label: 'Other (Special Case)' },
  ];

  const visaTypes = [
    'tourist', 'business', 'student', 'work', 'diplomatic', 'transit', 'resident'
  ];

  const idTypes = [
    'national_id', 'residence_permit', 'other'
  ];

  const stampTypes = [
    'entry', 'exit', 'transit', 'other'
  ];

  // ✅ Auto-fill additional document when docType changes
  useEffect(() => {
    if (!newDocument.docType) return;

    // Check if the selected document type matches the entry document
    if (newDocument.docType === formData.entryDocType) {
      const autoFillData = { autoFilled: true };

      if (formData.entryDocType === 'visa') {
        autoFillData.visaType = formData.visaType;
        autoFillData.visaNumber = formData.visaNumber;
        autoFillData.issueDate = formData.visaIssueDate;
        autoFillData.expiryDate = formData.visaExpiryDate;
        autoFillData.documentName = 'Visa Document';
      } else if (formData.entryDocType === 'id') {
        autoFillData.idType = formData.idType;
        autoFillData.idNumber = formData.idNumber;
        autoFillData.issueDate = formData.idIssueDate;
        autoFillData.expiryDate = formData.idExpiryDate;
        autoFillData.documentName = 'ID Document';
      } else if (formData.entryDocType === 'stamp') {
        autoFillData.stampType = formData.stampType || 'entry';
        autoFillData.stampNumber = formData.stampNumber || '';
        autoFillData.issueDate = formData.stampIssueDate || '';
        autoFillData.expiryDate = formData.stampExpiryDate || '';
        autoFillData.documentName = 'Stamp Document';
      } else if (formData.entryDocType === 'other') {
        autoFillData.documentName = formData.otherDocName;
        autoFillData.issueDate = formData.otherIssueDate;
        autoFillData.expiryDate = formData.otherExpiryDate;
      }

      // Only auto-fill if the fields are not empty
      if (autoFillData.issueDate || autoFillData.expiryDate || autoFillData.visaType || autoFillData.idType) {
        setNewDocument(prev => ({
          ...prev,
          ...autoFillData,
        }));
        toast.info('Auto-filled from Entry Document!');
      }
    } else {
      // Reset auto-fill flag when different type is selected
      setNewDocument(prev => ({
        ...prev,
        autoFilled: false,
        visaType: '',
        visaNumber: '',
        idNumber: '',
        idType: '',
        stampNumber: '',
        stampType: 'entry',
        documentName: '',
        issueDate: '',
        expiryDate: '',
        issuingAuthority: '',
      }));
    }
  }, [newDocument.docType, formData.entryDocType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Handle Passport File Upload
  const handlePassportFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File must be less than 10MB');
        return;
      }
      setPassportFile(file);
      setPassportFileName(file.name);
      toast.success('Passport file uploaded successfully');
    }
    e.target.value = '';
  };

  // ✅ Handle Entry Document File Upload
  const handleEntryDocFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File must be less than 10MB');
        return;
      }
      setEntryDocFile(file);
      setEntryDocFileName(file.name);
      toast.success('Entry document uploaded successfully');
    }
    e.target.value = '';
  };

  const handleDocTypeChange = (e) => {
    const value = e.target.value;
    setNewDocument({
      ...newDocument,
      docType: value,
      visaType: '',
      visaNumber: '',
      idNumber: '',
      idType: '',
      stampNumber: '',
      stampType: 'entry',
      documentName: '',
      autoFilled: false,
    });
  };

  const handleDocFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File must be less than 10MB');
        return;
      }
      setNewDocument({ ...newDocument, file });
    }
    e.target.value = '';
  };

  const addDocument = () => {
    if (!newDocument.docType) {
      toast.error('Please select document type');
      return;
    }
    if (!newDocument.issueDate) {
      toast.error('Please enter issue date');
      return;
    }
    if (!newDocument.expiryDate) {
      toast.error('Please enter expiry date');
      return;
    }

    if (newDocument.docType === 'visa' && !newDocument.visaType) {
      toast.error('Please select visa type');
      return;
    }
    if (newDocument.docType === 'id' && !newDocument.idType) {
      toast.error('Please select ID type');
      return;
    }

    const docData = {
      id: Date.now(),
      docType: newDocument.docType,
      issueDate: newDocument.issueDate,
      expiryDate: newDocument.expiryDate,
      issuingAuthority: newDocument.issuingAuthority || '',
      file: newDocument.file,
      preview: newDocument.file ? URL.createObjectURL(newDocument.file) : null,
      fileName: newDocument.file ? newDocument.file.name : null,
      fileSize: newDocument.file ? newDocument.file.size : 0,
      fileType: newDocument.file ? newDocument.file.type : null,
      isVerified: false,
      visaType: newDocument.visaType,
      visaNumber: newDocument.visaNumber,
      idNumber: newDocument.idNumber,
      idType: newDocument.idType,
      stampNumber: newDocument.stampNumber,
      stampType: newDocument.stampType,
      documentName: newDocument.documentName,
      autoFilled: newDocument.autoFilled,
    };

    setDocuments([...documents, docData]);
    setNewDocument({
      docType: '',
      issueDate: '',
      expiryDate: '',
      issuingAuthority: '',
      file: null,
      visaType: '',
      visaNumber: '',
      idNumber: '',
      idType: '',
      stampNumber: '',
      stampType: 'entry',
      documentName: '',
      autoFilled: false,
    });
    toast.success('Document added successfully');
  };

  const removeDocument = (docId) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const removePassportFile = () => {
    setPassportFile(null);
    setPassportFileName('');
  };

  const removeEntryDocFile = () => {
    setEntryDocFile(null);
    setEntryDocFileName('');
  };

  const handleViewDocument = (doc) => {
    setViewDocument(doc);
    setOpenViewDialog(true);
  };

  // ✅ Fixed: handleSubmit - ONLY send fields that have values
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();

      // Helper to check if we should include a field based on entryDocType
      const shouldIncludeField = (key) => {
        // Visa fields - only include if entryDocType is 'visa'
        if (['visaType', 'visaNumber', 'visaIssueDate', 'visaExpiryDate'].includes(key)) {
          return formData.entryDocType === 'visa';
        }
        // ID fields - only include if entryDocType is 'id'
        if (['idNumber', 'idType', 'idIssueDate', 'idExpiryDate'].includes(key)) {
          return formData.entryDocType === 'id';
        }
        // Stamp fields - only include if entryDocType is 'stamp'
        if (['stampNumber', 'stampType', 'stampIssueDate', 'stampExpiryDate'].includes(key)) {
          return formData.entryDocType === 'stamp';
        }
        // Other fields - only include if entryDocType is 'other'
        if (['otherDocName', 'otherDocNumber', 'otherIssueDate', 'otherExpiryDate'].includes(key)) {
          return formData.entryDocType === 'other';
        }
        return true;
      };

      // Process all form fields
      for (const [key, value] of Object.entries(formData)) {
        // Skip if the field should not be included
        if (!shouldIncludeField(key)) {
          continue;
        }

        // Handle nested objects
        if (typeof value === 'object' && value !== null) {
          if (key === 'personalContact' || key === 'placeOfBirth' || key === 'employment' || key === 'education') {
            for (const [subKey, subValue] of Object.entries(value)) {
              if (typeof subValue === 'object' && subValue !== null) {
                for (const [subSubKey, subSubValue] of Object.entries(subValue)) {
                  if (subSubValue !== null && subSubValue !== undefined && subSubValue !== '') {
                    formDataToSend.append(`${key}.${subKey}.${subSubKey}`, subSubValue);
                  }
                }
              } else {
                if (subValue !== null && subValue !== undefined && subValue !== '') {
                  formDataToSend.append(`${key}.${subKey}`, subValue);
                }
              }
            }
          } else {
            // For other objects, skip them (they shouldn't be sent directly)
            continue;
          }
        } else {
          // Simple key-value pair
          if (value !== null && value !== undefined && value !== '') {
            formDataToSend.append(key, value);
          }
        }
      }

      // Add photo
      if (photo) {
        formDataToSend.append('photo', photo);
      }

      // Add passport file
      if (passportFile) {
        formDataToSend.append('passportFile', passportFile);
      }

      // Add entry document file
      if (entryDocFile) {
        formDataToSend.append('entryDocumentFile', entryDocFile);
      }

      // Add documents
      documents.forEach((doc, index) => {
        formDataToSend.append(`documents[${index}].docType`, doc.docType);
        formDataToSend.append(`documents[${index}].issueDate`, doc.issueDate);
        formDataToSend.append(`documents[${index}].expiryDate`, doc.expiryDate);
        formDataToSend.append(`documents[${index}].issuingAuthority`, doc.issuingAuthority || '');
        if (doc.docType === 'visa') {
          formDataToSend.append(`documents[${index}].visaType`, doc.visaType);
          if (doc.visaNumber) {
            formDataToSend.append(`documents[${index}].visaNumber`, doc.visaNumber);
          }
        }
        if (doc.docType === 'id') {
          formDataToSend.append(`documents[${index}].idType`, doc.idType);
          if (doc.idNumber) {
            formDataToSend.append(`documents[${index}].idNumber`, doc.idNumber);
          }
        }
        if (doc.docType === 'stamp') {
          formDataToSend.append(`documents[${index}].stampType`, doc.stampType);
          if (doc.stampNumber) {
            formDataToSend.append(`documents[${index}].stampNumber`, doc.stampNumber);
          }
        }
        if (doc.docType === 'other') {
          if (doc.documentName) {
            formDataToSend.append(`documents[${index}].documentName`, doc.documentName);
          }
        }
        if (doc.file) {
          formDataToSend.append(`documents[${index}].file`, doc.file);
        }
      });

      await api.post('/citizens', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Citizen registered successfully!');
      navigate('/citizens');
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.response?.data?.message || 'Failed to register citizen');
      toast.error(error.response?.data?.message || 'Failed to register citizen');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Personal Information', 'Entry Document & Details', 'Contact & Documents'];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Register New Citizen
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* STEP 1: Personal Information */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
              {/* Photo Upload */}
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar src={photoPreview} sx={{ width: 150, height: 150, mb: 2 }}>
                    {!photoPreview && <PhotoCamera sx={{ fontSize: 60 }} />}
                  </Avatar>
                  <Button variant="outlined" component="label" startIcon={<PhotoCamera />} sx={{ mb: 1 }}>
                    Upload Photo
                    <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                  </Button>
                  {photo && (
                    <Button variant="text" color="error" size="small" onClick={removePhoto} startIcon={<Delete />}>
                      Remove Photo
                    </Button>
                  )}
                </Box>
              </Grid>

              {/* Personal Info */}
              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField required fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField required fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField required fullWidth label="Passport Number" name="passportNumber" value={formData.passportNumber} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField required fullWidth label="Passport Issue Date" name="passportIssueDate" type="date" value={formData.passportIssueDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField required fullWidth label="Passport Expiry Date" name="passportExpiryDate" type="date" value={formData.passportExpiryDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
              </Grid>

              {/* Passport File Upload */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  <FilePresent sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Passport Document Upload
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    sx={{ height: 56, minWidth: 200 }}
                  >
                    Upload Passport File
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      hidden
                      onChange={handlePassportFileChange}
                    />
                  </Button>
                  {passportFileName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={<Description />}
                        label={passportFileName}
                        onDelete={removePassportFile}
                        color="primary"
                      />
                      <Typography variant="caption" color="textSecondary">
                        ({(passportFile?.size / 1024).toFixed(1)} KB)
                      </Typography>
                    </Box>
                  )}
                  {!passportFileName && (
                    <Typography variant="caption" color="textSecondary">
                      Upload passport document (PDF or Image, max 10MB)
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Personal Details */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  <Person sx={{ mr: 1, verticalAlign: 'middle' }} /> Personal Details
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth select label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth select label="Risk Level" name="riskLevel" value={formData.riskLevel} onChange={handleChange}>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom color="textSecondary">
                  <LocationOn sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} /> Place of Birth
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="City" name="placeOfBirth.city" value={formData.placeOfBirth.city} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Country" name="placeOfBirth.country" value={formData.placeOfBirth.country} onChange={handleChange} />
              </Grid>
            </Grid>
          )}

          {/* STEP 2: Entry Document & Details */}
          {activeStep === 1 && (
            <Grid container spacing={3}>
              {/* Entry Document Type Selection */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  <InsertDriveFile sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Entry Document
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                  Select the document type used to enter the country
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  select
                  label="Entry Document Type"
                  name="entryDocType"
                  value={formData.entryDocType}
                  onChange={handleChange}
                >
                  {entryDocTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Entry Document File Upload */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    sx={{ height: 56, minWidth: 200 }}
                  >
                    Upload Entry Document
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      hidden
                      onChange={handleEntryDocFileChange}
                    />
                  </Button>
                  {entryDocFileName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={<Description />}
                        label={entryDocFileName}
                        onDelete={removeEntryDocFile}
                        color="success"
                      />
                      <Typography variant="caption" color="textSecondary">
                        ({(entryDocFile?.size / 1024).toFixed(1)} KB)
                      </Typography>
                    </Box>
                  )}
                  {!entryDocFileName && (
                    <Typography variant="caption" color="textSecondary">
                      Upload entry document (PDF or Image, max 10MB)
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Visa Fields (shown when entryDocType === 'visa') */}
              {formData.entryDocType === 'visa' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      select
                      label="Visa Type"
                      name="visaType"
                      value={formData.visaType}
                      onChange={handleChange}
                    >
                      {visaTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Visa Number"
                      name="visaNumber"
                      value={formData.visaNumber}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Visa Issue Date"
                      name="visaIssueDate"
                      type="date"
                      value={formData.visaIssueDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Visa Expiry Date"
                      name="visaExpiryDate"
                      type="date"
                      value={formData.visaExpiryDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              {/* ID Fields (shown when entryDocType === 'id') */}
              {formData.entryDocType === 'id' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      select
                      label="ID Type"
                      name="idType"
                      value={formData.idType}
                      onChange={handleChange}
                    >
                      {idTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="ID Number"
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="ID Issue Date"
                      name="idIssueDate"
                      type="date"
                      value={formData.idIssueDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="ID Expiry Date"
                      name="idExpiryDate"
                      type="date"
                      value={formData.idExpiryDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              {/* Stamp Fields (shown when entryDocType === 'stamp') */}
              {formData.entryDocType === 'stamp' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      select
                      label="Stamp Type"
                      name="stampType"
                      value={formData.stampType}
                      onChange={handleChange}
                    >
                      {stampTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Stamp Number"
                      name="stampNumber"
                      value={formData.stampNumber}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Stamp Issue Date"
                      name="stampIssueDate"
                      type="date"
                      value={formData.stampIssueDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Stamp Expiry Date"
                      name="stampExpiryDate"
                      type="date"
                      value={formData.stampExpiryDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              {/* Other Document Fields (shown when entryDocType === 'other') */}
              {formData.entryDocType === 'other' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Document Name"
                      name="otherDocName"
                      value={formData.otherDocName}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Document Number"
                      name="otherDocNumber"
                      value={formData.otherDocNumber}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Issue Date"
                      name="otherIssueDate"
                      type="date"
                      value={formData.otherIssueDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Expiry Date"
                      name="otherExpiryDate"
                      type="date"
                      value={formData.otherExpiryDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              {/* Entry Details */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Entry Details
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="Entry Date" name="entryDate" type="date" value={formData.entryDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="Expected Exit Date" name="expectedExitDate" type="date" value={formData.expectedExitDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField required fullWidth label="Entry Port" name="entryPort" value={formData.entryPort} onChange={handleChange} />
              </Grid>

              {/* Additional Documents Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  <UploadFile sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Additional Documents (Optional)
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                  Add any additional supporting documents (Stamp, Extra ID, etc.) - Fields will auto-fill from Entry Document if same type
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Additional Document Type"
                  value={newDocument.docType}
                  onChange={handleDocTypeChange}
                >
                  <MenuItem value="">Select Type</MenuItem>
                  {documentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label} {type.value === formData.entryDocType && '⭐ (Auto-fill available)'}
                    </MenuItem>
                  ))}
                </TextField>
                {newDocument.docType && newDocument.docType === formData.entryDocType && (
                  <FormHelperText sx={{ color: 'success.main' }}>
                    <CheckCircle sx={{ fontSize: 14, verticalAlign: 'middle' }} />
                    This document type matches your Entry Document. Fields will auto-fill!
                  </FormHelperText>
                )}
              </Grid>

              {/* Additional Document Type-Specific Fields */}
              {newDocument.docType === 'visa' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Visa Type"
                      value={newDocument.visaType}
                      onChange={(e) => setNewDocument({ ...newDocument, visaType: e.target.value })}
                      disabled={newDocument.autoFilled}
                      InputProps={{
                        sx: newDocument.autoFilled ? { bgcolor: '#f0f9ff' } : {}
                      }}
                    >
                      {visaTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </MenuItem>
                      ))}
                    </TextField>
                    {newDocument.autoFilled && (
                      <FormHelperText sx={{ color: 'success.main' }}>
                        Auto-filled from Entry Document
                      </FormHelperText>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Visa Number"
                      value={newDocument.visaNumber}
                      onChange={(e) => setNewDocument({ ...newDocument, visaNumber: e.target.value })}
                      disabled={newDocument.autoFilled}
                      InputProps={{
                        sx: newDocument.autoFilled ? { bgcolor: '#f0f9ff' } : {}
                      }}
                    />
                    {newDocument.autoFilled && (
                      <FormHelperText sx={{ color: 'success.main' }}>
                        Auto-filled from Entry Document
                      </FormHelperText>
                    )}
                  </Grid>
                </>
              )}

              {newDocument.docType === 'id' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="ID Type"
                      value={newDocument.idType}
                      onChange={(e) => setNewDocument({ ...newDocument, idType: e.target.value })}
                      disabled={newDocument.autoFilled}
                      InputProps={{
                        sx: newDocument.autoFilled ? { bgcolor: '#f0f9ff' } : {}
                      }}
                    >
                      {idTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </MenuItem>
                      ))}
                    </TextField>
                    {newDocument.autoFilled && (
                      <FormHelperText sx={{ color: 'success.main' }}>
                        Auto-filled from Entry Document
                      </FormHelperText>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="ID Number"
                      value={newDocument.idNumber}
                      onChange={(e) => setNewDocument({ ...newDocument, idNumber: e.target.value })}
                      disabled={newDocument.autoFilled}
                      InputProps={{
                        sx: newDocument.autoFilled ? { bgcolor: '#f0f9ff' } : {}
                      }}
                    />
                    {newDocument.autoFilled && (
                      <FormHelperText sx={{ color: 'success.main' }}>
                        Auto-filled from Entry Document
                      </FormHelperText>
                    )}
                  </Grid>
                </>
              )}

              {newDocument.docType === 'stamp' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Stamp Type"
                      value={newDocument.stampType}
                      onChange={(e) => setNewDocument({ ...newDocument, stampType: e.target.value })}
                    >
                      {stampTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Stamp Number"
                      value={newDocument.stampNumber}
                      onChange={(e) => setNewDocument({ ...newDocument, stampNumber: e.target.value })}
                    />
                  </Grid>
                </>
              )}

              {newDocument.docType === 'other' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Document Name"
                    value={newDocument.documentName}
                    onChange={(e) => setNewDocument({ ...newDocument, documentName: e.target.value })}
                    disabled={newDocument.autoFilled}
                    InputProps={{
                      sx: newDocument.autoFilled ? { bgcolor: '#f0f9ff' } : {}
                    }}
                  />
                  {newDocument.autoFilled && (
                    <FormHelperText sx={{ color: 'success.main' }}>
                      Auto-filled from Entry Document
                    </FormHelperText>
                  )}
                </Grid>
              )}

              {/* Common fields for additional documents */}
              {newDocument.docType && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Issue Date"
                      type="date"
                      value={newDocument.issueDate}
                      onChange={(e) => setNewDocument({ ...newDocument, issueDate: e.target.value })}
                      disabled={newDocument.autoFilled}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        sx: newDocument.autoFilled ? { bgcolor: '#f0f9ff' } : {}
                      }}
                    />
                    {newDocument.autoFilled && (
                      <FormHelperText sx={{ color: 'success.main' }}>
                        Auto-filled from Entry Document
                      </FormHelperText>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Expiry Date"
                      type="date"
                      value={newDocument.expiryDate}
                      onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })}
                      disabled={newDocument.autoFilled}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        sx: newDocument.autoFilled ? { bgcolor: '#f0f9ff' } : {}
                      }}
                    />
                    {newDocument.autoFilled && (
                      <FormHelperText sx={{ color: 'success.main' }}>
                        Auto-filled from Entry Document
                      </FormHelperText>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Issuing Authority"
                      value={newDocument.issuingAuthority}
                      onChange={(e) => setNewDocument({ ...newDocument, issuingAuthority: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUpload />}
                      sx={{ height: 56 }}
                    >
                      {newDocument.file ? 'Change File' : 'Upload File'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        hidden
                        onChange={handleDocFileChange}
                      />
                    </Button>
                    {newDocument.file && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {newDocument.file.name} ({(newDocument.file.size / 1024).toFixed(1)} KB)
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" onClick={addDocument} startIcon={<Add />}>
                      Add Document
                    </Button>
                    {newDocument.autoFilled && (
                      <Button 
                        variant="text" 
                        color="warning" 
                        onClick={() => {
                          setNewDocument(prev => ({
                            ...prev,
                            autoFilled: false,
                            visaType: '',
                            visaNumber: '',
                            idNumber: '',
                            idType: '',
                            documentName: '',
                            issueDate: '',
                            expiryDate: '',
                          }));
                        }}
                        sx={{ ml: 2 }}
                      >
                        Clear Auto-fill
                      </Button>
                    )}
                  </Grid>
                </>
              )}

              {/* Display added documents */}
              {documents.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Added Documents ({documents.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {documents.map((doc) => (
                      <Paper
                        key={doc.id}
                        variant="outlined"
                        sx={{ p: 2, flex: '1 1 200px', maxWidth: 250, borderColor: doc.autoFilled ? 'success.main' : 'default' }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Chip 
                            label={doc.docType} 
                            size="small" 
                            color={doc.autoFilled ? 'success' : 'primary'} 
                            icon={doc.autoFilled ? <CheckCircle /> : undefined}
                          />
                          <IconButton size="small" color="error" onClick={() => removeDocument(doc.id)}>
                            <Delete />
                          </IconButton>
                        </Box>
                        {doc.autoFilled && (
                          <Typography variant="caption" color="success.main" display="block" sx={{ mt: 0.5 }}>
                            ⭐ Auto-filled from Entry Document
                          </Typography>
                        )}
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          <strong>Issue:</strong> {format(new Date(doc.issueDate), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Expiry:</strong> {format(new Date(doc.expiryDate), 'MMM dd, yyyy')}
                        </Typography>
                        {doc.visaType && (
                          <Typography variant="caption" display="block">
                            <strong>Visa:</strong> {doc.visaType}
                          </Typography>
                        )}
                        {doc.fileName && (
                          <Typography variant="caption" display="block" noWrap>
                            📎 {doc.fileName}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}

          {/* STEP 3: Contact & Documents */}
          {activeStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  <Phone sx={{ mr: 1, verticalAlign: 'middle' }} /> Contact Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="Phone Number" name="personalContact.phone" value={formData.personalContact.phone} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" name="personalContact.email" type="email" value={formData.personalContact.email} onChange={handleChange} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom color="textSecondary">
                  <LocationOn sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} /> Address
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Street Address" name="personalContact.address.street" value={formData.personalContact.address.street} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="City" name="personalContact.address.city" value={formData.personalContact.address.city} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="State/Province" name="personalContact.address.state" value={formData.personalContact.address.state} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Country" name="personalContact.address.country" value={formData.personalContact.address.country} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Postal Code" name="personalContact.address.postalCode" value={formData.personalContact.address.postalCode} onChange={handleChange} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom color="textSecondary">
                  <Work sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} /> Employment Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Employer" name="employment.employer" value={formData.employment.employer} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Position" name="employment.position" value={formData.employment.position} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Start Date" name="employment.startDate" type="date" value={formData.employment.startDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="End Date" name="employment.endDate" type="date" value={formData.employment.endDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom color="textSecondary">
                  <School sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} /> Education Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Institution" name="education.institution" value={formData.education.institution} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Course" name="education.course" value={formData.education.course} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Start Date" name="education.startDate" type="date" value={formData.education.startDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="End Date" name="education.endDate" type="date" value={formData.education.endDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button variant="outlined" onClick={() => setActiveStep(Math.max(0, activeStep - 1))} disabled={activeStep === 0}>
              Back
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Registering...' : 'Register Citizen'}
              </Button>
            ) : (
              <Button variant="contained" onClick={() => setActiveStep(activeStep + 1)}>
                Next
              </Button>
            )}
          </Box>
        </form>
      </Paper>

      {/* View Document Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Document Preview</Typography>
            <IconButton onClick={() => setOpenViewDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewDocument && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>{viewDocument.fileName}</Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Type</Typography>
                  <Typography variant="body2">{viewDocument.docType}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Document Number</Typography>
                  <Typography variant="body2">{viewDocument.documentNumber || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Issue Date</Typography>
                  <Typography variant="body2">{viewDocument.issueDate ? format(new Date(viewDocument.issueDate), 'MMM dd, yyyy') : 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Expiry Date</Typography>
                  <Typography variant="body2">{viewDocument.expiryDate ? format(new Date(viewDocument.expiryDate), 'MMM dd, yyyy') : 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Issuing Authority</Typography>
                  <Typography variant="body2">{viewDocument.issuingAuthority || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    {viewDocument.fileType?.includes('image') ? (
                      <img src={viewDocument.preview} alt={viewDocument.fileName} style={{ maxWidth: '100%', maxHeight: 400 }} />
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <Description sx={{ fontSize: 80, color: 'grey.400' }} />
                        <Typography variant="body2" color="textSecondary">Preview not available for this file type</Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddCitizen;