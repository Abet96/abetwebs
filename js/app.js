function appLog(type, message, data = null) {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    const prefix = `[${timestamp}] [${type}]`;

    switch(type) {
        case 'INFO':
            console.log(`%c${prefix} ${message}`, 'color: #2563eb', data || '');
            break;
        case 'SUCCESS':
            console.log(`%c${prefix} ${message}`, 'color: #10b981', data || '');
            break;
        case 'ERROR':
            console.error(`%c${prefix} ${message}`, 'color: #ef4444', data || '');
            break;
        case 'WARNING':
            console.warn(`%c${prefix} ${message}`, 'color: #f59e0b', data || '');
            break;
        default:
            console.log(`${prefix} ${message}`, data || '');
    }
}

// Log saat aplikasi dimuat
appLog('INFO', 'Aplikasi CloudApp dimuat');
appLog('INFO', 'Halaman aktif: ' + document.title);

// ========================================
// 2. FETCH API - QUOTE OF THE DAY
// ========================================

// Elemen DOM untuk Quote
const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const newQuoteBtn = document.getElementById('new-quote-btn');

/**
 * Mengambil quote random dari API
 * API yang digunakan: quotable.io (gratis, tanpa API key)
 */
async function fetchQuote() {
    // Cek apakah elemen quote ada di halaman ini
    if (!quoteText || !quoteAuthor) {
        appLog('INFO', 'Elemen quote tidak ditemukan di halaman ini');
        return;
    }

    appLog('INFO', 'Mengambil quote dari API...');

    // Tampilkan loading state
    quoteText.textContent = 'Memuat quote...';
    quoteAuthor.textContent = '- Loading...';

    try {
        // Fetch dari API
        const response = await fetch('https://api.quotable.io/random');

        // Cek apakah response berhasil
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse JSON
        const data = await response.json();

        appLog('SUCCESS', 'Quote berhasil dimuat', data);

        // Tampilkan quote
        quoteText.textContent = `"${data.content}"`;
        quoteAuthor.textContent = `- ${data.author}`;

    } catch (error) {
        appLog('ERROR', 'Gagal mengambil quote', error.message);

        // Tampilkan fallback quote jika API gagal
        quoteText.textContent = '"Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan."';
        quoteAuthor.textContent = '- Colin Powell';
    }
}

// Event listener untuk tombol "Quote Baru"
if (newQuoteBtn) {
    newQuoteBtn.addEventListener('click', function() {
        appLog('INFO', 'User mengklik tombol Quote Baru');
        fetchQuote();
    });
}

// Load quote pertama kali saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    appLog('INFO', 'DOM Content Loaded');
    fetchQuote();
    loadNotes();
});

// ========================================
// 3. CRUD LOCALSTORAGE - NOTES
// ========================================

// Elemen DOM untuk Notes
const noteInput = document.getElementById('note-input');
const addNoteBtn = document.getElementById('add-note-btn');
const notesList = document.getElementById('notes-list');

// Key untuk localStorage
const NOTES_KEY = 'cloudapp_notes';

/**
 * Mengambil notes dari localStorage
 * @returns {Array} Array of notes
 */
function getNotes() {
    const notes = localStorage.getItem(NOTES_KEY);
    return notes ? JSON.parse(notes) : [];
}

/**
 * Menyimpan notes ke localStorage
 * @param {Array} notes - Array of notes
 */
function saveNotes(notes) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    appLog('SUCCESS', 'Notes berhasil disimpan ke localStorage', { count: notes.length });
}

/**
 * Menampilkan semua notes ke DOM
 */
function loadNotes() {
    // Cek apakah elemen notesList ada
    if (!notesList) {
        appLog('INFO', 'Elemen notes tidak ditemukan di halaman ini');
        return;
    }

    const notes = getNotes();
    appLog('INFO', 'Memuat notes dari localStorage', { count: notes.length });

    // Kosongkan list
    notesList.innerHTML = '';

    // Jika tidak ada notes
    if (notes.length === 0) {
        notesList.innerHTML = '<li class="empty-notes">Belum ada catatan. Tambahkan catatan pertama!</li>';
        return;
    }

    // Render setiap note
    notes.forEach(function(note, index) {
        const li = document.createElement('li');
        li.className = 'note-item';
        li.innerHTML = `
            <span class="note-text">${escapeHtml(note.text)}</span>
            <button class="note-delete" onclick="deleteNote(${index})">Hapus</button>
        `;
        notesList.appendChild(li);
    });
}

/**
 * Menambahkan note baru
 */
function addNote() {
    if (!noteInput) return;

    const text = noteInput.value.trim();

    // Validasi input
    if (text === '') {
        appLog('WARNING', 'User mencoba menambah note kosong');
        alert('Silakan tulis catatan terlebih dahulu!');
        return;
    }

    // Ambil notes yang ada
    const notes = getNotes();

    // Tambahkan note baru
    const newNote = {
        id: Date.now(),
        text: text,
        createdAt: new Date().toISOString()
    };

    notes.push(newNote);

    // Simpan ke localStorage
    saveNotes(notes);

    appLog('SUCCESS', 'Note baru ditambahkan', newNote);

    // Reset input
    noteInput.value = '';

    // Refresh tampilan
    loadNotes();
}

/**
 * Menghapus note berdasarkan index
 * @param {number} index - Index note yang akan dihapus
 */
function deleteNote(index) {
    const notes = getNotes();

    // Validasi index
    if (index < 0 || index >= notes.length) {
        appLog('ERROR', 'Index note tidak valid', { index });
        return;
    }

    // Konfirmasi penghapusan
    const confirmDelete = confirm('Apakah Anda yakin ingin menghapus catatan ini?');

    if (!confirmDelete) {
        appLog('INFO', 'User membatalkan penghapusan note');
        return;
    }

    // Hapus note
    const deletedNote = notes.splice(index, 1);
    appLog('SUCCESS', 'Note berhasil dihapus', deletedNote[0]);

    // Simpan perubahan
    saveNotes(notes);

    // Refresh tampilan
    loadNotes();
}

/**
 * Fungsi untuk escape HTML (mencegah XSS)
 * @param {string} text - Text yang akan di-escape
 * @returns {string} Text yang sudah di-escape
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listener untuk tombol tambah note
if (addNoteBtn) {
    addNoteBtn.addEventListener('click', function() {
        appLog('INFO', 'User mengklik tombol Tambah Note');
        addNote();
    });
}

// Event listener untuk Enter key pada input
if (noteInput) {
    noteInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            appLog('INFO', 'User menekan Enter pada input note');
            addNote();
        }
    });
}

// ========================================
// 4. UTILITY FUNCTIONS
// ========================================

/**
 * Menampilkan informasi browser dan device
 */
function logDeviceInfo() {
    const info = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
    };

    appLog('INFO', 'Device Information', info);
}

// Log device info saat load
logDeviceInfo();

// Log saat window di-resize (untuk testing responsive)
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        appLog('INFO', 'Window resized', {
            width: window.innerWidth,
            height: window.innerHeight
        });
    }, 500);
});

// ========================================
// 5. EXPORT UNTUK TESTING (opsional)
// ========================================

// Expose fungsi ke global scope untuk akses dari console
window.CloudApp = {
    getNotes: getNotes,
    addNote: addNote,
    deleteNote: deleteNote,
    fetchQuote: fetchQuote,
    appLog: appLog
};

appLog('SUCCESS', 'CloudApp berhasil diinisialisasi');
