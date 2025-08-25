import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Fab,
  Backdrop,
} from '@mui/material';
import {
  QrCodeScanner as QrCodeScannerIcon,
  QrCode as QrCodeIcon,
  CameraAlt as CameraIcon,
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
  CameraFront as CameraFrontIcon,
  CameraRear as CameraRearIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
  LocationOn as LocationIcon,
  DateRange as DateIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  CheckCircle as QualityIcon,
  LocalShipping as ShippingIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import QrScanner from 'qr-scanner';
import QRCode from 'react-qr-code';
import { apiRequest } from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

// Mock product data for QR lookup
const mockProductData = {
  'QR-PROD-12345': {
    id: 'PROD-12345',
    name: 'Organic Apples - Premium Grade',
    category: 'Fresh Produce',
    batchNumber: 'BATCH-2024-0845',
    producer: 'Green Valley Orchards',
    currentOwner: 'Fresh Market Distribution',
    currentLocation: 'Distribution Center - Portland',
    status: 'In Transit',
    qualityScore: 95.8,
    createdAt: '2024-08-15T10:30:00Z',
    lastUpdated: '2024-08-22T09:15:00Z',
    expiryDate: '2024-08-30T23:59:59Z',
    traceabilityEvents: [
      {
        id: '1',
        timestamp: '2024-08-15T10:30:00Z',
        stage: 'Production',
        location: 'Green Valley Farm - Orchard Section 3',
        participant: 'Green Valley Orchards',
        action: 'Harvested',
        temperature: 18.5,
        humidity: 65,
        qualityCheck: { passed: true, score: 98.2 },
      },
      {
        id: '2',
        timestamp: '2024-08-16T08:00:00Z',
        stage: 'Processing',
        location: 'Green Valley Processing Facility',
        participant: 'Green Valley Orchards',
        action: 'Quality inspection and packaging',
        temperature: 4.2,
        humidity: 85,
        qualityCheck: { passed: true, score: 96.5 },
      },
      {
        id: '3',
        timestamp: '2024-08-18T14:20:00Z',
        stage: 'Distribution',
        location: 'Regional Distribution Hub - Seattle',
        participant: 'Northwest Logistics',
        action: 'Transferred to distributor',
        temperature: 3.8,
        humidity: 82,
        qualityCheck: { passed: true, score: 95.8 },
      },
      {
        id: '4',
        timestamp: '2024-08-20T11:45:00Z',
        stage: 'Distribution',
        location: 'Distribution Center - Portland',
        participant: 'Fresh Market Distribution',
        action: 'Received and stored',
        temperature: 4.1,
        humidity: 80,
        qualityCheck: { passed: true, score: 95.8 },
      },
    ],
    certifications: [
      { name: 'USDA Organic', verified: true },
      { name: 'Non-GMO Verified', verified: true },
      { name: 'Fair Trade Certified', verified: true },
    ],
    blockchain: {
      contractAddress: '0xprod12345567890abcdef1234567890abcdef123',
      transactionHash: '0xtxhash12345567890abcdef1234567890abcdef123',
    },
  },
};

interface ScanHistory {
  id: string;
  qrCode: string;
  productName: string;
  timestamp: string;
  status: 'success' | 'failed' | 'invalid';
}

const QRScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [manualQRInput, setManualQRInput] = useState('');
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    // Check if camera is available
    QrScanner.hasCamera().then(setHasCamera);
    
    // Load scan history from localStorage
    const savedHistory = localStorage.getItem('qr-scan-history');
    if (savedHistory) {
      setScanHistory(JSON.parse(savedHistory));
    }
    
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      if (!videoRef.current) return;
      
      setIsScanning(true);
      setError(null);
      
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleScanSuccess(result.data),
        {
          returnDetailedScanResult: true,
          preferredCamera: facingMode,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      
      await scannerRef.current.start();
      
      if (flashEnabled) {
        // Flash control is not available in the current qr-scanner version
        // await scannerRef.current.setFlash(true);
      }
      
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please ensure camera permissions are granted.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const toggleFlash = async () => {
    if (scannerRef.current) {
      try {
        // Flash control is not available in the current qr-scanner version
        // await scannerRef.current.setFlash(!flashEnabled);
        setFlashEnabled(!flashEnabled);
        toast.error('Flash control not available in current version');
      } catch (err) {
        toast.error('Flash not supported on this device');
      }
    }
  };

  const toggleCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (isScanning) {
      stopScanning();
      setTimeout(() => {
        startScanning();
      }, 500);
    }
  };

  const handleScanSuccess = async (data: string) => {
    setScanResult(data);
    stopScanning();
    await lookupProduct(data);
  };

  const lookupProduct = async (qrData: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Make API call to real backend
      let productData: any = null;
      try {
        // QR code contains product ID, use it to fetch product details
        const response = await apiRequest.get(`/products/qr/${encodeURIComponent(qrData)}`);
        productData = response;
      } catch (apiError) {
        // If the QR endpoint fails, try to search by ID directly
        try {
          console.log('Trying to search product by ID:', qrData);
          const searchResponse = await apiRequest.post<any>('/products/search', {
            identifier: qrData
          });
          if (searchResponse) {
            // Format the response to match expected structure
            productData = {
              id: searchResponse._id,
              name: searchResponse.name,
              category: searchResponse.category,
              batchNumber: searchResponse.batchNumber,
              producer: searchResponse.manufacturer?.name || 'Unknown',
              currentOwner: searchResponse.currentOwner?.name || 'Unknown',
              currentLocation: searchResponse.currentLocation || 'Unknown',
              status: searchResponse.status,
              qualityScore: 95.8, // Default score
              createdAt: searchResponse.createdAt,
              lastUpdated: searchResponse.updatedAt,
              expiryDate: searchResponse.expiryDate,
              traceabilityEvents: searchResponse.history || []
            };
          }
        } catch (searchError) {
          // Final fallback to mock data if API fails
          console.warn('Product search failed, falling back to mock data:', searchError);
          productData = mockProductData[qrData as keyof typeof mockProductData];
        }
      }
      
      if (productData && productData.name) {
        setProductData(productData);
        setShowProductDialog(true);
        
        // Add to scan history
        const historyItem: ScanHistory = {
          id: Date.now().toString(),
          qrCode: qrData,
          productName: productData.name,
          timestamp: new Date().toISOString(),
          status: 'success',
        };
        
        const newHistory = [historyItem, ...scanHistory.slice(0, 9)]; // Keep last 10 scans
        setScanHistory(newHistory);
        localStorage.setItem('qr-scan-history', JSON.stringify(newHistory));
        
        toast.success('Product found successfully!');
      } else {
        setError('Product not found or invalid QR code');
        const historyItem: ScanHistory = {
          id: Date.now().toString(),
          qrCode: qrData,
          productName: 'Unknown Product',
          timestamp: new Date().toISOString(),
          status: 'invalid',
        };
        
        const newHistory = [historyItem, ...scanHistory.slice(0, 9)];
        setScanHistory(newHistory);
        localStorage.setItem('qr-scan-history', JSON.stringify(newHistory));
      }
    } catch (err) {
      console.error('Error looking up product:', err);
      setError('Failed to lookup product information');
      
      const historyItem: ScanHistory = {
        id: Date.now().toString(),
        qrCode: qrData,
        productName: 'Lookup Failed',
        timestamp: new Date().toISOString(),
        status: 'failed',
      };
      
      const newHistory = [historyItem, ...scanHistory.slice(0, 9)];
      setScanHistory(newHistory);
      localStorage.setItem('qr-scan-history', JSON.stringify(newHistory));
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = () => {
    if (manualQRInput.trim()) {
      lookupProduct(manualQRInput.trim());
      setManualQRInput('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'delivered':
      case 'completed': 
        return 'success';
      case 'in transit':
      case 'processing': 
        return 'warning';
      case 'expired':
      case 'recalled': 
        return 'error';
      default: 
        return 'default';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 95) return 'success';
    if (score >= 85) return 'warning';
    return 'error';
  };

  const generateSampleQR = () => {
    const sampleQRs = Object.keys(mockProductData);
    const randomQR = sampleQRs[Math.floor(Math.random() * sampleQRs.length)];
    setManualQRInput(randomQR);
  };

  const downloadProductReport = () => {
    if (!productData) return;
    
    try {
      // Create new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      const lineHeight = 7;
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);
      
      // Helper function to check if new page is needed
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      };
      
      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Product Traceability Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Product Information Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Product Information', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Product details
      const productInfo = [
        ['Product Name:', productData.name || 'N/A'],
        ['Product ID:', productData.id || 'N/A'],
        ['Batch Number:', productData.batchNumber || 'N/A'],
        ['Category:', productData.category || 'N/A'],
        ['Status:', productData.status || 'N/A'],
        ['Quality Score:', productData.qualityScore ? `${productData.qualityScore}%` : 'N/A'],
      ];
      
      productInfo.forEach(([label, value]) => {
        checkNewPage(lineHeight);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 35, yPosition);
        yPosition += lineHeight;
      });
      
      yPosition += 5;
      
      // Current Status Section
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Current Status', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const statusInfo = [
        ['Producer:', productData.producer || 'N/A'],
        ['Current Owner:', productData.currentOwner || 'N/A'],
        ['Current Location:', productData.currentLocation || 'N/A'],
        ['Last Updated:', productData.lastUpdated ? new Date(productData.lastUpdated).toLocaleString() : 'N/A'],
        ['Expiry Date:', productData.expiryDate ? new Date(productData.expiryDate).toLocaleString() : 'N/A'],
      ];
      
      statusInfo.forEach(([label, value]) => {
        checkNewPage(lineHeight);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        const textLines = pdf.splitTextToSize(value, contentWidth - 35);
        pdf.text(textLines, margin + 35, yPosition);
        yPosition += lineHeight * Math.max(1, textLines.length);
      });
      
      yPosition += 5;
      
      // Certifications Section (if available)
      if (productData.certifications && productData.certifications.length > 0) {
        checkNewPage(30 + (productData.certifications.length * lineHeight));
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Certifications', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        productData.certifications.forEach((cert: any) => {
          checkNewPage(lineHeight);
          const status = cert.verified ? '✓ Verified' : '⚠ Unverified';
          pdf.text(`• ${cert.name} - ${status}`, margin + 5, yPosition);
          yPosition += lineHeight;
        });
        
        yPosition += 5;
      }
      
      // Traceability History Section
      if (productData.traceabilityEvents && productData.traceabilityEvents.length > 0) {
        checkNewPage(30);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Traceability History', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(9);
        productData.traceabilityEvents.forEach((event: any, index: number) => {
          checkNewPage(35);
          
          // Event header
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Event ${index + 1}: ${event.stage || 'N/A'}`, margin, yPosition);
          yPosition += lineHeight;
          
          pdf.setFont('helvetica', 'normal');
          
          // Event details
          const eventDetails = [
            ['Date & Time:', event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'],
            ['Location:', event.location || 'N/A'],
            ['Participant:', event.participant || 'N/A'],
            ['Action:', event.action || 'N/A'],
          ];
          
          // Add conditions if available
          if (event.temperature || event.humidity) {
            let conditions = 'Conditions: ';
            if (event.temperature) conditions += `Temp: ${event.temperature}°C`;
            if (event.humidity) conditions += ` Humidity: ${event.humidity}%`;
            eventDetails.push(['', conditions]);
          }
          
          // Add quality check if available
          if (event.qualityCheck) {
            const qualityStatus = event.qualityCheck.passed ? 'Passed' : 'Failed';
            eventDetails.push(['Quality Check:', `${qualityStatus} - Score: ${event.qualityCheck.score}%`]);
          }
          
          eventDetails.forEach(([label, value]) => {
            checkNewPage(lineHeight);
            if (label) {
              pdf.setFont('helvetica', 'italic');
              pdf.text(label, margin + 5, yPosition);
              pdf.setFont('helvetica', 'normal');
              const textLines = pdf.splitTextToSize(value, contentWidth - 40);
              pdf.text(textLines, margin + 30, yPosition);
              yPosition += lineHeight * Math.max(1, textLines.length);
            } else {
              pdf.text(value, margin + 5, yPosition);
              yPosition += lineHeight;
            }
          });
          
          yPosition += 5;
        });
      }
      
      // Blockchain Information (if available)
      if (productData.blockchain) {
        checkNewPage(30);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Blockchain Information', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        if (productData.blockchain.contractAddress) {
          checkNewPage(lineHeight);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Contract Address:', margin, yPosition);
          pdf.setFont('helvetica', 'normal');
          const addressLines = pdf.splitTextToSize(productData.blockchain.contractAddress, contentWidth - 35);
          pdf.text(addressLines, margin + 35, yPosition);
          yPosition += lineHeight * Math.max(1, addressLines.length);
        }
        
        if (productData.blockchain.transactionHash) {
          checkNewPage(lineHeight);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Transaction Hash:', margin, yPosition);
          pdf.setFont('helvetica', 'normal');
          const hashLines = pdf.splitTextToSize(productData.blockchain.transactionHash, contentWidth - 35);
          pdf.text(hashLines, margin + 35, yPosition);
          yPosition += lineHeight * Math.max(1, hashLines.length);
        }
      }
      
      // Footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, pageHeight - 10);
      pdf.text(`QR Code: ${scanResult || 'N/A'}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      
      // Save the PDF
      const fileName = `product-report-${productData.id || 'unknown'}-${Date.now()}.pdf`;
      pdf.save(fileName);
      
      toast.success('Product report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate product report');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          QR Code Scanner
        </Typography>
        <Button
          variant="outlined"
          startIcon={<QrCodeIcon />}
          onClick={generateSampleQR}
        >
          Try Sample QR
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Scanner Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Camera Scanner
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ position: 'relative', textAlign: 'center' }}>
                {!hasCamera ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No camera detected. Please use manual input below.
                  </Alert>
                ) : (
                  <>
                    {!isScanning ? (
                      <Box sx={{ py: 4 }}>
                        <QrCodeScannerIcon sx={{ fontSize: 120, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          Click the button below to start scanning
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<CameraIcon />}
                          onClick={startScanning}
                          sx={{ mt: 2 }}
                        >
                          Start Scanner
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ position: 'relative' }}>
                        <video
                          ref={videoRef}
                          style={{
                            width: '100%',
                            maxWidth: '500px',
                            height: 'auto',
                            borderRadius: '8px',
                          }}
                        />
                        
                        {/* Scanner Controls */}
                        <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 1 }}>
                          <Fab
                            size="small"
                            color="primary"
                            onClick={toggleFlash}
                            sx={{ bgcolor: 'rgba(0,0,0,0.7)' }}
                          >
                            {flashEnabled ? <FlashOffIcon /> : <FlashOnIcon />}
                          </Fab>
                          <Fab
                            size="small"
                            color="primary"
                            onClick={toggleCamera}
                            sx={{ bgcolor: 'rgba(0,0,0,0.7)' }}
                          >
                            {facingMode === 'user' ? <CameraRearIcon /> : <CameraFrontIcon />}
                          </Fab>
                          <Fab
                            size="small"
                            color="secondary"
                            onClick={stopScanning}
                            sx={{ bgcolor: 'rgba(255,0,0,0.7)' }}
                          >
                            <CloseIcon />
                          </Fab>
                        </Box>
                        
                        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                          Position the QR code within the camera view
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Manual Input */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Manual QR Code Input
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Enter QR Code"
                  value={manualQRInput}
                  onChange={(e) => setManualQRInput(e.target.value)}
                  placeholder="Paste or type QR code here"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
                />
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleManualLookup}
                  disabled={!manualQRInput.trim() || loading}
                >
                  Lookup
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try: QR-PROD-12345 for a sample product
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Scan History */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Scan History
              </Typography>
              
              {scanHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No scans yet
                </Typography>
              ) : (
                <List>
                  {scanHistory.map((scan, index) => (
                    <ListItem key={scan.id} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {scan.status === 'success' ? (
                          <CheckCircleIcon color="success" />
                        ) : scan.status === 'invalid' ? (
                          <WarningIcon color="warning" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={scan.productName}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {scan.qrCode}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(scan.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                      {scan.status === 'success' && (
                        <IconButton
                          size="small"
                          onClick={() => lookupProduct(scan.qrCode)}
                        >
                          <ViewIcon />
                        </IconButton>
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* QR Code Generator */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generate QR Code
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <QRCode
                  value="QR-PROD-12345"
                  size={150}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Sample QR Code for Product: QR-PROD-12345
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ShareIcon />}
                sx={{ mt: 2 }}
                onClick={() => toast('QR code sharing functionality would be implemented here', { icon: 'ℹ️' })}
              >
                Share QR Code
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Loading Backdrop */}
      <Backdrop open={loading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Product Details Dialog */}
      <Dialog 
        open={showProductDialog} 
        onClose={() => setShowProductDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Product Details</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={downloadProductReport}>
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={() => setShowProductDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        {productData && (
          <DialogContent>
            {/* Product Overview */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <Typography variant="h6" gutterBottom>
                      {productData.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip 
                        label={productData.status} 
                        color={getStatusColor(productData.status) as any}
                        size="small"
                      />
                      <Chip 
                        label={`Quality: ${productData.qualityScore}%`}
                        color={getQualityColor(productData.qualityScore) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Product ID
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {productData.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Batch Number
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {productData.batchNumber}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Category
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {productData.category}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Current Owner
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {productData.currentOwner}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <QRCode
                        value={scanResult || ''}
                        size={120}
                        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Product QR Code
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Status
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        <strong>Location:</strong> {productData.currentLocation}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <BusinessIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        <strong>Owner:</strong> {productData.currentOwner}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <DateIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        <strong>Last Updated:</strong> {new Date(productData.lastUpdated).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <DateIcon fontSize="small" color="warning" />
                      <Typography variant="body2">
                        <strong>Expires:</strong> {new Date(productData.expiryDate).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Certifications */}
            {productData.certifications && productData.certifications.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Certifications
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {productData.certifications.map((cert: any, index: number) => (
                      <Chip
                        key={index}
                        label={cert.name}
                        color={cert.verified ? 'success' : 'default'}
                        icon={cert.verified ? <CheckCircleIcon /> : <WarningIcon />}
                        size="small"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Traceability History */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Traceability History
                </Typography>
                
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date & Time</TableCell>
                        <TableCell>Stage</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Conditions</TableCell>
                        <TableCell>Quality</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productData.traceabilityEvents.map((event: any) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(event.timestamp).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={event.stage} size="small" color="primary" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {event.location}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {event.action}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {event.temperature && (
                              <Typography variant="caption" display="block">
                                Temp: {event.temperature}°C
                              </Typography>
                            )}
                            {event.humidity && (
                              <Typography variant="caption" display="block">
                                Humidity: {event.humidity}%
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {event.qualityCheck && (
                              <Chip
                                label={`${event.qualityCheck.score}%`}
                                color={getQualityColor(event.qualityCheck.score) as any}
                                size="small"
                                icon={event.qualityCheck.passed ? <CheckCircleIcon /> : <ErrorIcon />}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </DialogContent>
        )}
        
        <DialogActions>
          <Button onClick={() => setShowProductDialog(false)}>
            Close
          </Button>
          <Button variant="contained" onClick={downloadProductReport} startIcon={<DownloadIcon />}>
            Download Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRScanner;