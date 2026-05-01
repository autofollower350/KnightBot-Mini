const puppeteer = require('puppeteer');
const fs = require('fs');

async function downloadJNVU(formNumber) {
    const pdfPath = `./admit_card_${formNumber}.pdf`;
    
    // Browser launch karein
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        const url = "https://erp.jnvuiums.in/(S(biolzjtwlrcfmzwwzgs5uj5n))/Exam/Pre_Exam/Exam_ForALL_AdmitCard.aspx#";

        // Speed ke liye images aur CSS block karein
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Form number bharein
        await page.type('#txtchallanNo', formNumber.toString());

        // Download handle karne ka jugaad
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: './',
        });

        // Submit button click karein
        await page.click('#btnGetResult');

        // Wait karein jab tak file download na ho jaye (5-10 seconds)
        console.log("Downloading...");
        await new Promise(resolve => setTimeout(resolve, 8000)); 

        await browser.close();
        
        if (fs.existsSync(pdfPath)) {
            return pdfPath;
        } else {
            return null;
        }

    } catch (error) {
        console.error("Error:", error);
        await browser.close();
        return null;
    }
}

// Bot Command Example (WhatsApp Bot Logic):
// if (command === 'jnvu') {
//    const formNo = args[0];
//    const path = await downloadJNVU(formNo);
//    if (path) {
//        await conn.sendMessage(id, { document: { url: path }, fileName: 'AdmitCard.pdf' });
//        fs.unlinkSync(path); // File delete kar dein
//    } else {
//        reply("Error: Admit card nahi mila!");
//    }
// }
