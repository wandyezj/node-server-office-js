# Design

A node server provides functionality to interact with an excel file via office.js.

Sequence

1. POST open-excel-file
    - Create a copy of the specified excel file with modified XML to automatically load an add-in
    - Open the excel file.
2. POST addin-eval
    - Send JavaScript to the add-in to be run in eval via websocket.
3. POST save-excel-file
    - Sends JavaScript to the add-in to run and get the workbook base64 contents
    - Create a copy of the open excel file and remove the modified XML
    - Save the copy to a location
    - note: not ideal to have to do this work around - would be nice to have a save function.
4. POST close-excel-file
    - Shuts down excel
    - note: option to save the workbook to a location

