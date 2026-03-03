/**
 * TextInput — Unified pill-shaped input bar
 * Layout: [📎/📷 upload] [text input flex-1] [🎤 mic button]
 */
import React, { useState, useRef } from 'react';
import {
    FiPlus,
    FiPaperclip,
    FiCamera,
    FiSend,
    FiMic,
    FiLoader,
} from 'react-icons/fi';

export default function TextInput({ onSend, onUpload, disabled, placeholder, leftSlot }) {
    const [text, setText] = useState('');
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const menuRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim() && !disabled) {
            onSend(text.trim());
            setText('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit(e);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setShowUploadMenu(false);
        setIsUploading(true);
        try {
            await onUpload(file);
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const canSend = text.trim() && !disabled;

    return (
        <div className="w-full relative">
            {/* Hidden file inputs */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf"
            />
            <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                capture="environment"
            />

            {/* Upload options pop-up menu */}
            {showUploadMenu && (
                <>
                    {/* Backdrop to dismiss */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUploadMenu(false)}
                    />
                    <div
                        ref={menuRef}
                        className="absolute bottom-[calc(100%+10px)] left-0 z-20 bg-white border border-slate-100 rounded-2xl shadow-lg p-1.5 flex flex-col gap-0.5 min-w-[168px] animate-fade-in-up"
                    >
                        <button
                            type="button"
                            onClick={() => { setShowUploadMenu(false); fileInputRef.current?.click(); }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-mediloon-600 transition-all duration-150 text-sm font-brand font-medium"
                        >
                            <div className="w-8 h-8 rounded-lg bg-mediloon-50 flex items-center justify-center flex-shrink-0">
                                <FiPaperclip className="w-4 h-4 text-mediloon-600" />
                            </div>
                            <span>Attach File</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowUploadMenu(false); cameraInputRef.current?.click(); }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-mediloon-600 transition-all duration-150 text-sm font-brand font-medium"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <FiCamera className="w-4 h-4 text-blue-500" />
                            </div>
                            <span>Take Photo</span>
                        </button>
                    </div>
                </>
            )}

            <form onSubmit={handleSubmit} className="w-full">
                {/* Unified pill container */}
                <div className={`
                    flex items-center w-full rounded-full border bg-white shadow-sm
                    transition-all duration-200
                    ${disabled
                        ? 'border-surface-fog opacity-60'
                        : 'border-surface-fog hover:border-mediloon-200 focus-within:border-mediloon-400 focus-within:shadow-md focus-within:shadow-mediloon-100/50'
                    }
                `}>

                    {/* ── LEFT: Upload button (clip + camera) ── */}
                    <button
                        type="button"
                        onClick={() => setShowUploadMenu(prev => !prev)}
                        disabled={disabled || isUploading}
                        title="Attach file or take photo"
                        className={`
                            flex-shrink-0 w-10 h-10 ml-1.5 rounded-full flex items-center justify-center gap-0.5
                            transition-all duration-200 active:scale-95
                            ${showUploadMenu
                                ? 'bg-mediloon-50 text-mediloon-600'
                                : 'text-slate-400 hover:text-mediloon-500 hover:bg-mediloon-50'
                            }
                            ${isUploading ? 'animate-pulse text-mediloon-400' : ''}
                        `}
                    >
                        {isUploading ? (
                            <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                            <FiPlus
                                className={`w-5 h-5 transition-transform duration-200 ${showUploadMenu ? 'rotate-45' : ''}`}
                            />
                        )}
                    </button>

                    {/* ── CENTER: Seamless text input ── */}
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || 'Type a message or speak...'}
                        disabled={disabled}
                        className={`
                            flex-1 min-w-0 py-3 px-3 bg-transparent border-none outline-none ring-0
                            font-body text-sm text-ink-primary placeholder:text-ink-ghost
                            ${disabled ? 'cursor-not-allowed' : ''}
                        `}
                    />

                    {/* ── RIGHT: Send button (when text present) or Mic button (injected via leftSlot prop) ── */}
                    {canSend ? (
                        <button
                            type="submit"
                            className="flex-shrink-0 w-10 h-10 mr-1.5 rounded-full flex items-center justify-center bg-mediloon-600 text-white shadow-sm hover:bg-mediloon-700 hover:shadow-md hover:-translate-y-px transition-all duration-200 active:scale-95"
                        >
                            <FiSend className="w-4 h-4" />
                        </button>
                    ) : (
                        /* Mic/voice button slot from parent */
                        leftSlot ? (
                            <div className="flex-shrink-0 mr-1.5">
                                {leftSlot}
                            </div>
                        ) : null
                    )}
                </div>
            </form>
        </div>
    );
}
