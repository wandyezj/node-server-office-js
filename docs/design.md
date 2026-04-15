# Design

A node server provides functionality to interact with an excel file via office.js.

Sequence

1. POST open-excel-file
    1. Create a copy of the specified excel file with modified XML to automatically load an add-in
    2. Open the excel file.
2. POST eval-excel-file
    1. Send JavaScript to the add-in to be run in eval via websocket.
3. POST close-excel-file
    1. Create a copy of the current excel file and remove the modified XML

