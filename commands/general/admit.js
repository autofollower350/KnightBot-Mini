const { chromium } = require('playwright');
const fs = require('fs');
const pdf = require('pdf-parse');

module.exports = {
    name: 'admit',
    description: 'JNVU Admit Card Downloader',
    category: 'utility',
    usage: 'admit <form_number>',
    async execute(m, { sock, args }) {
        const formNo = args[0];
        
        if (!formNo) {
            return m.reply("❌ कृपया फॉर्म नंबर दें।\nउदाहरण: *.admit 12345*");
        }

        const pdfPath = `./${formNo}.pdf`;
        await m.reply("_डाउनलोड हो रहा है, कृपया थोड़ा इंतज़ार करें..._");

        // ब्राउज़र लॉन्च (Playwright)
        const browser = await chromium.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Linux/VPS के लिए ज़रूरी
        });

        try {
            const context = await browser.newContext({ acceptDownloads: true });
            const page = await context.newPage();
            
            // रिसोर्स ब्लॉकिंग (स्पीड बढ़ाने के लिए)
            await page.route('**/*.{png,jpg,jpeg,gif,css,woff2}', route => route.abort());

            const url = "https://erp.jnvuiums.in/(S(biolzjtwlrcfmzwwzgs5uj5n))/Exam/Pre_Exam/Exam_ForALL_AdmitCard.aspx#";
            await page.goto(url, { waitUntil: 'commit', timeout: 30000 });
            
            await page.fill("#txtchallanNo", formNo);
            const submitBtn = page.locator("#btnGetResult");

            // डाउनलोड हैंडलिंग
            const [download] = await Promise.all([
                page.waitForEvent('download', { timeout: 15000 }),
                submitBtn.click().then(() => submitBtn.click())
            ]);

            await download.saveAs(pdfPath);

            // PDF डेटा निकालना
            const dataBuffer = fs.readFileSync(pdfPath);
            const pdfData = await pdf(dataBuffer);
            const text = pdfData.text;

            // डेटा पार्सिंग (RegEx)
            const name = (text.match(/NAME OF CANDIDATE\s*:\s*(.*)/) || [])[1]?.split('\n')[0].trim() || "N/A";
            const father = (text.match(/FATHER'S NAME\s*:\s*(.*)/) || [])[1]?.split('\n')[0].trim() || "N/A";
            const roll = (text.match(/Roll no is\s+([\w\d]+)/) || [])[1]?.trim() || "N/A";
            const centerMatch = text.match(/Exam Centre is\s*([\s\S]*?)(?=Print Date|To,|The Centre)/);
            const center = centerMatch ? centerMatch[1].replace(/\s+/g, ' ').trim() : "N/A";

            let caption = `✅ *JNVU ADMIT CARD*\n\n` +
                          `👤 *नाम:* ${name}\n` +
                          `👨🏻‍प्लस *पिता:* ${father}\n` +
                          `🔢 *रोल नंबर:* ${roll}\n` +
                          `📍 *केंद्र:* ${center}\n\n` +
                          `_Powered by Knightbot_`;

            // WhatsApp पर डॉक्यूमेंट और जानकारी भेजना
            await sock.sendMessage(m.chat, { 
                document: fs.readFileSync(pdfPath), 
                mimetype: 'application/pdf', 
                fileName: `AdmitCard_${formNo}.pdf`,
                caption: caption
            }, { quoted: m });

            // फ़ाइल डिलीट करना
            fs.unlinkSync(pdfPath);

        } catch (err) {
            console.error(err);
            await m.reply("❌ एरर: एडमिट कार्ड नहीं मिला या सर्वर धीमा है। कृपया सही फॉर्म नंबर चेक करें।");
        } finally {
            await browser.close();
        }
    }
};
