const supabase = require('../config/supabase');

/**
 * Get all folders
 * GET /api/folders
 */
const getAllFolders = async (req, res) => {
  try {
    const { data: folders, error } = await supabase
      .from('folders')
      .select(`
        *,
        pembuat:users!dibuat_oleh ( id, nama, email )
      `)
      .order('dibuat_pada', { ascending: false });

    if (error) {
      console.error('getAllFolders error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data folder.',
      });
    }

    return res.status(200).json({
      success: true,
      data: folders,
    });
  } catch (error) {
    console.error('getAllFolders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

/**
 * Get folder by ID with subfolders and files
 * GET /api/folders/:id
 */
const getFolderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil folder utama
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select(`
        *,
        pembuat:users!dibuat_oleh ( id, nama, email )
      `)
      .eq('id', id)
      .single();

    if (folderError || !folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder tidak ditemukan.',
      });
    }

    // Ambil subfolder
    const { data: subfolders, error: subError } = await supabase
      .from('folders')
      .select(`
        *,
        pembuat:users!dibuat_oleh ( id, nama, email )
      `)
      .eq('parent_id', id)
      .order('dibuat_pada', { ascending: false });

    if (subError) {
      console.error('Subfolder query error:', subError);
    }

    // Ambil file aktif dalam folder
    const { data: files, error: fileError } = await supabase
      .from('files')
      .select(`
        *,
        pengunggah:users!diunggah_oleh ( id, nama, email )
      `)
      .eq('folder_id', id)
      .is('dihapus_pada', null)
      .order('diunggah_pada', { ascending: false });

    if (fileError) {
      console.error('Files query error:', fileError);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...folder,
        subfolders: subfolders || [],
        files: files || [],
      },
    });
  } catch (error) {
    console.error('getFolderById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

/**
 * Create a new folder
 * POST /api/folders
 */
const createFolder = async (req, res) => {
  try {
    const { nama, parent_id } = req.body;

    if (!nama || nama.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nama folder wajib diisi.',
      });
    }

    // Jika ada parent_id, pastikan folder induk ada
    if (parent_id) {
      const { data: parentFolder, error: parentError } = await supabase
        .from('folders')
        .select('id')
        .eq('id', parent_id)
        .single();

      if (parentError || !parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Folder induk tidak ditemukan.',
        });
      }
    }

    const insertData = {
      nama: nama.trim(),
      dibuat_oleh: req.user.id,
    };

    if (parent_id) {
      insertData.parent_id = parent_id;
    }

    const { data: newFolder, error } = await supabase
      .from('folders')
      .insert(insertData)
      .select(`
        *,
        pembuat:users!dibuat_oleh ( id, nama, email )
      `)
      .single();

    if (error) {
      console.error('createFolder error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal membuat folder.',
      });
    }

    // Catat activity log
    await supabase.from('activity_logs').insert({
      user_id: req.user.id,
      aksi: 'buat_folder',
      keterangan: `Membuat folder ${nama.trim()}`,
      ip_address: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: newFolder,
      message: 'Folder berhasil dibuat.',
    });
  } catch (error) {
    console.error('createFolder error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

/**
 * Delete folder (admin only)
 * DELETE /api/folders/:id
 */
const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek folder ada
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .single();

    if (folderError || !folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder tidak ditemukan.',
      });
    }

    // Cek otorisasi
    if (req.user.role !== 'admin' && folder.dibuat_oleh !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk menghapus folder ini.',
      });
    }

    // Cek apakah ada file aktif di dalam folder
    const { data: activeFiles, error: fileError } = await supabase
      .from('files')
      .select('id')
      .eq('folder_id', id)
      .is('dihapus_pada', null);

    if (fileError) {
      console.error('Check files error:', fileError);
    }

    if (activeFiles && activeFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Folder masih berisi file aktif. Hapus semua file terlebih dahulu.',
      });
    }

    // Delete folder
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('deleteFolder error:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus folder.',
      });
    }

    // Catat activity log
    await supabase.from('activity_logs').insert({
      user_id: req.user.id,
      aksi: 'hapus_folder',
      keterangan: `Menghapus folder ${folder.nama}`,
      ip_address: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Folder berhasil dihapus.',
    });
  } catch (error) {
    console.error('deleteFolder error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

/**
 * Rename folder
 * PUT /api/folders/:id/rename
 */
const renameFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama } = req.body;

    if (!nama || nama.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nama folder wajib diisi.',
      });
    }

    // Cek folder ada
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .single();

    if (folderError || !folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder tidak ditemukan.',
      });
    }

    // Cek otorisasi
    if (req.user.role !== 'admin' && folder.dibuat_oleh !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk mengubah nama folder ini.',
      });
    }

    const newName = nama.trim();

    const { error: updateError } = await supabase
      .from('folders')
      .update({ nama: newName })
      .eq('id', id);

    if (updateError) {
      console.error('renameFolder error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengubah nama folder.',
      });
    }

    // Catat activity log
    await supabase.from('activity_logs').insert({
      user_id: req.user.id,
      aksi: 'ubah_folder',
      keterangan: `Mengubah nama folder dari ${folder.nama} menjadi ${newName}`,
      ip_address: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Nama folder berhasil diubah.',
    });
  } catch (error) {
    console.error('renameFolder error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

module.exports = { getAllFolders, getFolderById, createFolder, deleteFolder, renameFolder };
