/**
 * Student Fee Management System
 * VIDYA KUNJ - Frontend JavaScript
 */

// ===================================
// Global Variables
// ===================================
let allStudents = [];

// ===================================
// Initialization
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    loadStudents();
    loadSummary();
    setupDragAndDrop();
    populateMonthDropdowns();
});

// ===================================
// Month Helper Functions
// ===================================
function getMonthOptions() {
    // Only 2026 months
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months.map(m => `${m} 2026`);
}

// Get 2026 months for tag display
function get2026Months() {
    return ['January 2026', 'February 2026', 'March 2026', 'April 2026', 
            'May 2026', 'June 2026', 'July 2026', 'August 2026',
            'September 2026', 'October 2026', 'November 2026', 'December 2026'];
}

// Selected months sets
let selectedBulkMonths = new Set();
let selectedAddMonths = new Set();

// Render month tags
function renderMonthTags(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Use the correct global Set based on container
    const selectedSet = containerId === 'bulkMonthTags' ? selectedBulkMonths : selectedAddMonths;
    
    const months = get2026Months();
    container.innerHTML = months.map(month => {
        const isSelected = selectedSet.has(month);
        return `<span class="month-tag ${isSelected ? 'selected' : ''}" 
                      onclick="toggleMonthTag('${containerId}', '${month}')">${month}</span>`;
    }).join('');
}

// Toggle month selection
function toggleMonthTag(containerId, month) {
    const selectedSet = containerId === 'bulkMonthTags' ? selectedBulkMonths : selectedAddMonths;
    
    console.log('Toggling month:', month, 'in container:', containerId);
    
    if (selectedSet.has(month)) {
        selectedSet.delete(month);
    } else {
        selectedSet.add(month);
    }
    
    console.log('Selected months now:', Array.from(selectedSet));
    
    renderMonthTags(containerId);
}

function populateMonthDropdowns() {
    const options = getMonthOptions();
    const feeMonthSelect = document.getElementById('feeMonth');
    
    if (feeMonthSelect) {
        feeMonthSelect.innerHTML = options.map((month, index) => 
            `<option value="${month}" ${index === 0 ? 'selected' : ''}>${month}</option>`
        ).join('');
    }
}

// ===================================
// Data Loading Functions
// ===================================
async function loadStudents() {
    try {
        const response = await fetch('/api/students');
        const data = await response.json();
        
        if (data.success) {
            allStudents = data.data;
            renderTable(allStudents);
            updateRecordCount(allStudents.length);
        }
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Failed to load student data', 'error');
    }
}

async function loadSummary() {
    try {
        const response = await fetch('/api/summary');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalRecords').textContent = data.summary.total;
            document.getElementById('paidCount').textContent = data.summary.paid;
            document.getElementById('unpaidCount').textContent = data.summary.unpaid;
            
            // Populate month filter
            const monthFilter = document.getElementById('monthFilter');
            monthFilter.innerHTML = '<option value="">All Months</option>';
            data.summary.months.forEach(month => {
                if (month) {
                    const option = document.createElement('option');
                    option.value = month;
                    option.textContent = month;
                    monthFilter.appendChild(option);
                }
            });
        }
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// ===================================
// Table Rendering
// ===================================
function renderTable(students) {
    const tbody = document.getElementById('tableBody');
    
    if (students.length === 0) {
        tbody.innerHTML = `
            <tr class="no-data">
                <td colspan="7">
                    <div style="padding: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                        <p>No records found</p>
                        <p style="font-size: 0.875rem; margin-top: 0.5rem;">
                            Upload an Excel file or add a new record to get started
                        </p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = students.map(student => {
        const isPaid = student['Fee Status']?.toLowerCase() === 'paid';
        const statusClass = isPaid ? 'status-paid' : 'status-unpaid';
        const rowClass = isPaid ? 'row-paid' : 'row-unpaid';
        const statusText = isPaid ? 'Paid' : 'Not Paid';
        
        const receiptDisplay = isPaid && student['Receipt Number'] 
            ? `<span class="receipt-number clickable" onclick="searchByReceiptNumber('${escapeHtml(student['Receipt Number'] || '')}')">${student['Receipt Number']}</span>`
            : `<span class="no-receipt">-</span>`;
        
        // Create a unique key from name and father name
        const studentKey = `${student['Student Name'] || ''}_${student['Father Name'] || ''}`;
        
        return `
            <tr class="${rowClass}">
                <td>${escapeHtml(student['Student ID'] || '-')}</td>
                <td>
                    <strong class="student-name clickable" onclick="openStudentProfile('${escapeHtml(studentKey)}')">${escapeHtml(student['Student Name'] || '')}</strong>
                </td>
                <td>${escapeHtml(student['Father Name'] || '')}</td>
                <td>${escapeHtml(student['Mobile Number'] || '-')}</td>
                <td>${escapeHtml(student['Month'] || '')}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td>${receiptDisplay}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-small" 
                                onclick="openEditModal('${escapeHtml(studentKey)}', '${escapeHtml(student['Month'] || '')}', '${escapeHtml(student['Student Name'] || '')}', '${escapeHtml(student['Fee Status'] || '')}', '${escapeHtml(student['Receipt Number'] || '')}')">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-success btn-small" 
                                onclick="openAddMonthModal('${escapeHtml(student['Student Name'] || '')}', '${escapeHtml(student['Father Name'] || '')}', '${escapeHtml(student['Student ID'] || '')}', '${escapeHtml(student['Mobile Number'] || '')}')">
                            📅 Add Month
                        </button>
                        <button class="btn btn-danger btn-small" 
                                onclick="deleteRecord('${escapeHtml(studentKey)}', '${escapeHtml(student['Month'] || '')}')">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateRecordCount(count) {
    document.getElementById('recordCount').textContent = `Showing ${count} record${count !== 1 ? 's' : ''}`;
}

// ===================================
// Search & Filter Functions
// ===================================
let searchTimeout = null;

// Auto search with debounce - triggers as you type
function autoSearch() {
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Set new timeout (300ms delay for smooth typing)
    searchTimeout = setTimeout(() => {
        performSearch();
    }, 300);
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    const month = document.getElementById('monthFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    // Check if query looks like a receipt number (starts with RCP or contains mostly digits)
    const isReceiptSearch = query.toUpperCase().startsWith('RCP') || 
                           (query.length > 3 && /^[A-Z]*\d+/.test(query.toUpperCase()));
    
    // If it looks like a receipt and user typed enough characters, try receipt search
    if (isReceiptSearch && query.length >= 4) {
        try {
            const response = await fetch(`/api/student/${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.success) {
                showStudentProfile(data);
                return;
            }
        } catch (error) {
            // Not found as receipt, continue with normal search
        }
    }
    
    // Regular search
    try {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (month) params.append('month', month);
        if (status) params.append('status', status);
        
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
            renderTable(data.data);
            updateRecordCount(data.total);
        }
    } catch (error) {
        console.error('Error searching:', error);
    }
}

// Legacy functions for compatibility
function handleSearch(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

function handleReceiptSearch(event) {
    if (event.key === 'Enter') {
        searchByReceipt();
    }
}

async function searchStudents() {
    performSearch();
}

async function searchByReceipt() {
    const receiptNumber = document.getElementById('searchInput').value.trim();
    
    if (!receiptNumber) {
        showToast('Please enter a receipt number', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/student/${encodeURIComponent(receiptNumber)}`);
        const data = await response.json();
        
        if (data.success) {
            showStudentProfile(data);
        } else {
            showToast('Receipt number not found', 'error');
        }
    } catch (error) {
        console.error('Error searching by receipt:', error);
        showToast('Failed to find receipt', 'error');
    }
}

function searchByReceiptNumber(receiptNumber) {
    document.getElementById('searchInput').value = receiptNumber;
    searchByReceipt();
}

async function openStudentProfile(studentKey) {
    try {
        const response = await fetch(`/api/student-profile/${encodeURIComponent(studentKey)}`);
        const data = await response.json();
        
        if (data.success) {
            showStudentProfile(data);
        } else {
            showToast('Student not found', 'error');
        }
    } catch (error) {
        console.error('Error loading student profile:', error);
        showToast('Failed to load student profile', 'error');
    }
}

function showStudentProfile(data) {
    // Store the current student key for editing
    const studentKey = `${data.student.name}_${data.student.father_name}`;
    document.getElementById('currentProfileKey').value = studentKey;
    
    // Get first record for student ID and mobile
    const firstRecord = data.records[0] || {};
    
    // Update view mode
    document.getElementById('profileName').textContent = data.student.name;
    document.getElementById('profileStudentId').textContent = firstRecord['Student ID'] || '-';
    document.getElementById('profileFatherName').textContent = data.student.father_name || '-';
    document.getElementById('profileMobile').textContent = firstRecord['Mobile Number'] || '-';
    document.getElementById('profileTotalMonths').textContent = data.student.total_months;
    document.getElementById('profilePaidMonths').textContent = data.student.paid_months;
    document.getElementById('profileUnpaidMonths').textContent = data.student.unpaid_months;
    
    // Pre-fill edit form
    document.getElementById('editProfileOriginalName').value = data.student.name;
    document.getElementById('editProfileOriginalFather').value = data.student.father_name || '';
    document.getElementById('editProfileStudentId').value = firstRecord['Student ID'] || '';
    document.getElementById('editProfileName').value = data.student.name;
    document.getElementById('editProfileFather').value = data.student.father_name || '';
    document.getElementById('editProfileMobile').value = firstRecord['Mobile Number'] || '';
    
    // Ensure view mode is shown
    document.getElementById('profileViewMode').style.display = 'block';
    document.getElementById('profileEditMode').style.display = 'none';
    
    // Sort records by month (newest first)
    const sortedRecords = [...data.records].sort((a, b) => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        const parseMonth = (monthStr) => {
            const parts = (monthStr || '').split(' ');
            const monthIdx = monthNames.indexOf(parts[0]) || 0;
            const year = parseInt(parts[1]) || 2026;
            return year * 12 + monthIdx;
        };
        
        return parseMonth(b['Month']) - parseMonth(a['Month']);
    });
    
    // Render payment history (newest first)
    const tbody = document.getElementById('profileRecords');
    tbody.innerHTML = sortedRecords.map(record => {
        const isPaid = record['Fee Status']?.toLowerCase() === 'paid';
        const statusClass = isPaid ? 'status-paid' : 'status-unpaid';
        const statusIcon = isPaid ? '✅' : '❌';
        const statusText = isPaid ? 'Paid' : 'Not Paid';
        
        return `
            <tr>
                <td>${escapeHtml(record['Month'] || '')}</td>
                <td><span class="status-badge ${statusClass}">${statusIcon} ${statusText}</span></td>
                <td>${record['Receipt Number'] ? `<span class="receipt-number">${escapeHtml(record['Receipt Number'])}</span>` : '-'}</td>
            </tr>
        `;
    }).join('');
    
    showModal('profileModal');
}

// Toggle between profile view and edit mode
function toggleProfileEdit(showEdit) {
    document.getElementById('profileViewMode').style.display = showEdit ? 'none' : 'block';
    document.getElementById('profileEditMode').style.display = showEdit ? 'block' : 'none';
}

// Save profile edits
async function saveProfileEdit(event) {
    event.preventDefault();
    
    const originalName = document.getElementById('editProfileOriginalName').value;
    const originalFather = document.getElementById('editProfileOriginalFather').value;
    
    const updateData = {
        original_name: originalName,
        original_father: originalFather,
        student_id: document.getElementById('editProfileStudentId').value.trim(),
        student_name: document.getElementById('editProfileName').value.trim(),
        father_name: document.getElementById('editProfileFather').value.trim(),
        mobile_number: document.getElementById('editProfileMobile').value.trim()
    };
    
    if (!updateData.student_name) {
        showToast('Student name is required', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/update-student-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`Profile updated successfully! (${result.updated} records)`, 'success');
            toggleProfileEdit(false);
            
            // Reload the profile with new data
            const newStudentKey = `${updateData.student_name}_${updateData.father_name}`;
            openStudentProfile(newStudentKey);
            
            // Refresh the main student list
            loadStudents();
            loadSummary();
        } else {
            showToast(result.error || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Failed to update profile', 'error');
    }
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('monthFilter').value = '';
    document.getElementById('statusFilter').value = '';
    loadStudents();
}

// ===================================
// Modal Functions
// ===================================
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    // Reset forms
    if (modalId === 'addModal') {
        document.getElementById('addForm').reset();
        document.getElementById('receiptGroup').style.display = 'none';
        populateMonthDropdowns();
    }
    if (modalId === 'addMonthModal') {
        document.getElementById('addMonthForm').reset();
        document.getElementById('newMonthReceiptGroup').style.display = 'none';
    }
}

function toggleReceiptField() {
    const status = document.getElementById('feeStatus').value;
    const receiptGroup = document.getElementById('receiptGroup');
    receiptGroup.style.display = status === 'Paid' ? 'block' : 'none';
}

function toggleEditReceiptField() {
    const status = document.getElementById('editFeeStatus').value;
    const receiptGroup = document.getElementById('editReceiptGroup');
    receiptGroup.style.display = status === 'Paid' ? 'block' : 'none';
}

function toggleNewMonthReceiptField() {
    const status = document.getElementById('newMonthFeeStatus').value;
    const receiptGroup = document.getElementById('newMonthReceiptGroup');
    receiptGroup.style.display = status === 'Paid' ? 'block' : 'none';
}

function openAddMonthModal(studentName, fatherName, studentId, mobileNumber) {
    document.getElementById('addMonthStudentName').value = studentName;
    document.getElementById('addMonthFatherName').value = fatherName;
    document.getElementById('addMonthStudentId').value = studentId || '';
    document.getElementById('addMonthMobileNumber').value = mobileNumber || '';
    document.getElementById('addMonthStudentDisplay').textContent = studentName;
    document.getElementById('addMonthFatherDisplay').textContent = fatherName;
    
    // Initialize month tags (clear selection and render)
    selectedAddMonths.clear();
    renderMonthTags('addMonthTags');
    
    document.getElementById('newMonthFeeStatus').value = 'Not Paid';
    document.getElementById('newMonthReceiptGroup').style.display = 'none';
    document.getElementById('newMonthReceiptNumber').value = '';
    
    showModal('addMonthModal');
}

async function addMonthRecord(event) {
    event.preventDefault();
    
    // Get all selected months from the Set
    const selectedMonths = Array.from(selectedAddMonths);
    console.log('Selected months:', selectedMonths);
    console.log('selectedAddMonths Set:', selectedAddMonths);
    
    if (selectedMonths.length === 0) {
        showToast('Please select at least one month', 'error');
        return;
    }
    
    const studentId = document.getElementById('addMonthStudentId').value;
    const studentName = document.getElementById('addMonthStudentName').value;
    const fatherName = document.getElementById('addMonthFatherName').value;
    const mobileNumber = document.getElementById('addMonthMobileNumber').value;
    const feeStatus = document.getElementById('newMonthFeeStatus').value;
    const receiptNumber = document.getElementById('newMonthReceiptNumber').value;
    
    // Build records for all selected months
    const records = selectedMonths.map(month => ({
        'Student ID': studentId,
        'Student Name': studentName,
        'Father Name': fatherName,
        'Mobile Number': mobileNumber,
        'Month': month,
        'Fee Status': feeStatus,
        'Receipt Number': receiptNumber
    }));
    
    console.log('Records to add:', records);
    
    try {
        const response = await fetch('/api/bulk-add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records })
        });
        
        const result = await response.json();
        console.log('API response:', result);
        
        if (result.success) {
            const monthText = selectedMonths.length === 1 ? 'month' : 'months';
            showToast(`${result.added} ${monthText} added successfully!`, 'success');
            hideModal('addMonthModal');
            loadStudents();
            loadSummary();
        } else {
            showToast(result.error || 'Failed to add months', 'error');
        }
    } catch (error) {
        console.error('Error adding months:', error);
        showToast('Failed to add months', 'error');
    }
}

function openEditModal(studentKey, month, studentName, feeStatus, receiptNumber) {
    document.getElementById('editStudentName').value = studentKey.split('_')[0] || studentName;
    document.getElementById('editFatherName').value = studentKey.split('_')[1] || '';
    document.getElementById('editMonth').value = month;
    document.getElementById('editStudentName').textContent = studentName;
    document.getElementById('editMonthDisplay').textContent = month;
    document.getElementById('editFeeStatus').value = feeStatus?.toLowerCase() === 'paid' ? 'Paid' : 'Not Paid';
    document.getElementById('editReceiptNumber').value = receiptNumber || '';
    
    toggleEditReceiptField();
    showModal('editModal');
}

// ===================================
// CRUD Operations
// ===================================
async function addRecord(event) {
    event.preventDefault();
    
    const data = {
        student_id: document.getElementById('studentId').value,
        student_name: document.getElementById('studentName').value,
        father_name: document.getElementById('fatherName').value,
        mobile_number: document.getElementById('mobileNumber').value,
        month: document.getElementById('feeMonth').value,
        fee_status: document.getElementById('feeStatus').value,
        receipt_number: document.getElementById('receiptNumber').value
    };
    
    try {
        const response = await fetch('/api/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Record added successfully!', 'success');
            hideModal('addModal');
            loadStudents();
            loadSummary();
        } else {
            showToast(result.error || 'Failed to add record', 'error');
        }
    } catch (error) {
        console.error('Error adding record:', error);
        showToast('Failed to add record', 'error');
    }
}

async function updateRecord(event) {
    event.preventDefault();
    
    const data = {
        student_name: document.getElementById('editStudentName').value,
        father_name: document.getElementById('editFatherName').value,
        month: document.getElementById('editMonth').value,
        fee_status: document.getElementById('editFeeStatus').value,
        receipt_number: document.getElementById('editReceiptNumber').value
    };
    
    try {
        const response = await fetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Record updated successfully!', 'success');
            hideModal('editModal');
            loadStudents();
            loadSummary();
        } else {
            showToast(result.error || 'Failed to update record', 'error');
        }
    } catch (error) {
        console.error('Error updating record:', error);
        showToast('Failed to update record', 'error');
    }
}

async function deleteRecord(studentKey, month) {
    const parts = studentKey.split('_');
    const studentName = parts[0] || '';
    const fatherName = parts[1] || '';
    
    if (!confirm(`Are you sure you want to delete this record?\n\nStudent: ${studentName}\nFather: ${fatherName}\nMonth: ${month}`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_name: studentName, father_name: fatherName, month: month })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Record deleted successfully!', 'success');
            loadStudents();
            loadSummary();
        } else {
            showToast(result.error || 'Failed to delete record', 'error');
        }
    } catch (error) {
        console.error('Error deleting record:', error);
        showToast('Failed to delete record', 'error');
    }
}

// ===================================
// File Upload Functions
// ===================================
function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });
    
    uploadArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        uploadFile(files[0]);
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        uploadFile(file);
    }
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        showToast('Uploading file...', 'info');
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            hideModal('uploadModal');
            loadStudents();
            loadSummary();
        } else {
            showToast(result.error || 'Failed to upload file', 'error');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        showToast('Failed to upload file', 'error');
    }
    
    // Reset file input
    document.getElementById('fileInput').value = '';
}

// ===================================
// Download Functions
// ===================================
function toggleDownloadMenu() {
    const menu = document.getElementById('downloadMenu');
    menu.classList.toggle('show');
}

// Close download menu when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.download-dropdown');
    const menu = document.getElementById('downloadMenu');
    if (dropdown && menu && !dropdown.contains(e.target)) {
        menu.classList.remove('show');
    }
});

async function downloadExcel(filter = 'all') {
    // Close the menu
    document.getElementById('downloadMenu').classList.remove('show');
    
    try {
        const response = await fetch(`/api/download?filter=${filter}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Dynamic filename based on filter
            const filterLabel = filter === 'paid' ? '_paid' : (filter === 'unpaid' ? '_unpaid' : '');
            a.download = `student_fees${filterLabel}_${new Date().toISOString().slice(0,10)}.xlsx`;
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            const filterName = filter === 'paid' ? 'Paid records' : (filter === 'unpaid' ? 'Unpaid records' : 'All records');
            showToast(`${filterName} downloaded successfully!`, 'success');
        } else {
            const data = await response.json();
            showToast(data.error || 'No data to download', 'error');
        }
    } catch (error) {
        console.error('Error downloading file:', error);
        showToast('Failed to download file', 'error');
    }
}

// ===================================
// Utility Functions
// ===================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// Bulk Add - Tag-Based Selection (Spotify-like)
// ===================================
let allUniqueStudents = [];
let selectedStudentsSet = new Set();

// Load unique students from API
async function loadUniqueStudents() {
    try {
        const response = await fetch('/api/unique-students');
        const data = await response.json();
        if (data.success) {
            allUniqueStudents = data.students;
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// Initialize the bulk add modal
function initBulkAddModal() {
    // Initialize month tags for existing students tab
    selectedBulkMonths.clear();
    renderMonthTags('bulkMonthTags');
    
    // Populate month dropdown for new students tab
    const options = getMonthOptions();
    const singleMonthOptionsHtml = '<option value="">-- Select Month --</option>' + 
        options.map(m => `<option value="${m}">${m}</option>`).join('');
    
    const newBulkMonth = document.getElementById('newBulkMonth');
    if (newBulkMonth) newBulkMonth.innerHTML = singleMonthOptionsHtml;
    
    // Clear selections for existing students tab
    selectedStudentsSet = new Set();
    updateSelectedChips();
    updateSelectedCount();
    
    // Clear paste data for new students tab
    const pasteData = document.getElementById('pasteData');
    if (pasteData) {
        pasteData.value = '';
        updatePastePreview();
    }
    
    // Load students for autocomplete
    loadUniqueStudents();
    
    // Setup search input
    const searchInput = document.getElementById('studentSearchInput');
    const suggestions = document.getElementById('studentSuggestions');
    
    if (searchInput) {
        searchInput.value = '';
        
        searchInput.addEventListener('input', debounce(function() {
            const query = this.value.toLowerCase().trim();
            showSuggestions(query);
        }, 150));
        
        searchInput.addEventListener('focus', function() {
            const query = this.value.toLowerCase().trim();
            showSuggestions(query);
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.student-search-container')) {
                suggestions.classList.remove('show');
            }
        });
    }
    
    // Setup paste data listener
    if (pasteData) {
        pasteData.addEventListener('input', updatePastePreview);
    }
    
    // Reset to first tab
    switchBulkTab('new');
}

// Switch between tabs
function switchBulkTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.bulk-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.bulk-tab[onclick="switchBulkTab('${tabName}')"]`).classList.add('active');
    
    // Update tab contents
    document.querySelectorAll('.bulk-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'new') {
        document.getElementById('newStudentsTab').classList.add('active');
    } else {
        document.getElementById('existingStudentsTab').classList.add('active');
    }
}

// Parse pasted data and update preview
function updatePastePreview() {
    const pasteData = document.getElementById('pasteData').value.trim();
    const previewCount = document.querySelector('.preview-count');
    
    if (!pasteData) {
        previewCount.textContent = '0';
        return;
    }
    
    const students = parsePastedData(pasteData);
    previewCount.textContent = students.length;
}

// Parse pasted data (from Excel or comma-separated)
function parsePastedData(data) {
    const lines = data.split('\n').filter(line => line.trim());
    const students = [];
    
    for (const line of lines) {
        // Try tab separator first (Excel), then comma
        let parts = line.includes('\t') ? line.split('\t') : line.split(',');
        parts = parts.map(p => p.trim()).filter(p => p);
        
        // Skip header-like lines
        if (parts[0] && (parts[0].toLowerCase() === 'student name' || parts[0].toLowerCase() === 'name')) {
            continue;
        }
        
        if (parts.length >= 2) {
            students.push({
                name: parts[0],
                father: parts[1]
            });
        }
    }
    
    return students;
}

// Submit new students from pasted data
async function submitNewStudents() {
    const month = document.getElementById('newBulkMonth').value;
    const feeStatus = document.getElementById('newBulkStatus').value;
    const pasteData = document.getElementById('pasteData').value.trim();
    
    if (!month) {
        showToast('Please select a month', 'error');
        return;
    }
    
    if (!pasteData) {
        showToast('Please paste student data', 'error');
        return;
    }
    
    const students = parsePastedData(pasteData);
    
    if (students.length === 0) {
        showToast('No valid student data found. Make sure each line has Name and Father Name.', 'error');
        return;
    }
    
    // Build records
    const records = students.map(s => ({
        'Student Name': s.name,
        'Father Name': s.father,
        'Month': month,
        'Fee Status': feeStatus,
        'Receipt Number': ''
    }));
    
    try {
        const response = await fetch('/api/bulk-add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`Successfully added ${data.added} new students for ${month}!`, 'success');
            hideModal('bulkAddModal');
            loadStudents();
            loadSummary();
        } else {
            showToast(data.error || 'Failed to add students', 'error');
        }
    } catch (error) {
        console.error('Error adding students:', error);
        showToast('Failed to add students', 'error');
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Show filtered suggestions
function showSuggestions(query) {
    const suggestions = document.getElementById('studentSuggestions');
    
    // Filter students based on query
    let filtered = allUniqueStudents;
    if (query) {
        filtered = allUniqueStudents.filter(s => 
            s.name.toLowerCase().includes(query) || 
            s.father.toLowerCase().includes(query)
        );
    }
    
    if (filtered.length === 0) {
        suggestions.innerHTML = '<div class="no-suggestions">No students found</div>';
        suggestions.classList.add('show');
        return;
    }
    
    // Build suggestions HTML
    suggestions.innerHTML = filtered.slice(0, 15).map(student => {
        const key = `${student.name}_${student.father}`;
        const isSelected = selectedStudentsSet.has(key);
        const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        return `
            <div class="suggestion-item ${isSelected ? 'selected' : ''}" 
                 onclick="toggleStudent('${escapeHtml(student.name)}', '${escapeHtml(student.father)}')">
                <div class="suggestion-avatar">${initials}</div>
                <div class="suggestion-info">
                    <div class="suggestion-name">${escapeHtml(student.name)}</div>
                    <div class="suggestion-father">Father: ${escapeHtml(student.father)}</div>
                </div>
                <span class="suggestion-check">✓</span>
            </div>
        `;
    }).join('');
    
    suggestions.classList.add('show');
}

// Toggle student selection
function toggleStudent(name, father) {
    const key = `${name}_${father}`;
    
    if (selectedStudentsSet.has(key)) {
        selectedStudentsSet.delete(key);
    } else {
        selectedStudentsSet.add(key);
    }
    
    updateSelectedChips();
    updateSelectedCount();
    
    // Refresh suggestions to show updated selection state
    const query = document.getElementById('studentSearchInput').value.toLowerCase().trim();
    showSuggestions(query);
}

// Update the chips display
function updateSelectedChips() {
    const container = document.getElementById('selectedStudents');
    
    if (selectedStudentsSet.size === 0) {
        container.innerHTML = '<span style="color: #9ca3af; font-size: 0.9rem;">No students selected yet...</span>';
        return;
    }
    
    container.innerHTML = Array.from(selectedStudentsSet).map(key => {
        const [name, father] = key.split('_');
        return `
            <div class="student-chip">
                <span class="chip-name">${escapeHtml(name)}</span>
                <span class="chip-father">(${escapeHtml(father)})</span>
                <button class="chip-remove" onclick="removeStudent('${escapeHtml(name)}', '${escapeHtml(father)}')">&times;</button>
            </div>
        `;
    }).join('');
}

// Remove a student from selection
function removeStudent(name, father) {
    const key = `${name}_${father}`;
    selectedStudentsSet.delete(key);
    updateSelectedChips();
    updateSelectedCount();
    
    // Refresh suggestions if visible
    const suggestions = document.getElementById('studentSuggestions');
    if (suggestions.classList.contains('show')) {
        const query = document.getElementById('studentSearchInput').value.toLowerCase().trim();
        showSuggestions(query);
    }
}

// Update selected count
function updateSelectedCount() {
    const badge = document.querySelector('.count-badge');
    if (badge) {
        badge.textContent = selectedStudentsSet.size;
    }
}

// Select all students
function selectAllStudents() {
    allUniqueStudents.forEach(student => {
        const key = `${student.name}_${student.father}`;
        selectedStudentsSet.add(key);
    });
    updateSelectedChips();
    updateSelectedCount();
    
    const suggestions = document.getElementById('studentSuggestions');
    if (suggestions.classList.contains('show')) {
        const query = document.getElementById('studentSearchInput').value.toLowerCase().trim();
        showSuggestions(query);
    }
    
    showToast(`Selected all ${allUniqueStudents.length} students`, 'success');
}

// Clear all selected students
function clearSelectedStudents() {
    selectedStudentsSet.clear();
    updateSelectedChips();
    updateSelectedCount();
    
    const suggestions = document.getElementById('studentSuggestions');
    if (suggestions.classList.contains('show')) {
        const query = document.getElementById('studentSearchInput').value.toLowerCase().trim();
        showSuggestions(query);
    }
}

// Submit the bulk selection
async function submitBulkSelection() {
    // Get all selected months from the Set
    const selectedMonths = Array.from(selectedBulkMonths);
    const feeStatus = document.getElementById('bulkFeeStatus').value;
    
    if (selectedMonths.length === 0) {
        showToast('Please select at least one month', 'error');
        return;
    }
    
    if (selectedStudentsSet.size === 0) {
        showToast('Please select at least one student', 'error');
        return;
    }
    
    // Build records - for each student x each month combination
    const records = [];
    Array.from(selectedStudentsSet).forEach(key => {
        const [name, father] = key.split('_');
        
        // Find full student info from loaded list
        const studentInfo = allUniqueStudents.find(s => 
            s.name === name && s.father === father
        ) || {};
        
        // Add a record for each selected month
        selectedMonths.forEach(month => {
            records.push({
                'Student ID': studentInfo.student_id || '',
                'Student Name': name,
                'Father Name': father,
                'Mobile Number': studentInfo.mobile || '',
                'Month': month,
                'Fee Status': feeStatus,
                'Receipt Number': ''
            });
        });
    });
    
    try {
        const response = await fetch('/api/bulk-add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const monthText = selectedMonths.length === 1 ? selectedMonths[0] : `${selectedMonths.length} months`;
            showToast(`Successfully added ${data.added} records for ${monthText}!`, 'success');
            hideModal('bulkAddModal');
            loadStudents();
            loadSummary();
        } else {
            showToast(data.error || 'Failed to add records', 'error');
        }
    } catch (error) {
        console.error('Error adding bulk data:', error);
        showToast('Failed to add records', 'error');
    }
}

// Update hideModal to handle bulk add modal
const originalHideModal = hideModal;
hideModal = function(modalId) {
    if (modalId === 'bulkAddModal') {
        selectedStudentsSet.clear();
        document.getElementById('studentSearchInput').value = '';
        document.getElementById('studentSuggestions').classList.remove('show');
    }
    originalHideModal(modalId);
};

// Update showModal to init bulk add
const originalShowModal = showModal;
showModal = function(modalId) {
    if (modalId === 'bulkAddModal') {
        initBulkAddModal();
    }
    originalShowModal(modalId);
};