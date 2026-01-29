"""
Generate sample Excel data for Student Fee Management System
Run this script once to create sample data.
"""

import pandas as pd
import os

# Sample data - 10 students with multiple months
data = [
    # Student 1 - Aarav Patel
    {"Student Name": "Aarav Patel", "Student ID": "VK001", "Father Name": "Rajesh Patel", "Month": "January 2026", "Fee Status": "Paid", "Receipt Number": "RCP-001-JAN26"},
    {"Student Name": "Aarav Patel", "Student ID": "VK001", "Father Name": "Rajesh Patel", "Month": "December 2025", "Fee Status": "Paid", "Receipt Number": "RCP-001-DEC25"},
    
    # Student 2 - Priya Sharma
    {"Student Name": "Priya Sharma", "Student ID": "VK002", "Father Name": "Suresh Sharma", "Month": "January 2026", "Fee Status": "Not Paid", "Receipt Number": ""},
    {"Student Name": "Priya Sharma", "Student ID": "VK002", "Father Name": "Suresh Sharma", "Month": "December 2025", "Fee Status": "Paid", "Receipt Number": "RCP-002-DEC25"},
    
    # Student 3 - Rohan Gupta
    {"Student Name": "Rohan Gupta", "Student ID": "VK003", "Father Name": "Anil Gupta", "Month": "January 2026", "Fee Status": "Paid", "Receipt Number": "RCP-003-JAN26"},
    {"Student Name": "Rohan Gupta", "Student ID": "VK003", "Father Name": "Anil Gupta", "Month": "December 2025", "Fee Status": "Paid", "Receipt Number": "RCP-003-DEC25"},
    
    # Student 4 - Sneha Verma
    {"Student Name": "Sneha Verma", "Student ID": "VK004", "Father Name": "Prakash Verma", "Month": "January 2026", "Fee Status": "Not Paid", "Receipt Number": ""},
    {"Student Name": "Sneha Verma", "Student ID": "VK004", "Father Name": "Prakash Verma", "Month": "December 2025", "Fee Status": "Not Paid", "Receipt Number": ""},
    
    # Student 5 - Amit Singh
    {"Student Name": "Amit Singh", "Student ID": "VK005", "Father Name": "Vikram Singh", "Month": "January 2026", "Fee Status": "Paid", "Receipt Number": "RCP-005-JAN26"},
    {"Student Name": "Amit Singh", "Student ID": "VK005", "Father Name": "Vikram Singh", "Month": "December 2025", "Fee Status": "Paid", "Receipt Number": "RCP-005-DEC25"},
    
    # Student 6 - Kavya Mishra
    {"Student Name": "Kavya Mishra", "Student ID": "VK006", "Father Name": "Deepak Mishra", "Month": "January 2026", "Fee Status": "Paid", "Receipt Number": "RCP-006-JAN26"},
    {"Student Name": "Kavya Mishra", "Student ID": "VK006", "Father Name": "Deepak Mishra", "Month": "December 2025", "Fee Status": "Paid", "Receipt Number": "RCP-006-DEC25"},
    
    # Student 7 - Arjun Kumar
    {"Student Name": "Arjun Kumar", "Student ID": "VK007", "Father Name": "Ramesh Kumar", "Month": "January 2026", "Fee Status": "Not Paid", "Receipt Number": ""},
    {"Student Name": "Arjun Kumar", "Student ID": "VK007", "Father Name": "Ramesh Kumar", "Month": "December 2025", "Fee Status": "Paid", "Receipt Number": "RCP-007-DEC25"},
    
    # Student 8 - Ananya Joshi
    {"Student Name": "Ananya Joshi", "Student ID": "VK008", "Father Name": "Sanjay Joshi", "Month": "January 2026", "Fee Status": "Paid", "Receipt Number": "RCP-008-JAN26"},
    {"Student Name": "Ananya Joshi", "Student ID": "VK008", "Father Name": "Sanjay Joshi", "Month": "December 2025", "Fee Status": "Paid", "Receipt Number": "RCP-008-DEC25"},
    
    # Student 9 - Rahul Sharma (Same name as Priya's family - different father)
    {"Student Name": "Rahul Sharma", "Student ID": "VK009", "Father Name": "Mohan Sharma", "Month": "January 2026", "Fee Status": "Paid", "Receipt Number": "RCP-009-JAN26"},
    {"Student Name": "Rahul Sharma", "Student ID": "VK009", "Father Name": "Mohan Sharma", "Month": "December 2025", "Fee Status": "Not Paid", "Receipt Number": ""},
    
    # Student 10 - Meera Agarwal
    {"Student Name": "Meera Agarwal", "Student ID": "VK010", "Father Name": "Vinod Agarwal", "Month": "January 2026", "Fee Status": "Not Paid", "Receipt Number": ""},
    {"Student Name": "Meera Agarwal", "Student ID": "VK010", "Father Name": "Vinod Agarwal", "Month": "December 2025", "Fee Status": "Paid", "Receipt Number": "RCP-010-DEC25"},
]

# Create data folder if it doesn't exist
os.makedirs('data', exist_ok=True)

# Create DataFrame and save to Excel
df = pd.DataFrame(data)
df.to_excel('data/students.xlsx', index=False)

print("✅ Sample data created successfully!")
print(f"📁 File saved: data/students.xlsx")
print(f"👥 Total students: 10")
print(f"📊 Total records: {len(data)}")
print(f"   ✅ Paid: {sum(1 for d in data if d['Fee Status'] == 'Paid')}")
print(f"   ❌ Not Paid: {sum(1 for d in data if d['Fee Status'] == 'Not Paid')}")
