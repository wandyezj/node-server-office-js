# Design

A Node server uses Office.js to interact with an Excel file.

The server uses a MicroCommand architecture.

A request may contain multiple MicroCommands. The server runs them in order.

Each MicroCommand runs to completion before the next one starts. If one fails, the sequence stops.

Example request sequence:

1. ForceCloseExcel
    - Shut down current Excel instances.
2. OpenExcelFile
    - Copy the specified Excel file and modify its XML so it loads the add-in.
    - Open the copied Excel file.
    - Return the Excel process ID when available.
3. AddinEval
    - Send JavaScript to the add-in over the websocket.
    - Run the JavaScript in the add-in with `eval`.
    - Return console output, the eval result, or an eval error.
4. PowerShellSaveActiveWorkbookAs
    - Use PowerShell to save the active Excel workbook to the requested location.
    - Remove the embedded add-in XML from the saved copy.
    - Return success after writing the clean workbook copy.
5. CloseExcelFile
    - Close Excel by process ID or source file path.
    - Run after SaveExcelFile when the caller wants to persist the workbook first.
