(async () => {
    return await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const range = sheet.getRange("A1");
        range.values = [["5"]];
        await context.sync();
    });
})();
