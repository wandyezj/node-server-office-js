(async () => {
    /**
     * Helper to convert a byte array to Base64 string
     */
    function encodeByteArrayToBase64(data) {
        let binary = "";
        const bytes = new Uint8Array(data);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
    /**
     * Retrieves the current Excel workbook as a Base64 string.
     * @returns {Promise<string>} The Base64 encoded string of the .xlsx file.
     */
    async function getBase64Workbook() {
        return new Promise((resolve, reject) => {
            // 1. Request the compressed (xlsx) file in slices
            Office.context.document.getFileAsync(
                Office.FileType.Compressed,
                { sliceSize: 65536 },
                (result) => {
                    if (result.status === Office.AsyncResultStatus.Succeeded) {
                        const file = result.value;
                        const sliceCount = file.sliceCount;
                        let slicesReceived = 0;
                        let fileContent = [];

                        // 2. Recursive function to get each slice
                        function getSlice(index) {
                            file.getSliceAsync(index, (sliceResult) => {
                                if (sliceResult.status === Office.AsyncResultStatus.Succeeded) {
                                    // Add the slice data (byte array) to our collection
                                    fileContent = fileContent.concat(sliceResult.value.data);
                                    slicesReceived++;

                                    if (slicesReceived === sliceCount) {
                                        // 3. All slices received, close the file and process
                                        file.closeAsync();

                                        // Convert byte array to Base64
                                        const base64String = encodeByteArrayToBase64(fileContent);
                                        resolve(base64String);
                                    } else {
                                        // Get the next slice
                                        getSlice(slicesReceived);
                                    }
                                } else {
                                    file.closeAsync();
                                    reject("Failed to get slice: " + sliceResult.error.message);
                                }
                            });
                        }

                        getSlice(0);
                    } else {
                        reject("Failed to get file: " + result.error.message);
                    }
                },
            );
        });
    }

    const base64Workbook = await getBase64Workbook();
    return base64Workbook;
})();
