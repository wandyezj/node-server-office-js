(async () => {
    return Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const range = sheet.getRange("A1");
        range.load("values");
        await context.sync();
        const value = range.values[0][0];
        console.log(value);
        return value;
    });
})();
