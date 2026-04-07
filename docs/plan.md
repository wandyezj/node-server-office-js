# Plan

The goal is to build a node server that allows execution of office.js against specific office documents at a file path.

Specific Commands

- Open Document
- Execute office.js
- Get File Contents
- Close Document

## Open Document

- Copy document
- Inject XML to open an Add-In on launch of the workbook and connect to it via websockets.
- Open the document

> excel file_path

## Close Document

- Pull out the XML for the Add-In launch
- save at a location

## Get File Contents

See example: [Office.File.getSliceAsync](https://learn.microsoft.com/en-us/javascript/api/office/office.file?view=excel-js-preview#office-office-file-getsliceasync-member(1))

## Execute Office.js

- Use Websocket to send message to launch the XML

## Reference

[GitHub Office-Addin-Scripts](https://github.com/OfficeDev/Office-Addin-Scripts)