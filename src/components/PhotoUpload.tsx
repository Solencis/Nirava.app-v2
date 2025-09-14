import React, { useState, useRef } from 'react';
import { Camera, X, Upload, AlertCircle } from 'lucide-react';
import { uploadJournalPhoto, deleteJournalPhoto } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface PhotoUploadProps {
  onPhotoChange: (photoUrl: string | null) => void;
  currentPhoto?: string | null;
  className?: string;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  onPhotoChange, 
  currentPhoto, 
  className = '',
  onUploadStart,
  onUploadEnd
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validation
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      setError('La photo ne peut pas dépasser 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image');
      return;
    }

    setUploading(true);
    setError('');
    onUploadStart?.();

    try {
      // Delete old photo if exists
      if (currentPhoto) {
        await deleteJournalPhoto(currentPhoto);
      }

      // Upload new photo
      const photoUrl = await uploadJournalPhoto(file);
      onPhotoChange(photoUrl);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      if (error.message?.includes('bucket') || error.message?.includes('Bucket') || error.message?.includes('stockage')) {
        setError('⚠️ Configuration requise : Le bucket "journal-images" doit être créé dans votre projet Supabase (Storage → Create bucket)');
      } else {
        setError('Erreur lors de l\'upload. Vérifiez votre configuration Supabase.');
      }
    } finally {
      setUploading(false);
      onUploadEnd?.();
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentPhoto) return;

    try {
      await deleteJournalPhoto(currentPhoto);
      onPhotoChange(null);
    } catch (error) {
      console.error('Error deleting photo:', error);
      setError('Erreur lors de la suppression');
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Photo preview */}
      {currentPhoto && (
        <div className="relative">
          <img
            src={currentPhoto}
            alt="Photo ajoutée"
            className="w-full max-w-xs h-32 object-cover rounded-xl border border-stone/20"
          />
          <button
            onClick={handleRemovePhoto}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-300"
            aria-label="Supprimer la photo"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload button */}
      {!currentPhoto && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center px-4 py-2 bg-stone/10 text-stone rounded-xl hover:bg-stone/20 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-stone border-t-transparent rounded-full animate-spin mr-2"></div>
                Upload...
              </>
            ) : (
              <>
                <Camera size={16} className="mr-2" />
                Ajouter une photo
              </>
            )}
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center text-red-600 text-sm">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-stone/60">
        📸 Photo sécurisée • Max 5MB • JPG, PNG, WebP • Stockage privé
      </p>
    </div>
  );
};

export default PhotoUpload;