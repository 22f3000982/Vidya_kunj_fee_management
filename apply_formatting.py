import gspread
from gspread_formatting import *

gc = gspread.service_account(filename='credentials.json')
spreadsheet = gc.open_by_key('19F9qbeUSWyia-oWQbIWonJccytEUArW0ZrZ7kgmB0jc')
sheet = spreadsheet.sheet1

# Update headers to include Student ID and Mobile Number
# First, let's update the header row
sheet.update('A1:G1', [['Student ID', 'Student Name', 'Father Name', 'Mobile Number', 'Month', 'Fee Status', 'Receipt Number']])

# Define ranges - now columns A to G
bg_range_ab = 'A2:D1000'  # ID, Name, Father, Mobile - black text only
text_range = 'E2:G1000'   # Month, Fee Status, Receipt - colored text

# Background only for Name columns (A-D) - Not Paid
unpaid_bg_rule = ConditionalFormatRule(
    ranges=[GridRange.from_a1_range(bg_range_ab, sheet)],
    booleanRule=BooleanRule(
        condition=BooleanCondition('CUSTOM_FORMULA', ['=$F2="Not Paid"']),
        format=CellFormat(
            backgroundColor=Color(1, 0.85, 0.85)  # Light red background only
        )
    )
)

# Background only for Name columns (A-D) - Paid
paid_bg_rule = ConditionalFormatRule(
    ranges=[GridRange.from_a1_range(bg_range_ab, sheet)],
    booleanRule=BooleanRule(
        condition=BooleanCondition('CUSTOM_FORMULA', ['=$F2="Paid"']),
        format=CellFormat(
            backgroundColor=Color(0.85, 0.95, 0.85)  # Light green background only
        )
    )
)

# Red background + Red text for Not Paid (columns E-G)
unpaid_rule = ConditionalFormatRule(
    ranges=[GridRange.from_a1_range(text_range, sheet)],
    booleanRule=BooleanRule(
        condition=BooleanCondition('CUSTOM_FORMULA', ['=$F2="Not Paid"']),
        format=CellFormat(
            backgroundColor=Color(1, 0.85, 0.85),  # Light red background
            textFormat=TextFormat(foregroundColor=Color(0.8, 0, 0), bold=True)  # Dark red text
        )
    )
)

# Green background + Green text for Paid (columns E-G)
paid_rule = ConditionalFormatRule(
    ranges=[GridRange.from_a1_range(text_range, sheet)],
    booleanRule=BooleanRule(
        condition=BooleanCondition('CUSTOM_FORMULA', ['=$F2="Paid"']),
        format=CellFormat(
            backgroundColor=Color(0.85, 0.95, 0.85),  # Light green background
            textFormat=TextFormat(foregroundColor=Color(0, 0.5, 0), bold=False)  # Dark green text
        )
    )
)

# Clear existing rules and add new ones
rules = get_conditional_format_rules(sheet)
rules.clear()
rules.append(unpaid_bg_rule)   # Name columns - red bg only
rules.append(paid_bg_rule)     # Name columns - green bg only
rules.append(unpaid_rule)      # Other columns - red bg + red text
rules.append(paid_rule)        # Other columns - green bg + green text
rules.save()

print('✅ Conditional formatting applied to Google Sheet!')
print('   - Student Name & Father Name: Black text (background only)')
print('   - Month, Fee Status, Receipt: Colored text')
print('   - Paid rows: Light Green')
print('   - Not Paid rows: Light Red')
