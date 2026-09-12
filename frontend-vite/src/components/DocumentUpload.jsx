import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import {
  Delete,
  Visibility,
  CloudUpload,
  Description,
  PictureAsPdf,
  PhotoCamera,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const DocumentUpload = ({ documents, setDocuments }) => {
  const [newDoc, setNewDoc] = useState({
    docType: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: '',
    file: null,
    // Visa fields
    visaType: '',
    visaNumber: '',
    // ID fields
    idNumber: '',
    idType: '',
    // Passport fields
    passportNumber: '',
    // Stamp fields
    stampNumber: '',
    stampType: '',
    // Other fields
    documentName: '',
  });
  const [showForm, setShowForm] = useState(false);

  const documentTypes = [
    { value: 'visa', label: 'Visa' },
    { value: 'id', label: 'ID' },
    { value: 'passport', label: 'Passport' },
    { value: 'stamp', label: 'Stamp' },
    { value: 'other', label: 'Other' },
  ];

  const visaTypes = [
    'tourist', 'business', 'student', 'work', 'diplomatic', 'transit', 'resident'
  ];

  const idTypes = [
    'national_id', 'driving_license', 'residence_permit', 'other'
  ];

  const stampTypes = [
    'entry', 'exit', 'transit', 'other'
  ];

  const handleDocTypeChange = (e) => {
    const value = e.target.value;
    setNewDoc({
      ...newDoc,
      docType: value,
      visaType: '',
      visaNumber: '',
      idNumber: '',
      idType: '',
      passportNumber: '',
      stampNumber: '',
      stampType: '',
      documentName: '',
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File must be less than 10MB');
        return;
      }
      setNewDoc({ ...newDoc, file });
    }
  };

  const addDocument = () => {
    // Validate common fields
    if (!newDoc.docType) {
      toast.error('Please select document type');
      return;
    }
    if (!newDoc.issueDate) {
      toast.error('Please enter issue date');
      return;
    }
    if (!newDoc.expiryDate) {
      toast.error('Please enter expiry date');
      return;
    }

    // Validate type-specific fields
    if (newDoc.docType === 'visa' && !newDoc.visaType) {
      toast.error('Please select visa type');
      return;
    }
    if (newDoc.docType === 'id' && !newDoc.idType) {
      toast.error('Please select ID type');
      return;
    }

    const docData = {
      id: Date.now(),
      docType: newDoc.docType,
      issueDate: newDoc.issueDate,
      expiryDate: newDoc.expiryDate,
      issuingAuthority: newDoc.issuingAuthority || '',
      file: newDoc.file,
      preview: newDoc.file ? URL.createObjectURL(newDoc.file) : null,
      fileName: newDoc.file ? newDoc.file.name : null,
      fileSize: newDoc.file ? newDoc.file.size : 0,
      fileType: newDoc.file ? newDoc.file.type : null,
      isVerified: false,
      visaType: newDoc.visaType,
      visaNumber: newDoc.visaNumber,
      idNumber: newDoc.idNumber,
      idType: newDoc.idType,
      passportNumber: newDoc.passportNumber,
      stampNumber: newDoc.stampNumber,
      stampType: newDoc.stampType,
      documentName: newDoc.documentName,
    };

    setDocuments([...documents, docData]);
    setNewDoc({
      docType: '',
      issueDate: '',
      expiryDate: '',
      issuingAuthority: '',
      file: null,
      visaType: '',
      visaNumber: '',
      idNumber: '',
      idType: '',
      passportNumber: '',
      stampNumber: '',
      stampType: '',
      documentName: '',
    });
    setShowForm(false);
    toast.success('Document added successfully');
  };

  const removeDocument = (id) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  const getDocTypeLabel = (type) => {
    return documentTypes.find(d => d.value === type)?.label || type;
  };

  return (
    <Box>
      {!showForm ? (
        <Button
          variant="outlined"
          startIcon={<CloudUpload />}
          onClick={() => setShowForm(true)}
          sx={{ mt: 1 }}
        >
          Add Document
        </Button>
      ) : (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Add New Document
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Document Type"
                value={newDoc.docType}
                onChange={handleDocTypeChange}
              >
                {documentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {newDoc.docType === 'visa' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    select
                    label="Visa Type"
                    value={newDoc.visaType}
                    onChange={(e) => setNewDoc({ ...newDoc, visaType: e.target.value })}
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
                    value={newDoc.visaNumber}
                    onChange={(e) => setNewDoc({ ...newDoc, visaNumber: e.target.value })}
                  />
                </Grid>
              </>
            )}

            {newDoc.docType === 'id' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    select
                    label="ID Type"
                    value={newDoc.idType}
                    onChange={(e) => setNewDoc({ ...newDoc, idType: e.target.value })}
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
                    value={newDoc.idNumber}
                    onChange={(e) => setNewDoc({ ...newDoc, idNumber: e.target.value })}
                  />
                </Grid>
              </>
            )}

            {newDoc.docType === 'passport' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Passport Number"
                  value={newDoc.passportNumber}
                  onChange={(e) => setNewDoc({ ...newDoc, passportNumber: e.target.value })}
                />
              </Grid>
            )}

            {newDoc.docType === 'stamp' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    select
                    label="Stamp Type"
                    value={newDoc.stampType}
                    onChange={(e) => setNewDoc({ ...newDoc, stampType: e.target.value })}
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
                    value={newDoc.stampNumber}
                    onChange={(e) => setNewDoc({ ...newDoc, stampNumber: e.target.value })}
                  />
                </Grid>
              </>
            )}

            {newDoc.docType === 'other' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Document Name"
                  value={newDoc.documentName}
                  onChange={(e) => setNewDoc({ ...newDoc, documentName: e.target.value })}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Issue Date"
                type="date"
                value={newDoc.issueDate}
                onChange={(e) => setNewDoc({ ...newDoc, issueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Expiry Date"
                type="date"
                value={newDoc.expiryDate}
                onChange={(e) => setNewDoc({ ...newDoc, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText="Used for overstay detection"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Issuing Authority"
                value={newDoc.issuingAuthority}
                onChange={(e) => setNewDoc({ ...newDoc, issuingAuthority: e.target.value })}
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
                {newDoc.file ? 'Change File' : 'Upload File'}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              {newDoc.file && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {newDoc.file.name} ({(newDoc.file.size / 1024).toFixed(1)} KB)
                </Typography>
              )}
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={addDocument}>
              Add Document
            </Button>
            <Button variant="outlined" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </Box>
        </Paper>
      )}

      {documents.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Uploaded Documents ({documents.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {documents.map((doc) => (
              <Paper
                key={doc.id}
                variant="outlined"
                sx={{ p: 2, flex: '1 1 200px', maxWidth: 250 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Chip
                    label={getDocTypeLabel(doc.docType)}
                    size="small"
                    color="primary"
                  />
                  <Box>
                    <IconButton size="small" color="error" onClick={() => removeDocument(doc.id)}>
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
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
        </Box>
      )}
    </Box>
  );
};

export default DocumentUpload;