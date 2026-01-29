"""
Student Fee Management System - Vercel Serverless API
A Flask application to manage student fee records using Google Sheets as database.
"""

from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
import pandas as pd
import os
from datetime import datetime
from io import BytesIO
import json
import gspread
from google.oauth2.service_account import Credentials

app = Flask(__name__, template_folder='../templates', static_folder='../static')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Configuration - Use environment variables for Vercel
SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID', '19F9qbeUSWyia-oWQbIWonJccytEUArW0ZrZ7kgmB0jc')

# Google Sheets connection
gc = None
sheet = None

def get_google_credentials():
    """Get Google credentials from environment variable"""
    creds_json = os.environ.get('GOOGLE_CREDENTIALS')
    if creds_json:
        try:
            creds_dict = json.loads(creds_json)
            scopes = [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]
            credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
            return credentials
        except Exception as e:
            print(f"Error parsing credentials: {e}")
            return None
    print("GOOGLE_CREDENTIALS environment variable not found")
    return None

def get_google_sheet():
    """Connect to Google Sheet and return the worksheet"""
    global gc, sheet
    try:
        if gc is None:
            credentials = get_google_credentials()
            if credentials:
                gc = gspread.authorize(credentials)
                print("Connected to Google Sheets via environment credentials")
            else:
                # Fallback to local credentials file for development
                try:
                    gc = gspread.service_account(filename='credentials.json')
                    print("Connected to Google Sheets via local credentials file")
                except Exception as e:
                    print(f"Failed to load local credentials: {e}")
                    return None
        if sheet is None:
            spreadsheet = gc.open_by_key(SPREADSHEET_ID)
            sheet = spreadsheet.sheet1
            print(f"Opened spreadsheet with ID: {SPREADSHEET_ID}")
        return sheet
    except Exception as e:
        print(f"Error connecting to Google Sheets: {e}")
        return None


def read_sheet_data():
    """Read student data from Google Sheet"""
    try:
        worksheet = get_google_sheet()
        if worksheet is None:
            return []
        
        all_values = worksheet.get_all_values()
        if len(all_values) <= 1:
            return []
        
        headers = all_values[0]
        records = []
        for row in all_values[1:]:
            record = {}
            for i, header in enumerate(headers):
                record[header] = row[i] if i < len(row) else ''
            records.append(record)
        
        return records
    except Exception as e:
        print(f"Error reading data: {e}")
        return []


def save_sheet_data(records):
    """Save student data to Google Sheet"""
    try:
        worksheet = get_google_sheet()
        if worksheet is None:
            return False
        
        # Clear existing data
        worksheet.clear()
        
        # Write headers
        headers = ['Student ID', 'Student Name', 'Father Name', 'Mobile Number', 'Month', 'Fee Status', 'Receipt Number']
        worksheet.append_row(headers)
        
        # Write data rows
        for record in records:
            row = [
                str(record.get('Student ID', '')),
                str(record.get('Student Name', '')),
                str(record.get('Father Name', '')),
                str(record.get('Mobile Number', '')),
                str(record.get('Month', '')),
                str(record.get('Fee Status', '')),
                str(record.get('Receipt Number', ''))
            ]
            worksheet.append_row(row)
        
        # Apply conditional formatting
        try:
            apply_conditional_formatting(worksheet)
        except:
            pass
        
        return True
    except Exception as e:
        print(f"Error saving data: {e}")
        return False


def apply_conditional_formatting(worksheet):
    """Apply conditional formatting for fee status"""
    try:
        from gspread_formatting import ConditionalFormatRule, BooleanRule, BooleanCondition, CellFormat, Color, GridRange, get_conditional_format_rules, set_conditional_format_rules
        
        # Clear existing rules
        rules = get_conditional_format_rules(worksheet)
        rules.clear()
        
        # Get the range for the entire data area
        all_values = worksheet.get_all_values()
        num_rows = len(all_values)
        
        if num_rows > 1:
            # Green for "Paid"
            paid_rule = ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(f'A2:G{num_rows}', worksheet)],
                booleanRule=BooleanRule(
                    condition=BooleanCondition('CUSTOM_FORMULA', [f'=$F2="Paid"']),
                    format=CellFormat(backgroundColor=Color(0.85, 0.95, 0.85))
                )
            )
            
            # Red for "Not Paid"
            not_paid_rule = ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(f'A2:G{num_rows}', worksheet)],
                booleanRule=BooleanRule(
                    condition=BooleanCondition('CUSTOM_FORMULA', [f'=$F2="Not Paid"']),
                    format=CellFormat(backgroundColor=Color(1.0, 0.85, 0.85))
                )
            )
            
            rules.append(paid_rule)
            rules.append(not_paid_rule)
            set_conditional_format_rules(worksheet, rules)
    except Exception as e:
        print(f"Error applying formatting: {e}")


# ===================================
# Routes
# ===================================

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/students', methods=['GET'])
def get_students():
    """Get all student records with optional filtering"""
    records = read_sheet_data()
    
    # Apply filters
    search = request.args.get('search', '').lower().strip()
    month_filter = request.args.get('month', '').strip()
    status_filter = request.args.get('status', '').strip()
    
    filtered = records
    
    if search:
        filtered = [r for r in filtered if 
            search in str(r.get('Student Name', '')).lower() or
            search in str(r.get('Father Name', '')).lower() or
            search in str(r.get('Student ID', '')).lower() or
            search in str(r.get('Mobile Number', '')).lower() or
            search in str(r.get('Receipt Number', '')).lower()]
    
    if month_filter:
        filtered = [r for r in filtered if r.get('Month', '') == month_filter]
    
    if status_filter:
        filtered = [r for r in filtered if r.get('Fee Status', '').lower() == status_filter.lower()]
    
    return jsonify({
        'success': True,
        'data': filtered,
        'total': len(filtered)
    })


@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Get fee collection summary statistics"""
    records = read_sheet_data()
    
    total_records = len(records)
    paid_count = sum(1 for r in records if str(r.get('Fee Status', '')).lower() == 'paid')
    unpaid_count = total_records - paid_count
    
    # Get unique students
    unique_students = set()
    unique_months = set()
    for r in records:
        key = f"{r.get('Student Name', '')}_{r.get('Father Name', '')}"
        unique_students.add(key)
        month = r.get('Month', '')
        if month:
            unique_months.add(month)
    
    # Sort months
    month_order = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    
    def month_sort_key(m):
        parts = m.split(' ')
        month_name = parts[0] if parts else ''
        year = int(parts[1]) if len(parts) > 1 else 2026
        month_idx = month_order.index(month_name) if month_name in month_order else 0
        return (year, month_idx)
    
    sorted_months = sorted(unique_months, key=month_sort_key)
    
    return jsonify({
        'success': True,
        'summary': {
            'total': total_records,
            'total_students': len(unique_students),
            'paid': paid_count,
            'unpaid': unpaid_count,
            'months': sorted_months
        }
    })


@app.route('/api/add', methods=['POST'])
def add_record():
    """Add a new student fee record"""
    data = request.json
    
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    student_id = data.get('student_id', '').strip()
    student_name = data.get('student_name', '').strip()
    father_name = data.get('father_name', '').strip()
    mobile_number = data.get('mobile_number', '').strip()
    month = data.get('month', '').strip()
    fee_status = data.get('fee_status', 'Not Paid').strip()
    receipt_number = data.get('receipt_number', '').strip()
    
    if not all([student_name, month]):
        return jsonify({'success': False, 'error': 'Student name and month are required'}), 400
    
    records = read_sheet_data()
    
    # Check for duplicate
    for r in records:
        if (str(r.get('Student Name', '')) == student_name and 
            str(r.get('Father Name', '')) == father_name and 
            str(r.get('Month', '')).lower() == month.lower()):
            return jsonify({'success': False, 'error': 'Record already exists for this student and month'}), 400
    
    # Add new record
    new_record = {
        'Student ID': student_id,
        'Student Name': student_name,
        'Father Name': father_name,
        'Mobile Number': mobile_number,
        'Month': month,
        'Fee Status': fee_status,
        'Receipt Number': receipt_number
    }
    
    records.append(new_record)
    
    if save_sheet_data(records):
        return jsonify({'success': True, 'message': 'Record added successfully'})
    else:
        return jsonify({'success': False, 'error': 'Failed to save record'}), 500


@app.route('/api/update', methods=['POST'])
def update_record():
    """Update an existing student fee record"""
    data = request.json
    
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    student_name = data.get('student_name', '').strip()
    father_name = data.get('father_name', '').strip()
    month = data.get('month', '').strip()
    fee_status = data.get('fee_status', '').strip()
    receipt_number = data.get('receipt_number', '').strip()
    
    if not all([student_name, month]):
        return jsonify({'success': False, 'error': 'Student name and month are required'}), 400
    
    records = read_sheet_data()
    
    found = False
    for r in records:
        if (str(r.get('Student Name', '')) == student_name and 
            str(r.get('Father Name', '')) == father_name and 
            str(r.get('Month', '')) == month):
            r['Fee Status'] = fee_status
            r['Receipt Number'] = receipt_number
            found = True
            break
    
    if not found:
        return jsonify({'success': False, 'error': 'Record not found'}), 404
    
    if save_sheet_data(records):
        return jsonify({'success': True, 'message': 'Record updated successfully'})
    else:
        return jsonify({'success': False, 'error': 'Failed to update record'}), 500


@app.route('/api/delete', methods=['POST'])
def delete_record():
    """Delete a student fee record"""
    data = request.json
    
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    student_name = data.get('student_name', '').strip()
    father_name = data.get('father_name', '').strip()
    month = data.get('month', '').strip()
    
    if not all([student_name, month]):
        return jsonify({'success': False, 'error': 'Student name and month are required'}), 400
    
    records = read_sheet_data()
    
    original_count = len(records)
    records = [r for r in records if not (
        str(r.get('Student Name', '')) == student_name and 
        str(r.get('Father Name', '')) == father_name and 
        str(r.get('Month', '')) == month
    )]
    
    if len(records) == original_count:
        return jsonify({'success': False, 'error': 'Record not found'}), 404
    
    if save_sheet_data(records):
        return jsonify({'success': True, 'message': 'Record deleted successfully'})
    else:
        return jsonify({'success': False, 'error': 'Failed to delete record'}), 500


@app.route('/api/bulk-add', methods=['POST'])
def bulk_add_records():
    """Add multiple student fee records at once"""
    data = request.json
    
    if not data or 'records' not in data:
        return jsonify({'success': False, 'error': 'No records provided'}), 400
    
    new_records = data['records']
    
    if not new_records or len(new_records) == 0:
        return jsonify({'success': False, 'error': 'Empty records list'}), 400
    
    existing_records = read_sheet_data()
    
    # Build lookup sets for duplicate checking
    existing_student_months = set()
    existing_receipts = set()
    
    for record in existing_records:
        key = f"{record.get('Student Name', '')}_{record.get('Father Name', '')}_{record.get('Month', '').lower()}"
        existing_student_months.add(key)
        receipt = str(record.get('Receipt Number', '')).lower().strip()
        if receipt:
            existing_receipts.add(receipt)
    
    added_count = 0
    skipped_count = 0
    
    for rec in new_records:
        student_id = rec.get('Student ID', '').strip()
        student_name = rec.get('Student Name', '').strip()
        father_name = rec.get('Father Name', '').strip()
        mobile_number = rec.get('Mobile Number', '').strip()
        month = rec.get('Month', '').strip()
        fee_status = rec.get('Fee Status', 'Not Paid').strip()
        receipt_number = rec.get('Receipt Number', '').strip()
        
        if not all([student_name, month]):
            skipped_count += 1
            continue
        
        # Check for duplicate student+month
        key = f"{student_name}_{father_name}_{month.lower()}"
        if key in existing_student_months:
            skipped_count += 1
            continue
        
        # Add the record
        new_record = {
            'Student ID': student_id,
            'Student Name': student_name,
            'Father Name': father_name,
            'Mobile Number': mobile_number,
            'Month': month,
            'Fee Status': fee_status,
            'Receipt Number': receipt_number
        }
        
        existing_records.append(new_record)
        existing_student_months.add(key)
        added_count += 1
    
    if added_count > 0:
        if save_sheet_data(existing_records):
            return jsonify({
                'success': True,
                'added': added_count,
                'skipped': skipped_count,
                'message': f'Added {added_count} records successfully!'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to save records'}), 500
    else:
        return jsonify({
            'success': True,
            'added': 0,
            'skipped': skipped_count,
            'message': 'No new records were added (all duplicates)'
        })


@app.route('/api/unique-students', methods=['GET'])
def get_unique_students():
    """Get list of unique students for bulk add feature"""
    records = read_sheet_data()
    
    unique_students = {}
    for r in records:
        key = f"{r.get('Student Name', '')}_{r.get('Father Name', '')}"
        if key not in unique_students:
            unique_students[key] = {
                'name': r.get('Student Name', ''),
                'father': r.get('Father Name', ''),
                'student_id': r.get('Student ID', ''),
                'mobile': r.get('Mobile Number', '')
            }
    
    return jsonify({
        'success': True,
        'students': list(unique_students.values())
    })


@app.route('/api/student-profile/<path:student_key>', methods=['GET'])
def get_student_profile(student_key):
    """Get complete student profile with all payment records"""
    records = read_sheet_data()
    
    parts = student_key.split('_')
    student_name = parts[0] if len(parts) > 0 else ''
    father_name = parts[1] if len(parts) > 1 else ''
    
    student_records = [r for r in records if 
        str(r.get('Student Name', '')) == str(student_name) and
        str(r.get('Father Name', '')) == str(father_name)]
    
    if not student_records:
        return jsonify({'success': False, 'error': 'Student not found'}), 404
    
    first_record = student_records[0]
    total_months = len(student_records)
    paid_months = sum(1 for r in student_records if str(r.get('Fee Status', '')).lower() == 'paid')
    
    return jsonify({
        'success': True,
        'student': {
            'name': first_record.get('Student Name', ''),
            'father_name': first_record.get('Father Name', ''),
            'total_months': total_months,
            'paid_months': paid_months,
            'unpaid_months': total_months - paid_months
        },
        'records': student_records
    })


@app.route('/api/update-student-profile', methods=['POST'])
def update_student_profile():
    """Update student profile info across all their records"""
    data = request.json
    
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    original_name = data.get('original_name', '').strip()
    original_father = data.get('original_father', '').strip()
    new_student_id = data.get('student_id', '').strip()
    new_name = data.get('student_name', '').strip()
    new_father = data.get('father_name', '').strip()
    new_mobile = data.get('mobile_number', '').strip()
    
    if not new_name:
        return jsonify({'success': False, 'error': 'Student name is required'}), 400
    
    records = read_sheet_data()
    updated_count = 0
    
    for record in records:
        if (str(record.get('Student Name', '')) == original_name and 
            str(record.get('Father Name', '')) == original_father):
            record['Student ID'] = new_student_id
            record['Student Name'] = new_name
            record['Father Name'] = new_father
            record['Mobile Number'] = new_mobile
            updated_count += 1
    
    if updated_count == 0:
        return jsonify({'success': False, 'error': 'No records found for this student'}), 404
    
    if save_sheet_data(records):
        return jsonify({
            'success': True,
            'updated': updated_count,
            'message': f'Updated {updated_count} records'
        })
    else:
        return jsonify({'success': False, 'error': 'Failed to save changes'}), 500


@app.route('/api/download', methods=['GET'])
def download_data():
    """Download student data as Excel file"""
    filter_type = request.args.get('filter', 'all')
    
    records = read_sheet_data()
    
    if filter_type == 'paid':
        records = [r for r in records if str(r.get('Fee Status', '')).lower() == 'paid']
    elif filter_type == 'unpaid':
        records = [r for r in records if str(r.get('Fee Status', '')).lower() != 'paid']
    
    if not records:
        return jsonify({'success': False, 'error': 'No records to download'}), 404
    
    df = pd.DataFrame(records)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Fee Records')
    
    output.seek(0)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'fee_records_{filter_type}_{timestamp}.xlsx'
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )


@app.route('/api/debug', methods=['GET'])
def debug_info():
    """Debug endpoint to check configuration"""
    has_creds = os.environ.get('GOOGLE_CREDENTIALS') is not None
    sheet_id = os.environ.get('SPREADSHEET_ID', SPREADSHEET_ID)
    
    # Try to connect
    connection_status = "Not attempted"
    record_count = 0
    error_msg = None
    
    try:
        worksheet = get_google_sheet()
        if worksheet:
            connection_status = "Connected"
            all_values = worksheet.get_all_values()
            record_count = max(0, len(all_values) - 1)
        else:
            connection_status = "Failed - worksheet is None"
    except Exception as e:
        connection_status = "Failed"
        error_msg = str(e)
    
    return jsonify({
        'has_google_credentials': has_creds,
        'spreadsheet_id': sheet_id,
        'connection_status': connection_status,
        'record_count': record_count,
        'error': error_msg
    })


# For Vercel
app.debug = False
