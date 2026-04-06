import React, { useState } from 'react';
import { FileText, Upload, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useTooltipText } from '../../contexts/I18nContext';

export interface Document {
    id: string;
    title: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    mimeType: string;
    createdAt: string;
}

interface DocumentManagementProps {
    collectionId: string;
    documents: Document[];
    onUpload: (files: FileList) => void;
    onDelete: (id: string) => void;
}

export function DocumentManagement({ documents, onUpload, onDelete }: DocumentManagementProps) {
    const [isDragging, setIsDragging] = useState(false);
    const tooltip = useTooltipText();

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            onUpload(e.dataTransfer.files);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-white">Documents</h3>
                    <p className="text-slate-500 text-sm">Manage files in this collection.</p>
                </div>
            </div>

            {/* Upload Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                title={tooltip('knowledge.upload')}
                className={`relative overflow-hidden group py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl transition-all duration-500 ${isDragging
                    ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                    : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'
                    }`}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="relative w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500 shadow-xl">
                    <Upload className={`w-8 h-8 ${isDragging ? 'text-indigo-400 animate-bounce' : 'text-slate-500'}`} />
                </div>

                <div className="relative text-center">
                    <p className="text-slate-300 font-medium">Click to upload or drag and drop</p>
                    <p className="text-slate-500 text-sm mt-1">PDF, TXT, MD or JSON (max. 10MB)</p>
                </div>

                <input
                    type="file"
                    multiple
                    title={tooltip('knowledge.upload')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => e.target.files && onUpload(e.target.files)}
                />
            </div>

            {/* Documents List */}
            <div className="bg-slate-900/40 rounded-3xl border border-slate-800/50 overflow-hidden backdrop-blur-md">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Document Name</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Mime Type</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Added At</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {documents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-600 italic">
                                    No documents in this collection.
                                </td>
                            </tr>
                        ) : (
                            documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-4 h-4 text-indigo-400/70" />
                                            <span className="text-sm text-slate-200 font-medium">{doc.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {doc.status === 'completed' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                                            {doc.status === 'processing' && <Clock className="w-3 h-3 text-amber-500 animate-spin" />}
                                            {doc.status === 'pending' && <Clock className="w-3 h-3 text-slate-500" />}
                                            {doc.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-500" />}
                                            <span className={`text-[11px] font-bold uppercase tracking-tighter ${doc.status === 'completed' ? 'text-emerald-500' :
                                                doc.status === 'processing' ? 'text-amber-500' :
                                                    doc.status === 'failed' ? 'text-red-500' : 'text-slate-500'
                                                }`}>
                                                {doc.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                                        {doc.mimeType}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => onDelete(doc.id)}
                                            title={tooltip('knowledge.deleteDocument')}
                                            className="p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
