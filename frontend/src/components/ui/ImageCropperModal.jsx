import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

/**
 * Seçilen görüntüyü canvas üzerinde kırpıp Blob döndürür.
 */
async function cropImageToBlob(image, crop, outputSize) {
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0, 0,
        outputSize, outputSize
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
}

async function cropRectImageToBlob(image, crop, outW, outH) {
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0, 0,
        outW, outH
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
}

/**
 * Props:
 *  - imageSrc: string (data URL / object URL)
 *  - mode: 'avatar' | 'cover'
 *  - onConfirm: (blob: Blob) => void
 *  - onCancel: () => void
 */
export default function ImageCropperModal({ imageSrc, mode = 'avatar', onConfirm, onCancel }) {
    const isAvatar = mode === 'avatar';
    const aspect = isAvatar ? 1 : 16 / 6;

    const imgRef = useRef(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [saving, setSaving] = useState(false);

    const onImageLoad = useCallback((e) => {
        const { width, height } = e.currentTarget;
        const c = centerCrop(
            makeAspectCrop({ unit: '%', width: 80 }, aspect, width, height),
            width, height
        );
        setCrop(c);
    }, [aspect]);

    const handleConfirm = async () => {
        if (!completedCrop || !imgRef.current) return;
        setSaving(true);
        try {
            let blob;
            if (isAvatar) {
                blob = await cropImageToBlob(imgRef.current, completedCrop, 400);
            } else {
                blob = await cropRectImageToBlob(imgRef.current, completedCrop, 1200, 450);
            }
            onConfirm(blob);
        } catch (e) {
            console.error('Kırpma hatası:', e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={S.backdrop} onClick={onCancel}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={S.header}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#262F59' }}>
                        {isAvatar ? 'Profil Fotoğrafı Kırp' : 'Kapak Fotoğrafı Kırp'}
                    </h3>
                    <button onClick={onCancel} style={S.closeBtn}>&times;</button>
                </div>

                {/* Crop Area */}
                <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'center', background: '#111', minHeight: 260, alignItems: 'center' }}>
                    <ReactCrop
                        crop={crop}
                        onChange={(_, pct) => setCrop(pct)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspect}
                        circularCrop={isAvatar}
                        minWidth={isAvatar ? 80 : 160}
                        keepSelection
                    >
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Kırpılacak görsel"
                            onLoad={onImageLoad}
                            style={{
                                maxWidth: isAvatar ? 380 : 680,
                                maxHeight: 420,
                                objectFit: 'contain',
                                display: 'block',
                            }}
                        />
                    </ReactCrop>
                </div>

                {/* Hint */}
                <p style={{ margin: 0, padding: '10px 24px 0', fontSize: 12, color: '#aaa', textAlign: 'center' }}>
                    {isAvatar
                        ? 'Dairenin konumunu ve boyutunu ayarlayın.'
                        : 'Dikdörtgeni sürükleyerek istediğiniz alanı seçin.'}
                </p>

                {/* Footer */}
                <div style={S.footer}>
                    <button onClick={onCancel} style={{ ...S.btn, ...S.btnSecondary, flex: 1 }}>İptal</button>
                    <button onClick={handleConfirm} disabled={saving || !completedCrop}
                        style={{ ...S.btn, ...S.btnPrimary, flex: 2, opacity: (saving || !completedCrop) ? 0.6 : 1 }}>
                        {saving
                            ? <><div style={S.spin}></div>Kaydediliyor...</>
                            : <><i className="feather-check" style={{ marginRight: 8 }}></i>Uygula</>}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                /* react-image-crop overrides */
                .ReactCrop__crop-selection { border: 2.5px solid #fff !important; }
                .ReactCrop__drag-handle::after { background: #262F59 !important; border: 2px solid #fff !important; }
            `}</style>
        </div>
    );
}

const S = {
    backdrop: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn .2s',
    },
    modal: {
        background: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 740,
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px', borderBottom: '1px solid #f0f2f5',
    },
    closeBtn: {
        background: 'none', border: 'none', fontSize: 28, cursor: 'pointer',
        color: '#bbb', lineHeight: 1, padding: 0,
    },
    footer: {
        display: 'flex', gap: 12, padding: '16px 24px',
        borderTop: '1px solid #f0f2f5',
    },
    btn: {
        padding: '11px 22px', borderRadius: 24, fontWeight: 700,
        fontSize: 14, cursor: 'pointer', border: 'none',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    },
    btnPrimary: { backgroundColor: '#262F59', color: '#fff' },
    btnSecondary: { backgroundColor: '#f0f2f5', color: '#262F59' },
    spin: {
        width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)',
        borderTopColor: '#fff', borderRadius: '50%',
        animation: 'spin .7s linear infinite', marginRight: 8,
    },
};
