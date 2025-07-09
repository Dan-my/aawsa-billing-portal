# AAWSA Billing Portal: Application Documentation

## 1. Overview

The AAWSA Billing Portal is a comprehensive web application designed to manage the water billing lifecycle for the Addis Ababa Water and Sewerage Authority. It provides a robust, role-based system for managing branches, staff, customers, and meter data.

The portal's core functionalities include:
-   **Role-Based Access Control (RBAC):** A granular permissions system to ensure users only see and do what their role allows.
-   **Data Management:** Tools for manual and bulk CSV data entry for all customers and meters.
-   **Automated Billing:** A sophisticated engine that calculates monthly bills based on consumption, customer type, and applicable tariffs.
-   **Reporting & Analytics:** Dashboards and downloadable reports that provide insight into billing performance, water usage, and operational metrics.
-   **Centralized Administration:** Tools for administrators to manage the entire system, from user accounts to billing rates.

---

## 2. Core Concepts

Understanding these key entities is essential to using the portal effectively.

-   **Branches**: These represent the physical or administrative divisions of AAWSA. Each branch is a container for staff members, bulk meters, and individual customers, allowing for decentralized management.
-   **Staff Members**: These are the users of the portal. Every staff member is assigned to a branch (or "Head Office") and given a specific role that dictates their access level.
-   **Roles & Permissions**: This is the heart of the security model. Instead of assigning permissions one-by-one, staff are assigned a `Role` (e.g., "Admin", "Staff Management", "Staff"). Each role has a specific set of permissions (e.g., `branches_create`, `customers_view_all`) that define what actions a user can perform.
-   **Bulk Meters**: These are large, high-capacity water meters that typically serve a collection of smaller, individual customers (e.g., a meter for an entire apartment building). Their billing is based on the **difference billing** principle: the bill is calculated on the *unaccounted-for water*, which is the total consumption of the bulk meter minus the sum of the consumption of all individual customers connected to it.
-   **Individual Customers**: These are the end-users of the water service, such as households or small businesses. They have their own meters and are typically associated with a parent bulk meter. Their bills are calculated based on their own consumption readings.

---

## 3. Key Features & Tasks (by User Role)

The portal provides different experiences based on the user's assigned role.

### 3.1. Administrator (Super User)

The Administrator has unrestricted access to all features and data across the entire system.

-   **System-Wide Dashboard**: Views a comprehensive dashboard with aggregated data from all branches.
-   **Branch Management**: Has full CRUD (Create, Read, Update, Delete) capabilities for all branches.
-   **Staff Management**: Can add, edit, and delete any staff member. Assigns staff to branches and roles.
-   **Roles & Permissions Management**: **This is unique to the Admin.** Can create new roles and define exactly which permissions are assigned to each role, offering fine-grained control over the entire application's security.
-   **Customer & Meter Management**: Has full CRUD access to every bulk meter and individual customer in the system, regardless of branch.
-   **Data Entry**: Can perform manual and CSV-based data entry for any entity without restriction.
-   **Reporting**: Can generate and view all system-wide reports with unfiltered data from all branches.
-   **Notifications**: Can send notifications to all staff members or target specific branches.
-   **Tariff Management**: Can define and update the billing tariff rates, service fees, and meter rent prices that form the basis of all bill calculations.
-   **Application Settings**: Can configure global settings like the application name and default currency.

### 3.2. Head Office Management

This role is designed for high-level oversight and monitoring without editing capabilities.

-   **Aggregated Dashboard**: Views a high-level dashboard that summarizes key metrics across all branches, focusing on performance comparisons and overall trends.
-   **View-Only Access**: Can view all data (branches, staff, customers, meters) across the entire system but cannot create, edit, or delete any records.
-   **Reporting**: Can generate and view all system-wide reports, such as "List of Paid Bills" and "List of Sent Bills".
-   **Notifications**: Can send notifications to all staff or specific branches.

### 3.3. Staff Management

This role is responsible for managing the day-to-day operations of a specific branch.

-   **Branch-Specific Dashboard**: Views a dashboard focused on their assigned branch's performance, including bill payment statuses, customer counts, and water usage trends. It also includes a comparison chart to see how their branch performs against others.
-   **Branch-Specific CRUD**: Can create, read, update, and delete staff, bulk meters, and individual customers, but *only within their assigned branch*.
-   **Data Entry**: Has full access to manual and CSV data entry forms, with data being automatically associated with their branch.
-   **Reporting**: Can generate and view all reports, but the data is automatically filtered to their branch.

### 3.4. Staff

This role is focused on data entry and viewing branch-level information.

-   **Simplified Dashboard**: Views a dashboard with key metrics for their assigned branch.
-   **Branch-Specific View**: Can view bulk meters and individual customers that belong to their branch.
-   **Data Entry**: Can perform manual and CSV data entry. All entered data is automatically tagged with their branch information.
-   **Reporting**: Can generate and view reports filtered for their branch's data.

---

## 4. Data Entry and Management

The portal supports two primary methods for data entry to accommodate different needs.

### 4.1. Manual Data Entry

Located under the "Data Entry" tab, this method is ideal for adding or correcting single records. Forms are provided for:
-   Individual Customers
-   Bulk Meters

Staff users will find that their branch information is automatically pre-filled where applicable.

### 4.2. CSV File Upload

This is a powerful feature for importing large amounts of data at once. The "CSV Upload" tab provides separate sections for bulk meters and individual customers.

**Key Requirements for CSV Files:**
-   The first row **must** be a header row.
-   The column names and their order in the header **must exactly match** the templates.
-   Refer to the `README.md` file in the project for the precise column specifications and example rows for both `bulk_meter_template.csv` and `individual_customer_template.csv`.
-   The system validates each row and provides a summary of successful imports and a list of any errors found after the upload attempt.

---

## 5. Billing Calculation Engine

The portal uses a sophisticated algorithm to automate bill calculations, ensuring accuracy and consistency.

### 5.1. The "Difference Billing" Model for Bulk Meters

A key concept is how bulk meters are billed. Instead of billing for the total consumption, the system calculates the "unaccounted-for water" and bills for that amount.

`Bulk Meter Billable Usage = (Total Bulk Meter Usage) - (Sum of All Assigned Individual Customer Usages)`

The final bill for the bulk meter is then calculated based on this "difference" usage, using the non-domestic tariff rates.

### 5.2. Bill Calculation Steps

For any given meter (individual or the "difference" of a bulk meter), the final bill is calculated as follows:

1.  **Calculate Base Water Charge**:
    -   **Domestic**: A progressive, tiered rate is applied. Lower consumption is billed at a lower rate, and as consumption increases, higher rates are applied to the usage in each successive tier.
    -   **Non-domestic / Bulk Meter**: A single rate is applied to the entire consumption. The specific rate is determined by finding which tier the total consumption falls into.

2.  **Calculate Service Fees**: These are calculated as a percentage of the Base Water Charge.
    -   **Maintenance Fee**: 1%
    -   **Sanitation Fee**: 7% for Domestic, 10% for Non-domestic.

3.  **Calculate Other Charges**:
    -   **Sewerage Charge**: Applied only if "Sewerage Connection" is "Yes". The charge is the total consumption (m³) multiplied by a fixed rate per cubic meter (this rate differs for Domestic and Non-domestic).
    -   **Meter Rent**: A fixed monthly fee based on the meter's size (e.g., 1/2", 1", 2").

4.  **Calculate VAT (Value Added Tax)**:
    -   VAT is 15%.
    -   For **Non-domestic** customers, it's applied to the Base Water Charge.
    -   For **Domestic** customers, it's only applied if total consumption exceeds 15 m³. In that case, it is calculated only on the portion of the water charge corresponding to usage *above* 15 m³.

5.  **Assemble the Total Bill**:
    -   The final bill is the sum of all the components calculated above.

---

## 6. Technology Stack

The application is built with a modern, robust set of technologies:

-   **Frontend Framework**: [Next.js](https://nextjs.org/) (with React)
-   **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Database & Backend**: [Supabase](https://supabase.com/) (Managed PostgreSQL)
-   **Client-side Data Management**: A custom data store in `src/lib/data-store.ts` that acts as a real-time cache for Supabase data.
-   **Generative AI**: [Genkit](https://firebase.google.com/docs/genkit) for AI-powered features.

---

## 7. Database & Migrations

-   The application's backend is powered by a Supabase project, which includes a PostgreSQL database, authentication, and auto-generated APIs.
-   Any changes required for the database schema (e.g., adding tables or columns) are provided as SQL script files in the `database_migrations/` folder.
-   As instructed in the `README.md`, these scripts must be run manually in the **SQL Editor** of your Supabase project dashboard to keep your database schema in sync with the application's requirements.
