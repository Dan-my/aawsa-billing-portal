
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Data Entry

The application supports data entry through manual forms and CSV file uploads for both bulk meters and individual customers. This can be accessed via the "Data Entry" section in the admin panel.

### Manual Data Entry
- Go to Admin Panel -> Data Entry.
- Select the "Individual (Manual)" or "Bulk Meter (Manual)" tab.
- Fill in the respective forms to add single records.

### CSV Upload for Data Entry

- Go to Admin Panel -> Data Entry.
- Select the "CSV Upload" tab.
- Choose the appropriate section for "Bulk Meter CSV Upload" or "Individual Customer CSV Upload".
- Click "Choose File", select your CSV, and then click "Upload".

**Important Notes for CSV Files:**
- The first row of your CSV file **must** be a header row with column names matching the specifications below.
- Column order must also match the specifications.
- Values should not be enclosed in quotes unless they contain a comma. If values are quoted, ensure they are standard double quotes.
- Dates (e.g., `month`) should be in `YYYY-MM` format (e.g., `2023-12`).
- Numerical fields (e.g., `meterSize`, `previousReading`, `currentReading`, `ordinal`) should contain valid numbers.
- Boolean-like fields (e.g., `sewerageConnection`) should use `Yes` or `No`.
- For `customerType`, use `Domestic` or `Non-domestic`.
- `assignedBulkMeterId` for individual customers must correspond to an **existing Bulk Meter ID** in the system. You may need to upload bulk meters first.

#### Bulk Meter CSV Columns
The CSV file for bulk meter data entry must have the following columns in this specific order:
1.  `name` (Text, e.g., Kality Industrial Zone Meter 1)
2.  `customerKeyNumber` (Text, e.g., BULKCUST001)
3.  `contractNumber` (Text, e.g., BULKCONTR001)
4.  `meterSize` (Number, e.g., 2.5 for 2.5 inches)
5.  `meterNumber` (Text, e.g., BULKMTR789)
6.  `previousReading` (Number, e.g., 1000.00)
7.  `currentReading` (Number, e.g., 1500.50)
8.  `month` (Text, format YYYY-MM, e.g., 2023-11)
9.  `specificArea` (Text, e.g., Kality Zone 1, Block A)
10. `location` (Text, e.g., Kality Sub-City)
11. `ward` (Text, e.g., Woreda 05)

**Example Bulk Meter CSV Row (after header):**
`Kality Main Feeder,BMK001,BMCK001,3,MTR-BM-K001,10000,10500,2023-11,Industrial Zone A,Kality,Woreda 5`

#### Individual Customer CSV Columns
The CSV file for individual customer data entry must have the following columns in this specific order:
1.  `name` (Text, e.g., John Doe)
2.  `customerKeyNumber` (Text, e.g., CUST12345)
3.  `contractNumber` (Text, e.g., CONTR67890)
4.  `customerType` (Text, either `Domestic` or `Non-domestic`)
5.  `bookNumber` (Text, e.g., BK001)
6.  `ordinal` (Number, e.g., 1)
7.  `meterSize` (Number, e.g., 0.5 for 0.5 inches)
8.  `meterNumber` (Text, e.g., MTR123XYZ)
9.  `previousReading` (Number, e.g., 100.00)
10. `currentReading` (Number, e.g., 120.50)
11. `month` (Text, format YYYY-MM, e.g., 2023-11)
12. `specificArea` (Text, e.g., Kebele 05, House No 123)
13. `location` (Text, e.g., Bole Sub-City)
14. `ward` (Text, e.g., Woreda 03)
15. `sewerageConnection` (Text, either `Yes` or `No`)
16. `assignedBulkMeterId` (Text, ID of an existing bulk meter, e.g., bm001)

**Example Individual Customer CSV Row (after header):**
`Jane Smith,CUST54321,CONTR09876,Domestic,BK002,1,0.75,MTRXYZ789,50,75,2023-11,Kebele 10, House 456,Arada,Woreda 1,Yes,bm002`

Processing feedback, including any errors per row, will be displayed after attempting to upload the CSV file.
