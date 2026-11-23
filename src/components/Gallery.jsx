import { useState, useEffect, useCallback } from "react";
import { supabase } from '../supabaseClient';

import "./Gallery.css";

export default function Gallery ({ session, profile, onLogout }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  const [lightboxIndex, setLightboxIndex] = useState(null);
 
  //Fetch photos and create signed URLs for private viewing
  const fetchPhotos = async () => {
    try {
     const {data, error} = await supabase
         .from("photos")
         .select("id, storage_path, caption, profiles(username, passcode)")
         .order("created_at", {ascending: false});  

     if (!error && data) {
      const photosWithURLs = await Promise.all(
        data.map(async (item) => {
          const {data: urlData} = await supabase.storage
               .from("event-photos")
               .createSignedUrl(item.storage_path, 86400);

          return {
            ...item,
            url: urlData?.signedUrl,
            uploader: item.profiles?.username,
            passcode: item.profiles?.passcode
          };      
        })
      );

      setPhotos(photosWithURLs);
     }  

    } catch (err) {
      console.error("Error fetching photos: ", err);

    } finally {
      setLoadingPhotos(false);
    }
  };
   
  useEffect(() => {
    fetchPhotos();
  }, []);

  //Slideshow navigation handlers
  const handlePrev = useCallback(() => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) => (prev < photos.length ? prev + 1 : 0));
  }, [photos.length]);

  const handleClose = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  //Slideshow keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, handlePrev, handleNext, handleClose]);

  const handleUpload = async (e) => {
    try {
     setUploading(true);
     const files = Array.from(e.target.files || []);  
     if (files.length === 0) return;  

     // Лимит: 15 МБ в байтах
     const MAX_SIZE_MB = 15;
     const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

     // Filter to allow only JPG files up to 15 MB
     const filteredFiles = files.filter((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      const isJpg = file.type === "image/jpeg" || ext === "jpg" || ext === "jpeg";
      const isValidSize = file.size <= MAX_SIZE_BYTES;

      return isJpg && isValidSize;
     });

     if (filteredFiles.length === 0) {
      alert(`Разрешены только файлы .jpg / .jpeg размером до ${MAX_SIZE_MB} МБ.`);
      return;
     }

     if (filteredFiles.length < files.length) {
      alert(`Некоторые файлы были пропущены (неверный формат или превышен лимит в ${MAX_SIZE_MB} МБ).`);
     }
     
     //Upload all files and insert DB records in parallel
     await Promise.all(
       filteredFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();

        //Append index and random suffix to avoid file name collision in batch
        const filePath = `${session.user.id}/${Date.now()}-${index}.${fileExt}`;

        //Upload to private bucket
        const {error: storageError} = await supabase.storage
             .from("event-photos")
             .upload(filePath, file);

        if (storageError) throw storageError;    

        //Insert record linked to current user
        const {error: dbError} = await supabase.from("photos").insert([
          {
            storage_path: filePath,
            caption: file.name,
            user_id: session.user.id
          }
        ]);

        if (dbError) throw dbError;
       })
     );

     fetchPhotos();

    } catch (err) {
     alert(err.message);

    } finally {
     setUploading(false);
     e.target.value = "";
    }
  };

  return(
    <div className="gallery-container">
      <header className="gallery-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gallery-title">Фотографии SAM</h1>
          <p className="gallery-user-username">Вход выполнен как: <strong>{profile?.username}</strong></p>
        </div>
       
        {/* Кнопка выхода */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="logout-btn"
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: '#ff4d4f',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold'
            }}
          >
            Выйти
          </button>
        )}
      </header>

      {/*Upload Button*/}
      <section className="upload-card">
        <label className={`upload-label ${uploading ? 'disabled' : ''}`}>
          <span>{uploading ? "Загрузка..." : "+ Загрузите ваши фотографии"}</span>
          <span className="upload-subtext">Только файлы .jpg (до 15 МБ)</span>

          <input
           type="file"
           accept="image/jpeg, .jpg, .jpeg"
           multiple
           onChange={handleUpload}
           disabled={uploading}
           style={{display: "none"}}        
          />
        </label>
      </section>

      {/*Image Grid*/}
      <section className="photo-grid">
        {photos.map((photo, index) => (
          <div className="photo-item" key={photo.id} onClick={() => setLightboxIndex(index)}>
           <img
            className="photo-img"
            src={photo.url}
            alt={photo.caption}
            loading="lazy"
           />

           <div className="photo-overlay">
             <span className="photo-uploader">Загружено: <strong>{photo.uploader} ({photo.passcode})</strong></span>
           </div>
          </div>
        ))}
      </section>

      {/*Slideshow Modal*/}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div className="lightbox-backdrop">
          <div className="lightbox-content">
            <button className="lightbox-close-btn" onClick={handleClose} aria-label="Close">
              &times;
            </button>

            {photos.length > 1 && (
              <>
                <button className="lightbox-nav-btn prev" onClick={handlePrev} aria-label="Previous Photo">
                  &#10094;
                </button>

                <button className="lightbox-nav-btn next" onClick={handleNext} aria-label="Next Photo">
                  &#10095;
                </button>
              </>
            )}

            <img
             className="lightbox-img"
             src={photos[lightboxIndex].url}
             alt={photos[lightboxIndex].caption}
            />

            <div className="lightbox-details">
              <span className="lightbox-counter">{lightboxIndex + 1} / {photos.length}</span>
              <span className="lightbox-caption">{photos[lightboxIndex].caption}</span>
              <span className="lightbox-uploader">Загружено: {photos[lightboxIndex].uploader}</span>
            </div>

          </div>
        </div>
      )}

      {photos.length === 0 && !loadingPhotos && (
        <p className="empty-gallery">
          Пока нет ни одной фотографии
        </p>
      )}

      {loadingPhotos && <p className="loading-text">Загрузка фотографий...</p>}
    </div>
  );  
}
