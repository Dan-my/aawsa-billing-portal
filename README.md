

The application supports data entry through manual forms and CSV file uploads for both bulk meters and individual customers. This can be accessed via the "Data Entry" section in the admin panel.

### Manual Data Entry
- Go to Admin Panel -> Data Entry.
- Select the "Individual (Manual)" or "Bulk Meter (Manual)" tab.
- Fill in the respective forms to add single records.

### CSV File Specifications & Upload

For CSV uploads, go to Admin Panel -> Data Entry and select the "CSV Upload" tab. Choose the appropriate section for "Bulk Meter CSV Upload" or "Individual Customer CSV Upload".

**Important Notes for CSV Files:**
- The first row of your CSV file **must** be a header row with column names exactly matching the specifications below.
- Column order must also match the specifications.
- Values should not be enclosed in quotes unless they contain a comma. If values are quoted, ensure they are standard double quotes.
- Dates (e.g., `month`) should be in `YYYY-MM` format (e.g., `2023-12`).
- Numerical fields (e.g., `meterSize`, `previousReading`, `currentReading`, `ordinal`) should contain valid numbers without currency symbols or thousands separators.
- `customerKeyNumber` must be a **unique identifier** for the record.
- `branchId` must correspond to an **existing Branch ID** in the system. This field can be left blank if not assigning to a specific branch.
- For Individual Customers:
    - `assignedBulkMeterId`: **This is a critical field.** The value in this column **must** be the `customerKeyNumber` of an existing bulk meter in the system. You may need to upload your bulk meters first to get their `customerKeyNumber` values. This field can be left blank if the customer is not assigned to a bulk meter.
    - `customerType` must be one of "Domestic" or "Non-domestic".
    - `sewerageConnection` must be one of "Yes" or "No".

#### Bulk Meter CSV Columns (Template)
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
12. `branchId` (Text, ID of an existing branch, or blank)

**Example Bulk Meter CSV Row (after header):**
`Kality Main Feeder,BMK001,BMCK001,3,MTR-BM-K001,10000,10500,2023-11,"Industrial Zone A",Kality,"Woreda 5",1`

#### Individual Customer CSV Columns (Template)
The CSV file for individual customer data entry must have the following columns in this specific order:
1.  `name` (Text, e.g., John Doe)
2.  `customerKeyNumber` (Text, e.g., CUST001)
3.  `contractNumber` (Text, e.g., CONTR001)
4.  `customerType` (Text, "Domestic" or "Non-domestic")
5.  `bookNumber` (Text, e.g., B001)
6.  `ordinal` (Number, e.g., 1)
7.  `meterSize` (Number, e.g., 0.75 for 0.75 inches)
8.  `meterNumber` (Text, e.g., MTR001)
9.  `previousReading` (Number, e.g., 100.00)
10. `currentReading` (Number, e.g., 120.50)
11. `month` (Text, format YYYY-MM, e.g., 2023-11)
12. `specificArea` (Text, e.g., Kebele 01)
13. `location` (Text, e.g., Bole Sub-City)
14. `ward` (Text, e.g., Woreda 03)
15. `sewerageConnection` (Text, "Yes" or "No")
16. `assignedBulkMeterId` (Text, **Important:** Use the 'customerKeyNumber' of an existing bulk meter here. e.g., BMK001. Leave blank if not assigned.)
17. `branchId` (Text, ID of an existing branch, or blank)

**Example Individual Customer CSV Row (after header):**
`Jane Smith,CUST002,CONTR002,Domestic,B002,1,0.75,MTR002,120,150,2023-11,"Kebele 02",Arada,"Woreda 1",No,BMK001,2`

Processing feedback, including any errors per row, will be displayed after attempting to upload the CSV file.

## Deployment

This Next.js application is ready for deployment to various platforms that support Node.js and the Next.js framework.

### **Prerequisites for all platforms:**
*   **GitHub Repository:** Your code must be pushed to a GitHub repository.
*   **Supabase Keys:** You will need your Supabase **Project URL** and **Anon Key**.

---

### **Option 1: Vercel (Recommended)**
Vercel is the creator of Next.js and provides a seamless, zero-configuration deployment experience.

1.  **Sign Up:** Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.
2.  **Import Project:** On your Vercel dashboard, click "Add New..." -> "Project". Find your GitHub repository and click "Import".
3.  **Configure Environment Variables:**
    *   Expand the "Environment Variables" section.
    *   Add the following two variables:
        *   **Name:** `NEXT_PUBLIC_SUPABASE_URL`, **Value:** Your Supabase project URL.
        *   **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`, **Value:** Your Supabase `anon` (public) key.
4.  **Deploy:** Click the "Deploy" button. Vercel will handle the rest. Your site will be live in a few minutes.

---

### **Option 2: Netlify**
Netlify is another popular platform with excellent support for Next.js.

1.  **Sign Up:** Go to [netlify.com](https://app.netlify.com/signup) and sign up with your GitHub account.
2.  **Import Project:** From your dashboard, click "Add new site" -> "Import an existing project". Choose GitHub, authorize access, and select your repository.
3.  **Configure Build Settings & Environment Variables:**
    *   Netlify will detect that it's a Next.js project and pre-fill the build command (`next build`) and publish directory (`.next`). You can leave these as defaults.
    *   Before deploying, go to "Site settings" -> "Build & deploy" -> "Environment".
    *   Add the same two environment variables as for Vercel:
        *   `NEXT_PUBLIC_SUPABASE_URL`
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4.  **Deploy:** Go to the "Deploys" tab for your new site and trigger a deploy. Netlify will build and deploy your application.

---

### **Option 3: Firebase Hosting**
Since you are using Firebase Studio, deploying to Firebase Hosting is a natural fit, though it requires using the command line.

1.  **Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or select an existing one).
2.  **Install Firebase CLI:** If you don't have it, install the Firebase Command Line Interface by running this command in your terminal:
    ```bash
    npm install -g firebase-tools
    ```
3.  **Login & Initialize:**
    *   In your terminal, log in to Firebase: `firebase login`
    *   Navigate to your project's root folder and run: `firebase init hosting`
    *   Follow the prompts:
        *   Choose to **use an existing project** and select the one you created in the console.
        *   When asked about public directory, type `.next`. **This is important.**
        *   When asked if you want to configure as a single-page app, say **No**.
        *   When asked to set up automatic builds with GitHub, you can say **Yes** and follow the steps to connect your repository.
4.  **Deploy:** Run the following command from your project's root folder:
    ```bash
    firebase deploy --only hosting
    ```
    *Note: For a Next.js app with server-side features, Firebase now has experimental support for deploying directly. When initializing, you might be prompted to use a web framework. If so, select Next.js, and Firebase will handle setting up Cloud Functions for you.*

---

### **Other Cloud Providers**
You can also deploy this application to major cloud providers, although these methods are typically more advanced:
*   **AWS (Amazon Web Services):** Using services like AWS Amplify or containerizing your app for ECS/Fargate.
*   **Google Cloud:** Using Cloud Run for a containerized deployment or App Engine.
*   **Microsoft Azure:** Using Azure App Service or Azure Static Web Apps.

---

## Migrating to Standard PostgreSQL

If you prefer to host your own PostgreSQL database instead of using Supabase, you can set up the entire schema using the `000_complete_schema.sql` file.

### Step 1: Create the Database
Connect to your PostgreSQL server and create a new database. The recommended name is `postgres` to maintain consistency with the Supabase environment, but you can choose any name.

```sql
CREATE DATABASE postgres;
```

### Step 2: Run the Schema Script
Use a tool like `psql` to execute the complete schema file against your newly created database. This will create all the necessary tables, roles, functions, and security policies.

From your terminal, run the following command, replacing the placeholders with your actual database credentials:

```bash
psql -h YOUR_DB_HOST -p YOUR_DB_PORT -U YOUR_DB_USER -d postgres -f database_migrations/000_complete_schema.sql
```
You will be prompted for your database password.

### Step 3: Update Environment Variables
Once the schema is created, you must update your application's environment variables to point to your new database. Open the `.env` file in the root of the project and add your PostgreSQL connection string:

```env
# Replace with your actual PostgreSQL connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://your_user:your_password@your_host:5432/postgres"

# The Supabase keys are no longer needed if you are self-hosting the database.
# You can remove or comment them out.
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
After updating the `.env` file, restart your application for the changes to take effect. The application will now connect to your self-hosted PostgreSQL database.

---

### Hosting PostgreSQL on Your Own Server

Setting up a PostgreSQL database on your own server (whether it's a physical machine, a Virtual Private Server (VPS), or a cloud instance) involves a few key steps. The method below using Docker is highly recommended for its simplicity and consistency.

#### **Option A: Using Docker (Recommended)**

Docker simplifies the installation and management process significantly.

1.  **Install Docker:** If you don't have it, install [Docker](https://docs.docker.com/get-docker/) on your server.

2.  **Run PostgreSQL Container:** Run the following command in your server's terminal. This will download the official PostgreSQL image and start a container.

    ```bash
    docker run --name aawsa-postgres -e POSTGRES_PASSWORD=your_strong_password -p 5432:5432 -v aawsa_pgdata:/var/lib/postgresql/data -d postgres
    ```
    *   `--name aawsa-postgres`: Gives your container a memorable name.
    *   `-e POSTGRES_PASSWORD=...`: **Set a strong, secure password here.** This is for the default `postgres` user.
    *   `-p 5432:5432`: Maps port 5432 on your server to port 5432 in the container, allowing your application to connect.
    *   `-v aawsa_pgdata:/var/lib/postgresql/data`: **This is crucial.** It creates a volume on your server to persist the database data. Without this, your data would be lost if the container is removed.
    *   `-d`: Runs the container in detached mode (in the background).
    *   `postgres`: The name of the Docker image to use.

3.  **Connect and Run Schema:**
    *   Your database is now running. The `DATABASE_URL` for your `.env` file will be:
        `postgresql://postgres:your_strong_password@YOUR_SERVER_IP:5432/postgres`
    *   From your local machine (or any machine with `psql` installed), you can now run the schema script:
        ```bash
        psql -h YOUR_SERVER_IP -p 5432 -U postgres -d postgres -f database_migrations/000_complete_schema.sql
        ```
    *   You will be prompted for the password you set in the `docker run` command.

#### **Option B: Direct Installation on Linux (e.g., Ubuntu)**

This method installs PostgreSQL directly onto the server's operating system.

1.  **Install PostgreSQL:**
    ```bash
    sudo apt update
    sudo apt install postgresql postgresql-contrib
    ```

2.  **Initial Setup:**
    *   PostgreSQL creates a default user named `postgres`. Switch to this user to perform admin tasks:
        ```bash
        sudo -i -u postgres
        ```
    *   From the `postgres` user prompt, create a new database user for your application and set a password:
        ```bash
        createuser --interactive
        # Follow prompts: Enter name of role (e.g., aawsa_user), and answer 'n' to superuser.
        psql -c "ALTER USER your_new_user WITH PASSWORD 'your_strong_password';"
        ```
    *   Create the database itself:
        ```sql
        createdb postgres
        ```

3.  **Configure Remote Access (Important):**
    *   By default, PostgreSQL only allows local connections. You must edit two configuration files to allow your web application to connect.
    *   **Edit `postgresql.conf`:**
        *   Find the file (usually at `/etc/postgresql/YOUR_VERSION/main/postgresql.conf`).
        *   Uncomment and change the `listen_addresses` line to allow connections from any IP address:
            ```conf
            listen_addresses = '*'
            ```
    *   **Edit `pg_hba.conf`:**
        *   Find the file in the same directory as `postgresql.conf`.
        *   Add this line to the end of the file to allow your new user to connect from any IP using a password. **For better security, replace `0.0.0.0/0` with your web server's specific IP address if possible.**
            ```conf
            # TYPE  DATABASE        USER            ADDRESS                 METHOD
            host    all             all             0.0.0.0/0               md5
            ```
    *   **Restart PostgreSQL** to apply the changes:
        ```bash
        sudo systemctl restart postgresql
        ```

4.  **Run Schema and Connect:** You can now run the schema script and update your application's `.env` file with your new `DATABASE_URL` using the user and password you created.

---

## Supabase Database Migrations

If you are using Supabase, you may need to apply incremental updates to your database schema.

### **Important: Always back up your data before running any migration script.**

---

### **Migration: Role-Based Access Control (RBAC) and Security Policies (Required)**

This is a comprehensive update that creates the tables for roles and permissions, adds the necessary database functions, and sets up row-level security. It also seeds the database with default roles and a permission set for each role.

**To apply this update:**

1.  **Navigate to the SQL Editor:**
    *   Go to your Supabase project dashboard.
    *   In the left-hand menu, click on the **SQL Editor** icon (it looks like a database with a query symbol).
2.  **Run the Script:**
    *   Click on **"+ New query"**.
    *   Open the newly added file `database_migrations/002_rbac_setup.sql` in this project.
    *   Copy the entire content of that file.
    *   Paste the content into the query window in the Supabase SQL Editor.
    *   Click the **"RUN"** button.

---

### **Migration: Update Notification Function (Required)**

This update fixes two critical bugs in the notification system.
**To apply this update:**

1.  **Navigate to the SQL Editor.**
2.  **Run the Script:**
    *   Click on **"+ New query"**.
    *   Open the newly added file `database_migrations/update_notification_function.sql` in this project.
    *   Copy the entire content of that file and run it.

---

### **Migration: Add Tariff Table (Required)**

This update moves the tariff rates from being hard-coded in the application to a proper database table. This makes them centrally managed and editable through the "Tariff Management" page in the admin panel.

**To apply this update:**

1.  **Navigate to the SQL Editor.**
2.  **Run the Script:**
    *   Click on **"+ New query"**.
    *   Open the newly added file `database_migrations/003_tariffs_setup.sql` in this project.
    *   Copy the entire content of that file and run it.

---

### **Migration: Add Meter Rent Prices to Tariffs Table (Required)**

This update makes meter rent prices year-specific and editable by moving them into the `tariffs` database table.

**To apply this update:**

1.  **Navigate to the SQL Editor.**
2.  **Run the Script:**
    *   Click on **"+ New query"**.
    *   Open the newly added file `database_migrations/004_add_meter_rent_to_tariffs.sql` in this project.
    *   Copy the entire content of that file and run it.

---

### **Migration: Add Approval Columns to Bulk Meters (Required)**

This update adds the necessary columns to the `bulk_meters` table to support the approval workflow for new bulk meter records.

**To apply this update:**

1.  **Navigate to the SQL Editor.**
2.  **Run the Script:**
    *   Click on **"+ New query"**.
    *   Open the newly added file `database_migrations/005_add_approval_to_bulk_meters.sql` in this project.
    *   Copy the entire content of that file and run it.

---

### **Migration: Add VAT Details to Tariffs Table (Required)**

This update makes VAT calculations fully database-driven by adding `vat_rate` and `domestic_vat_threshold_m3` to the `tariffs` table.

**To apply this update:**

1.  **Navigate to the SQL Editor.**
2.  **Run the Script:**
    *   Click on **"+ New query"**.
    *   Open the newly added file `database_migrations/006_add_vat_to_tariffs.sql` in this project.
    *   Copy the entire content of that file and run it.
