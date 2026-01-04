import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Download, Eye, Loader, Plus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Document {
  id: string;
  requestId: string;
  documentType: 'PDF' | 'ATTACHMENT';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  generatedBy: string | null;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const { tokens } = useAuthStore();
  const token = tokens?.accessToken;
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (requestId) {
      fetchDocuments(requestId);
    }
  }, [requestId]);

  const fetchDocuments = async (reqId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/documents/request/${reqId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (reqId: string) => {
    try {
      setGenerating(reqId);
      const response = await fetch(`${API_URL}/documents/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: reqId,
          includeSignatures: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const data = await response.json();
      setDocuments((prev) => [data.data, ...prev]);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      // For now, open in new tab since we're using placeholder URLs
      window.open(document.fileUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Documents
            </h1>
            {requestId && (
              <button
                onClick={() => generatePDF(requestId)}
                disabled={generating === requestId}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating === requestId ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Generate PDF
                  </>
                )}
              </button>
            )}
          </div>

          {!requestId && (
            <p className="mt-2 text-sm text-gray-600">
              Select a request to view its documents
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {!requestId ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              No request selected
            </p>
            <button
              onClick={() => navigate('/requests')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Go to Requests
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              No documents yet for this request
            </p>
            <button
              onClick={() => generatePDF(requestId)}
              disabled={generating === requestId}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {generating === requestId ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Generate First PDF
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {document.fileName}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <span>{document.documentType}</span>
                      <span>•</span>
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span>•</span>
                      <span>{formatDate(document.createdAt)}</span>
                    </div>
                    {document.generatedBy && (
                      <p className="mt-1 text-xs text-gray-500">
                        Generated by {document.generatedBy}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadDocument(document)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View document"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => downloadDocument(document)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Download document"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document viewer modal would go here in production */}
    </div>
  );
}
