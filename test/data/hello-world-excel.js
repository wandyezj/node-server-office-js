Excel.run(async (context) => {
    const address = "A1";
    const value = "Hello, world!";
    const sheet = context.workbook.worksheets.getActiveWorksheet();

    const range = sheet.getRange(address);
    range.values = [[value]];

    range.load("address");
    sheet.load("name");
    await context.sync();

    console.log(`Set ${sheet.name} ${range.address} to [${value}]`);
});
