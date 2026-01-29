## Horus Management System (HMS) – API

This project is an ASP.NET Core Web API for managing **raw materials**, **quality control (QC)**, and **inventory** flows in the Horus Management System.

The API is organized around three main domains:

- **Raw materials**: Master data for materials you buy and store.
- **Quality control**: Incoming deliveries, invoice files, and QC decisions.
- **Inventories**: Warehouses, current stock, and inventory transactions.

---

## Running the API

1. **Configure the database connection**
   - The connection string is in `appsettings.json` under `ConnectionStrings:HmsDatabase`.
   - Make sure it points to a reachable SQL Server instance.

2. **Run the API**
   - From the project root (`H_M_S`), run:

     ```bash
     dotnet run --project H_M_S/H_M_S.csproj
     ```

3. **Swagger UI (API documentation)**
   - Swagger is already enabled in `Program.cs`.
   - After starting the API, open the browser and navigate to:
     - `http://localhost:<port>/swagger`
   - You will see all endpoints, their models, and can test them interactively.

---

## High-Level Architecture

- **Presentation/API layer**
  - Controllers in `H_M_S/Controllers`:
    - `RawMaterialsController`
    - `QualityControlController`
    - `InventoriesController`
  - Each controller is annotated with `[ApiController]` and `[Route("api/[controller]")]`.

- **Business/Integration layer (BIL)**
  - Services in `BIL/Services` implementing interfaces in `BIL/Services/Interfaces`.
  - Encapsulate business rules and orchestration logic.

- **Data access layer (DAL)**
  - `HmsDbContext` and repositories under `DAL`.
  - Use Entity Framework Core and SQL Server (configured in `Program.cs`).

---

## API Overview

### Raw Materials (`api/RawMaterials`)

- **POST `api/RawMaterials`**
  - **Description**: Create a new raw material.
  - **Body**: `RawMaterialCreateDto` (name, description, etc.).
  - **Responses**:
    - `201 Created` with `RawMaterialDto`.
    - `400 BadRequest` (validation/business rule failure).
    - `500 InternalServerError` (unexpected error).

- **GET `api/RawMaterials`**
  - **Description**: Get a list of all raw materials.
  - **Responses**:
    - `200 OK` with `IReadOnlyList<RawMaterialDto>`.

- **GET `api/RawMaterials/{id}`**
  - **Description**: Get a single raw material by id.
  - **Responses**:
    - `200 OK` with `RawMaterialDto`.
    - `404 NotFound` if not found.

- **PUT `api/RawMaterials/{id}`**
  - **Description**: Update an existing raw material.
  - **Body**: `RawMaterialUpdateDto`.
  - **Responses**:
    - `200 OK` with updated `RawMaterialDto`.
    - `404 NotFound` if not found.
    - `400 BadRequest` (validation/business rules).

- **DELETE `api/RawMaterials/{id}`**
  - **Description**: Soft delete a raw material (mark as inactive).
  - **Responses**:
    - `204 NoContent` on success.
    - `404 NotFound` if not found.

---

### Quality Control (`api/QualityControl`)

- **POST `api/QualityControl/with-invoice`**
  - **Description**: Register a new incoming delivery for QC and upload the invoice PDF.
  - **Consumes**: `multipart/form-data`.
  - **Form fields** (`QualityControlWithInvoiceRequest`):
    - `PurchaseInvoiceNumber` (string)
    - `RawMaterialId` (int)
    - `Quantity` (numeric)
    - `InvoicePdf` (file; required)
  - **Behavior**:
    - Saves the PDF under the `Invoices` folder.
    - Creates a QC record with a reference to the saved file.
  - **Responses**:
    - `201 Created` with `QualityControlDto`.
    - `400 BadRequest` if file missing or business rules fail.
    - `500 InternalServerError` on unexpected errors.

- **POST `api/QualityControl/{id}/review`**
  - **Description**: Review a QC record and approve or reject it.
  - **Body**: `QualityControlReviewDto` (decision, reviewer info, comments, etc.).
  - **Responses**:
    - `200 OK` with updated `QualityControlDto`.
    - `400 BadRequest` on domain validation failures.

- **GET `api/QualityControl/{id}`**
  - **Description**: Get a QC record by id.
  - **Responses**:
    - `200 OK` with `QualityControlDto`.
    - `404 NotFound` if not found.

---

### Inventories (`api/Inventories`)

- **POST `api/Inventories`**
  - **Description**: Create a new inventory (warehouse).
  - **Body**: `InventoryCreateDto` (name, location, capacity, isActive, etc.).
  - **Responses**:
    - `201 Created` with `InventoryDto`.
    - `400 BadRequest` on business rule failure (e.g., duplicate name).

- **GET `api/Inventories`**
  - **Description**: List all inventories with their current utilization.
  - **Responses**:
    - `200 OK` with `IReadOnlyList<InventoryDto>`.

- **GET `api/Inventories/{id}`**
  - **Description**: Get a single inventory by id.
  - **Responses**:
    - `200 OK` with `InventoryDto`.
    - `404 NotFound` if not found.

- **PUT `api/Inventories/{id}`**
  - **Description**: Update an existing inventory.
  - **Body**: `InventoryUpdateDto`.
  - **Responses**:
    - `200 OK` with updated `InventoryDto`.
    - `404 NotFound` if not found.
    - `400 BadRequest` on domain validation failures.

- **DELETE `api/Inventories/{id}`**
  - **Description**: Soft delete an inventory (mark inactive).
  - **Responses**:
    - `204 NoContent` on success.
    - `404 NotFound` if not found.

- **GET `api/Inventories/{id}/contents`**
  - **Description**: Get aggregated contents (stock) for a specific inventory.
  - **Responses**:
    - `200 OK` with `IReadOnlyList<InventoryItemDto>` (raw material + quantity).
    - `400 BadRequest` on domain errors (e.g., invalid inventory).

- **POST `api/Inventories/receive-from-qc`**
  - **Description**: Receive approved QC records into an inventory as inbound transactions.
  - **Body**: `InventoryReceiveFromQcDto` (links QC record and target inventory).
  - **Behavior**:
    - Validates QC record (must exist and be approved).
    - Validates target inventory.
    - Creates an inbound inventory transaction and updates stock levels.
  - **Responses**:
    - `200 OK` with `InventoryTransactionDto`.
    - `400 BadRequest` on business rule failures.

---

## Typical End-to-End Flow

1. **Setup master data**
   - Create raw materials via `POST api/RawMaterials`.
   - Create inventories via `POST api/Inventories`.

2. **Register incoming delivery**
   - Call `POST api/QualityControl/with-invoice` with QC details and the invoice PDF.

3. **Review QC**
   - Call `POST api/QualityControl/{id}/review` to approve or reject the QC record.

4. **Receive into inventory**
   - Call `POST api/Inventories/receive-from-qc` to move approved QC quantities into a specific inventory.

5. **Query stock**
   - Call `GET api/Inventories/{id}/contents` to see current stock per raw material in a given inventory.

This README gives a high-level overview; for full request/response schemas, use the **Swagger UI** generated by the running API.

