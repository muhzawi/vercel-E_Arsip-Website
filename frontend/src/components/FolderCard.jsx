import { useNavigate } from 'react-router-dom';
import { Folder, Edit, Trash2 } from 'lucide-react';

export default function FolderCard({ folder, index = 0, currentUser, onRename, onDelete }) {
  const navigate = useNavigate();
  const isEven = index % 2 === 0;

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.id === folder.dibuat_oleh;

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onRename) onRename(folder);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(folder);
  };

  return (
    <div
      onClick={() => navigate(`/folder/${folder.id}`)}
      className="bg-[#ffffff] border-[0.5px] border-[#E0E0E0] rounded-[8px] p-[14px] cursor-pointer transition-all duration-200 hover:border-[#297BBF] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] group relative"
    >
      <div 
        className="rounded-[6px] p-[6px] inline-flex items-center justify-center"
        style={{ 
          backgroundColor: isEven ? '#EBF4FC' : '#FFFBE6',
          color: isEven ? '#297BBF' : '#c9a800'
        }}
      >
        <Folder size={22} />
      </div>
      
      {isAuthorized && (
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleEdit} className="p-1.5 text-gray-400 hover:text-[#297BBF] hover:bg-[#EBF4FC] rounded-md transition-colors" title="Ubah Nama">
            <Edit size={16} />
          </button>
          <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Hapus Folder">
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <p className="font-[500] text-[13px] text-[#000000] mt-[10px] truncate pr-8">{folder.nama}</p>
      <p className="text-[11px] text-[#666666] mt-0.5">{folder.pembuat?.nama || 'Unknown'}</p>
      <p className="text-[11px] text-[#297BBF] font-[500] mt-1.5 group-hover:underline">
        Buka
      </p>
    </div>
  );
}
