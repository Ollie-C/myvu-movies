import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  parseLetterboxdCSV,
  validateLetterboxdCSV,
  importFromLetterboxd,
  type ImportProgress,
  type ImportResult,
} from '@/services/letterboxdImport';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';

interface LetterboxdImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LetterboxdImportModal({
  isOpen,
  onClose,
}: LetterboxdImportModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const importMutation = useMutation({
    mutationFn: async (entries: any[]) => {
      return importFromLetterboxd(entries, user!.id, (progress) => {
        setProgress(progress);
      });
    },
    onSuccess: (importResult) => {
      setResult(importResult);
      setIsImporting(false);
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['user-movies'] });
      queryClient.invalidateQueries({ queryKey: ['watched-movies'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error) => {
      console.error('Import failed:', error);
      setIsImporting(false);
      setResult({
        successful: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Import failed'],
      });
    },
  });

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidationError(null);
    setProgress(null);
    setResult(null);

    // Validate the file
    setIsValidating(true);
    try {
      const content = await selectedFile.text();
      const validation = validateLetterboxdCSV(content);

      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid file format');
        setFile(null);
      }
    } catch (error) {
      setValidationError('Failed to read file');
      setFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setProgress(null);
    setResult(null);

    try {
      const content = await file.text();
      const entries = parseLetterboxdCSV(content);

      await importMutation.mutateAsync(entries);
    } catch (error) {
      console.error('Import error:', error);
      setIsImporting(false);
      setResult({
        successful: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Import failed'],
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setValidationError(null);
    setProgress(null);
    setResult(null);
    onClose();
  };

  const resetForm = () => {
    setFile(null);
    setValidationError(null);
    setProgress(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <Card className='w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-bold text-primary'>
              Import from Letterboxd
            </h2>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClose}
              className='text-secondary hover:text-primary'>
              ✕
            </Button>
          </div>

          {!result ? (
            <>
              {/* File Upload Section */}
              <div className='mb-6'>
                <div className='border-2 border-dashed border-border rounded-lg p-8 text-center'>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='.csv'
                    onChange={handleFileSelect}
                    className='hidden'
                  />

                  {!file ? (
                    <div>
                      <Upload className='w-12 h-12 text-secondary mx-auto mb-4' />
                      <p className='text-lg font-medium text-primary mb-2'>
                        Upload your Letterboxd export
                      </p>
                      <p className='text-secondary mb-4'>
                        Export your data from Letterboxd and upload the CSV file
                        here
                      </p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className='bg-primary hover:bg-primary/90'>
                        Choose CSV File
                      </Button>
                    </div>
                  ) : (
                    <div className='flex items-center justify-center gap-3'>
                      <FileText className='w-8 h-8 text-green-600' />
                      <div className='text-left'>
                        <p className='font-medium text-primary'>{file.name}</p>
                        <p className='text-sm text-secondary'>
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={resetForm}
                        className='text-secondary hover:text-primary'>
                        ✕
                      </Button>
                    </div>
                  )}
                </div>

                {validationError && (
                  <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                    <div className='flex items-center gap-2 text-red-700'>
                      <XCircle className='w-4 h-4' />
                      <span className='text-sm'>{validationError}</span>
                    </div>
                  </div>
                )}

                {isValidating && (
                  <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                    <div className='flex items-center gap-2 text-blue-700'>
                      <div className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
                      <span className='text-sm'>Validating file...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Import Button */}
              {file && !validationError && !isValidating && (
                <div className='flex justify-end gap-3'>
                  <Button variant='ghost' onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={isImporting}
                    className='bg-primary hover:bg-primary/90'>
                    {isImporting ? 'Importing...' : 'Start Import'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Results Section */
            <div className='space-y-6'>
              <div className='text-center'>
                <div className='flex items-center justify-center gap-2 mb-4'>
                  {result.successful > 0 ? (
                    <CheckCircle className='w-8 h-8 text-green-600' />
                  ) : (
                    <XCircle className='w-8 h-8 text-red-600' />
                  )}
                  <h3 className='text-lg font-semibold text-primary'>
                    Import {result.successful > 0 ? 'Completed' : 'Failed'}
                  </h3>
                </div>

                <div className='grid grid-cols-2 gap-4 mb-6'>
                  <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                    <div className='text-2xl font-bold text-green-700'>
                      {result.successful}
                    </div>
                    <div className='text-sm text-green-600'>
                      Successfully imported
                    </div>
                  </div>
                  <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                    <div className='text-2xl font-bold text-red-700'>
                      {result.failed}
                    </div>
                    <div className='text-sm text-red-600'>Failed to import</div>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className='text-left'>
                    <h4 className='font-medium text-primary mb-2'>Errors:</h4>
                    <div className='max-h-32 overflow-y-auto space-y-1'>
                      {result.errors.map((error, index) => (
                        <div
                          key={index}
                          className='text-sm text-red-600 bg-red-50 p-2 rounded'>
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.debugInfo && (
                  <div className='text-left mt-4 p-4 bg-gray-50 rounded-lg'>
                    <h4 className='font-medium text-primary mb-2'>
                      Debug Info:
                    </h4>
                    <div className='text-sm text-secondary space-y-1'>
                      <div>Total parsed: {result.debugInfo.totalParsed}</div>
                      <div>
                        Duplicates skipped: {result.debugInfo.duplicatesSkipped}
                      </div>
                      <div>API failures: {result.debugInfo.apiFailures}</div>
                      <div>DB failures: {result.debugInfo.dbFailures}</div>
                      <div>Total batches: {result.debugInfo.totalBatches}</div>
                      <div>
                        Avg batch time:{' '}
                        {Math.round(result.debugInfo.avgBatchTime)}ms
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className='flex justify-end gap-3'>
                <Button variant='ghost' onClick={resetForm}>
                  Import Another File
                </Button>
                <Button
                  onClick={handleClose}
                  className='bg-primary hover:bg-primary/90'>
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Progress Section */}
          {isImporting && progress && (
            <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium text-blue-700'>
                  Importing movies...
                </span>
                <span className='text-sm text-blue-600'>
                  {progress.processed}/{progress.total}
                </span>
              </div>

              <div className='w-full bg-blue-200 rounded-full h-2 mb-3'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{
                    width: `${(progress.processed / progress.total) * 100}%`,
                  }}
                />
              </div>

              <div className='text-xs text-blue-600 space-y-1'>
                <div>
                  Batch {progress.currentBatch}/{progress.totalBatches}
                </div>
                <div>
                  Successful: {progress.successful} | Failed: {progress.failed}
                </div>
                {progress.currentMovies.length > 0 && (
                  <div className='truncate'>
                    Current: {progress.currentMovies.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!file && !result && (
            <div className='mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
              <h4 className='font-medium text-primary mb-2 flex items-center gap-2'>
                <Download className='w-4 h-4' />
                How to export from Letterboxd
              </h4>
              <ol className='text-sm text-secondary space-y-1 list-decimal list-inside'>
                <li>Go to your Letterboxd profile settings</li>
                <li>Scroll down to "Data Export"</li>
                <li>Click "Export Your Data"</li>
                <li>Download the CSV file when ready</li>
                <li>Upload the file here to import your movies</li>
              </ol>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
