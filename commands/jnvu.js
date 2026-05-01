const axios = require('axios');
const fs = require('fs');

async function downloadJNVU(formNumber) {
    const pdfPath = `./admit_card_${formNumber}.pdf`;
    const url = "https://erp.jnvuiums.in/(S(biolzjtwlrcfmzwwzgs5uj5n))/Exam/Pre_Exam/Exam_ForALL_AdmitCard.aspx";

    try {
        // 1. बिना ब्राउज़र के सीधे रिक्वेस्ट भेजें
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream', // क्योंकि हमें PDF फाइल चाहिए
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://erp.jnvuiums.in/'
            },
            params: {
                'txtchallanNo': formNumber,
                'btnGetResult': 'Download' // यह JNVU के बटन का नाम है
            }
        });

        // 2. फाइल को सेव करें
        const writer = fs.createWriteStream(pdfPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(pdfPath));
            writer.on('error', reject);
        });

    } catch (error) {
        console.error("Scraping Error:", error.message);
        return null;
    }
}
