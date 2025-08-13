// Audited: 11/08/2025

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Download } from 'lucide-react';
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

interface ImportState {
  file: File | null;
  isValidating: boolean;
  validationError: string | null;
  isImporting: boolean;
  progress: ImportProgress | null;
  result: ImportResult | null;
}

export function LetterboxdImportModal({
  isOpen,
  onClose,
}: LetterboxdImportModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importState, setImportState] = useState<ImportState>({
    file: null,
    isValidating: false,
    validationError: null,
    isImporting: false,
    progress: null,
    result: null,
  });

  const importMutation = useMutation({
    mutationFn: async (entries: any[]) => {
      return importFromLetterboxd(entries, user!.id, (progress) => {
        setImportState((prev) => ({ ...prev, progress }));
      });
    },
    onSuccess: (importResult) => {
      setImportState((prev) => ({
        ...prev,
        result: importResult,
        isImporting: false,
      }));
      queryClient.invalidateQueries({ queryKey: ['user-movies'] });
      queryClient.invalidateQueries({ queryKey: ['watched-movies'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error) => {
      console.error('Import failed:', error);
      setImportState((prev) => ({
        ...prev,
        isImporting: false,
        result: {
          successful: 0,
          failed: 0,
          errors: [error instanceof Error ? error.message : 'Import failed'],
        },
      }));
    },
  });

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      setImportState((prev) => ({
        ...prev,
        validationError: 'File size exceeds 5MB limit',
      }));
      return;
    }

    setImportState((prev) => ({
      ...prev,
      file: selectedFile,
      validationError: null,
      progress: null,
      result: null,
    }));

    setImportState((prev) => ({ ...prev, isValidating: true }));
    try {
      const content = await selectedFile.text();
      const validation = validateLetterboxdCSV(content);

      if (!validation.valid) {
        setImportState((prev) => ({
          ...prev,
          validationError: validation.error || 'Invalid file format',
        }));
        setImportState((prev) => ({ ...prev, file: null }));
      }
    } catch (error) {
      setImportState((prev) => ({
        ...prev,
        validationError: 'Failed to read file',
      }));
      setImportState((prev) => ({ ...prev, file: null }));
    } finally {
      setImportState((prev) => ({ ...prev, isValidating: false }));
    }
  };

  const handleImport = async () => {
    if (!importState.file) return;

    setImportState((prev) => ({
      ...prev,
      isImporting: true,
      progress: null,
      result: null,
    }));

    try {
      const content = await importState.file.text();
      const entries = parseLetterboxdCSV(content);

      await importMutation.mutateAsync(entries);
    } catch (error) {
      console.error('Import error:', error);
      setImportState((prev) => ({
        ...prev,
        isImporting: false,
        result: {
          successful: 0,
          failed: 0,
          errors: [error instanceof Error ? error.message : 'Import failed'],
        },
      }));
    }
  };

  const handleClose = () => {
    setImportState((prev) => ({
      ...prev,
      file: null,
      validationError: null,
      progress: null,
      result: null,
    }));
    onClose();
  };

  const resetForm = () => {
    setImportState((prev) => ({
      ...prev,
      file: null,
      validationError: null,
      progress: null,
      result: null,
    }));
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

          {!importState.result ? (
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

                  {!importState.file ? (
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
                        <p className='font-medium text-primary'>
                          {importState.file.name}
                        </p>
                        <p className='text-sm text-secondary'>
                          {(importState.file.size / 1024).toFixed(1)} KB
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

                {importState.validationError && (
                  <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                    <div className='flex items-center gap-2 text-red-700'>
                      <XCircle className='w-4 h-4' />
                      <span className='text-sm'>
                        {importState.validationError}
                      </span>
                    </div>
                  </div>
                )}

                {importState.isValidating && (
                  <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                    <div className='flex items-center gap-2 text-blue-700'>
                      <div className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
                      <span className='text-sm'>Validating file...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Import Button */}
              {importState.file &&
                !importState.validationError &&
                !importState.isValidating && (
                  <div className='flex justify-end gap-3'>
                    <Button variant='ghost' onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={importState.isImporting}
                      className='bg-primary hover:bg-primary/90'>
                      {importState.isImporting
                        ? 'Importing...'
                        : 'Start Import'}
                    </Button>
                  </div>
                )}
            </>
          ) : (
            /* Results Section */
            <div className='space-y-6'>
              <div className='text-center'>
                <div className='flex items-center justify-center gap-2 mb-4'>
                  {importState.result.successful > 0 ? (
                    <CheckCircle className='w-8 h-8 text-green-600' />
                  ) : (
                    <XCircle className='w-8 h-8 text-red-600' />
                  )}
                  <h3 className='text-lg font-semibold text-primary'>
                    Import{' '}
                    {importState.result.successful > 0 ? 'Completed' : 'Failed'}
                  </h3>
                </div>

                <div className='grid grid-cols-2 gap-4 mb-6'>
                  <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                    <div className='text-2xl font-bold text-green-700'>
                      {importState.result.successful}
                    </div>
                    <div className='text-sm text-green-600'>
                      Successfully imported
                    </div>
                  </div>
                  <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                    <div className='text-2xl font-bold text-red-700'>
                      {importState.result.failed}
                    </div>
                    <div className='text-sm text-red-600'>Failed to import</div>
                  </div>
                </div>

                {importState.result.errors.length > 0 && (
                  <div className='text-left'>
                    <h4 className='font-medium text-primary mb-2'>Errors:</h4>
                    <div className='max-h-32 overflow-y-auto space-y-1'>
                      {importState.result.errors.map((error, index) => (
                        <div
                          key={index}
                          className='text-sm text-red-600 bg-red-50 p-2 rounded'>
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importState.result.debugInfo && (
                  <div className='text-left mt-4 p-4 bg-gray-50 rounded-lg'>
                    <h4 className='font-medium text-primary mb-2'>
                      Debug Info:
                    </h4>
                    <div className='text-sm text-secondary space-y-1'>
                      <div>
                        Total parsed: {importState.result.debugInfo.totalParsed}
                      </div>
                      <div>
                        Duplicates skipped:{' '}
                        {importState.result.debugInfo.duplicatesSkipped}
                      </div>
                      <div>
                        API failures: {importState.result.debugInfo.apiFailures}
                      </div>
                      <div>
                        DB failures: {importState.result.debugInfo.dbFailures}
                      </div>
                      <div>
                        Total batches:{' '}
                        {importState.result.debugInfo.totalBatches}
                      </div>
                      <div>
                        Avg batch time:{' '}
                        {Math.round(importState.result.debugInfo.avgBatchTime)}
                        ms
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
          {importState.isImporting && importState.progress && (
            <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium text-blue-700'>
                  Importing movies...
                </span>
                <span className='text-sm text-blue-600'>
                  {importState.progress.processed}/{importState.progress.total}
                </span>
              </div>

              <div className='w-full bg-blue-200 rounded-full h-2 mb-3'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{
                    width: `${
                      (importState.progress.processed /
                        importState.progress.total) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div className='text-xs text-blue-600 space-y-1'>
                <div>
                  Batch {importState.progress.currentBatch}/
                  {importState.progress.totalBatches}
                </div>
                <div>
                  Successful: {importState.progress.successful} | Failed:{' '}
                  {importState.progress.failed}
                </div>
                {importState.progress.currentMovies.length > 0 && (
                  <div className='truncate'>
                    Current: {importState.progress.currentMovies.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!importState.file && !importState.result && (
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
